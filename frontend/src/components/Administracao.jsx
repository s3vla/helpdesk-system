import { useEffect, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import {
  buscarSetores,
  criarSetor,
  buscarMapeamentos,
  criarMapeamento,
  atualizarMapeamento,
} from '../services/setoresService'
import {
  buscarGrupos,
  criarGrupo,
  adicionarMembro,
  removerMembro,
} from '../services/gruposService'
import { buscarColaboradores, cadastrarColaborador } from '../services/ticketService'
import {
  buscarCategorias,
  criarCategoria,
  atualizarCategoria,
} from '../services/categoriasService'
import { emailComDominioAutorizado, MENSAGEM_DOMINIO_INVALIDO } from '../utils/dominiosEmailAutorizados'
import EstadoRequisicao from './EstadoRequisicao'
import SolicitanteSelect from './SolicitanteSelect'
import PasswordInput from './PasswordInput'
import { IconX, IconPlus, IconSearch } from './icons'

// Shell da nova seção "Administração" — abas internas por sub-recurso, as
// 4 já com funcionalidade de verdade (último bloco do plano aprovado:
// Categorias — a mudança de maior risco, enum virando FK administrável).
const ABAS = [
  { id: 'categorias', label: 'Categorias' },
  { id: 'setores', label: 'Setores' },
  { id: 'grupos', label: 'Grupos' },
  { id: 'colaboradores', label: 'Colaboradores' },
]

function SetoresTab() {
  const { token, tratarErroApi } = useAuth()
  const [setores, setSetores] = useState([])
  const [mapeamentos, setMapeamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [nomeSetorNovo, setNomeSetorNovo] = useState('')
  const [criandoSetor, setCriandoSetor] = useState(false)
  const [erroSetor, setErroSetor] = useState('')

  const [prefixoNovo, setPrefixoNovo] = useState('')
  const [setorIdNovoMapeamento, setSetorIdNovoMapeamento] = useState('')
  const [criandoMapeamento, setCriandoMapeamento] = useState(false)
  const [erroMapeamento, setErroMapeamento] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const [listaSetores, listaMapeamentos] = await Promise.all([
        buscarSetores(token),
        buscarMapeamentos(token),
      ])
      setSetores(listaSetores)
      setMapeamentos(listaMapeamentos)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function aoCriarSetor(e) {
    e.preventDefault()
    if (!nomeSetorNovo.trim()) return
    setCriandoSetor(true)
    setErroSetor('')
    try {
      const setorCriado = await criarSetor(token, nomeSetorNovo.trim())
      setSetores(atual => [...atual, setorCriado].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNomeSetorNovo('')
    } catch (e) {
      if (!tratarErroApi(e)) setErroSetor(traduzirErroApi(e))
    } finally {
      setCriandoSetor(false)
    }
  }

  async function aoCriarMapeamento(e) {
    e.preventDefault()
    if (!prefixoNovo.trim() || !setorIdNovoMapeamento) return
    setCriandoMapeamento(true)
    setErroMapeamento('')
    try {
      const mapeamentoCriado = await criarMapeamento(token, {
        prefixoEmail: prefixoNovo.trim(),
        setorId: Number(setorIdNovoMapeamento),
      })
      setMapeamentos(atual => [...atual, mapeamentoCriado].sort((a, b) => a.prefixoEmail.localeCompare(b.prefixoEmail)))
      setPrefixoNovo('')
      setSetorIdNovoMapeamento('')
    } catch (e) {
      if (!tratarErroApi(e)) setErroMapeamento(traduzirErroApi(e))
    } finally {
      setCriandoMapeamento(false)
    }
  }

  async function aoTrocarSetorMapeamento(mapeamento, novoSetorId) {
    if (!novoSetorId) return
    try {
      const atualizado = await atualizarMapeamento(token, mapeamento.id, Number(novoSetorId))
      setMapeamentos(atual => atual.map(m => (m.id === atualizado.id ? atualizado : m)))
    } catch (e) {
      if (!tratarErroApi(e)) setErroMapeamento(traduzirErroApi(e))
    }
  }

  return (
    <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={estilos.card}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Setores</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              {setores.length} setor{setores.length !== 1 ? 'es' : ''} cadastrado{setores.length !== 1 ? 's' : ''} — sem exclusão, só criação.
            </p>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form onSubmit={aoCriarSetor} style={{ display: 'flex', gap: 10 }}>
              <input
                value={nomeSetorNovo}
                onChange={e => setNomeSetorNovo(e.target.value)}
                placeholder="Nome do setor novo — ex: Compras"
                disabled={criandoSetor}
                style={{ ...estilos.input, flex: 1 }}
              />
              <button type="submit" disabled={!nomeSetorNovo.trim() || criandoSetor}
                style={{ ...estilos.btnPrimary, width: 'auto', padding: '0 22px', opacity: !nomeSetorNovo.trim() || criandoSetor ? 0.6 : 1 }}>
                {criandoSetor ? 'Criando...' : 'Criar setor'}
              </button>
            </form>
            {erroSetor && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroSetor}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {setores.map(s => (
                <span key={s.id} style={{
                  background: 'rgba(0,73,192,0.08)', color: '#0049C0', borderRadius: 999,
                  padding: '5px 12px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
                }}>
                  {s.nome}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={estilos.card}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Mapeamento prefixo de e-mail → setor</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              Usado no Primeiro Acesso e no cadastro de colaborador pra preencher o departamento automaticamente — ex: prefixo &quot;financeiro&quot; aponta pro setor Financeiro.
            </p>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <form onSubmit={aoCriarMapeamento} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={prefixoNovo}
                onChange={e => setPrefixoNovo(e.target.value)}
                placeholder="Prefixo do e-mail — ex: compras"
                disabled={criandoMapeamento}
                style={{ ...estilos.input, flex: '1 1 200px' }}
              />
              <select
                value={setorIdNovoMapeamento}
                onChange={e => setSetorIdNovoMapeamento(e.target.value)}
                disabled={criandoMapeamento}
                style={{ ...estilos.input, flex: '1 1 180px' }}
              >
                <option value="">Selecione o setor...</option>
                {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              <button type="submit" disabled={!prefixoNovo.trim() || !setorIdNovoMapeamento || criandoMapeamento}
                style={{ ...estilos.btnPrimary, width: 'auto', padding: '0 22px', opacity: !prefixoNovo.trim() || !setorIdNovoMapeamento || criandoMapeamento ? 0.6 : 1 }}>
                {criandoMapeamento ? 'Criando...' : 'Mapear'}
              </button>
            </form>
            {erroMapeamento && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroMapeamento}</p>}

            {mapeamentos.length === 0 ? (
              <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0 }}>Nenhum mapeamento cadastrado ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mapeamentos.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '9px 12px', borderRadius: 8, border: `1px solid ${CORES_APP.bordaSuave}`,
                  }}>
                    <span style={{ fontSize: 14, color: CORES_APP.texto, fontFamily: 'monospace' }}>{m.prefixoEmail}@...</span>
                    <select
                      value={m.setor.id}
                      onChange={e => aoTrocarSetorMapeamento(m, e.target.value)}
                      style={{ ...estilos.input, width: 'auto', padding: '6px 10px', fontSize: 13 }}
                    >
                      {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </EstadoRequisicao>
  )
}

function CategoriasTab() {
  const { token, tratarErroApi } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [nomeNovo, setNomeNovo] = useState('')
  const [criando, setCriando] = useState(false)
  const [erroCriar, setErroCriar] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setCategorias(await buscarCategorias(token))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function aoCriar(e) {
    e.preventDefault()
    if (!nomeNovo.trim()) return
    setCriando(true)
    setErroCriar('')
    try {
      const criada = await criarCategoria(token, nomeNovo.trim())
      setCategorias(atual => [...atual, criada].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNomeNovo('')
    } catch (e) {
      if (!tratarErroApi(e)) setErroCriar(traduzirErroApi(e))
    } finally {
      setCriando(false)
    }
  }

  async function aoAlternarCampo(categoria, campo) {
    try {
      const atualizada = await atualizarCategoria(token, categoria.id, { [campo]: !categoria[campo] })
      setCategorias(atual => atual.map(c => (c.id === atualizada.id ? atualizada : c)))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    }
  }

  return (
    <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={estilos.card}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Categorias</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              {categorias.length} categoria{categorias.length !== 1 ? 's' : ''} cadastrada{categorias.length !== 1 ? 's' : ''} — sem exclusão, só ativar/desativar. &quot;Considerada rede&quot; classifica automaticamente o chamado como nível N2.
            </p>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form onSubmit={aoCriar} style={{ display: 'flex', gap: 10 }}>
              <input
                value={nomeNovo}
                onChange={e => setNomeNovo(e.target.value)}
                placeholder="Nome da categoria nova — ex: VPN"
                disabled={criando}
                style={{ ...estilos.input, flex: 1 }}
              />
              <button type="submit" disabled={!nomeNovo.trim() || criando}
                style={{ ...estilos.btnPrimary, width: 'auto', padding: '0 22px', opacity: !nomeNovo.trim() || criando ? 0.6 : 1 }}>
                {criando ? 'Criando...' : 'Criar categoria'}
              </button>
            </form>
            {erroCriar && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroCriar}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {categorias.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
                  padding: '10px 12px', borderRadius: 8, border: `1px solid ${CORES_APP.bordaSuave}`,
                  opacity: c.ativo ? 1 : 0.55,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: CORES_APP.texto }}>{c.nome}</span>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: CORES_APP.textoFraco, cursor: 'pointer' }}>
                      <input type="checkbox" checked={c.consideradaRede} onChange={() => aoAlternarCampo(c, 'consideradaRede')} />
                      Considerada rede (N2)
                    </label>
                    <button type="button" onClick={() => aoAlternarCampo(c, 'ativo')}
                      style={{
                        background: c.ativo ? 'rgba(0,73,192,0.08)' : 'rgba(0,120,81,0.08)',
                        color: c.ativo ? '#0049C0' : '#007851',
                        border: 'none', borderRadius: 999, padding: '5px 14px', fontSize: 12.5,
                        fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer',
                      }}>
                      {c.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EstadoRequisicao>
  )
}

function GruposTab() {
  const { token, tratarErroApi } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [nomeGrupoNovo, setNomeGrupoNovo] = useState('')
  const [criandoGrupo, setCriandoGrupo] = useState(false)
  const [erroGrupo, setErroGrupo] = useState('')

  // Só um grupo expandido por vez, pra escolher membro sem poluir a lista
  // inteira com um seletor por card.
  const [grupoExpandidoId, setGrupoExpandidoId] = useState(null)
  const [novoMembroId, setNovoMembroId] = useState(null)
  const [alterandoMembro, setAlterandoMembro] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const [listaGrupos, listaColaboradores] = await Promise.all([
        buscarGrupos(token),
        buscarColaboradores(token),
      ])
      setGrupos(listaGrupos)
      setColaboradores(listaColaboradores.itens)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function aoCriarGrupo(e) {
    e.preventDefault()
    if (!nomeGrupoNovo.trim()) return
    setCriandoGrupo(true)
    setErroGrupo('')
    try {
      const grupoCriado = await criarGrupo(token, nomeGrupoNovo.trim())
      setGrupos(atual => [...atual, grupoCriado].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNomeGrupoNovo('')
    } catch (e) {
      if (!tratarErroApi(e)) setErroGrupo(traduzirErroApi(e))
    } finally {
      setCriandoGrupo(false)
    }
  }

  async function aoAdicionarMembro(grupo) {
    if (!novoMembroId) return
    setAlterandoMembro(true)
    try {
      const atualizado = await adicionarMembro(token, grupo.id, Number(novoMembroId))
      setGrupos(atual => atual.map(g => (g.id === atualizado.id ? atualizado : g)))
      setNovoMembroId(null)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setAlterandoMembro(false)
    }
  }

  async function aoRemoverMembro(grupo, usuarioId) {
    try {
      const atualizado = await removerMembro(token, grupo.id, Number(usuarioId))
      setGrupos(atual => atual.map(g => (g.id === atualizado.id ? atualizado : g)))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    }
  }

  return (
    <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={estilos.card}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Grupos</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} cadastrado{grupos.length !== 1 ? 's' : ''} — só organizacional, sem efeito em roteamento de chamado ainda.
            </p>
          </div>
          <div style={{ padding: '16px 22px' }}>
            <form onSubmit={aoCriarGrupo} style={{ display: 'flex', gap: 10 }}>
              <input
                value={nomeGrupoNovo}
                onChange={e => setNomeGrupoNovo(e.target.value)}
                placeholder="Nome do grupo novo — ex: N2 de Rede"
                disabled={criandoGrupo}
                style={{ ...estilos.input, flex: 1 }}
              />
              <button type="submit" disabled={!nomeGrupoNovo.trim() || criandoGrupo}
                style={{ ...estilos.btnPrimary, width: 'auto', padding: '0 22px', opacity: !nomeGrupoNovo.trim() || criandoGrupo ? 0.6 : 1 }}>
                {criandoGrupo ? 'Criando...' : 'Criar grupo'}
              </button>
            </form>
            {erroGrupo && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: '10px 0 0' }}>{erroGrupo}</p>}
          </div>
        </div>

        {grupos.length === 0 ? (
          <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0 }}>Nenhum grupo cadastrado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grupos.map(grupo => {
              const expandido = grupoExpandidoId === grupo.id
              const idsNoGrupo = new Set(grupo.membros.map(m => m.id))
              const opcoesDisponiveis = colaboradores.filter(c => !idsNoGrupo.has(c.id))
              return (
                <div key={grupo.id} style={estilos.card}>
                  <button type="button" onClick={() => { setGrupoExpandidoId(expandido ? null : grupo.id); setNovoMembroId(null) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: '16px 22px', textAlign: 'left',
                    }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: CORES_APP.texto }}>{grupo.nome}</span>
                    <span style={{ color: CORES_APP.textoFraco, fontSize: 13 }}>{grupo.membros.length} membro{grupo.membros.length !== 1 ? 's' : ''}</span>
                  </button>
                  {expandido && (
                    <div style={{ padding: '0 22px 20px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: `1px solid ${CORES_APP.bordaSuave}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                        {grupo.membros.length === 0 ? (
                          <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0 }}>Nenhum membro ainda.</p>
                        ) : grupo.membros.map(membro => (
                          <div key={membro.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                            padding: '8px 12px', borderRadius: 8, border: `1px solid ${CORES_APP.bordaSuave}`,
                          }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{membro.name ?? '— (aguardando cadastro)'}</div>
                              <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{membro.email}</div>
                            </div>
                            <button type="button" onClick={() => aoRemoverMembro(grupo, membro.id)} title="Remover do grupo"
                              style={{ background: 'none', border: 'none', color: CORES_APP.textoSuave, cursor: 'pointer', display: 'flex', padding: 4 }}>
                              <IconX width={14} height={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <SolicitanteSelect opcoes={opcoesDisponiveis} valor={novoMembroId} onChange={setNovoMembroId} disabled={alterandoMembro} />
                        </div>
                        <button type="button" onClick={() => aoAdicionarMembro(grupo)} disabled={!novoMembroId || alterandoMembro}
                          style={{ ...estilos.btnPrimary, width: 'auto', padding: '0 20px', opacity: !novoMembroId || alterandoMembro ? 0.6 : 1 }}>
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </EstadoRequisicao>
  )
}

// Aba "Colaboradores" da Administração é só de CRIAÇÃO — decisão aprovada
// no plano: a tela cheia de gestão (listar, ver histórico, resetar conta)
// continua sendo ITUsers.jsx, já acessível pela sidebar principal. Aqui a
// busca serve pra checar rápido se um colaborador já existe ANTES de tentar
// cadastrar de novo (evita bater num 409 sem necessidade); o "+" abre o
// formulário de cadastro.
function ColaboradoresTab() {
  const { token, tratarErroApi } = useAuth()
  const [colaboradores, setColaboradores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  const [formularioAberto, setFormularioAberto] = useState(false)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [senha, setSenha] = useState('')
  const [cadastrando, setCadastrando] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const resultado = await buscarColaboradores(token)
      setColaboradores(resultado.itens)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const termo = busca.trim().toLowerCase()
  const filtrados = termo
    ? colaboradores.filter(c => (c.name ?? '').toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo))
    : colaboradores

  function fecharFormulario() {
    setFormularioAberto(false)
    setEmail('')
    setNome('')
    setCargo('')
    setSenha('')
    setErroCadastro('')
  }

  const podeCadastrar = email.trim() && nome.trim() && senha.length >= 8

  async function aoCadastrar(e) {
    e.preventDefault()
    if (!podeCadastrar) return
    if (!emailComDominioAutorizado(email)) {
      setErroCadastro(MENSAGEM_DOMINIO_INVALIDO)
      return
    }
    setCadastrando(true)
    setErroCadastro('')
    try {
      const criado = await cadastrarColaborador(token, {
        email: email.trim(),
        nome: nome.trim(),
        senha,
        cargo: cargo.trim() || undefined,
      })
      setColaboradores(atual => [criado, ...atual.filter(c => c.id !== criado.id)])
      fecharFormulario()
    } catch (e) {
      if (!tratarErroApi(e)) setErroCadastro(traduzirErroApi(e))
    } finally {
      setCadastrando(false)
    }
  }

  return (
    <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, pointerEvents: 'none', display: 'flex' }}><IconSearch /></span>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail — pra checar se já existe antes de cadastrar"
              style={{ ...estilos.input, paddingLeft: 40 }}
            />
          </div>
          <button type="button" onClick={() => setFormularioAberto(v => !v)}
            style={{ ...estilos.btnPrimary, width: 'auto', padding: '0 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconPlus width={16} height={16} /> Cadastrar colaborador
          </button>
        </div>

        {formularioAberto && (
          <div style={estilos.card}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Cadastrar colaborador</h2>
                <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
                  Defina uma senha inicial — o colaborador é obrigado a trocá-la no primeiro login.
                </p>
              </div>
              <button type="button" onClick={fecharFormulario} style={{ background: 'none', border: 'none', color: CORES_APP.textoSuave, cursor: 'pointer', display: 'flex', padding: 4 }}>
                <IconX width={16} height={16} />
              </button>
            </div>
            <form onSubmit={aoCadastrar} style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={estilos.label}>E-mail corporativo</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@novatechagro.com.br" disabled={cadastrando} style={estilos.input} />
              </div>
              <div>
                <label style={estilos.label}>Nome completo</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo do colaborador" disabled={cadastrando} style={estilos.input} />
              </div>
              <div>
                <label style={estilos.label}>Cargo (opcional)</label>
                <input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex.: Analista Fiscal" disabled={cadastrando} style={estilos.input} />
              </div>
              <div>
                <label style={estilos.label}>Senha inicial</label>
                <PasswordInput value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" disabled={cadastrando} />
              </div>
              {erroCadastro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroCadastro}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={!podeCadastrar || cadastrando}
                  style={{ ...estilos.btnPrimary, opacity: !podeCadastrar || cadastrando ? 0.6 : 1 }}>
                  {cadastrando ? 'Cadastrando...' : 'Cadastrar'}
                </button>
                <button type="button" onClick={fecharFormulario} disabled={cadastrando} style={estilos.btnGhost}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div style={estilos.card}>
          <div style={{ padding: '14px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              {filtrados.length} de {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''} — gestão completa (histórico, resetar conta) continua em "Colaboradores" no menu principal.
            </p>
          </div>
          {filtrados.length === 0 ? (
            <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhum colaborador encontrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtrados.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{c.name ?? '— (aguardando cadastro)'}</div>
                    <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{c.email}</div>
                  </div>
                  <span style={{ fontSize: 12, color: CORES_APP.textoFraco, alignSelf: 'center' }}>{c.dept}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EstadoRequisicao>
  )
}

function Administracao() {
  const [aba, setAba] = useState('setores')

  return (
    <div className="animate-fade-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 22, flexShrink: 0 }}>
        <h1 style={estilos.sectionTitle}>Administração</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Categorias, setores, grupos e colaboradores — configuração central da Área Técnica.</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexShrink: 0, borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
        {ABAS.map(item => {
          const ativa = aba === item.id
          return (
            <button key={item.id} onClick={() => setAba(item.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 16px', fontFamily: 'Outfit, sans-serif', fontSize: 14,
                fontWeight: ativa ? 700 : 500, color: ativa ? '#0049C0' : CORES_APP.textoFraco,
                borderBottom: ativa ? '2px solid #0049C0' : '2px solid transparent', marginBottom: -1,
              }}>
              {item.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {aba === 'categorias' && <CategoriasTab />}
        {aba === 'setores' && <SetoresTab />}
        {aba === 'grupos' && <GruposTab />}
        {aba === 'colaboradores' && <ColaboradoresTab />}
      </div>
    </div>
  )
}

export default Administracao
