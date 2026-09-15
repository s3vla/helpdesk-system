import { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { estilos, CORES_APP, CORES_PRIORIDADE, CORES_STATUS, CORES_TI } from '../styles/theme'
import { cores } from '../styles/authTheme'
import { useAuth } from '../hooks/useAuth'
import { buscarMetricas, buscarRepeticao } from '../services/dashboardService'
import { LABEL_CATEGORIA } from '../utils/categorias'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import EstadoRequisicao from './EstadoRequisicao'

// N1→N3 é uma escala de severidade crescente, mesma ideia conceitual de
// baixa→alta prioridade — reaproveita as cores já aprovadas em
// CORES_PRIORIDADE em vez de inventar uma paleta nova só pra este gráfico.
// Renomeado de CORES_NIVEL pra CORES_POR_NIVEL_GRAFICO (era um nome local
// deste arquivo, coincidência com o CORES_NIVEL agora exportado por
// theme.js pra outra coisa — a paleta índigo de TicketPanel.jsx). Sem
// relação nenhuma entre os dois; só evitando confundir os dois nomes.
const CORES_POR_NIVEL_GRAFICO = { N1: CORES_PRIORIDADE.baixa.dot, N2: CORES_PRIORIDADE.media.dot, N3: CORES_PRIORIDADE.alta.fg }

// Paleta cíclica pra qualquer agrupamento que não seja nível — um widget
// genérico (categoria, status, prioridade, solicitante, técnico) pode ter
// qualquer quantidade de grupos, não dá pra mapear uma cor fixa por valor
// como dá pra fazer com nível.
const PALETA_CICLICA = [cores.verdeEscuro, CORES_TI.accent, CORES_STATUS.andamento.fg, CORES_APP.verde, cores.azulMedio, CORES_PRIORIDADE.alta.fg]

const estiloCard = { ...estilos.card, padding: 20 }
const estiloTitulo = { fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: CORES_APP.tinta, margin: '0 0 14px' }
const estiloLinhaRanking = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', background: CORES_APP.fundoCampo, borderRadius: 8 }
const estiloPosicao = { color: CORES_APP.textoSuave, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, width: 20, flexShrink: 0 }
const estiloContador = { background: CORES_APP.card, border: `1px solid ${CORES_APP.borda}`, color: CORES_APP.textoFraco, borderRadius: 99, padding: '3px 10px', fontSize: 11.5, fontFamily: 'Outfit, sans-serif', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }

// Traduz o `rotulo` bruto da API pro texto exibido, reaproveitando os
// dicionários que já existem em vez de duplicar tradução — categoria já
// vem no NOME final (não mais um enum maiúsculo cru, ver Categoria entity
// no backend), só passa por LABEL_CATEGORIA se for uma das 5 originais que
// ainda têm um rótulo mais "leigo" cadastrado; senão usa o nome cru mesmo.
// status/prioridade só precisam de .toLowerCase() pra baterem com as
// chaves de CORES_STATUS/CORES_PRIORIDADE (ambos em styles/theme.js).
function traduzirRotulo(agruparPor, item) {
  if (agruparPor === 'categoria') return LABEL_CATEGORIA[item.chave] ?? item.rotulo
  if (agruparPor === 'status') return CORES_STATUS[item.chave.toLowerCase()]?.label ?? item.rotulo
  if (agruparPor === 'prioridade') return CORES_PRIORIDADE[item.chave.toLowerCase()]?.label ?? item.rotulo
  return item.rotulo
}

function corDoItem(agruparPor, chave, indice) {
  if (agruparPor === 'nivel') return CORES_POR_NIVEL_GRAFICO[chave] ?? PALETA_CICLICA[0]
  return PALETA_CICLICA[indice % PALETA_CICLICA.length]
}

// `widget`: { titulo, agruparPor, tipo, formatoVisual, limite } — mesmo
// formato salvo em DashboardWidget, ou o estado (parcial, enquanto a
// pessoa preenche) do formulário de CriarDashboard.jsx, usado como preview
// ao vivo. `periodo`: { dataInicio, dataFim }. Autossuficiente: busca seus
// próprios dados sempre que `widget` ou `periodo` mudam — é isso que deixa
// o mesmo componente servir tanto a tela "Dashboard" (um widget já salvo
// por instância) quanto o preview do formulário (nenhum widget salvo
// ainda, só o estado do formulário).
function WidgetRenderer({ widget, periodo }) {
  const { token, tratarErroApi } = useAuth()
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const configCompleta = !!(widget.agruparPor && widget.tipo && widget.formatoVisual)

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      if (widget.agruparPor === 'repeticaoCategoria') {
        const grupos = await buscarRepeticao(token, periodo)
        setItens(grupos.map(g => ({
          chave: `${g.categoria}-${g.rotulo}`,
          rotulo: `${LABEL_CATEGORIA[g.categoria] ?? g.categoria} ${g.rotulo}`,
          total: g.total,
        })))
      } else {
        setItens(await buscarMetricas(token, { ...periodo, agruparPor: widget.agruparPor, tipo: widget.tipo, limite: widget.limite }))
      }
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (!configCompleta) {
      setItens([])
      setErro('')
      setCarregando(false)
      return
    }
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configCompleta, widget.agruparPor, widget.tipo, widget.formatoVisual, widget.limite, periodo.dataInicio, periodo.dataFim])

  const dadosGrafico = itens.map((item, indice) => ({
    ...item,
    rotuloExibido: widget.agruparPor === 'repeticaoCategoria' ? item.rotulo : traduzirRotulo(widget.agruparPor, item),
    cor: corDoItem(widget.agruparPor, item.chave, indice),
  }))
  // tipo=contagem zero-preenche todos os valores do enum (ver ChamadosService)
  // — com 0 chamados no período, `dadosGrafico` não fica vazio (ainda tem os
  // N1/N2/N3 etc., só que todos com total 0). Um <PieChart> não consegue
  // desenhar fatia nenhuma quando a soma é 0 (ângulo = 0/0) e acaba
  // renderizando invisível mesmo com "itens" — por isso o estado vazio
  // considera a SOMA, não só a quantidade de itens.
  const totalGeral = dadosGrafico.reduce((soma, item) => soma + item.total, 0)

  return (
    <div style={estiloCard}>
      <h3 style={estiloTitulo}>{widget.titulo || 'Widget sem título'}</h3>
      {!configCompleta ? (
        <p style={{ color: CORES_APP.textoSuave, fontSize: 13.5, margin: 0, padding: '8px 0' }}>Preencha os campos ao lado para ver o preview.</p>
      ) : (
        <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
          {totalGeral === 0 ? (
            <p style={{ color: CORES_APP.textoSuave, fontSize: 13.5, margin: 0, padding: '8px 0' }}>Nenhum chamado neste período.</p>
          ) : widget.formatoVisual === 'barra' ? (
            <ResponsiveContainer width="100%" height={200}>
              {/* `margin.left` NUNCA negativo — um <svg> raiz tem
                  overflow:hidden por padrão (diferente de elemento HTML
                  comum), então uma margem negativa aqui empurra o rótulo do
                  eixo Y (right-aligned) pra fora dos limites do próprio SVG
                  e corta os primeiros dígitos. Passava despercebido com
                  contagem de 1 dígito (corte de ~3px, quase imperceptível),
                  mas com 10+ chamados (2 dígitos) cortava o primeiro
                  algarismo inteiro — "12"/"16" apareciam como "2"/"6". Bug
                  real encontrado com evidência: mediu-se getBoundingClientRect()
                  do texto do eixo Y vs. do próprio <svg> e confirmou-se
                  que o texto renderizava ANTES da borda esquerda do SVG. */}
              <BarChart data={dadosGrafico} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CORES_APP.bordaSuave} vertical={false} />
                <XAxis dataKey="rotuloExibido" tick={{ fill: CORES_APP.textoFraco, fontSize: 12, fontFamily: 'Outfit, sans-serif' }} axisLine={{ stroke: CORES_APP.borda }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: CORES_APP.textoFraco, fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                  labelStyle={{ color: CORES_APP.tinta, fontWeight: 600 }}
                  formatter={valor => [valor, 'Chamados']}
                  cursor={{ fill: 'rgba(0,73,192,0.06)' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {dadosGrafico.map(item => <Cell key={item.chave} fill={item.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : widget.formatoVisual === 'pizza' ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={dadosGrafico} dataKey="total" nameKey="rotuloExibido" cx="50%" cy="50%" outerRadius={82} label={item => item.rotuloExibido}>
                  {dadosGrafico.map(item => <Cell key={item.chave} fill={item.cor} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                  formatter={valor => [valor, 'Chamados']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dadosGrafico.map((item, indice) => (
                <div key={item.chave} style={estiloLinhaRanking}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={estiloPosicao}>{indice + 1}</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13.5, color: CORES_APP.tinta, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.rotuloExibido}</span>
                  </div>
                  <span style={estiloContador}>{item.total}</span>
                </div>
              ))}
            </div>
          )}
        </EstadoRequisicao>
      )}
    </div>
  )
}

export default WidgetRenderer
