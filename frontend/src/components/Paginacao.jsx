import { CORES_APP } from '../styles/theme'
import { cores } from '../styles/authTheme'
import { IconChevronRight } from './icons'

// Até quantos números de página mostrar de cada lado da página atual —
// além disso, mostra só as pontas (1 ... 8 9 [10] 11 12 ... 30) em vez de
// listar todas as páginas, pra nunca estourar a largura do rodapé numa
// lista bem grande.
const VIZINHANCA = 1

// Monta a lista de "itens" do meio da paginação: números + separadores
// '…' onde houver um salto. Sempre inclui a primeira e a última página.
function montarItens(paginaAtual, totalPaginas) {
  const paginas = new Set([1, totalPaginas])
  for (let p = paginaAtual - VIZINHANCA; p <= paginaAtual + VIZINHANCA; p++) {
    if (p >= 1 && p <= totalPaginas) paginas.add(p)
  }
  const ordenadas = [...paginas].sort((a, b) => a - b)

  const itens = []
  let anterior = 0
  for (const p of ordenadas) {
    if (anterior && p - anterior > 1) itens.push({ tipo: 'reticencias', chave: `r-${p}` })
    itens.push({ tipo: 'pagina', valor: p, chave: `p-${p}` })
    anterior = p
  }
  return itens
}

// Componente único de paginação, reaproveitado em toda listagem que pode
// crescer sem limite (Central de Chamados, Meus Chamados, Acompanhando,
// Colaboradores, Soluções Conhecidas, Mural de Avisos) — números de página
// + setas anterior/próxima, sempre no rodapé da lista. Não busca dados
// sozinho: só avisa `aoMudarPagina(novaPagina)`, quem chama decide o que
// fazer (a tela já tem seu próprio efeito que reage à mudança de página).
function Paginacao({ paginaAtual, totalPaginas, aoMudarPagina }) {
  if (totalPaginas <= 1) return null

  const itens = montarItens(paginaAtual, totalPaginas)

  const estiloBotaoBase = {
    minWidth: 30, height: 30, padding: '0 6px', borderRadius: 7, fontSize: 13,
    fontFamily: 'Outfit, sans-serif', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }

  // Fica de propósito FORA da área com overflowY:'auto' de quem chama
  // (ver ITUsers.jsx e as outras 5 telas paginadas) — não position:sticky
  // nem fixed, porque com um ancestral de altura travada de verdade
  // (height:'100%' + flex column, mesma técnica de TicketPanel.jsx) a
  // paginação já fica ancorada embaixo simplesmente por estar fora do
  // bloco que rola, sem precisar de nenhum truque de posicionamento CSS.
  // Borda superior separa visualmente da lista, já que agora fica
  // sempre visível ali, mesmo com a lista rolando por baixo dela.
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap',
      marginTop: 20, paddingTop: 16, flexShrink: 0,
      borderTop: `1px solid ${CORES_APP.bordaSuave}`,
    }} aria-label="Paginação">
      <button type="button" onClick={() => aoMudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1}
        title="Página anterior"
        style={{ ...estiloBotaoBase, background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, color: paginaAtual === 1 ? CORES_APP.borda : CORES_APP.textoFraco, cursor: paginaAtual === 1 ? 'default' : 'pointer' }}>
        <IconChevronRight width={13} height={13} style={{ transform: 'rotate(180deg)' }} />
      </button>

      {itens.map(item => item.tipo === 'reticencias' ? (
        <span key={item.chave} style={{ ...estiloBotaoBase, color: CORES_APP.textoSuave, cursor: 'default' }}>…</span>
      ) : (
        <button key={item.chave} type="button" onClick={() => aoMudarPagina(item.valor)}
          style={{
            ...estiloBotaoBase,
            background: item.valor === paginaAtual ? 'rgba(0,120,81,0.1)' : 'transparent',
            color: item.valor === paginaAtual ? cores.verdeEscuro : CORES_APP.textoFraco,
            border: `1px solid ${item.valor === paginaAtual ? 'rgba(0,120,81,0.3)' : 'transparent'}`,
            fontWeight: item.valor === paginaAtual ? 700 : 400,
          }}>
          {item.valor}
        </button>
      ))}

      <button type="button" onClick={() => aoMudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}
        title="Próxima página"
        style={{ ...estiloBotaoBase, background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, color: paginaAtual === totalPaginas ? CORES_APP.borda : CORES_APP.textoFraco, cursor: paginaAtual === totalPaginas ? 'default' : 'pointer' }}>
        <IconChevronRight width={13} height={13} />
      </button>
    </nav>
  )
}

export default Paginacao
