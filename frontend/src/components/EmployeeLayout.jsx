import { useState } from 'react'
import Logo from './Logo'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { obterIniciais } from '../utils/formatters'
import { IconEye, IconMenu, IconLock, IconLogOut, IconSun, IconMoon, IconMegaphone, IconListChecks, IconNote, IconLightbulb } from './icons'
import { CORES_APP, CORES_PRIORIDADE } from '../styles/theme'
import { cores } from '../styles/authTheme'
import { useTheme } from '../hooks/useTheme'
import ChatFlutuante from './ChatFlutuante'

// Cabeçalho fixo do colaborador: logo, navegação (Novo Chamado / Meus
// Chamados) e avatar com iniciais que abre um pequeno menu (Trocar senha /
// Sair) — antes o clique no avatar deslogava direto; virou um menu porque
// "Trocar senha" precisava de um lugar acessível pra qualquer usuário.
// Em telas estreitas (mobile) os labels viram ícones para caber no espaço.
// `larguraMaxima` tem default 840 (a largura de sempre, boa pra telas de
// texto/lista como Meus Chamados) — só a tela "Abrir chamado" pede uma
// largura maior (App.jsx passa um valor diferente ali), pra caber o
// layout de duas colunas (formulário + Resumo da Solicitação) sem
// espremer. Nenhuma outra tela do colaborador muda.
function EmployeeLayout({ user, telaAtiva, onNav, onLogout, onTrocarSenha, larguraMaxima = 840, contagemAvisos = 0, children }) {
  const largura = useWindowWidth()
  // 768 é o mesmo breakpoint de TicketPanel.jsx/ITLayout.jsx — antes era
  // 640, que deixava uma faixa "morta" entre 640 e ~1100px (largura real
  // que os 6 labels de texto completo precisam pra caber sem quebrar
  // linha) onde os itens do menu quebravam em duas linhas e estouravam a
  // altura fixa do header, cortando texto no topo da página (ver captura
  // de tela reportada). `compacto` cobre esse meio-termo: ainda mostra
  // texto (não vira ícone cedo demais), só com menos respiro — e o
  // `overflowX: 'auto'` do <nav> abaixo é a rede de segurança final: se
  // mesmo assim não couber (larguras bem no limiar), rola por dentro do
  // menu em vez de quebrar linha ou estourar o header.
  const mobile = largura < 768
  const compacto = !mobile && largura < 1024
  const [menuAberto, setMenuAberto] = useState(false)
  const { modo, alternarTema } = useTheme()

  const itensNav = [
    { tela: 'emp-home', label: mobile ? '+' : 'Novo Chamado' },
    { tela: 'emp-tickets', label: mobile ? <IconMenu /> : 'Meus Chamados' },
    { tela: 'emp-observing', label: mobile ? <IconEye /> : 'Acompanhando' },
    { tela: 'emp-avisos', label: mobile ? <IconMegaphone /> : 'Mural de Avisos', badge: contagemAvisos },
    { tela: 'emp-tarefas', label: mobile ? <IconListChecks /> : 'Minhas Tarefas' },
    { tela: 'emp-anotacoes', label: mobile ? <IconNote /> : 'Minhas Anotações' },
  ]

  return (
    // height (não minHeight) + overflow hidden: fecha a página inteira na
    // altura exata da viewport, então quem decide como rolar o que sobra é
    // sempre um filho específico, nunca a janela do navegador como um
    // todo. `main` abaixo vira o container de scroll padrão (mesmo
    // resultado visual de antes pra toda tela que não pede nada especial
    // — cabeçalho continua fixo, conteúdo rola por baixo dele); as 6 telas
    // paginadas (Colaboradores, Acompanhando, Fórum, Central de Chamados,
    // Soluções Conhecidas, Mural de Avisos) usam `height:'100%'` no
    // próprio wrapper pra assumir SEU PRÓPRIO scroll interno em vez do de
    // `main`, com a paginação ancorada fora dessa área — mesma técnica de
    // "coluna flex + flex:1 1 auto + minHeight:0" já usada em
    // TicketPanel.jsx pro bloco de comentários.
    <div style={{ height: '100vh', overflow: 'hidden', background: CORES_APP.fundo, display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: CORES_APP.card, borderBottom: `1px solid ${CORES_APP.bordaSuave}`, padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 40, flexShrink: 0, gap: 12 }}>
        {/* flexShrink: 0 na logo e no bloco da direita — só o <nav> do meio
            pode ceder espaço (rolando por dentro dele mesmo, ver abaixo).
            Sem isso, a logo/avatar também poderiam ser espremidos ou
            cortados em larguras intermediárias. */}
        <div style={{ flexShrink: 0 }}>
          <Logo size={mobile ? 30 : 36} showText={!mobile} />
        </div>
        {/* minWidth: 0 é o que permite um item de flexbox encolher abaixo
            do tamanho do seu conteúdo — sem isso, overflowX não teria
            efeito nenhum (o <nav> simplesmente empurraria o header pra
            largura toda do conteúdo). flexWrap: nowrap garante que os
            itens NUNCA quebrem linha (a causa raiz do bug reportado); se
            não couberem, rolam horizontalmente por dentro do próprio menu
            em vez de estourar a altura fixa do header. */}
        <nav style={{
          display: 'flex', flexWrap: 'nowrap', gap: mobile ? 4 : compacto ? 2 : 4, flexShrink: 1, minWidth: 0,
          overflowX: 'auto', scrollbarWidth: 'thin',
          // `overflowX: 'auto'` sozinho força o navegador a tratar
          // `overflowY` como 'auto' também (não dá pra ter só um eixo
          // rolável) — isso cortava o badge de contagem, que flutua
          // acima/à direita do botão via `top/right: -4px` (mais o anel
          // de `boxShadow` de 2px, 6px de protrusão real no total). O
          // corte de overflow acontece na borda do padding-box, não do
          // content-box — esse padding cria espaço suficiente ali,
          // sem mudar a posição visual do badge em si.
          padding: mobile ? '2px 4px' : '6px',
        }}>
          {itensNav.map(item => (
            <button key={item.tela} onClick={() => onNav(item.tela)}
              style={{
                position: 'relative',
                background: telaAtiva === item.tela ? 'rgba(0,120,81,0.1)' : 'transparent',
                color: telaAtiva === item.tela ? cores.verdeEscuro : CORES_APP.textoFraco,
                border: `1px solid ${telaAtiva === item.tela ? 'rgba(0,120,81,0.25)' : 'transparent'}`,
                borderRadius: 8, padding: mobile ? '7px 14px' : compacto ? '7px 10px' : '7px 16px',
                fontSize: mobile ? 16 : compacto ? 12 : 13,
                fontFamily: 'Outfit, sans-serif', fontWeight: telaAtiva === item.tela ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              {item.label}
              {!!item.badge && (
                <span style={{
                  position: 'absolute', top: mobile ? 2 : -4, right: mobile ? 2 : -4,
                  minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99,
                  background: CORES_PRIORIDADE.alta.dot, color: '#fff', fontSize: 10, fontWeight: 700,
                  fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, boxShadow: `0 0 0 2px ${CORES_APP.card}`,
                }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', flexShrink: 0 }}>
          {!mobile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: CORES_APP.tinta, lineHeight: 1.2 }}>{user.name?.split(' ')[0]}</div>
              <div style={{ fontSize: 11, color: CORES_APP.textoFraco }}>{user.role}</div>
            </div>
          )}
          <div onClick={() => setMenuAberto(v => !v)} title="Minha conta"
            style={{ width: 34, height: 34, borderRadius: '50%', background: cores.verdeEscuro, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
            {obterIniciais(user.name)}
          </div>
          {menuAberto && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 44 }} onClick={() => setMenuAberto(false)} />
              <div style={{ position: 'absolute', top: 42, right: 0, zIndex: 45, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: 6, minWidth: 160, boxShadow: '0 8px 24px rgba(16,35,31,0.18)' }}>
                <button onClick={alternarTema} aria-pressed={modo === 'escuro'}
                  title={modo === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', color: CORES_APP.texto, fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '9px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  {modo === 'claro' ? <IconMoon width={14} height={14} /> : <IconSun width={14} height={14} />}
                  {modo === 'claro' ? 'Tema escuro' : 'Tema claro'}
                </button>
                <button onClick={() => { setMenuAberto(false); onNav('emp-forum') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', color: CORES_APP.texto, fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '9px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  <IconLightbulb width={14} height={14} /> Fórum de Sugestões
                </button>
                <button onClick={() => { setMenuAberto(false); onTrocarSenha() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', color: CORES_APP.texto, fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '9px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  <IconLock width={14} height={14} /> Trocar senha
                </button>
                <button onClick={() => { setMenuAberto(false); onLogout() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', color: CORES_APP.erro, fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '9px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  <IconLogOut width={14} height={14} /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: mobile ? '24px 16px' : '36px 28px', maxWidth: larguraMaxima, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
      <ChatFlutuante />
    </div>
  )
}

export default EmployeeLayout
