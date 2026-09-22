import { cores, fonte, fonteMono } from '../../styles/authTheme'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import Logo from '../Logo'

// Painel de marca (lado esquerdo nas 4 telas de autenticação). Fundo
// decorativo 100% gerado por gradientes CSS (sem foto), pra não depender
// de nenhuma imagem específica de empresa neste template público. No
// mobile, empilha acima do formulário em vez de ficar ao lado (ver
// LoginScreen/ITLoginScreen/etc., que trocam o grid por flex-column via
// useWindowWidth — mesmo padrão responsivo já usado no resto do app).
function BrandPanel() {
  const largura = useWindowWidth()
  const mobile = largura < 900

  return (
    <aside style={{
      position: 'relative', overflow: 'hidden',
      padding: mobile ? '32px 24px' : '56px 56px 48px',
      minHeight: mobile ? 260 : undefined,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      background: cores.azulProfundo, fontFamily: fonte,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(168deg, rgba(0,73,192,0.9) 0%, rgba(0,130,192,0.82) 55%, rgba(0,204,192,0.62) 130%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,58,140,0.72) 0%, rgba(0,58,140,0) 55%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)',
        backgroundSize: '46px 46px',
      }} />
      {/* Halo verde reduzido de propósito (o próprio design original já
          sinalizou que, em tamanho/opacidade cheios, brigava visualmente
          com o azul) — metade do raio e menos opaco que a referência. */}
      <div style={{
        position: 'absolute', right: -140, bottom: -180, width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, rgba(114,198,32,0.22), rgba(0,179,81,0) 68%)',
      }} />

      {/* Ícone original da marca (círculos concêntricos giratórios,
          componente Logo.jsx já usado no resto do sistema) — aqui só o
          ícone (showText=false), porque o texto "EXEMPLO · SUPORTE" deste
          painel tem formato próprio (duas linhas, mono no segundo), maior
          que o "EXEMPLO" compacto do Logo.jsx, para ter presença como no
          design anterior (login antigo usava Logo size={54}). */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: mobile ? 14 : 18 }}>
        <Logo size={mobile ? 40 : 54} showText={false} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: mobile ? 21 : 27, fontWeight: 700, letterSpacing: '0.14em', color: '#fff' }}>EMPRESA</span>
          <span style={{ fontFamily: fonteMono, fontSize: mobile ? 11 : 12, letterSpacing: '0.32em', color: 'rgba(255,255,255,0.75)' }}>EXEMPLO · SUPORTE</span>
        </div>
      </div>

      {!mobile && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 460 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3vw, 44px)', lineHeight: 1.05, overflowWrap: 'break-word', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>
            Abertura e acompanhamento de chamados internos
          </h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)' }}>
            Registre um problema, acompanhe o andamento e converse com a equipe técnica sem sair do sistema.
          </p>
        </div>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cores.verdeLima, display: 'inline-block', flexShrink: 0 }} />
        <span>Sistemas operando normalmente</span>
      </div>
    </aside>
  )
}

export default BrandPanel
