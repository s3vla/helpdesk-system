import { useEffect, useState } from 'react'
import { estilos, CORES_APP, CORES_TI, CORES_PRIORIDADE, CORES_STATUS } from '../styles/theme'
import { cores } from '../styles/authTheme'
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
  atualizarGrupo,
  removerGrupo,
  adicionarMembro,
  removerMembro,
} from '../services/gruposService'
import { buscarColaboradores, cadastrarColaborador } from '../services/ticketService'
import {
  buscarCategorias,
  criarCategoria,
  atualizarCategoria,
  removerCategoria,
} from '../services/categoriasService'
import {
  buscarPalavrasChaveN3,
  criarPalavraChaveN3,
  atualizarPalavraChaveN3,
  removerPalavraChaveN3,
} from '../services/palavrasChaveN3Service'
import {
  buscarRelatorioAcesso,
  buscarRelatorioAtividadeChamados,
  buscarRelatorioTempoAtendimento,
  buscarRelatorioCargaTecnicos,
  buscarRelatorioReaberturas,
} from '../services/relatoriosService'
import { emailComDominioAutorizado, MENSAGEM_DOMINIO_INVALIDO } from '../utils/dominiosEmailAutorizados'
import { formatarDataHora, tempoDecorrido } from '../utils/formatters'
import { dataInicioPadrao, dataFimPadrao } from '../utils/periodoPadrao'
import EstadoRequisicao from './EstadoRequisicao'
import SolicitanteSelect from './SolicitanteSelect'
import PasswordInput from './PasswordInput'
import { IconX, IconPlus, IconSearch, IconEdit, IconTrash } from './icons'

