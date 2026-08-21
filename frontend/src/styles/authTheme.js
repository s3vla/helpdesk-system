// Tema CLARO exclusivo das telas de autenticação (login colaborador, login
// TI, primeiro acesso, troca de senha obrigatória) — baseado no design
// fornecido (Figma). Isolado de propósito em vez de misturar com
// `theme.js`: o resto do sistema (Central de Chamados, painel de
// atendimento etc.) continua no tema escuro atual, sem nenhuma mudança.
//
// Regra de cor: AZUL = navegação/foco/ações da área de TI. VERDE = ação de
// confirmação do colaborador. Lima só como sinalização pontual (status
// "operando", ponto do logo). Nada de verde-esmeralda ou navy do tema
// escuro vazando pra cá.
export const cores = {
  azul: '#0049C0',
  azulMedio: '#0082C0',
  ciano: '#00CCC0',
  verdeLima: '#72C620',
  verde: '#00B351',
  verdeEscuro: '#007851',
  azulProfundo: '#003B8F',
  tinta: '#10231F',
  texto: '#3C4A46',
  textoFraco: '#5C6B67',
  textoSuave: '#7A8783',
  placeholder: '#9AA5A2',
  borda: '#D2DAD7',
  bordaSuave: '#E3E8E6',
  fundo: '#F4F6F5',
  fundoCampo: '#EFF3F1',
  branco: '#FFFFFF',
  erro: '#C0392B',
}

export const fonte = 'Archivo, Helvetica, sans-serif'
export const fonteMono = "'IBM Plex Mono', monospace"

export const estilosAuth = {
  pagina: {
    display: 'grid',
    gridTemplateColumns: '44% 1fr',
    minHeight: '100vh',
    background: cores.fundo,
    fontFamily: fonte,
  },
  paginaMobile: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: cores.fundo,
    fontFamily: fonte,
  },
  principal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    boxSizing: 'border-box',
  },
  coluna: { width: '100%', maxWidth: 424, display: 'flex', flexDirection: 'column', gap: 28 },
  eyebrow: { fontFamily: fonteMono, fontSize: 11, letterSpacing: '0.18em', color: cores.azulMedio },
  titulo: { margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: cores.tinta },
  texto: { margin: 0, fontSize: 15, lineHeight: 1.5, color: cores.textoFraco },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  campo: { display: 'flex', flexDirection: 'column', gap: 7 },
  rotulo: { fontSize: 13, fontWeight: 500, color: cores.texto },
  input: {
    height: 50,
    padding: '0 16px',
    fontFamily: fonte,
    fontSize: 15,
    color: cores.tinta,
    background: cores.branco,
    border: `1px solid ${cores.borda}`,
    borderRadius: 10,
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputSenha: { paddingRight: 52 },
  botao: {
    height: 52,
    marginTop: 6,
    fontFamily: fonte,
    fontSize: 15,
    fontWeight: 600,
    color: cores.branco,
    border: 0,
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background .15s',
  },
  divisor: { paddingTop: 22, borderTop: `1px solid ${cores.bordaSuave}` },
  link: { fontSize: 14, color: cores.azul, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 0 },
}

export const botaoVerde = { ...estilosAuth.botao, background: cores.verdeEscuro }
export const botaoAzul = { ...estilosAuth.botao, background: cores.azul }
export const botaoInativo = { ...estilosAuth.botao, background: cores.bordaSuave, color: cores.placeholder, cursor: 'not-allowed' }

// Heurística client-side só pra dar um feedback visual imediato — NÃO é
// validação: a regra real (mínimo 8 caracteres) continua sendo aplicada
// pelo backend, isso aqui nunca bloqueia nem libera nada sozinho.
export function forcaSenha(p) {
  if (!p) return { pct: '0%', cor: cores.bordaSuave, label: '—' }
  let n = 0
  if (p.length >= 8) n++
  if (p.length >= 12) n++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++
  if (/[0-9]/.test(p)) n++
  if (/[^A-Za-z0-9]/.test(p)) n++
  if (n <= 2) return { pct: '33%', cor: cores.azulMedio, label: 'FRACA' }
  if (n === 3) return { pct: '66%', cor: cores.verde, label: 'BOA' }
  return { pct: '100%', cor: cores.verdeEscuro, label: 'FORTE' }
}
