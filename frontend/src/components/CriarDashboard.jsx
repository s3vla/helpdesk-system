import { useEffect, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { cores } from '../styles/authTheme'
import { useAuth } from '../hooks/useAuth'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { buscarWidgets, criarWidget, atualizarWidget, moverWidget, removerWidget } from '../services/dashboardService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { dataFimPadrao, dataInicioPadrao } from '../utils/periodoPadrao'
import { IconPlus, IconEdit, IconTrash, IconChevronUp, IconChevronDown } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import WidgetRenderer from './WidgetRenderer'

const LABEL_AGRUPAR_POR = {
  nivel: 'Nível',
  categoria: 'Categoria',
  status: 'Status',
  prioridade: 'Prioridade',
  solicitante: 'Solicitante',
  tecnicoResponsavel: 'Técnico responsável',
  repeticaoCategoria: 'Repetição (categoria + palavra-chave)',
}
// Sem repeticaoCategoria — exclusivo do widget de seed, não criável pela UI
// (ver limitação já validada com o usuário: a lógica de repetição não cabe
// no motor genérico de GET /chamados/metricas).
const OPCOES_AGRUPAR_POR = ['nivel', 'categoria', 'status', 'prioridade', 'solicitante', 'tecnicoResponsavel']
const LABEL_TIPO = { contagem: 'Contagem', ranking: 'Ranking' }
const LABEL_FORMATO = { barra: 'Gráfico de barras', pizza: 'Gráfico de pizza', lista: 'Lista' }

const FORMULARIO_VAZIO = { titulo: '', agruparPor: 'categoria', tipo: 'contagem', formatoVisual: 'barra', limite: '10' }

const estiloLinha = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: CORES_APP.fundoCampo, borderRadius: 10, flexWrap: 'wrap' }
const estiloBotaoIcone = { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CORES_APP.card, border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, color: CORES_APP.textoFraco, cursor: 'pointer', flexShrink: 0 }
const estiloBotaoIconeDesabilitado = { ...estiloBotaoIcone, opacity: 0.35, cursor: 'not-allowed' }

