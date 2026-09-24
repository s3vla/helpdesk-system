import { cores } from '../../styles/authTheme'

// Só renderiza quando o backend confirma modoDemo=true (ver App.jsx, que
// busca isso em GET / — a única fonte de verdade é o backend, nunca uma
// variável própria do frontend, pra não haver risco de uma dizer demo e a
// outra não). Mesma paleta neutra/informativa já usada em
// AuthContext.mensagemSessao (avisoBg/avisoBorda/avisoTexto), pra não
// parecer um erro.
function AvisoDemo() {
  return (
    <div style={{
      background: cores.avisoBg, border: `1px solid ${cores.avisoBorda}`,
      borderRadius: 10, padding: '10px 14px', color: cores.avisoTexto, fontSize: 12.5, lineHeight: 1.5,
    }}>
      Ambiente de demonstração — Técnico: suporte@empresa-exemplo.com / Demo2026! —
      Colaborador: clique em "Primeiro Acesso" e use rh@empresa-exemplo.com ou financeiro@empresa-exemplo.com
    </div>
  )
}

export default AvisoDemo