// Shell da nova seção "Administração" — abas internas por sub-recurso, as
// 5 já com funcionalidade de verdade (último bloco: Atividade e
// Relatórios — 3 relatórios administrativos sobre acesso/uso do sistema).
const ABAS = [
  { id: 'categorias', label: 'Categorias' },
  { id: 'palavras-chave-n3', label: 'Palavras-chave N3' },
  { id: 'setores', label: 'Setores' },
  { id: 'grupos', label: 'Grupos' },
  { id: 'colaboradores', label: 'Colaboradores' },
  { id: 'atividade', label: 'Atividade' },
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
              {setores.length} setor{setores.length !== 1 ? 'es' : ''} cadastrado{setores.length !== 1 ? 's' : ''}, sem exclusão, só criação.
            </p>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form onSubmit={aoCriarSetor} style={{ display: 'flex', gap: 10 }}>
              <input
                value={nomeSetorNovo}
                onChange={e => setNomeSetorNovo(e.target.value)}
                placeholder="Nome do setor novo, ex: Compras"
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
                  background: 'rgba(0,73,192,0.08)', color: CORES_TI.accent, borderRadius: 999,
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
              Usado no Primeiro Acesso e no cadastro de colaborador pra preencher o departamento automaticamente, ex: prefixo &quot;financeiro&quot; aponta pro setor Financeiro.
            </p>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <form onSubmit={aoCriarMapeamento} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={prefixoNovo}
                onChange={e => setPrefixoNovo(e.target.value)}
                placeholder="Prefixo do e-mail, ex: compras"
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

  // Confirmação inline por linha (mesmo padrão de "Resetar conta" em
  // ITUserDetail.jsx) — só uma categoria por vez em modo de confirmação.
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')

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

  async function aoDefinirNivelPadrao(categoria, nivel) {
    if (categoria.nivelPadrao === nivel) return
    try {
      const atualizada = await atualizarCategoria(token, categoria.id, { nivelPadrao: nivel })
      setCategorias(atual => atual.map(c => (c.id === atualizada.id ? atualizada : c)))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    }
  }

  function aoPedirExclusao(categoria) {
    setConfirmandoExclusaoId(categoria.id)
    setErroExcluir('')
  }

  function aoCancelarExclusao() {
    setConfirmandoExclusaoId(null)
    setErroExcluir('')
  }

  // 409 (categoria em uso) chega com a mensagem já pronta do backend — ver
  // CategoriasService.remover — mostrada direto na linha, sem some a
  // confirmação, pra a pessoa já ver o botão "Desativar" logo ali do lado
  // como alternativa.
  async function aoConfirmarExclusao(categoria) {
    setExcluindo(true)
    setErroExcluir('')
    try {
      await removerCategoria(token, categoria.id)
      setCategorias(atual => atual.filter(c => c.id !== categoria.id))
      setConfirmandoExclusaoId(null)
    } catch (e) {
      if (!tratarErroApi(e)) setErroExcluir(traduzirErroApi(e))
    } finally {
      setExcluindo(false)
    }
  }

  async function aoDesativarEmVezDeExcluir(categoria) {
    await aoAlternarCampo(categoria, 'ativo')
    aoCancelarExclusao()
  }

  return (
    <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={estilos.card}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Categorias</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              {categorias.length} categoria{categorias.length !== 1 ? 's' : ''} cadastrada{categorias.length !== 1 ? 's' : ''}. Excluir só é permitido pra categoria nunca usada; caso contrário, desative. O nível padrão classifica automaticamente o chamado — uma palavra-chave da aba &quot;Palavras-chave N3&quot; sempre sobrepõe pra N3, independente do nível padrão aqui.
            </p>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form onSubmit={aoCriar} style={{ display: 'flex', gap: 10 }}>
              <input
                value={nomeNovo}
                onChange={e => setNomeNovo(e.target.value)}
                placeholder="Nome da categoria nova, ex: VPN"
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
              {categorias.map(c => {
                const confirmando = confirmandoExclusaoId === c.id
                return (
                  <div key={c.id} style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '10px 12px', borderRadius: 8,
                    border: `1px solid ${confirmando ? 'rgba(239,68,68,0.35)' : CORES_APP.bordaSuave}`,
                    opacity: c.ativo ? 1 : 0.55,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: CORES_APP.texto }}>{c.nome}</span>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: CORES_APP.textoFraco }}>Nível padrão</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {['N1', 'N2', 'N3'].map(nivel => (
                              <button key={nivel} type="button" onClick={() => aoDefinirNivelPadrao(c, nivel)}
                                title={`Considerado ${nivel}`}
                                style={{
                                  background: c.nivelPadrao === nivel ? 'rgba(0,73,192,0.12)' : CORES_APP.fundoCampo,
                                  color: c.nivelPadrao === nivel ? CORES_TI.accent : CORES_APP.textoFraco,
                                  border: `1px solid ${c.nivelPadrao === nivel ? 'rgba(0,73,192,0.3)' : CORES_APP.borda}`,
                                  borderRadius: 6, padding: '4px 9px', fontSize: 11.5, fontFamily: 'Outfit, sans-serif',
                                  fontWeight: c.nivelPadrao === nivel ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
                                }}>
                                {nivel}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button type="button" onClick={() => aoAlternarCampo(c, 'ativo')}
                          style={{
                            background: c.ativo ? 'rgba(0,73,192,0.08)' : 'rgba(0,120,81,0.08)',
                            color: c.ativo ? CORES_TI.accent : cores.verdeEscuro,
                            border: 'none', borderRadius: 999, padding: '5px 14px', fontSize: 12.5,
                            fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer',
                          }}>
                          {c.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        {!confirmando && (
                          <button type="button" onClick={() => aoPedirExclusao(c)}
                            style={{
                              background: 'rgba(239,68,68,0.08)', color: CORES_PRIORIDADE.alta.dot,
                              border: 'none', borderRadius: 999, padding: '5px 14px', fontSize: 12.5,
                              fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer',
                            }}>
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>

                    {confirmando && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: `1px solid ${CORES_APP.bordaSuave}` }}>
                        <div style={{ color: CORES_APP.tinta, fontSize: 13 }}>
                          Tem certeza que quer excluir <strong>{c.nome}</strong>? Essa ação não pode ser desfeita.
                        </div>
                        {erroExcluir && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroExcluir}</p>}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => aoConfirmarExclusao(c)} disabled={excluindo}
                            style={{
                              background: 'rgba(239,68,68,0.15)', color: CORES_PRIORIDADE.alta.dot, border: '1px solid rgba(239,68,68,0.35)',
                              borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                              cursor: excluindo ? 'default' : 'pointer', opacity: excluindo ? 0.6 : 1,
                            }}>
                            {excluindo ? 'Excluindo...' : 'Sim, excluir'}
                          </button>
                          <button type="button" onClick={aoCancelarExclusao} disabled={excluindo}
                            style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                            Cancelar
                          </button>
                          {erroExcluir && (
                            <button type="button" onClick={() => aoDesativarEmVezDeExcluir(c)}
                              style={{ background: 'rgba(0,73,192,0.08)', color: CORES_TI.accent, border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer' }}>
                              Desativar em vez disso
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </EstadoRequisicao>
  )
}

// Dicionário administrável que sobrepõe o nível de um chamado pra N3
// sempre que o texto (descrição/mensagem de erro) contém alguma palavra
// ativa daqui — independente do nível padrão da categoria (ver
// CategoriasTab e nivel-triagem.util.ts no backend). Mesmo padrão de
// CategoriasTab, sem o bloco de "desativar em vez de excluir" (aqui
// excluir é sempre físico e direto — nada referencia a palavra por FK).
function PalavrasChaveN3Tab() {
  const { token, tratarErroApi } = useAuth()
  const [palavrasChave, setPalavrasChave] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [palavraNova, setPalavraNova] = useState('')
  const [criando, setCriando] = useState(false)
  const [erroCriar, setErroCriar] = useState('')

  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setPalavrasChave(await buscarPalavrasChaveN3(token))
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
    if (!palavraNova.trim()) return
    setCriando(true)
    setErroCriar('')
    try {
      const criada = await criarPalavraChaveN3(token, palavraNova.trim())
      setPalavrasChave(atual => [...atual, criada].sort((a, b) => a.palavra.localeCompare(b.palavra)))
      setPalavraNova('')
    } catch (e) {
      if (!tratarErroApi(e)) setErroCriar(traduzirErroApi(e))
    } finally {
      setCriando(false)
    }
  }

  async function aoAlternarAtivo(palavraChave) {
    try {
      const atualizada = await atualizarPalavraChaveN3(token, palavraChave.id, { ativo: !palavraChave.ativo })
      setPalavrasChave(atual => atual.map(p => (p.id === atualizada.id ? atualizada : p)))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    }
  }

  function aoPedirExclusao(palavraChave) {
    setConfirmandoExclusaoId(palavraChave.id)
    setErroExcluir('')
  }

  function aoCancelarExclusao() {
    setConfirmandoExclusaoId(null)
    setErroExcluir('')
  }

  async function aoConfirmarExclusao(palavraChave) {
    setExcluindo(true)
    setErroExcluir('')
    try {
      await removerPalavraChaveN3(token, palavraChave.id)
      setPalavrasChave(atual => atual.filter(p => p.id !== palavraChave.id))
      setConfirmandoExclusaoId(null)
    } catch (e) {
      if (!tratarErroApi(e)) setErroExcluir(traduzirErroApi(e))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={estilos.card}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Palavras-chave N3</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              {palavrasChave.length} palavra{palavrasChave.length !== 1 ? 's' : ''} cadastrada{palavrasChave.length !== 1 ? 's' : ''}. Um chamado cujo texto (descrição ou mensagem de erro) contenha alguma palavra ativa aqui é automaticamente classificado como N3, independente da categoria escolhida.
            </p>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form onSubmit={aoCriar} style={{ display: 'flex', gap: 10 }}>
              <input
                value={palavraNova}
                onChange={e => setPalavraNova(e.target.value)}
                placeholder="Palavra ou expressão nova, ex: nota fiscal"
                disabled={criando}
                style={{ ...estilos.input, flex: 1 }}
              />
              <button type="submit" disabled={!palavraNova.trim() || criando}
                style={{ ...estilos.btnPrimary, width: 'auto', padding: '0 22px', opacity: !palavraNova.trim() || criando ? 0.6 : 1 }}>
                {criando ? 'Criando...' : 'Adicionar'}
              </button>
            </form>
            {erroCriar && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroCriar}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {palavrasChave.map(p => {
                const confirmando = confirmandoExclusaoId === p.id
                return (
                  <div key={p.id} style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '10px 12px', borderRadius: 8,
                    border: `1px solid ${confirmando ? 'rgba(239,68,68,0.35)' : CORES_APP.bordaSuave}`,
                    opacity: p.ativo ? 1 : 0.55,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: CORES_APP.texto }}>{p.palavra}</span>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <button type="button" onClick={() => aoAlternarAtivo(p)}
                          style={{
                            background: p.ativo ? 'rgba(0,73,192,0.08)' : 'rgba(0,120,81,0.08)',
                            color: p.ativo ? CORES_TI.accent : cores.verdeEscuro,
                            border: 'none', borderRadius: 999, padding: '5px 14px', fontSize: 12.5,
                            fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer',
                          }}>
                          {p.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        {!confirmando && (
                          <button type="button" onClick={() => aoPedirExclusao(p)}
                            style={{
                              background: 'rgba(239,68,68,0.08)', color: CORES_PRIORIDADE.alta.dot,
                              border: 'none', borderRadius: 999, padding: '5px 14px', fontSize: 12.5,
                              fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer',
                            }}>
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>

                    {confirmando && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: `1px solid ${CORES_APP.bordaSuave}` }}>
                        <div style={{ color: CORES_APP.tinta, fontSize: 13 }}>
                          Tem certeza que quer excluir <strong>{p.palavra}</strong>? Essa ação não pode ser desfeita.
                        </div>
                        {erroExcluir && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroExcluir}</p>}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => aoConfirmarExclusao(p)} disabled={excluindo}
                            style={{
                              background: 'rgba(239,68,68,0.15)', color: CORES_PRIORIDADE.alta.dot, border: '1px solid rgba(239,68,68,0.35)',
                              borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                              cursor: excluindo ? 'default' : 'pointer', opacity: excluindo ? 0.6 : 1,
                            }}>
                            {excluindo ? 'Excluindo...' : 'Sim, excluir'}
                          </button>
                          <button type="button" onClick={aoCancelarExclusao} disabled={excluindo}
                            style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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

  // Edição de nome — input inline, um grupo por vez (mesmo raciocínio de
  // grupoExpandidoId acima).
  const [editandoId, setEditandoId] = useState(null)
  const [nomeEditando, setNomeEditando] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')

  // Confirmação inline por linha, mesmo padrão de CategoriasTab acima —
  // sem a alternativa "Desativar em vez disso" porque Grupo não tem campo
  // ativo/inativo, só existe/não existe.
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')

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

  function aoIniciarEdicao(grupo) {
    setEditandoId(grupo.id)
    setNomeEditando(grupo.nome)
    setErroEdicao('')
  }

  function aoCancelarEdicao() {
    setEditandoId(null)
    setErroEdicao('')
  }

  async function aoSalvarEdicao(grupo) {
    if (!nomeEditando.trim()) return
    setSalvandoEdicao(true)
    setErroEdicao('')
    try {
      const atualizado = await atualizarGrupo(token, grupo.id, nomeEditando.trim())
      setGrupos(atual => atual.map(g => (g.id === atualizado.id ? atualizado : g)).sort((a, b) => a.nome.localeCompare(b.nome)))
      setEditandoId(null)
    } catch (e) {
      if (!tratarErroApi(e)) setErroEdicao(traduzirErroApi(e))
    } finally {
      setSalvandoEdicao(false)
    }
  }

  function aoPedirExclusao(grupo) {
    setConfirmandoExclusaoId(grupo.id)
    setErroExcluir('')
  }

  function aoCancelarExclusao() {
    setConfirmandoExclusaoId(null)
    setErroExcluir('')
  }

  // 409 (grupo em uso por aviso) chega com a mensagem já pronta do backend
  // — ver GruposService.remover — mostrada direto na linha, sem derrubar a
  // tela (mesmo padrão de CategoriasTab.aoConfirmarExclusao).
  async function aoConfirmarExclusao(grupo) {
    setExcluindo(true)
    setErroExcluir('')
    try {
      await removerGrupo(token, grupo.id)
      setGrupos(atual => atual.filter(g => g.id !== grupo.id))
      setConfirmandoExclusaoId(null)
    } catch (e) {
      if (!tratarErroApi(e)) setErroExcluir(traduzirErroApi(e))
    } finally {
      setExcluindo(false)
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
              {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} cadastrado{grupos.length !== 1 ? 's' : ''}. Grupo usado por algum aviso do Mural não pode ser excluído.
            </p>
          </div>
          <div style={{ padding: '16px 22px' }}>
            <form onSubmit={aoCriarGrupo} style={{ display: 'flex', gap: 10 }}>
              <input
                value={nomeGrupoNovo}
                onChange={e => setNomeGrupoNovo(e.target.value)}
                placeholder="Nome do grupo novo, ex: N2 de Rede"
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
              const editando = editandoId === grupo.id
              const confirmandoExclusao = confirmandoExclusaoId === grupo.id
              return (
                <div key={grupo.id} style={{ ...estilos.card, border: `1px solid ${confirmandoExclusao ? 'rgba(239,68,68,0.35)' : CORES_APP.borda}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px' }}>
                    {editando ? (
                      <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input value={nomeEditando} onChange={e => setNomeEditando(e.target.value)} disabled={salvandoEdicao} autoFocus
                          style={{ ...estilos.input, flex: 1 }} />
                        <button type="button" onClick={() => aoSalvarEdicao(grupo)} disabled={!nomeEditando.trim() || salvandoEdicao}
                          style={{ ...estilos.btnPrimary, width: 'auto', padding: '9px 16px', fontSize: 13, opacity: !nomeEditando.trim() || salvandoEdicao ? 0.6 : 1 }}>
                          {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button type="button" onClick={aoCancelarEdicao} disabled={salvandoEdicao}
                          style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setGrupoExpandidoId(expandido ? null : grupo.id); setNovoMembroId(null) }}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left',
                          }}>
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: CORES_APP.texto }}>{grupo.nome}</span>
                          <span style={{ color: CORES_APP.textoFraco, fontSize: 13 }}>{grupo.membros.length} membro{grupo.membros.length !== 1 ? 's' : ''}</span>
                        </button>
                        <button type="button" onClick={() => aoIniciarEdicao(grupo)} title="Editar nome"
                          style={{ background: 'none', border: 'none', color: CORES_APP.textoSuave, cursor: 'pointer', display: 'flex', padding: 6, flexShrink: 0 }}>
                          <IconEdit width={15} height={15} />
                        </button>
                        {!confirmandoExclusao && (
                          <button type="button" onClick={() => aoPedirExclusao(grupo)} title="Excluir grupo"
                            style={{ background: 'none', border: 'none', color: CORES_APP.textoSuave, cursor: 'pointer', display: 'flex', padding: 6, flexShrink: 0 }}>
                            <IconTrash width={15} height={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {erroEdicao && editando && (
                    <p style={{ color: CORES_APP.erro, fontSize: 13, margin: '0 22px 12px' }}>{erroEdicao}</p>
                  )}
                  {confirmandoExclusao && (
                    <div style={{ padding: '0 22px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ color: CORES_APP.tinta, fontSize: 13 }}>
                        Tem certeza que quer excluir <strong>{grupo.nome}</strong>? Essa ação não pode ser desfeita.
                      </div>
                      {erroExcluir && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroExcluir}</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => aoConfirmarExclusao(grupo)} disabled={excluindo}
                          style={{
                            background: 'rgba(239,68,68,0.15)', color: CORES_PRIORIDADE.alta.dot, border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                            cursor: excluindo ? 'default' : 'pointer', opacity: excluindo ? 0.6 : 1,
                          }}>
                          {excluindo ? 'Excluindo...' : 'Sim, excluir'}
                        </button>
                        <button type="button" onClick={aoCancelarExclusao} disabled={excluindo}
                          style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
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
                              <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{membro.name ?? '(aguardando cadastro)'}</div>
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
              placeholder="Buscar por nome ou e-mail, pra checar se já existe antes de cadastrar"
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
                  Defina uma senha inicial. O colaborador é obrigado a trocá-la no primeiro login.
                </p>
              </div>
              <button type="button" onClick={fecharFormulario} style={{ background: 'none', border: 'none', color: CORES_APP.textoSuave, cursor: 'pointer', display: 'flex', padding: 4 }}>
                <IconX width={16} height={16} />
              </button>
            </div>
            <form onSubmit={aoCadastrar} style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={estilos.label}>E-mail corporativo</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@empresa-exemplo.com" disabled={cadastrando} style={estilos.input} />
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
              {filtrados.length} de {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}. Gestão completa (histórico, resetar conta) continua em "Colaboradores" no menu principal.
            </p>
          </div>
          {filtrados.length === 0 ? (
            <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhum colaborador encontrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtrados.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{c.name ?? '(aguardando cadastro)'}</div>
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

// Minutos -> "Xh Ymin" (ou só "Ymin" quando < 1h) — mesma ideia de
// tempoDecorrido (utils/formatters.js), só que pra uma DURAÇÃO em vez de
// "quanto tempo atrás", por isso não reaproveita aquela função direto.
function formatarDuracaoMinutos(minutos) {
  if (minutos < 60) return `${minutos}min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas}h` : `${horas}h ${resto}min`
}

const SUBABAS_ATIVIDADE = [
  { id: 'acesso', label: 'Acesso ao sistema' },
  { id: 'chamados', label: 'Chamados por colaborador' },
  { id: 'tempo', label: 'Tempo de atendimento' },
  { id: 'carga', label: 'Carga entre técnicos' },
  { id: 'reaberturas', label: 'Chamados reabertos' },
]

function RelatorioAcessoSecao() {
  const { token, tratarErroApi } = useAuth()
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [diasInatividade, setDiasInatividade] = useState(30)
  const [soInativos, setSoInativos] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setItens(await buscarRelatorioAcesso(token, { diasInatividade }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diasInatividade])

  const itensExibidos = soInativos ? itens.filter(i => i.inativo) : itens
  const totalInativos = itens.filter(i => i.inativo).length

  return (
    <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
      <div style={estilos.card}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}`, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Último acesso por colaborador</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>
              {itens.length} colaborador{itens.length !== 1 ? 'es' : ''}, {totalInativos} inativo{totalInativos !== 1 ? 's' : ''} há mais de {diasInatividade} dias.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={estilos.label}>Dias p/ inativo</span>
              <input type="number" min="1" value={diasInatividade}
                onChange={e => setDiasInatividade(Number(e.target.value) || 1)}
                style={{ ...estilos.input, width: 90, padding: '9px 12px', fontSize: 14 }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: CORES_APP.textoFraco, cursor: 'pointer', paddingBottom: 11 }}>
              <input type="checkbox" checked={soInativos} onChange={e => setSoInativos(e.target.checked)} />
              Só inativos
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {itensExibidos.length === 0 ? (
            <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhum colaborador encontrado.</p>
          ) : itensExibidos.map(item => (
            <div key={item.usuarioId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}`, gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.onlineAgora && (
                    <span title="Online agora" style={{ width: 7, height: 7, borderRadius: '50%', background: CORES_APP.verde, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{item.nome ?? '(aguardando cadastro)'}</span>
                </div>
                <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{item.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12.5, color: CORES_APP.textoFraco }}>
                  {item.ultimoAcesso ? `${formatarDataHora(new Date(item.ultimoAcesso))} (${tempoDecorrido(new Date(item.ultimoAcesso))})` : 'Nunca acessou'}
                </span>
                {item.inativo && (
                  <span style={{ background: 'rgba(239,68,68,0.1)', color: CORES_PRIORIDADE.alta.dot, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                    Inativo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </EstadoRequisicao>
  )
}

// Compartilhado pelas duas seções seguintes (chamados/tempo) — mesmo par
// de <input type="date"> já usado em DashboardTI.jsx, reaproveitado aqui
// pela mesma consistência visual pedida.
function FiltroPeriodo({ dataInicio, setDataInicio, dataFim, setDataFim }) {
  return (
    <div style={{ ...estilos.card, padding: '14px 16px', marginBottom: 18, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={estilos.label}>Data início</span>
        <input type="date" value={dataInicio} max={dataFim}
          onChange={e => setDataInicio(e.target.value)}
          style={{ ...estilos.input, width: 'auto', padding: '9px 12px', fontSize: 14 }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={estilos.label}>Data fim</span>
        <input type="date" value={dataFim} min={dataInicio} max={dataFimPadrao()}
          onChange={e => setDataFim(e.target.value)}
          style={{ ...estilos.input, width: 'auto', padding: '9px 12px', fontSize: 14 }} />
      </label>
    </div>
  )
}

function RelatorioAtividadeChamadosSecao() {
  const { token, tratarErroApi } = useAuth()
  const [dataInicio, setDataInicio] = useState(dataInicioPadrao)
  const [dataFim, setDataFim] = useState(dataFimPadrao)
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setItens(await buscarRelatorioAtividadeChamados(token, { dataInicio, dataFim }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim])

  const comChamados = itens.filter(i => i.totalChamados > 0).sort((a, b) => b.totalChamados - a.totalChamados)
  const semChamados = itens.filter(i => i.totalChamados === 0)

  return (
    <div>
      <FiltroPeriodo dataInicio={dataInicio} setDataInicio={setDataInicio} dataFim={dataFim} setDataFim={setDataFim} />
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={estilos.card}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Chamados abertos no período</h2>
              <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>{comChamados.length} colaborador{comChamados.length !== 1 ? 'es' : ''} abriu{comChamados.length !== 1 ? 'ram' : ''} pelo menos 1 chamado.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {comChamados.length === 0 ? (
                <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhum chamado no período.</p>
              ) : comChamados.map(item => (
                <div key={item.usuarioId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}`, gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{item.nome ?? '(aguardando cadastro)'}</div>
                    <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{item.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: CORES_APP.textoFraco }}>Último: {formatarDataHora(new Date(item.ultimoChamadoEm))}</span>
                    <span style={{ background: 'rgba(0,73,192,0.08)', color: CORES_TI.accent, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                      {item.totalChamados}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...estilos.card, border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Não abriram nenhum chamado no período</h2>
              <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>{semChamados.length} colaborador{semChamados.length !== 1 ? 'es' : ''}.</p>
            </div>
            {semChamados.length === 0 ? (
              <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Todos os colaboradores abriram pelo menos 1 chamado no período.</p>
            ) : (
              <div style={{ padding: '12px 22px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {semChamados.map(item => (
                  <span key={item.usuarioId} style={{ background: 'rgba(245,158,11,0.1)', color: CORES_STATUS.andamento.fg, borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                    {item.nome ?? item.email}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </EstadoRequisicao>
    </div>
  )
}

function RelatorioTempoAtendimentoSecao() {
  const { token, tratarErroApi } = useAuth()
  const [dataInicio, setDataInicio] = useState(dataInicioPadrao)
  const [dataFim, setDataFim] = useState(dataFimPadrao)
  const [relatorio, setRelatorio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setRelatorio(await buscarRelatorioTempoAtendimento(token, { dataInicio, dataFim }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim])

  return (
    <div>
      <FiltroPeriodo dataInicio={dataInicio} setDataInicio={setDataInicio} dataFim={dataFim} setDataFim={setDataFim} />
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
        {relatorio && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ ...estilos.card, padding: '18px 22px', flex: '1 1 200px' }}>
                <div style={{ color: CORES_APP.textoFraco, fontSize: 12.5, marginBottom: 4 }}>Tempo médio de espera</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: CORES_APP.tinta }}>
                  {relatorio.mediaGeralMinutos !== null ? formatarDuracaoMinutos(relatorio.mediaGeralMinutos) : '—'}
                </div>
              </div>
              <div style={{ ...estilos.card, padding: '18px 22px', flex: '1 1 200px' }}>
                <div style={{ color: CORES_APP.textoFraco, fontSize: 12.5, marginBottom: 4 }}>Chamados medidos</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: CORES_APP.tinta }}>{relatorio.itens.length}</div>
              </div>
              <div style={{ ...estilos.card, padding: '18px 22px', flex: '1 1 200px' }}>
                <div style={{ color: CORES_APP.textoFraco, fontSize: 12.5, marginBottom: 4 }}>Sem transição p/ atendimento</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: CORES_APP.textoSuave }}>{relatorio.totalSemTransicaoParaAtendimento}</div>
              </div>
            </div>

            <div style={estilos.card}>
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Mais demorados</h2>
                <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>Os 5 chamados que mais esperaram até entrar em atendimento no período.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {relatorio.maisDemorados.length === 0 ? (
                  <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhum chamado com tempo de atendimento calculado no período.</p>
                ) : relatorio.maisDemorados.map((item, indice) => (
                  <div key={item.chamadoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}`, gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: CORES_APP.textoSuave, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, width: 16 }}>{indice + 1}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{item.titulo}</div>
                        <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>Aberto em {formatarDataHora(new Date(item.dataAbertura))}</div>
                      </div>
                    </div>
                    <span style={{ background: 'rgba(239,68,68,0.1)', color: CORES_PRIORIDADE.alta.dot, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                      {formatarDuracaoMinutos(item.tempoEsperaMinutos)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </EstadoRequisicao>
    </div>
  )
}

function RelatorioCargaTecnicosSecao() {
  const { token, tratarErroApi } = useAuth()
  const [dataInicio, setDataInicio] = useState(dataInicioPadrao)
  const [dataFim, setDataFim] = useState(dataFimPadrao)
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setItens(await buscarRelatorioCargaTecnicos(token, { dataInicio, dataFim }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim])

  const itensOrdenados = [...itens].sort((a, b) => b.totalChamados - a.totalChamados)

  return (
    <div>
      <FiltroPeriodo dataInicio={dataInicio} setDataInicio={setDataInicio} dataFim={dataFim} setDataFim={setDataFim} />
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
        <div style={estilos.card}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Distribuição de carga entre técnicos</h2>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>Chamados atribuídos no período e tempo médio até a primeira finalização.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {itensOrdenados.length === 0 ? (
              <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhum técnico cadastrado.</p>
            ) : itensOrdenados.map(item => (
              <div key={item.tecnicoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}`, gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{item.nome ?? item.email}</div>
                  <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{item.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 12, color: CORES_APP.textoFraco }}>
                    {item.totalFinalizados} finalizado{item.totalFinalizados !== 1 ? 's' : ''}, média {item.tempoMedioResolucaoMinutos !== null ? formatarDuracaoMinutos(item.tempoMedioResolucaoMinutos) : '—'}
                  </span>
                  <span style={{ background: 'rgba(0,73,192,0.08)', color: CORES_TI.accent, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                    {item.totalChamados}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EstadoRequisicao>
    </div>
  )
}

function RelatorioReaberturasSecao() {
  const { token, tratarErroApi } = useAuth()
  const [dataInicio, setDataInicio] = useState(dataInicioPadrao)
  const [dataFim, setDataFim] = useState(dataFimPadrao)
  const [relatorio, setRelatorio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setRelatorio(await buscarRelatorioReaberturas(token, { dataInicio, dataFim }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim])

  return (
    <div>
      <FiltroPeriodo dataInicio={dataInicio} setDataInicio={setDataInicio} dataFim={dataFim} setDataFim={setDataFim} />
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={carregar}>
        {relatorio && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {relatorio.destaque.length > 0 && (
              <div style={{ ...estilos.card, border: '1px solid rgba(239,68,68,0.25)' }}>
                <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Reabertos 2+ vezes</h2>
                  <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>{relatorio.destaque.length} chamado{relatorio.destaque.length !== 1 ? 's' : ''} reaberto{relatorio.destaque.length !== 1 ? 's' : ''} mais de uma vez, pode indicar resolução recorrentemente malfeita.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {relatorio.destaque.map(item => (
                    <div key={item.chamadoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}`, gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{item.titulo}</div>
                        <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{item.tecnicoResponsavelNome ?? 'Sem técnico responsável'}</div>
                      </div>
                      <span style={{ background: 'rgba(239,68,68,0.1)', color: CORES_PRIORIDADE.alta.dot, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                        {item.totalReaberturas}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={estilos.card}>
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Todos os chamados reabertos no período</h2>
                <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>{relatorio.porChamado.length} chamado{relatorio.porChamado.length !== 1 ? 's' : ''}.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {relatorio.porChamado.length === 0 ? (
                  <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhum chamado reaberto no período.</p>
                ) : relatorio.porChamado.map(item => (
                  <div key={item.chamadoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}`, gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{item.titulo}</div>
                      <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{item.tecnicoResponsavelNome ?? 'Sem técnico responsável'}</div>
                    </div>
                    <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                      {item.totalReaberturas}x
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={estilos.card}>
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: CORES_APP.texto, margin: '0 0 3px' }}>Por técnico responsável</h2>
                <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>Reaberturas somadas por quem resolveu originalmente, sem julgamento, só pra identificar padrão.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {relatorio.porTecnico.length === 0 ? (
                  <p style={{ color: CORES_APP.textoSuave, fontSize: 13, margin: 0, padding: '16px 22px' }}>Nenhuma reabertura com técnico responsável identificado no período.</p>
                ) : relatorio.porTecnico.map(item => (
                  <div key={item.tecnicoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: `1px solid ${CORES_APP.bordaSuave}`, gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: CORES_APP.texto }}>{item.nome ?? item.email}</div>
                      <div style={{ fontSize: 12, color: CORES_APP.textoFraco }}>{item.email}</div>
                    </div>
                    <span style={{ background: 'rgba(0,73,192,0.08)', color: CORES_TI.accent, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                      {item.totalReaberturas}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </EstadoRequisicao>
    </div>
  )
}

function AtividadeTab() {
  const [subaba, setSubaba] = useState('acesso')

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {SUBABAS_ATIVIDADE.map(item => {
          const ativa = subaba === item.id
          return (
            <button key={item.id} onClick={() => setSubaba(item.id)}
              style={{
                background: ativa ? 'rgba(0,73,192,0.08)' : CORES_APP.fundoCampo,
                color: ativa ? CORES_TI.accent : CORES_APP.textoFraco,
                border: `1px solid ${ativa ? 'rgba(0,73,192,0.22)' : CORES_APP.borda}`,
                borderRadius: 8, padding: '7px 14px', fontSize: 13, fontFamily: 'Outfit, sans-serif',
                fontWeight: ativa ? 600 : 400, cursor: 'pointer',
              }}>
              {item.label}
            </button>
          )
        })}
      </div>
      {subaba === 'acesso' && <RelatorioAcessoSecao />}
      {subaba === 'chamados' && <RelatorioAtividadeChamadosSecao />}
      {subaba === 'tempo' && <RelatorioTempoAtendimentoSecao />}
      {subaba === 'carga' && <RelatorioCargaTecnicosSecao />}
      {subaba === 'reaberturas' && <RelatorioReaberturasSecao />}
    </div>
  )
}

function Administracao() {
  const [aba, setAba] = useState('setores')

  return (
    <div className="animate-fade-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 22, flexShrink: 0 }}>
        <h1 style={estilos.sectionTitle}>Administração</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Categorias, setores, grupos, colaboradores e relatórios de atividade: configuração central da Área Técnica.</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexShrink: 0, borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
        {ABAS.map(item => {
          const ativa = aba === item.id
          return (
            <button key={item.id} onClick={() => setAba(item.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 16px', fontFamily: 'Outfit, sans-serif', fontSize: 14,
                fontWeight: ativa ? 700 : 500, color: ativa ? CORES_TI.accent : CORES_APP.textoFraco,
                borderBottom: ativa ? `2px solid ${CORES_TI.accent}` : '2px solid transparent', marginBottom: -1,
              }}>
              {item.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {aba === 'categorias' && <CategoriasTab />}
        {aba === 'palavras-chave-n3' && <PalavrasChaveN3Tab />}
        {aba === 'setores' && <SetoresTab />}
        {aba === 'grupos' && <GruposTab />}
        {aba === 'colaboradores' && <ColaboradoresTab />}
        {aba === 'atividade' && <AtividadeTab />}
      </div>
    </div>
  )
}

export default Administracao
