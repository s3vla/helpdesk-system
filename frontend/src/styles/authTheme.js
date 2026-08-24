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
  // Levemente puxado pro azul (não é mais um cinza neutro) — o lado claro
  // das 4 telas de auth estava "seco" demais com um cinza chapado; esse
  // tingimento é quase imperceptível sozinho, mas some a sensação de vazio
  // clínico quando combinado com a textura diagonal + os círculos de canto
  // (ver FundoDecorativo.jsx). `fundoCampo` fica de fora de propósito — é
  // usado dentro do card (campo readOnly do Primeiro Acesso), não na
  // página, então não precisa do mesmo tingimento.
  fundo: '#F2F5F8',
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
  // `position: relative` + `overflow: hidden` são pro FundoDecorativo (ver
  // components/auth/FundoDecorativo.jsx), que cobre o `<main>` inteiro
  // deitado atrás do card — sem isso os círculos de canto (que estouram a
  // borda de propósito, mesmo truque de BrandPanel.jsx) criariam scroll.
  principal: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    boxSizing: 'border-box',
  },
  principalMobile: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 20px',
    boxSizing: 'border-box',
  },
  // Card flutuante do formulário, "pousado" sobre o cinza claro de
  // `pagina`/`paginaMobile` — antes o formulário ficava direto sobre o
  // fundo da página, sem nenhuma superfície própria. `coluna` (o miolo:
  // eyebrow/título, form, divisor de links) vive DENTRO deste card agora.
  // `position: relative` + `zIndex: 1` erguem o card acima do
  // FundoDecorativo (que fica em zIndex 0 dentro do mesmo `<main>`).
  cartao: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 424, boxSizing: 'border-box',
    background: cores.branco, border: `1px solid ${cores.bordaSuave}`,
    borderRadius: 18, padding: '36px 34px',
    boxShadow: '0 16px 40px rgba(16,35,31,0.10)',
  },
  cartaoMobile: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 424, boxSizing: 'border-box',
    background: cores.branco, border: `1px solid ${cores.bordaSuave}`,
    borderRadius: 16, padding: '28px 22px',
    boxShadow: '0 10px 28px rgba(16,35,31,0.10)',
  },
  coluna: { display: 'flex', flexDirection: 'column', gap: 22 },
  eyebrow: { fontFamily: fonteMono, fontSize: 11, letterSpacing: '0.18em', color: cores.azulMedio },
  titulo: { margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: cores.tinta },
  texto: { margin: 0, fontSize: 15, lineHeight: 1.5, color: cores.textoFraco },
  // Densidade alinhada ao mesmo ajuste já feito nos formulários de chamado
  // (CreateTicket.jsx/ITAbrirChamado.jsx): gaps menores entre label→input→
  // próximo campo, e campo um pouco mais baixo (46px, não mais 50px).
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  campo: { display: 'flex', flexDirection: 'column', gap: 6 },
  rotulo: { fontSize: 13, fontWeight: 500, color: cores.texto },
  input: {
    height: 46,
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
  divisor: { paddingTop: 18, borderTop: `1px solid ${cores.bordaSuave}` },
  // `padding: 0` é necessário mesmo com background/border zerados — sem
  // isso, o <button> herda o padding padrão do navegador (varia por
  // browser/SO), que passava despercebido nos outros usos deste estilo
  // (sempre com texto normal ao redor achatando o efeito) mas inflava
  // visivelmente o respiro do link "Sou da equipe técnica", que é 100%
  // botão, sem nenhum texto solto ao redor pra disfarçar.
  link: { fontSize: 14, color: cores.azul, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 0, padding: 0 },
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
