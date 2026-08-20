import { useState, useRef, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen =
  | 'login' | 'it-login'
  | 'emp-home' | 'emp-tickets' | 'emp-sent'
  | 'it-dash' | 'it-users' | 'it-user' | 'it-solutions'

type TicketStatus = 'parado' | 'andamento' | 'finalizado'
type Priority = 'baixa' | 'media' | 'alta'
type Level = 'N1' | 'N2' | 'N3'
type Category = 'Hardware' | 'Software' | 'Rede' | 'Acesso' | 'Outro'

interface User { id: string; name: string; email: string; role: string; dept: string }
interface TComment { id: string; author: string; text: string; date: Date; internal: boolean }
interface Resolution { text: string; hasImage: boolean; isKnownSolution: boolean; resolvedAt: Date; resolvedBy: string }
interface Ticket {
  id: string; userId: string; summary: string; description: string; errorMsg?: string
  status: TicketStatus; priority: Priority; level: Level; category: Category
  created: Date; updated: Date; assignedTo?: string; comments: TComment[]; hasImage?: boolean
  resolution?: Resolution
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const USERS: User[] = [
  { id: 'u1', name: 'Ana Paula Ferreira', email: 'ana.ferreira@novatechagro.com.br', role: 'Analista Agrônoma', dept: 'Campo' },
  { id: 'u2', name: 'Carlos Rodrigues', email: 'carlos.rodrigues@novatechagro.com.br', role: 'Supervisor de Produção', dept: 'Operações' },
  { id: 'u3', name: 'Fernanda Lima', email: 'fernanda.lima@novatechagro.com.br', role: 'Assistente Administrativo', dept: 'Administrativo' },
  { id: 'u4', name: 'Marcos Alves', email: 'marcos.alves@novatechagro.com.br', role: 'Gerente de Logística', dept: 'Logística' },
  { id: 'u5', name: 'Juliana Costa', email: 'juliana.costa@novatechagro.com.br', role: 'Analista Financeira', dept: 'Financeiro' },
]

function makeTickets(): Ticket[] {
  return [
    { id: 't1', userId: 'u1', summary: 'Computador não liga', description: 'Meu computador de trabalho não está ligando desde esta manhã. Pressionei o botão de power várias vezes sem resultado algum.', errorMsg: 'Tela permanece preta ao pressionar o botão de power', status: 'andamento', priority: 'alta', level: 'N1', category: 'Hardware', created: new Date('2026-08-08T08:30'), updated: new Date('2026-08-08T10:15'), assignedTo: 'João Técnico', comments: [{ id: 'c1', author: 'João Técnico', text: 'Verificando a fonte de alimentação. Irei até sua mesa em 30 minutos.', date: new Date('2026-08-08T10:15'), internal: false }], hasImage: true },
    { id: 't2', userId: 'u1', summary: 'Acesso ao AgriManager bloqueado', description: 'Não consigo acessar o AgriManager após atualização de senha. O sistema exibe erro de credenciais inválidas.', errorMsg: 'Erro 401 – Credenciais inválidas', status: 'finalizado', priority: 'media', level: 'N1', category: 'Acesso', created: new Date('2026-08-05T14:00'), updated: new Date('2026-08-05T16:30'), assignedTo: 'Maria TI', comments: [{ id: 'c2', author: 'Maria TI', text: 'Senha resetada e acesso restaurado. Pode tentar novamente.', date: new Date('2026-08-05T16:30'), internal: false }], resolution: { text: 'Usuário havia alterado a senha no portal mas o cache de credenciais do AgriManager não foi atualizado. Solução: acessar Painel TI > Usuários > forçar sincronização de senha no módulo de SSO. O acesso foi restaurado em menos de 2 minutos.', hasImage: false, isKnownSolution: true, resolvedAt: new Date('2026-08-05T16:30'), resolvedBy: 'Maria TI' } },
    { id: 't3', userId: 'u2', summary: 'Wi-fi lento no Galpão 3', description: 'O wi-fi do galpão 3 está quase sem sinal. Os tablets usados para registro de estoque ficam desconectando constantemente durante o trabalho.', status: 'parado', priority: 'alta', level: 'N2', category: 'Rede', created: new Date('2026-08-10T07:45'), updated: new Date('2026-08-10T07:45'), comments: [] },
    { id: 't4', userId: 'u2', summary: 'Impressora HP offline', description: 'A impressora do setor de operações está offline. Documentos ficam na fila de impressão mas nunca saem.', errorMsg: 'Impressora offline – verificar conexão USB e rede', status: 'andamento', priority: 'media', level: 'N1', category: 'Hardware', created: new Date('2026-08-09T11:20'), updated: new Date('2026-08-09T13:00'), assignedTo: 'Pedro TI', comments: [], hasImage: true },
    { id: 't5', userId: 'u3', summary: 'Excel trava ao abrir planilha grande', description: 'O Excel trava sempre que abro a planilha de controle de estoque mensal. Preciso forçar o fechamento e perco todo o trabalho feito.', errorMsg: 'Microsoft Excel parou de funcionar', status: 'parado', priority: 'media', level: 'N1', category: 'Software', created: new Date('2026-08-10T09:00'), updated: new Date('2026-08-10T09:00'), comments: [] },
    { id: 't6', userId: 'u3', summary: 'Acesso ao módulo de RH no ERP', description: 'Preciso de acesso ao módulo de RH do ERP para lançar as horas extras da equipe. Aguardando liberação do gestor.', status: 'finalizado', priority: 'baixa', level: 'N1', category: 'Acesso', created: new Date('2026-08-07T10:00'), updated: new Date('2026-08-07T15:00'), assignedTo: 'Maria TI', comments: [], resolution: { text: 'Perfil de acesso criado no ERP com permissão de leitura/escrita no módulo RH-Ponto. Gestor autorizou via e-mail. Configuração feita em: Admin ERP > Usuários > Fernanda Lima > Perfil > adicionar "RH_LANCAMENTO". Reiniciar sessão do ERP após a alteração.', hasImage: true, isKnownSolution: true, resolvedAt: new Date('2026-08-07T15:00'), resolvedBy: 'Maria TI' } },
    { id: 't7', userId: 'u4', summary: 'VPN não conecta – home office', description: 'Desde ontem não consigo conectar à VPN da empresa para trabalhar de casa. Já reiniciei o computador e o roteador sem sucesso.', errorMsg: 'Erro 800 – Falha ao estabelecer conexão VPN', status: 'andamento', priority: 'alta', level: 'N2', category: 'Rede', created: new Date('2026-08-09T17:30'), updated: new Date('2026-08-10T08:00'), assignedTo: 'João Técnico', comments: [{ id: 'c3', author: 'João Técnico', text: 'Verificando configurações do servidor VPN. Entrará em contato em breve.', date: new Date('2026-08-10T08:00'), internal: true }] },
    { id: 't8', userId: 'u5', summary: 'Monitor com listras na tela', description: 'O monitor do meu computador está exibindo listras horizontais coloridas e fica piscando intermitentemente durante o dia.', status: 'parado', priority: 'baixa', level: 'N1', category: 'Hardware', created: new Date('2026-08-10T10:30'), updated: new Date('2026-08-10T10:30'), comments: [], hasImage: true },
  ]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: Date) { return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
function fmtTime(d: Date) { return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000)
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}
function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

// ── Colors ────────────────────────────────────────────────────────────────────

const S_COLORS: Record<TicketStatus, { bg: string; fg: string; label: string; dot: string }> = {
  parado:     { bg: 'rgba(100,116,139,0.15)', fg: '#94a3b8', label: 'Parado',       dot: '#64748b' },
  andamento:  { bg: 'rgba(245,158,11,0.12)',  fg: '#f59e0b', label: 'Em andamento', dot: '#f59e0b' },
  finalizado: { bg: 'rgba(34,197,94,0.12)',   fg: '#22c55e', label: 'Finalizado',   dot: '#22c55e' },
}
const P_COLORS: Record<Priority, { dot: string; label: string }> = {
  baixa: { dot: '#22c55e', label: 'Baixa' },
  media: { dot: '#f59e0b', label: 'Média' },
  alta:  { dot: '#ef4444', label: 'Alta'  },
}

// ── Shared primitive styles ─────────────────────────────────────────────────

const css = {
  input: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(20,184,166,0.2)',
    borderRadius: 10, padding: '12px 14px', color: '#f0f4ff', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  } as React.CSSProperties,
  btnPrimary: {
    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    color: '#fff', border: 'none', borderRadius: 10, padding: '13px 28px',
    fontSize: 15, fontFamily: 'Outfit, sans-serif', fontWeight: 700,
    letterSpacing: '0.04em', cursor: 'pointer', width: '100%',
  } as React.CSSProperties,
  btnGhost: {
    background: 'rgba(20,184,166,0.08)', color: '#14b8a6',
    border: '1px solid rgba(20,184,166,0.25)', borderRadius: 10,
    padding: '10px 20px', fontSize: 14, fontFamily: 'Outfit, sans-serif',
    fontWeight: 600, cursor: 'pointer',
  } as React.CSSProperties,
  label: {
    color: '#7b92b4', fontFamily: 'Outfit, sans-serif', fontSize: 11,
    letterSpacing: '0.09em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 7,
  },
  card: {
    background: '#0d1b34', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26,
    color: '#f0f4ff', margin: '0 0 4px',
  } as React.CSSProperties,
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo({ size = 44, showText = true }: { size?: number; showText?: boolean }) {
  const cx = size / 2
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showText ? 12 : 0 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0 }}
          className="animate-spin-slow"
        >
          <circle cx={cx} cy={cx} r={cx * 0.87} fill="none" stroke="#14b8a6"
            strokeWidth={cx * 0.11} strokeDasharray={`${cx * 1.25} ${cx * 0.55}`} strokeLinecap="round" />
        </svg>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0 }}
          className="animate-spin-reverse"
        >
          <circle cx={cx} cy={cx} r={cx * 0.56} fill="none" stroke="#4ade80"
            strokeWidth={cx * 0.095} strokeDasharray={`${cx * 0.75} ${cx * 0.4}`} strokeLinecap="round" />
        </svg>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={cx} cy={cx} r={cx * 0.22} fill="#14b8a6" />
        </svg>
      </div>
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '0.13em', color: '#f0f4ff', fontSize: size * 0.47 }}>NOVATECH</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, letterSpacing: '0.3em', color: '#14b8a6', fontSize: size * 0.23, marginTop: 2 }}>AGRO</div>
        </div>
      )}
    </div>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const c = S_COLORS[status]
  return (
    <span style={{ background: c.bg, color: c.fg, padding: '3px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

function PriorityChip({ priority }: { priority: Priority }) {
  const c = P_COLORS[priority]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: c.dot, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

// ── Resolution Modal ──────────────────────────────────────────────────────────

function ResolutionModal({ onConfirm, onCancel }: {
  onConfirm: (r: Resolution) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [hasImage, setHasImage] = useState(false)
  const [isKnown, setIsKnown] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const ready = text.trim().length > 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(4,10,22,0.7)', backdropFilter: 'blur(6px)' }} onClick={onCancel}>
      <div style={{ background: '#0d1b34', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: '28px 26px', width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 18 }}
        onClick={e => e.stopPropagation()} className="animate-fade-up">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✓</div>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: '#f0f4ff', margin: 0 }}>Registrar resolução</h3>
            <p style={{ color: '#7b92b4', fontSize: 12, margin: 0, marginTop: 2 }}>Documente como o problema foi resolvido antes de finalizar</p>
          </div>
        </div>

        {/* Resolution text */}
        <div>
          <label style={css.label}>
            Como foi resolvido? <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={text} onChange={e => setText(e.target.value)} autoFocus
            placeholder="Descreva a causa do problema e os passos que resolveram. Seja específico – isso vai ajudar na próxima vez que o problema aparecer."
            style={{ ...css.input, minHeight: 110, resize: 'vertical', lineHeight: 1.7, fontSize: 14 }}
          />
        </div>

        {/* Image upload */}
        <div>
          <label style={{ ...css.label }}>
            Print da solução <span style={{ color: '#4a5f7a', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span>
          </label>
          <div onClick={() => fileRef.current?.click()}
            style={{ border: `1px dashed ${hasImage ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 9, padding: '14px', textAlign: 'center', cursor: 'pointer', background: hasImage ? 'rgba(34,197,94,0.05)' : 'transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{hasImage ? '✓' : '📎'}</span>
            <span style={{ color: hasImage ? '#4ade80' : '#7b92b4', fontSize: 13 }}>{hasImage ? 'Imagem anexada – clique para trocar' : 'Anexar print da configuração corrigida'}</span>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setHasImage(!!e.target.files?.length)} />
          </div>
        </div>

        {/* Known solution checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'pointer', background: isKnown ? 'rgba(20,184,166,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isKnown ? 'rgba(20,184,166,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '13px 14px', transition: 'all 0.2s' }}>
          <input type="checkbox" checked={isKnown} onChange={e => setIsKnown(e.target.checked)}
            style={{ accentColor: '#14b8a6', marginTop: 2, flexShrink: 0, width: 15, height: 15 }} />
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: isKnown ? '#14b8a6' : '#f0f4ff', marginBottom: 2 }}>Marcar como solução conhecida</div>
            <div style={{ fontSize: 12, color: '#7b92b4', lineHeight: 1.5 }}>Este tipo de problema pode se repetir. A solução ficará disponível na base de Soluções Conhecidas para referência futura.</div>
          </div>
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => ready && onConfirm({ text: text.trim(), hasImage, isKnownSolution: isKnown, resolvedAt: new Date(), resolvedBy: 'João Técnico' })}
            disabled={!ready}
            style={{ ...css.btnPrimary, background: ready ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34,197,94,0.2)', color: ready ? '#fff' : '#4a5f7a', cursor: ready ? 'pointer' : 'not-allowed', flex: 1 }}>
            Confirmar e finalizar
          </button>
          <button onClick={onCancel}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#7b92b4', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px 18px', fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ticket Detail Panel ──────────────────────────────────────────────────────

function TicketPanel({
  ticket, user, onClose, isIT, onUpdate, allTickets, onGoToSolutions,
}: {
  ticket: Ticket; user: User | undefined; onClose: () => void
  isIT: boolean; onUpdate?: (t: Ticket) => void
  allTickets?: Ticket[]; onGoToSolutions?: (cat: Category) => void
}) {
  const [commentText, setCommentText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const w = useWindowWidth()
  const panelW = Math.min(560, w)

  // Check if there are known solutions for the same category (Change 4)
  const hasSimilarSolutions = isIT && ticket.status !== 'finalizado' && allTickets
    ? allTickets.some(t => t.resolution?.isKnownSolution && t.category === ticket.category && t.id !== ticket.id)
    : false

  function changeStatus(s: TicketStatus) {
    if (!onUpdate) return
    const up: Ticket = { ...ticket, status: s, updated: new Date() }
    if (s === 'andamento' && !up.assignedTo) up.assignedTo = 'João Técnico'
    onUpdate(up)
  }

  function handleFinalize(resolution: Resolution) {
    if (!onUpdate) return
    onUpdate({ ...ticket, status: 'finalizado', updated: new Date(), resolution, assignedTo: ticket.assignedTo ?? 'João Técnico' })
    setShowResolutionModal(false)
  }

  function addComment() {
    if (!commentText.trim() || !onUpdate) return
    onUpdate({
      ...ticket,
      updated: new Date(),
      comments: [...ticket.comments, { id: `c${Date.now()}`, author: 'João Técnico', text: commentText, date: new Date(), internal: isInternal }],
    })
    setCommentText('')
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }} onClick={onClose}>
        <div style={{ flex: 1, background: 'rgba(4,10,22,0.75)', backdropFilter: 'blur(4px)' }} />
        <div
          style={{ width: panelW, height: '100%', background: '#0a1628', borderLeft: '1px solid rgba(20,184,166,0.18)', overflowY: 'auto', padding: 30, display: 'flex', flexDirection: 'column', gap: 22 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Change 4 – similar solutions suggestion banner */}
          {hasSimilarSolutions && (
            <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.22)', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: '#14b8a6' }}>Chamados parecidos já foram resolvidos antes</span>
                <span style={{ color: '#7b92b4', fontSize: 12, display: 'block', marginTop: 1 }}>Existe uma solução conhecida para {ticket.category} na base de soluções.</span>
              </div>
              {onGoToSolutions && (
                <button onClick={() => { onClose(); onGoToSolutions(ticket.category) }}
                  style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Ver soluções →
                </button>
              )}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                <StatusBadge status={ticket.status} />
                <PriorityChip priority={ticket.priority} />
                <span style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{ticket.level}</span>
                <span style={{ background: 'rgba(255,255,255,0.06)', color: '#7b92b4', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>{ticket.category}</span>
              </div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 19, color: '#f0f4ff', margin: 0, lineHeight: 1.4 }}>{ticket.summary}</h2>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: '#7b92b4', fontSize: 18, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Solicitante', main: user?.name ?? '—', sub: user?.dept },
              { label: 'Aberto em', main: fmtDate(ticket.created), sub: fmtTime(ticket.created) },
              ticket.assignedTo ? { label: 'Responsável TI', main: ticket.assignedTo, sub: undefined, accent: true } : null,
              { label: 'Última atualização', main: timeAgo(ticket.updated), sub: undefined },
            ].filter(Boolean).map((m, i) => m && (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '11px 13px' }}>
                <div style={css.label}>{m.label}</div>
                <div style={{ color: (m as { accent?: boolean }).accent ? '#14b8a6' : '#f0f4ff', fontWeight: 500, fontSize: 14 }}>{m.main}</div>
                {m.sub && <div style={{ color: '#7b92b4', fontSize: 12, marginTop: 1 }}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <div style={css.label}>Descrição</div>
            <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.75, margin: 0 }}>{ticket.description}</p>
          </div>

          {/* Error */}
          {ticket.errorMsg && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ ...css.label, color: '#f87171', marginBottom: 6 }}>Mensagem de erro</div>
              <code style={{ color: '#fca5a5', fontFamily: 'monospace', fontSize: 13 }}>{ticket.errorMsg}</code>
            </div>
          )}

          {/* Attached image */}
          {ticket.hasImage && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(20,184,166,0.14)', borderRadius: 10, padding: 14 }}>
              <div style={css.label}>Print anexado</div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7b92b4', fontSize: 13, gap: 8 }}>
                <span style={{ fontSize: 20 }}>🖼</span> screenshot_erro.png
              </div>
            </div>
          )}

          {/* Change 2 – Resolution section for finalized tickets */}
          {ticket.status === 'finalizado' && ticket.resolution && (
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 12, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✓</div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: '#4ade80' }}>Como foi resolvido</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ticket.resolution.isKnownSolution && (
                    <span style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Solução conhecida</span>
                  )}
                  <span style={{ color: '#4a5f7a', fontSize: 11 }}>por {ticket.resolution.resolvedBy}</span>
                </div>
              </div>
              <p style={{ color: '#a7f3d0', fontSize: 14, margin: 0, lineHeight: 1.75 }}>{ticket.resolution.text}</p>
              {ticket.resolution.hasImage && (
                <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px dashed rgba(34,197,94,0.2)', borderRadius: 8, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: 13, gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🖼</span> print_solucao.png
                </div>
              )}
            </div>
          )}

          {/* IT status actions */}
          {isIT && (
            <div>
              <div style={css.label}>Alterar status</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ticket.status === 'parado' && (
                  <button onClick={() => changeStatus('andamento')}
                    style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
                    ▶ Iniciar Atendimento
                  </button>
                )}
                {ticket.status === 'andamento' && (
                  <>
                    <button onClick={() => setShowResolutionModal(true)}
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.28)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                      ✓ Finalizar
                    </button>
                    <button onClick={() => changeStatus('parado')}
                      style={{ background: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
                      ⏸ Pausar
                    </button>
                  </>
                )}
                {ticket.status === 'finalizado' && (
                  <button onClick={() => changeStatus('parado')}
                    style={{ background: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
                    ↩ Reabrir
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Comments history */}
          <div>
            <div style={css.label}>Histórico de comentários {ticket.comments.length > 0 && `(${ticket.comments.length})`}</div>
            {ticket.comments.length === 0
              ? <div style={{ color: '#3a4f6a', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhuma atualização ainda</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ticket.comments.map(c => (
                    <div key={c.id} style={{ background: c.internal ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.internal ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '11px 13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                        <span style={{ color: c.internal ? '#818cf8' : '#14b8a6', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13 }}>
                          {c.author} {c.internal && <span style={{ fontSize: 10, opacity: 0.75 }}>(interno)</span>}
                        </span>
                        <span style={{ color: '#4a5f7a', fontSize: 12 }}>{fmtDate(c.date)} {fmtTime(c.date)}</span>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: 14, margin: 0, lineHeight: 1.65 }}>{c.text}</p>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* IT add comment */}
          {isIT && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="Adicionar comentário ou atualização..."
                style={{ ...css.input, minHeight: 88, resize: 'vertical', lineHeight: 1.65 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#7b92b4', fontSize: 13 }}>
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ accentColor: '#818cf8' }} />
                  Comentário interno
                </label>
                <button onClick={addComment} style={{ ...css.btnGhost, padding: '8px 18px', fontSize: 13 }}>Comentar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change 1 – Resolution modal, rendered above the panel */}
      {showResolutionModal && (
        <ResolutionModal
          onConfirm={handleFinalize}
          onCancel={() => setShowResolutionModal(false)}
        />
      )}
    </>
  )
}

// ── First Access Modal ───────────────────────────────────────────────────────

function FirstAccessModal({ email, onComplete }: { email: string; onComplete: (name: string, role: string) => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,10,22,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ ...css.card, border: '1px solid rgba(20,184,166,0.25)', padding: '34px 30px', width: '100%', maxWidth: 400 }} className="animate-fade-up">
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 21, color: '#f0f4ff', margin: '0 0 6px' }}>Primeiro acesso</h2>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 26px', lineHeight: 1.6 }}>Precisamos de mais algumas informações para configurar sua conta.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={css.label}>E-mail</label>
            <div style={{ ...css.input, color: '#7b92b4', display: 'flex', alignItems: 'center' }}>{email}</div>
          </div>
          <div>
            <label style={css.label}>Nome completo</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" style={css.input} />
          </div>
          <div>
            <label style={css.label}>Cargo</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Analista de Campo" style={css.input} />
          </div>
          <button
            onClick={() => name.trim() && role.trim() && onComplete(name.trim(), role.trim())}
            style={{ ...css.btnPrimary, marginTop: 6, opacity: name.trim() && role.trim() ? 1 : 0.45 }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Login Screen ─────────────────────────────────────────────────────────────

const BG = 'https://images.unsplash.com/photo-1535379453347-1ffd615e2e08?w=1920&h=1080&fit=crop&auto=format'

function LoginScreen({ onLogin, onSwitchIT }: { onLogin: (u: User) => void; onSwitchIT: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [firstAccess, setFirstAccess] = useState<string | null>(null)

  function doLogin() {
    if (!email.toLowerCase().endsWith('@novatechagro.com.br')) { setErr('Use seu e-mail corporativo @novatechagro.com.br'); return }
    if (!pass) { setErr('Informe sua senha'); return }
    setErr('')
    const found = USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (found) onLogin(found); else setFirstAccess(email)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#060f1e' }}>
      <img src={BG} alt="Lavoura Novatech" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(6,16,31,0.88) 0%, rgba(8,22,50,0.82) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }} className="animate-fade-up">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <Logo size={54} />
        </div>
        <div style={{ background: 'rgba(10,22,42,0.94)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 18, padding: '34px 30px', backdropFilter: 'blur(24px)' }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#f0f4ff', margin: '0 0 6px' }}>Bem-vindo</h1>
          <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 26px' }}>Acesse com seu e-mail corporativo</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={css.label}>E-mail corporativo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="seu.nome@novatechagro.com.br" style={css.input} />
            </div>
            <div>
              <label style={css.label}>Senha</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="••••••••" style={css.input} />
            </div>
            {err && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{err}</p>}
            <button onClick={doLogin} style={{ ...css.btnPrimary, marginTop: 6 }}>Entrar</button>
          </div>
          <div style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <button onClick={onSwitchIT} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', textDecorationColor: 'rgba(123,146,180,0.35)' }}>
              Área Técnica — TI →
            </button>
          </div>
        </div>
      </div>

      {firstAccess && <FirstAccessModal email={firstAccess} onComplete={(n, r) => { onLogin({ id: `u${Date.now()}`, name: n, email: firstAccess!, role: r, dept: 'Novatech Agro' }); setFirstAccess(null) }} />}
    </div>
  )
}

// ── IT Login Screen ───────────────────────────────────────────────────────────

function ITLoginScreen({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  function doLogin() {
    if (!email || !pass) { setErr('Preencha e-mail e senha'); return }
    onLogin()
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#04080f' }}>
      <img src={BG} alt="Lavoura" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(4,8,18,0.96) 0%, rgba(6,14,32,0.94) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }} className="animate-fade-up">
        {/* Area badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.32)', borderRadius: 99, padding: '6px 18px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#14b8a6', display: 'inline-block' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: '#14b8a6', textTransform: 'uppercase' }}>Área Técnica — Restrito</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo size={46} />
        </div>
        <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(20,184,166,0.22)', borderRadius: 18, padding: '34px 30px', backdropFilter: 'blur(24px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: '#f0f4ff', margin: 0 }}>Acesso Restrito</h1>
          </div>
          <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 26px' }}>Use suas credenciais de técnico TI</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={css.label}>E-mail TI</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="tecnico@novatechagro.com.br" style={css.input} />
            </div>
            <div>
              <label style={css.label}>Senha</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="••••••••" style={css.input} />
            </div>
            {err && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{err}</p>}
            <button onClick={doLogin} style={{ ...css.btnPrimary, marginTop: 6 }}>Acessar Painel TI</button>
          </div>
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 13 }}>← Acesso de colaboradores</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Employee Top Nav Layout ───────────────────────────────────────────────────

function EmployeeLayout({ user, activeNav, onNav, onLogout, children }: {
  user: User; activeNav: Screen; onNav: (s: Screen) => void; onLogout: () => void; children: React.ReactNode
}) {
  const w = useWindowWidth()
  const mobile = w < 640
  return (
    <div style={{ minHeight: '100vh', background: '#060f1e', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#0a1628', borderBottom: '1px solid rgba(20,184,166,0.1)', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0, gap: 12 }}>
        <Logo size={mobile ? 30 : 36} showText={!mobile} />
        <nav style={{ display: 'flex', gap: 4 }}>
          {([['emp-home', mobile ? '+' : 'Novo Chamado'], ['emp-tickets', mobile ? '☰' : 'Meus Chamados']] as [Screen, string][]).map(([s, label]) => (
            <button key={s} onClick={() => onNav(s)}
              style={{ background: activeNav === s ? 'rgba(20,184,166,0.12)' : 'transparent', color: activeNav === s ? '#14b8a6' : '#94a3b8', border: `1px solid ${activeNav === s ? 'rgba(20,184,166,0.25)' : 'transparent'}`, borderRadius: 8, padding: mobile ? '7px 14px' : '7px 16px', fontSize: mobile ? 16 : 13, fontFamily: 'Outfit, sans-serif', fontWeight: activeNav === s ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!mobile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: '#f0f4ff', lineHeight: 1.2 }}>{user.name.split(' ')[0]}</div>
              <div style={{ fontSize: 11, color: '#7b92b4' }}>{user.role}</div>
            </div>
          )}
          <div onClick={onLogout} title="Sair"
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
            {initials(user.name)}
          </div>
        </div>
      </header>
      <main style={{ flex: 1, padding: mobile ? '24px 16px' : '36px 28px', maxWidth: 840, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  )
}

// ── Create Ticket ─────────────────────────────────────────────────────────────

function CreateTicket({ userId, onSubmit }: { userId: string; onSubmit: (t: Ticket) => void }) {
  const [desc, setDesc] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [cat, setCat] = useState<Category>('Hardware')
  const [prio, setPrio] = useState<Priority>('media')
  const [hasFile, setHasFile] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const w = useWindowWidth()

  function submit() {
    if (!desc.trim()) return
    onSubmit({ id: `t${Date.now()}`, userId, summary: desc.slice(0, 65), description: desc, errorMsg: errMsg || undefined, status: 'parado', priority: prio, level: 'N1', category: cat, created: new Date(), updated: new Date(), comments: [], hasImage: hasFile })
  }

  const cats: Category[] = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro']
  const prios: { v: Priority; label: string; color: string }[] = [
    { v: 'baixa', label: 'Baixa', color: '#22c55e' },
    { v: 'media', label: 'Média', color: '#f59e0b' },
    { v: 'alta',  label: 'Alta',  color: '#ef4444' },
  ]

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: w < 640 ? 24 : 28, color: '#f0f4ff', margin: '0 0 6px' }}>Abrir chamado</h1>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0, lineHeight: 1.6 }}>Descreva o problema que você está enfrentando. O Time de TI entrará em contato.</p>
      </div>
      <div style={{ ...css.card, border: '1px solid rgba(20,184,166,0.14)', padding: w < 640 ? 20 : 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={css.label}>O que você precisa? <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva o problema com o máximo de detalhes possível..."
            style={{ ...css.input, minHeight: 120, resize: 'vertical', lineHeight: 1.7 }} />
        </div>
        <div>
          <label style={{ ...css.label }}>Qual mensagem de erro apareceu? <span style={{ color: '#4a5f7a', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span></label>
          <input value={errMsg} onChange={e => setErrMsg(e.target.value)} placeholder="Ex: Erro 404, tela azul, acesso negado..." style={css.input} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: w < 500 ? '1fr' : '1fr 1fr', gap: 20 }}>
          <div>
            <label style={css.label}>Categoria</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  style={{ background: cat === c ? 'rgba(20,184,166,0.14)' : 'rgba(255,255,255,0.04)', color: cat === c ? '#14b8a6' : '#94a3b8', border: `1px solid ${cat === c ? 'rgba(20,184,166,0.38)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '7px 13px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: cat === c ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={css.label}>Prioridade</label>
            <div style={{ display: 'flex', gap: 7 }}>
              {prios.map(p => (
                <button key={p.v} onClick={() => setPrio(p.v)}
                  style={{ background: prio === p.v ? `${p.color}1a` : 'rgba(255,255,255,0.04)', color: prio === p.v ? p.color : '#94a3b8', border: `1px solid ${prio === p.v ? `${p.color}4d` : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '7px 12px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: prio === p.v ? 600 : 400, cursor: 'pointer', flex: 1, transition: 'all 0.15s' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label style={{ ...css.label }}>Print do erro <span style={{ color: '#4a5f7a', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span></label>
          <div onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${hasFile ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '22px', textAlign: 'center', cursor: 'pointer', background: hasFile ? 'rgba(20,184,166,0.05)' : 'transparent', transition: 'all 0.2s' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{hasFile ? '✓' : '📎'}</div>
            <div style={{ color: hasFile ? '#14b8a6' : '#7b92b4', fontSize: 14 }}>{hasFile ? 'Imagem anexada – clique para trocar' : 'Clique para anexar imagem'}</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setHasFile(!!e.target.files?.length)} />
          </div>
        </div>
        <button onClick={submit} disabled={!desc.trim()} style={{ ...css.btnPrimary, opacity: desc.trim() ? 1 : 0.45, cursor: desc.trim() ? 'pointer' : 'not-allowed', fontSize: 16 }}>
          Enviar chamado
        </button>
      </div>
    </div>
  )
}

// ── Ticket Sent ───────────────────────────────────────────────────────────────

function TicketSent({ onNew, onView }: { onNew: () => void; onView: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '62vh', textAlign: 'center', padding: 20 }}>
      <div className="animate-check-pop" style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, fontSize: 40, color: '#22c55e' }}>
        ✓
      </div>
      <h2 className="animate-fade-up" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26, color: '#f0f4ff', margin: '0 0 10px', animationDelay: '0.1s' }}>Chamado enviado!</h2>
      <p className="animate-fade-up" style={{ color: '#7b92b4', fontSize: 15, margin: '0 0 36px', maxWidth: 380, lineHeight: 1.7, animationDelay: '0.15s' }}>
        Recebemos sua solicitação. O Time de TI irá analisar e entrar em contato em breve.
      </p>
      <div className="animate-fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.2s' }}>
        <button onClick={onView} style={{ ...css.btnPrimary, width: 'auto' }}>Ver meus chamados</button>
        <button onClick={onNew} style={css.btnGhost}>Abrir outro chamado</button>
      </div>
    </div>
  )
}

// ── My Tickets Kanban ─────────────────────────────────────────────────────────

function MyTickets({ tickets, userId, onSelect }: { tickets: Ticket[]; userId: string; onSelect: (t: Ticket) => void }) {
  const mine = tickets.filter(t => t.userId === userId)
  const w = useWindowWidth()
  const cols: { status: TicketStatus; label: string; color: string }[] = [
    { status: 'parado',     label: 'Parado',       color: '#64748b' },
    { status: 'andamento',  label: 'Em andamento', color: '#f59e0b' },
    { status: 'finalizado', label: 'Finalizado',   color: '#22c55e' },
  ]
  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: w < 640 ? 24 : 28, color: '#f0f4ff', margin: '0 0 6px' }}>Meus chamados</h1>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0 }}>{mine.length} chamado{mine.length !== 1 ? 's' : ''} no total</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: w < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {cols.map(col => {
          const cards = mine.filter(t => t.status === col.status)
          return (
            <div key={col.status} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#0d1b34', borderRadius: 10, border: `1px solid ${col.color}30` }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: '#4a5f7a' }}>{cards.length}</span>
              </div>
              {cards.length === 0
                ? <div style={{ padding: '22px 14px', textAlign: 'center', color: '#2a3a4e', fontSize: 13, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 10 }}>Nenhum chamado</div>
                : cards.map(t => (
                  <div key={t.id} onClick={() => onSelect(t)}
                    style={{ ...css.card, borderLeft: `3px solid ${col.color}`, padding: '14px 15px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = col.color }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: '#f0f4ff', marginBottom: 8, lineHeight: 1.4 }}>{t.summary}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#7b92b4', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{t.category}</span>
                      <span style={{ color: '#4a5f7a', fontSize: 11 }}>{fmtDate(t.created)}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── IT Sidebar Layout ─────────────────────────────────────────────────────────

function ITLayout({ screen, onNav, onLogout, children }: { screen: Screen; onNav: (s: Screen) => void; onLogout: () => void; children: React.ReactNode }) {
  const w = useWindowWidth()
  const mobile = w < 768
  const [menuOpen, setMenuOpen] = useState(false)
  const nav: { s: Screen; label: string; icon: React.ReactNode }[] = [
    { s: 'it-dash',      label: 'Chamados',         icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { s: 'it-users',     label: 'Colaboradores',    icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="8" cy="8" r="4"/><path d="M2 20a6 6 0 0 1 12 0"/><circle cx="18" cy="9" r="3"/><path d="M22 20a4 4 0 0 0-8 0"/></svg> },
    { s: 'it-solutions', label: 'Soluções Conhecidas', icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  ]

  const sidebar = (
    <aside style={{ width: 220, background: '#06101e', borderRight: '1px solid rgba(20,184,166,0.1)', display: 'flex', flexDirection: 'column', padding: '22px 14px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 32, padding: '0 4px' }}><Logo size={34} /></div>
      <div style={{ background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.18)', borderRadius: 8, padding: '7px 11px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#14b8a6', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#14b8a6', textTransform: 'uppercase' }}>Painel TI</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {nav.map(item => (
          <button key={item.s} onClick={() => { onNav(item.s); setMenuOpen(false) }}
            style={{ background: screen === item.s || (screen === 'it-user' && item.s === 'it-users') ? 'rgba(20,184,166,0.1)' : 'transparent', color: screen === item.s || (screen === 'it-user' && item.s === 'it-users') ? '#14b8a6' : item.s === 'it-solutions' ? '#94a3b8' : '#7b92b4', border: 'none', borderRadius: 9, padding: '11px 13px', fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: screen === item.s ? 600 : 400, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', color: '#4a5f7a', fontFamily: 'Outfit, sans-serif', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
        Sair
      </button>
    </aside>
  )

  if (mobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#050d1a', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#06101e', borderBottom: '1px solid rgba(20,184,166,0.1)', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>
          <Logo size={30} />
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 22 }}>☰</button>
        </header>
        {menuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setMenuOpen(false)}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 220 }} onClick={e => e.stopPropagation()}>
              {sidebar}
            </div>
          </div>
        )}
        <main style={{ flex: 1, padding: '22px 16px', boxSizing: 'border-box' }}>{children}</main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050d1a', display: 'flex' }}>
      <div style={{ width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40 }}>{sidebar}</div>
      <main style={{ flex: 1, marginLeft: 220, padding: '34px 32px', minHeight: '100vh', boxSizing: 'border-box' }}>{children}</main>
    </div>
  )
}

// ── IT Dashboard ──────────────────────────────────────────────────────────────

function ITDashboard({ tickets, users, onSelect }: { tickets: Ticket[]; users: User[]; onSelect: (t: Ticket) => void }) {
  const [fStatus, setFStatus] = useState<TicketStatus | 'all'>('all')
  const [fLevel, setFLevel]   = useState<Level | 'all'>('all')
  const w = useWindowWidth()

  const filtered = tickets.filter(t =>
    (fStatus === 'all' || t.status === fStatus) &&
    (fLevel  === 'all' || t.level  === fLevel)
  )

  const stats = [
    { label: 'Total',        value: tickets.length,                               color: '#14b8a6' },
    { label: 'Parados',      value: tickets.filter(t => t.status === 'parado').length,     color: '#64748b' },
    { label: 'Em andamento', value: tickets.filter(t => t.status === 'andamento').length,  color: '#f59e0b' },
    { label: 'Finalizados',  value: tickets.filter(t => t.status === 'finalizado').length, color: '#22c55e' },
  ]

  const statusFilters: [TicketStatus | 'all', string][] = [['all','Todos'],['parado','Parados'],['andamento','Em andamento'],['finalizado','Finalizados']]
  const levelFilters: [Level | 'all', string][] = [['all','N1–N3'],['N1','N1'],['N2','N2'],['N3','N3']]

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 26 }}>
        <h1 style={css.sectionTitle}>Central de Chamados</h1>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0 }}>Todos os chamados abertos no sistema</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: w < 600 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 26 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...css.card, borderTop: `3px solid ${s.color}`, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 30, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#7b92b4', fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#4a5f7a', fontFamily: 'Outfit, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 2 }}>Status:</span>
        {statusFilters.map(([v, label]) => {
          const active = fStatus === v
          const c = v !== 'all' ? S_COLORS[v as TicketStatus].fg : '#7b92b4'
          return (
            <button key={v} onClick={() => setFStatus(v)}
              style={{ background: active ? `${c}1a` : 'rgba(255,255,255,0.04)', color: active ? c : '#7b92b4', border: `1px solid ${active ? `${c}44` : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '5px 11px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {label}
            </button>
          )
        })}
        <span style={{ color: '#4a5f7a', fontFamily: 'Outfit, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 6, marginRight: 2 }}>Nível:</span>
        {levelFilters.map(([v, label]) => (
          <button key={v} onClick={() => setFLevel(v)}
            style={{ background: fLevel === v ? 'rgba(129,140,248,0.14)' : 'rgba(255,255,255,0.04)', color: fLevel === v ? '#818cf8' : '#7b92b4', border: `1px solid ${fLevel === v ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '5px 11px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: fLevel === v ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {w >= 900 && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 80px 60px 90px 100px', gap: 10, padding: '6px 16px', color: '#3a4f6a', fontFamily: 'Outfit, sans-serif', fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
            <span>Chamado</span><span>Colaborador</span><span>Cat.</span><span>Nível</span><span>Prioridade</span><span>Status</span>
          </div>
        )}
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#4a5f7a', fontSize: 14 }}>Nenhum chamado encontrado</div>
        )}
        {filtered.map(t => {
          const u = users.find(u => u.id === t.userId)
          const pColor = P_COLORS[t.priority].dot
          return (
            <div key={t.id} onClick={() => onSelect(t)}
              style={{ ...css.card, display: w >= 900 ? 'grid' : 'flex', flexDirection: 'column', gridTemplateColumns: w >= 900 ? '2fr 1.1fr 80px 60px 90px 100px' : undefined, gap: w >= 900 ? 10 : 10, padding: '14px 16px', cursor: 'pointer', alignItems: 'center', borderLeft: `3px solid ${pColor}`, transition: 'border-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(20,184,166,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: '#f0f4ff', marginBottom: 3 }}>{t.summary}</div>
                <div style={{ color: '#4a5f7a', fontSize: 12 }}>{timeAgo(t.created)}</div>
              </div>
              {w >= 900 ? (
                <>
                  <div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{u?.name.split(' ')[0]} {u?.name.split(' ').slice(-1)}</div>
                    <div style={{ color: '#4a5f7a', fontSize: 11 }}>{u?.dept}</div>
                  </div>
                  <span style={{ color: '#7b92b4', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>{t.category}</span>
                  <span style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{t.level}</span>
                  <PriorityChip priority={t.priority} />
                  <StatusBadge status={t.status} />
                </>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  <StatusBadge status={t.status} />
                  <PriorityChip priority={t.priority} />
                  <span style={{ color: '#7b92b4', fontSize: 12 }}>{u?.name.split(' ')[0]} · {t.category}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── IT Users ──────────────────────────────────────────────────────────────────

function ITUsers({ users, tickets, onSelect }: { users: User[]; tickets: Ticket[]; onSelect: (u: User) => void }) {
  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 26 }}>
        <h1 style={css.sectionTitle}>Colaboradores</h1>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0 }}>{users.length} colaboradores cadastrados</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
        {users.map(u => {
          const ut = tickets.filter(t => t.userId === u.id)
          const open = ut.filter(t => t.status !== 'finalizado').length
          const done = ut.filter(t => t.status === 'finalizado').length
          return (
            <div key={u.id} onClick={() => onSelect(u)}
              style={{ ...css.card, padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.12s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(20,184,166,0.28)'; el.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = '' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                  {initials(u.name)}
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#f0f4ff' }}>{u.name}</div>
                  <div style={{ color: '#7b92b4', fontSize: 12, marginTop: 1 }}>{u.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, gap: 4 }}>
                {[['Total', ut.length, '#f0f4ff'], ['Abertos', open, open > 0 ? '#f59e0b' : '#4a5f7a'], ['Finalizados', done, '#22c55e']].map(([l, v, c]) => (
                  <div key={l as string} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: c as string, lineHeight: 1 }}>{v as number}</div>
                    <div style={{ color: '#4a5f7a', fontSize: 11, marginTop: 3 }}>{l as string}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, color: '#4a5f7a', fontSize: 12, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>{u.dept}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── IT User Detail ────────────────────────────────────────────────────────────

function ITUserDetail({ user, tickets, onBack, onSelect }: { user: User; tickets: Ticket[]; onBack: () => void; onSelect: (t: Ticket) => void }) {
  const ut = tickets.filter(t => t.userId === user.id).sort((a, b) => b.created.getTime() - a.created.getTime())
  return (
    <div className="animate-fade-up">
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'Inter, sans-serif' }}>
        ← Colaboradores
      </button>
      <div style={{ ...css.card, border: '1px solid rgba(20,184,166,0.14)', borderRadius: 16, padding: '20px 24px', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', flexShrink: 0 }}>
          {initials(user.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: '#f0f4ff', margin: '0 0 3px' }}>{user.name}</h1>
          <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 2px' }}>{user.role} · {user.dept}</p>
          <p style={{ color: '#4a5f7a', fontSize: 12, margin: 0 }}>{user.email}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#14b8a6', lineHeight: 1 }}>{ut.length}</div>
          <div style={{ color: '#7b92b4', fontSize: 12, marginTop: 2 }}>chamados</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ut.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#4a5f7a', fontSize: 14 }}>Nenhum chamado registrado</div>
        )}
        {ut.map(t => (
          <div key={t.id} onClick={() => onSelect(t)}
            style={{ ...css.card, borderLeft: `3px solid ${P_COLORS[t.priority].dot}`, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(20,184,166,0.28)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 15, color: '#f0f4ff', marginBottom: 3 }}>{t.summary}</div>
              <div style={{ color: '#7b92b4', fontSize: 12 }}>{fmtDate(t.created)} · {t.category}</div>
            </div>
            <StatusBadge status={t.status} />
            <PriorityChip priority={t.priority} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── IT Solutions ──────────────────────────────────────────────────────────────

function ITSolutions({ tickets, initialCategory }: { tickets: Ticket[]; initialCategory?: Category }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<Category | 'all'>(initialCategory ?? 'all')

  const cats: (Category | 'all')[] = ['all', 'Hardware', 'Software', 'Rede', 'Acesso', 'Outro']
  const catLabels: Record<string, string> = { all: 'Todas', Hardware: 'Hardware', Software: 'Software', Rede: 'Rede', Acesso: 'Acesso', Outro: 'Outro' }

  // Only tickets with a registered known solution
  const known = tickets.filter(t => t.resolution?.isKnownSolution)

  // Count tickets per category across ALL tickets (not just known solutions) – shows how recurrent the problem type is
  const catCount: Record<string, number> = {}
  tickets.forEach(t => { catCount[t.category] = (catCount[t.category] ?? 0) + 1 })

  const filtered = known.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return t.summary.toLowerCase().includes(q) || t.resolution!.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="animate-fade-up">
      {/* Page header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
          <h1 style={css.sectionTitle}>Soluções Conhecidas</h1>
        </div>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0 }}>
          {known.length} solução{known.length !== 1 ? 'ões' : ''} catalogada{known.length !== 1 ? 's' : ''} — pesquise antes de começar a resolver um chamado novo
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por palavra-chave — ex: impressora, VPN, acesso..."
          style={{ ...css.input, paddingLeft: 40, fontSize: 14 }}
        />
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {cats.map(c => {
          const count = c === 'all' ? known.length : known.filter(t => t.category === c).length
          const active = filterCat === c
          return (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ background: active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', color: active ? '#4ade80' : '#7b92b4', border: `1px solid ${active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {catLabels[c]}
              <span style={{ background: active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', color: active ? '#4ade80' : '#4a5f7a', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Solution cards */}
      {filtered.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🔍</div>
          <div style={{ color: '#7b92b4', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Nenhuma solução encontrada</div>
          <div style={{ color: '#4a5f7a', fontSize: 14 }}>{search ? `Nenhum resultado para "${search}"` : 'Nenhuma solução conhecida nesta categoria ainda'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(t => {
            const occurrences = catCount[t.category] ?? 1
            return (
              <div key={t.id} style={{ ...css.card, border: '1px solid rgba(34,197,94,0.14)', borderLeft: '3px solid #22c55e', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 7, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#7b92b4', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{t.category}</span>
                      <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Solução conhecida</span>
                      <span style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>📊</span> {occurrences} ocorrência{occurrences !== 1 ? 's' : ''} em {t.category}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#f0f4ff', margin: 0, lineHeight: 1.4 }}>{t.summary}</h3>
                    <p style={{ color: '#7b92b4', fontSize: 13, margin: '4px 0 0', lineHeight: 1.5 }}>{t.description.slice(0, 120)}{t.description.length > 120 ? '…' : ''}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#4a5f7a', fontSize: 11 }}>Resolvido em</div>
                    <div style={{ color: '#7b92b4', fontSize: 12, marginTop: 2 }}>{fmtDate(t.resolution!.resolvedAt)}</div>
                    <div style={{ color: '#4a5f7a', fontSize: 11, marginTop: 2 }}>por {t.resolution!.resolvedBy}</div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(34,197,94,0.1)' }} />

                {/* Resolution text */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>✓</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 12, color: '#4ade80', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Como foi resolvido</span>
                  </div>
                  <p style={{ color: '#a7f3d0', fontSize: 14, margin: 0, lineHeight: 1.75, background: 'rgba(34,197,94,0.04)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(34,197,94,0.1)' }}>
                    {t.resolution!.text}
                  </p>
                </div>

                {/* Solution image placeholder */}
                {t.resolution!.hasImage && (
                  <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px dashed rgba(34,197,94,0.2)', borderRadius: 8, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: 13, gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🖼</span> print_solucao.png
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>(makeTickets())
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [solutionsFilterCat, setSolutionsFilterCat] = useState<Category | undefined>(undefined)

  function updateTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? t : x))
    setSelectedTicket(t)
  }

  function goToSolutions(cat: Category) {
    setSolutionsFilterCat(cat)
    setScreen('it-solutions')
  }

  // ── Login screens ────────────────────────────────────────────────────────────
  if (screen === 'login') return <LoginScreen onLogin={u => { setCurrentUser(u); setScreen('emp-home') }} onSwitchIT={() => setScreen('it-login')} />
  if (screen === 'it-login') return <ITLoginScreen onLogin={() => setScreen('it-dash')} onBack={() => setScreen('login')} />

  // ── Employee screens ─────────────────────────────────────────────────────────
  if (screen === 'emp-home' || screen === 'emp-tickets' || screen === 'emp-sent') {
    const activeNav: Screen = screen === 'emp-sent' ? 'emp-home' : screen
    return (
      <EmployeeLayout user={currentUser!} activeNav={activeNav} onNav={s => { setSelectedTicket(null); setScreen(s) }} onLogout={() => { setCurrentUser(null); setScreen('login') }}>
        {screen === 'emp-sent'
          ? <TicketSent onNew={() => setScreen('emp-home')} onView={() => setScreen('emp-tickets')} />
          : screen === 'emp-home'
          ? <CreateTicket userId={currentUser!.id} onSubmit={t => { setTickets(p => [t, ...p]); setScreen('emp-sent') }} />
          : <MyTickets tickets={tickets} userId={currentUser!.id} onSelect={setSelectedTicket} />
        }
        {selectedTicket && (
          <TicketPanel ticket={selectedTicket} user={USERS.find(u => u.id === selectedTicket.userId) ?? currentUser ?? undefined}
            onClose={() => setSelectedTicket(null)} isIT={false} onUpdate={updateTicket} />
        )}
      </EmployeeLayout>
    )
  }

  // ── IT screens ──────────────────────────────────────────────────────────────
  return (
    <ITLayout screen={screen} onNav={s => { setSelectedUser(null); setSelectedTicket(null); if (s !== 'it-solutions') setSolutionsFilterCat(undefined); setScreen(s) }} onLogout={() => setScreen('login')}>
      {screen === 'it-dash' && <ITDashboard tickets={tickets} users={USERS} onSelect={setSelectedTicket} />}
      {screen === 'it-users' && <ITUsers users={USERS} tickets={tickets} onSelect={u => { setSelectedUser(u); setScreen('it-user') }} />}
      {screen === 'it-user' && selectedUser && <ITUserDetail user={selectedUser} tickets={tickets} onBack={() => setScreen('it-users')} onSelect={setSelectedTicket} />}
      {screen === 'it-solutions' && <ITSolutions tickets={tickets} initialCategory={solutionsFilterCat} />}
      {selectedTicket && (
        <TicketPanel ticket={selectedTicket} user={USERS.find(u => u.id === selectedTicket.userId)}
          onClose={() => setSelectedTicket(null)} isIT={true} onUpdate={updateTicket}
          allTickets={tickets} onGoToSolutions={goToSolutions} />
      )}
    </ITLayout>
  )
}