// Tela de ADMINISTRAÇÃO do Dashboard TI — lista todos os widgets (ativos e
// inativos), com ativar/desativar, reordenar (setas — decidido em vez de
// drag-and-drop, mesmo resultado sem dependência nova), editar e excluir
// (bloqueado pra widgets `fixo`). O formulário de criar/editar reaproveita
// WidgetRenderer como preview ao vivo, alimentado pelo próprio estado do
// formulário em vez de um widget já salvo.
function CriarDashboard() {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const mobile = largura < 900

  const [widgets, setWidgets] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroFormulario, setErroFormulario] = useState('')
  const [confirmandoRemoverId, setConfirmandoRemoverId] = useState(null)

  const periodoPreview = { dataInicio: dataInicioPadrao(), dataFim: dataFimPadrao() }

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      setWidgets((await buscarWidgets(token)) ?? [])
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const widgetEmEdicao = editandoId ? widgets.find(w => w.id === editandoId) : null
  const ehFixo = widgetEmEdicao?.fixo ?? false

  function iniciarCriacao() {
    setEditandoId(null)
    setFormulario(FORMULARIO_VAZIO)
    setErroFormulario('')
    setMostrarFormulario(true)
  }

  function iniciarEdicao(widget) {
    setEditandoId(widget.id)
    setFormulario({
      titulo: widget.titulo,
      agruparPor: widget.agruparPor,
      tipo: widget.tipo,
      formatoVisual: widget.formatoVisual,
      limite: widget.limite ? String(widget.limite) : '10',
    })
    setErroFormulario('')
    setMostrarFormulario(true)
  }

  function fecharFormulario() {
    setMostrarFormulario(false)
    setEditandoId(null)
  }

  async function salvar() {
    if (!formulario.titulo.trim()) {
      setErroFormulario('Dê um título para o widget')
      return
    }
    setSalvando(true)
    setErroFormulario('')
    try {
      const dadosBase = {
        titulo: formulario.titulo.trim(),
        tipo: formulario.tipo,
        formatoVisual: formulario.formatoVisual,
        limite: formulario.tipo === 'ranking' ? Number(formulario.limite) || 10 : undefined,
      }
      if (editandoId) {
        // Nunca reenvia agruparPor pro widget fixo — ele usa
        // 'repeticaoCategoria', que a rota de edição rejeita de propósito
        // (só aceita os 6 agrupamentos genéricos, ver AtualizarWidgetDto).
        const dados = ehFixo ? dadosBase : { ...dadosBase, agruparPor: formulario.agruparPor }
        await atualizarWidget(token, editandoId, dados)
      } else {
        await criarWidget(token, { ...dadosBase, agruparPor: formulario.agruparPor })
      }
      fecharFormulario()
      await buscar()
    } catch (e) {
      if (!tratarErroApi(e)) setErroFormulario(traduzirErroApi(e))
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(widget) {
    await atualizarWidget(token, widget.id, { ativo: !widget.ativo })
    await buscar()
  }

  async function mover(id, direcao) {
    setWidgets(await moverWidget(token, id, direcao))
  }

  async function remover(id) {
    if (confirmandoRemoverId !== id) {
      setConfirmandoRemoverId(id)
      return
    }
    setConfirmandoRemoverId(null)
    await removerWidget(token, id)
    await buscar()
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={estilos.sectionTitle}>Criar Dashboard</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Configure os widgets exibidos na tela Dashboard, compartilhado entre os técnicos</p>
        </div>
        {!mostrarFormulario && (
          <button onClick={iniciarCriacao} style={{ ...estilos.btnPrimary, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}>
            <IconPlus width={15} height={15} /> Adicionar widget
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mobile || !mostrarFormulario ? '1fr' : '1fr 380px', gap: 20, alignItems: 'flex-start' }}>
        <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
          {widgets.length === 0 ? (
            <div style={{ ...estilos.card, padding: 32, textAlign: 'center' }}>
              <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Nenhum widget configurado ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {widgets.map((widget, indice) => (
                <div key={widget.id} style={estiloLinha}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 160 }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: CORES_APP.tinta }}>{widget.titulo}</span>
                    <span style={{ fontSize: 12, color: CORES_APP.textoSuave }}>
                      {LABEL_TIPO[widget.tipo]} · {LABEL_AGRUPAR_POR[widget.agruparPor]} · {LABEL_FORMATO[widget.formatoVisual]}
                      {widget.fixo && ' · fixo'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => alternarAtivo(widget)}
                      style={{
                        padding: '6px 12px', borderRadius: 7, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer',
                        background: widget.ativo ? 'rgba(0,120,81,0.1)' : CORES_APP.card,
                        color: widget.ativo ? cores.verdeEscuro : CORES_APP.textoSuave,
                        border: `1px solid ${widget.ativo ? 'rgba(0,120,81,0.3)' : CORES_APP.borda}`,
                      }}>
                      {widget.ativo ? 'Ativo' : 'Inativo'}
                    </button>

                    <button onClick={() => mover(widget.id, 'cima')} disabled={indice === 0}
                      style={indice === 0 ? estiloBotaoIconeDesabilitado : estiloBotaoIcone} title="Mover pra cima">
                      <IconChevronUp width={14} height={14} />
                    </button>
                    <button onClick={() => mover(widget.id, 'baixo')} disabled={indice === widgets.length - 1}
                      style={indice === widgets.length - 1 ? estiloBotaoIconeDesabilitado : estiloBotaoIcone} title="Mover pra baixo">
                      <IconChevronDown width={14} height={14} />
                    </button>

                    <button onClick={() => iniciarEdicao(widget)} style={estiloBotaoIcone} title="Editar">
                      <IconEdit width={14} height={14} />
                    </button>

                    <button
                      onClick={() => remover(widget.id)}
                      disabled={widget.fixo}
                      title={widget.fixo ? 'Widget fixo, desative em vez de excluir' : (confirmandoRemoverId === widget.id ? 'Clique de novo para confirmar' : 'Excluir')}
                      style={widget.fixo ? estiloBotaoIconeDesabilitado : {
                        ...estiloBotaoIcone,
                        ...(confirmandoRemoverId === widget.id ? { background: CORES_APP.erro, borderColor: CORES_APP.erro, color: '#fff' } : {}),
                      }}>
                      <IconTrash width={14} height={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EstadoRequisicao>

        {mostrarFormulario && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormularioWidget
              formulario={formulario} setFormulario={setFormulario}
              ehFixo={ehFixo} editando={!!editandoId}
              erro={erroFormulario} salvando={salvando}
              onSalvar={salvar} onCancelar={fecharFormulario}
            />
            <WidgetRenderer widget={formulario} periodo={periodoPreview} />
          </div>
        )}
      </div>
    </div>
  )
}

function FormularioWidget({ formulario, setFormulario, ehFixo, editando, erro, salvando, onSalvar, onCancelar }) {
  function atualizarCampo(campo, valor) {
    setFormulario(f => ({ ...f, [campo]: valor }))
  }

  return (
    <div style={{ ...estilos.card, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: CORES_APP.tinta, margin: 0 }}>
        {editando ? 'Editar widget' : 'Novo widget'}
      </h3>

      <div>
        <label style={estilos.label}>Título</label>
        <input value={formulario.titulo} onChange={e => atualizarCampo('titulo', e.target.value)}
          placeholder="Ex: Contagem por prioridade" style={{ ...estilos.input, padding: '10px 12px', fontSize: 14 }} disabled={salvando} />
      </div>

      <div>
        <label style={estilos.label}>O que agrupar</label>
        <select value={formulario.agruparPor} onChange={e => atualizarCampo('agruparPor', e.target.value)}
          disabled={salvando || ehFixo} style={{ ...estilos.input, padding: '10px 12px', fontSize: 14, ...(ehFixo ? { background: CORES_APP.fundoCampo, cursor: 'not-allowed' } : {}) }}>
          {ehFixo
            ? <option value={formulario.agruparPor}>{LABEL_AGRUPAR_POR[formulario.agruparPor]}</option>
            : OPCOES_AGRUPAR_POR.map(op => <option key={op} value={op}>{LABEL_AGRUPAR_POR[op]}</option>)}
        </select>
        {ehFixo && <p style={{ color: CORES_APP.textoSuave, fontSize: 12, margin: '4px 0 0' }}>Widget fixo. O agrupamento não pode ser alterado.</p>}
      </div>

      <div>
        <label style={estilos.label}>Tipo</label>
        <select value={formulario.tipo} onChange={e => atualizarCampo('tipo', e.target.value)}
          disabled={salvando} style={{ ...estilos.input, padding: '10px 12px', fontSize: 14 }}>
          {Object.entries(LABEL_TIPO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </select>
      </div>

      <div>
        <label style={estilos.label}>Formato visual</label>
        <select value={formulario.formatoVisual} onChange={e => atualizarCampo('formatoVisual', e.target.value)}
          disabled={salvando} style={{ ...estilos.input, padding: '10px 12px', fontSize: 14 }}>
          {Object.entries(LABEL_FORMATO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </select>
      </div>

      {formulario.tipo === 'ranking' && (
        <div>
          <label style={estilos.label}>Quantos itens mostrar</label>
          <input type="number" min={1} value={formulario.limite} onChange={e => atualizarCampo('limite', e.target.value)}
            style={{ ...estilos.input, padding: '10px 12px', fontSize: 14 }} disabled={salvando} />
        </div>
      )}

      {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSalvar} disabled={salvando} style={{ ...estilos.btnPrimary, opacity: salvando ? 0.7 : 1, cursor: salvando ? 'default' : 'pointer' }}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={onCancelar} disabled={salvando} style={{ background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: '11px 20px', color: CORES_APP.textoFraco, fontFamily: 'Outfit, sans-serif', fontSize: 14, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default CriarDashboard
