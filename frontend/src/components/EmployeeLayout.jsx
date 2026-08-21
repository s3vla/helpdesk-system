import { useState } from 'react'
import Logo from './Logo'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { obterIniciais } from '../utils/formatters'
import { IconEye, IconMenu, IconLock, IconLogOut } from './icons'
import { CORES_APP } from '../styles/theme'

// Cabeçalho fixo do colaborador: logo, navegação (Novo Chamado / Meus
// Chamados) e avatar com iniciais que abre um pequeno menu (Trocar senha /
// Sair) — antes o clique no avatar deslogava direto; virou um menu porque
// "Trocar senha" precisava de um lugar acessível pra qualquer usuário.
// Em telas estreitas (mobile) os labels viram ícones para caber no espaço.
function EmployeeLayout({ user, telaAtiva, onNav, onLogout, onTrocarSenha, children }) {
  const largura = useWindowWidth()
  const mobile = largura < 640
  const [menuAberto, setMenuAberto] = useState(false)

  const itensNav = [
    { tela: 'emp-home', label: mobile ? '+' : 'Novo Chamado' },
    { tela: 'emp-tickets', label: mobile ? <IconMenu /> : 'Meus Chamados' },
    { tela: 'emp-observing', label: mobile ? <IconEye /> : 'Acompanhando' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: CORES_APP.fundo, display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: CORES_APP.card, borderBottom: `1px solid ${CORES_APP.bordaSuave}`, padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0, gap: 12 }}>
        <Logo size={mobile ? 30 : 36} showText={!mobile} />
        <nav style={{ display: 'flex', gap: 4 }}>
          {itensNav.map(item => (
            <button key={item.tela} onClick={() => onNav(item.tela)}
              style={{
                background: telaAtiva === item.tela ? 'rgba(0,120,81,0.1)' : 'transparent',
                color: telaAtiva === item.tela ? '#007851' : CORES_APP.textoFraco,
                border: `1px solid ${telaAtiva === item.tela ? 'rgba(0,120,81,0.25)' : 'transparent'}`,
                borderRadius: 8, padding: mobile ? '7px 14px' : '7px 16px', fontSize: mobile ? 16 : 13,
                fontFamily: 'Outfit, sans-serif', fontWeight: telaAtiva === item.tela ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {!mobile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: CORES_APP.tinta, lineHeight: 1.2 }}>{user.name?.split(' ')[0]}</div>
              <div style={{ fontSize: 11, color: CORES_APP.textoFraco }}>{user.role}</div>
            </div>
          )}
          <div onClick={() => setMenuAberto(v => !v)} title="Minha conta"
            style={{ width: 34, height: 34, borderRadius: '50%', background: '#007851', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
            {obterIniciais(user.name)}
          </div>
          {menuAberto && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 44 }} onClick={() => setMenuAberto(false)} />
              <div style={{ position: 'absolute', top: 42, right: 0, zIndex: 45, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: 6, minWidth: 160, boxShadow: '0 8px 24px rgba(16,35,31,0.18)' }}>
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
      <main style={{ flex: 1, padding: mobile ? '24px 16px' : '36px 28px', maxWidth: 840, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  )
}

export default EmployeeLayout
