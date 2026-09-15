import { useState } from 'react'
import Logo from './Logo'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { IconMenu, IconLock, IconLogOut, IconSun, IconMoon, IconBarChart, IconSettings, IconMegaphone, IconListChecks, IconLightbulb, IconShield } from './icons'
import { CORES_TI, CORES_APP } from '../styles/theme'
import { cores } from '../styles/authTheme'
import { obterIniciais } from '../utils/formatters'
import { useTheme } from '../hooks/useTheme'

// Sidebar fixa da Área Técnica (Chamados / Colaboradores / Soluções
// Conhecidas). Abaixo de 768px vira um menu hambúrguer que sobrepõe a tela,
// já que não cabe lado a lado com o conteúdo.
const ITENS_NAV = [
  {
    tela: 'it-dash',
    label: 'Chamados',
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    tela: 'it-admin',
    label: 'Administração',
    icon: <IconShield width={16} height={16} />,
    // Destaque: separa esta entrada das demais, em posição de destaque logo
    // depois de "Chamados" — ver ITLayout abaixo, onde `destaque: true`
    // ganha cor/negrito diferentes mesmo fora do estado ativo.
    destaque: true,
  },
  {
    tela: 'it-users',
    label: 'Colaboradores',
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="8" cy="8" r="4" /><path d="M2 20a6 6 0 0 1 12 0" />
        <circle cx="18" cy="9" r="3" /><path d="M22 20a4 4 0 0 0-8 0" />
      </svg>
    ),
  },
  {
    tela: 'it-solutions',
    label: 'Soluções Conhecidas',
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    tela: 'it-abrir-chamado',
    label: 'Abrir chamado',
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    tela: 'it-metricas',
    label: 'Dashboard',
    icon: <IconBarChart width={16} height={16} />,
  },
  {
    tela: 'it-metricas-config',
    label: 'Criar Dashboard',
    icon: <IconSettings width={16} height={16} />,
  },
  {
    tela: 'it-avisos',
    label: 'Mural de Avisos',
    icon: <IconMegaphone width={16} height={16} />,
  },
  {
    tela: 'it-tarefas',
    label: 'Minhas Tarefas',
    icon: <IconListChecks width={16} height={16} />,
  },
]

function ITLayout({ tela, usuario, onNav, onLogout, onTrocarSenha, children }) {
  const largura = useWindowWidth()
  const mobile = largura < 768
  const [menuAberto, setMenuAberto] = useState(false)
  const { modo, alternarTema } = useTheme()

  const sidebar = (
    <aside style={{ width: 220, background: CORES_APP.card, borderRight: `1px solid ${CORES_APP.bordaSuave}`, display: 'flex', flexDirection: 'column', padding: '22px 14px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 32, padding: '0 4px' }}><Logo size={34} /></div>
      <div style={{ background: 'rgba(0,73,192,0.08)', border: '1px solid rgba(0,73,192,0.22)', borderRadius: 8, padding: '7px 11px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: CORES_TI.accent, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: CORES_TI.accent, textTransform: 'uppercase' }}>Painel TI</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {ITENS_NAV.map(item => {
          const ativo = tela === item.tela || (tela === 'it-user' && item.tela === 'it-users')
          return (
            <button key={item.tela} onClick={() => { onNav(item.tela); setMenuAberto(false) }}
              style={{
                background: ativo ? 'rgba(0,73,192,0.1)' : (item.destaque ? 'rgba(0,73,192,0.05)' : 'transparent'),
                color: ativo || item.destaque ? CORES_TI.accent : CORES_APP.textoFraco,
                border: item.destaque && !ativo ? '1px solid rgba(0,73,192,0.22)' : 'none',
                borderRadius: 9, padding: '11px 13px', fontSize: 14,
                fontFamily: 'Outfit, sans-serif', fontWeight: ativo || item.destaque ? 600 : 400, cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                marginBottom: item.destaque ? 8 : 0,
              }}>
              {item.icon}{item.label}
            </button>
          )
        })}
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Só o nome — nível é atributo do CHAMADO (N1/N2/N3), não da
            pessoa, não faz sentido rotular o técnico com um "Técnico N2". */}
        {usuario?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 2px 2px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: cores.verdeEscuro, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 11, color: '#fff', flexShrink: 0 }}>
              {obterIniciais(usuario.name)}
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: CORES_APP.tinta, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.name}</span>
          </div>
        )}
        <button onClick={alternarTema} aria-pressed={modo === 'escuro'}
          title={modo === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 9, padding: '10px 13px', color: CORES_APP.textoFraco, fontFamily: 'Outfit, sans-serif', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
          {modo === 'claro' ? <IconMoon width={14} height={14} /> : <IconSun width={14} height={14} />}
          {modo === 'claro' ? 'Tema escuro' : 'Tema claro'}
        </button>
        <button onClick={() => { onNav('it-forum'); setMenuAberto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 9, padding: '10px 13px', color: CORES_APP.textoFraco, fontFamily: 'Outfit, sans-serif', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
          <IconLightbulb width={14} height={14} /> Fórum de Sugestões
        </button>
        <button onClick={() => { onTrocarSenha(); setMenuAberto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 9, padding: '10px 13px', color: CORES_APP.textoFraco, fontFamily: 'Outfit, sans-serif', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
          <IconLock width={14} height={14} /> Trocar senha
        </button>
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 9, padding: '10px 13px', color: CORES_APP.textoSuave, fontFamily: 'Outfit, sans-serif', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
          <IconLogOut width={14} height={14} /> Sair
        </button>
      </div>
    </aside>
  )

  // height (não minHeight) + overflow hidden nos dois wrappers, mesmo
  // raciocínio de EmployeeLayout.jsx: fecha a página na altura exata da
  // viewport, `main` vira o container de scroll padrão pra qualquer tela
  // comum, e as 6 telas paginadas usam `height:'100%'` no próprio wrapper
  // pra assumir seu próprio scroll interno com a paginação ancorada fora
  // dele (mesma técnica de TicketPanel.jsx).
  if (mobile) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden', background: CORES_APP.fundo, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: CORES_APP.card, borderBottom: `1px solid ${CORES_APP.bordaSuave}`, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 40, flexShrink: 0 }}>
          <Logo size={30} />
          <button onClick={() => setMenuAberto(v => !v)} style={{ background: 'none', border: 'none', color: CORES_APP.textoFraco, cursor: 'pointer', display: 'flex' }}>
            <IconMenu width={22} height={22} />
          </button>
        </header>
        {menuAberto && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setMenuAberto(false)}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 220 }} onClick={e => e.stopPropagation()}>
              {sidebar}
            </div>
          </div>
        )}
        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 16px', boxSizing: 'border-box' }}>{children}</main>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: CORES_APP.fundo, display: 'flex' }}>
      <div style={{ width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40 }}>{sidebar}</div>
      <main style={{ flex: 1, marginLeft: 220, padding: '34px 32px', height: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>{children}</main>
    </div>
  )
}

export default ITLayout
