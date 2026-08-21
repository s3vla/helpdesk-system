import { useEffect, useState } from 'react'
import { estilos, CORES_PRIORIDADE, CORES_APP } from '../styles/theme'
import { obterIniciais, formatarData } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import { buscarChamadosDoColaborador, resetarConta } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { LABEL_CATEGORIA } from '../utils/categorias'
import EstadoRequisicao from './EstadoRequisicao'
import StatusBadge from './StatusBadge'
import PriorityChip from './PriorityChip'

// Detalhe de um colaborador: dados de contato, histórico completo de
// chamados abertos por ele, e o botão de "resetar conta" — usado quando um
// e-mail de cargo (ex: faturamento02@) muda de responsável. Mantém o
// usuário exibido em estado próprio (`usuarioAtual`) pra atualizar a tela
// na hora, sem precisar navegar pra fora e voltar depois do reset.
function ITUserDetail({ usuario, versaoDados, onVoltar, onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const [usuarioAtual, setUsuarioAtual] = useState(usuario)
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [confirmandoReset, setConfirmandoReset] = useState(false)
  const [resetando, setResetando] = useState(false)
  const [erroReset, setErroReset] = useState('')

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const lista = await buscarChamadosDoColaborador(token, usuarioAtual.id)
      lista.sort((a, b) => b.created.getTime() - a.created.getTime())
      setChamados(lista)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioAtual.id, versaoDados])

  async function confirmarReset() {
    setResetando(true)
    setErroReset('')
    try {
      const atualizado = await resetarConta(token, usuarioAtual.id)
      setUsuarioAtual(atualizado)
      setConfirmandoReset(false)
    } catch (e) {
      if (!tratarErroApi(e)) setErroReset(traduzirErroApi(e))
    } finally {
      setResetando(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <button onClick={onVoltar} style={{ background: 'none', border: 'none', color: CORES_APP.textoFraco, cursor: 'pointer', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'Inter, sans-serif' }}>
        ← Colaboradores
      </button>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.14)', borderRadius: 16, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: usuarioAtual.emAguardoDeCadastro ? CORES_APP.fundoCampo : '#007851', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', flexShrink: 0 }}>
          {usuarioAtual.emAguardoDeCadastro ? '?' : obterIniciais(usuarioAtual.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {usuarioAtual.emAguardoDeCadastro ? (
            <>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: CORES_APP.tinta, margin: '0 0 6px' }}>Conta resetada</h1>
              <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Aguardando novo cadastro</span>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: CORES_APP.tinta, margin: '0 0 3px' }}>{usuarioAtual.name}</h1>
              <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: '0 0 2px' }}>{[usuarioAtual.role, usuarioAtual.dept].filter(Boolean).join(' · ')}</p>
            </>
          )}
          <p style={{ color: CORES_APP.textoSuave, fontSize: 12, margin: 0 }}>{usuarioAtual.email}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#00b351', lineHeight: 1 }}>{chamados.length}</div>
          <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginTop: 2 }}>chamados</div>
        </div>
      </div>

      {/* Reset de conta: pensado pra e-mail de cargo (não de pessoa) mudar
          de responsável — ver src/config/emails-autorizados.ts no backend.
          Some quando a conta já está resetada, já que não há o que resetar
          de novo até alguém completar o Primeiro Acesso. */}
      {!usuarioAtual.emAguardoDeCadastro && (
        <div style={{ ...estilos.card, border: '1px solid rgba(245,158,11,0.2)', padding: '16px 18px', marginBottom: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!confirmandoReset ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: CORES_APP.tinta }}>Este e-mail mudou de responsável?</div>
                <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginTop: 2 }}>Resetar apaga nome, cargo e senha atuais — a próxima pessoa completa o Primeiro Acesso do zero.</div>
              </div>
              <button onClick={() => setConfirmandoReset(true)}
                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Resetar conta
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: CORES_APP.tinta, fontSize: 13 }}>
                Tem certeza? <strong>{usuarioAtual.name}</strong> vai perder o acesso imediatamente e o histórico de chamados passará a mostrar o nome de quem completar o próximo Primeiro Acesso neste e-mail.
              </div>
              {erroReset && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroReset}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={confirmarReset} disabled={resetando}
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: resetando ? 'default' : 'pointer', opacity: resetando ? 0.6 : 1 }}>
                  {resetando ? 'Resetando...' : 'Sim, resetar agora'}
                </button>
                <button onClick={() => { setConfirmandoReset(false); setErroReset('') }} disabled={resetando}
                  style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chamados.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 14 }}>Nenhum chamado registrado</div>
          )}
          {chamados.map(chamado => (
            <div key={chamado.id} onClick={() => onSelect(chamado)}
              style={{ ...estilos.card, borderLeft: `3px solid ${CORES_PRIORIDADE[chamado.priority].dot}`, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 15, color: CORES_APP.tinta, marginBottom: 3 }}>{chamado.summary}</div>
                <div style={{ color: CORES_APP.textoFraco, fontSize: 12 }}>{formatarData(chamado.created)} · {LABEL_CATEGORIA[chamado.category]}</div>
              </div>
              <StatusBadge status={chamado.status} />
              <PriorityChip priority={chamado.priority} />
            </div>
          ))}
        </div>
      </EstadoRequisicao>
    </div>
  )
}

export default ITUserDetail
