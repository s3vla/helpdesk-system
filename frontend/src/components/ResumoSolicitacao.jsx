import { estilos, CORES_APP } from '../styles/theme'
import { LABEL_CATEGORIA } from '../utils/categorias'
import PriorityChip from './PriorityChip'

const estiloLinha = { background: CORES_APP.fundoCampo, borderRadius: 8, padding: '9px 11px' }
const estiloValor = { color: CORES_APP.tinta, fontWeight: 500, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

// Card lateral da tela "Abrir chamado" (CreateTicket.jsx e
// ITAbrirChamado.jsx) — só reflete o que já está no formulário, nada
// calculado ou inventado: sem status de sistema, tempo de resposta ou
// FAQ, porque nada disso existe de verdade no sistema hoje. Nível
// estimado também fica de fora de propósito: a regra automática
// (nivel-triagem.util.ts) só existe no backend, e replicá-la aqui geraria
// duas cópias da mesma lógica podendo divergir com o tempo — o nível real
// já aparece pro técnico assim que o chamado é criado, isso basta.
function ResumoSolicitacao({ categoria, prioridade, arquivos = [] }) {
  // 0 → "Nenhum"; 1 → nome do arquivo (mais informativo pro caso comum);
  // 2+ → contagem (listar todos os nomes aqui ficaria apertado pro
  // espaço da coluna direita — a lista completa já fica visível no
  // dropzone do formulário, ao lado).
  const textoAnexo = arquivos.length === 0 ? 'Nenhum' : arquivos.length === 1 ? arquivos[0].name : `${arquivos.length} imagens anexadas`

  return (
    <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.14)', padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: CORES_APP.tinta, margin: 0 }}>Resumo da solicitação</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={estiloLinha}>
          <div style={estilos.label}>Categoria</div>
          <div style={estiloValor}>{LABEL_CATEGORIA[categoria] ?? categoria}</div>
        </div>
        <div style={estiloLinha}>
          <div style={estilos.label}>Prioridade</div>
          <PriorityChip priority={prioridade} />
        </div>
        <div style={estiloLinha}>
          <div style={estilos.label}>{arquivos.length > 1 ? 'Anexos' : 'Anexo'}</div>
          <div style={{ ...estiloValor, color: arquivos.length ? '#00b351' : CORES_APP.textoFraco }}>{textoAnexo}</div>
        </div>
      </div>
    </div>
  )
}

export default ResumoSolicitacao
