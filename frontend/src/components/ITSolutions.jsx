import { useEffect, useState } from 'react'
import { estilos } from '../styles/theme'
import { formatarData } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import { buscarSolucoesConhecidas } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { URL_BASE } from '../services/apiClient'
import { CATEGORIAS as CATEGORIAS_INTERNAS, LABEL_CATEGORIA as LABEL_CATEGORIA_BASE } from '../utils/categorias'
import { IconBarChart, IconBook, IconSearch } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import ImageLightbox from './ImageLightbox'

const CATEGORIAS = ['all', ...CATEGORIAS_INTERNAS]
const LABEL_CATEGORIA = { all: 'Todas', ...LABEL_CATEGORIA_BASE }

// Base de "Soluções Conhecidas": busca as soluções catalogadas
// (GET /solucoes-conhecidas já filtra por marcadaComo=true no backend) e
// aplica busca por palavra-chave e filtro de categoria localmente, sobre a
// lista já carregada — a API já devolve `ocorrenciasCategoria` pronto por
// item, então não precisamos mais da lista completa de chamados aqui.
function ITSolutions() {
  const { token, tratarErroApi } = useAuth()
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [solucoes, setSolucoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [imagemAmpliada, setImagemAmpliada] = useState(null)

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      setSolucoes(await buscarSolucoesConhecidas(token))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtradas = solucoes.filter(c => {
    if (filtroCategoria !== 'all' && c.category !== filtroCategoria) return false
    if (busca.trim()) {
      const termo = busca.toLowerCase()
      return c.summary.toLowerCase().includes(termo) || c.resolution.text.toLowerCase().includes(termo) || c.category.toLowerCase().includes(termo)
    }
    return true
  })

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}><IconBook width={16} height={16} /></div>
          <h1 style={estilos.sectionTitle}>Soluções Conhecidas</h1>
        </div>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0 }}>
          {carregando ? 'Carregando...' : `${solucoes.length} solução${solucoes.length !== 1 ? 'ões' : ''} catalogada${solucoes.length !== 1 ? 's' : ''} — pesquise antes de começar a resolver um chamado novo`}
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: 18 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5f7a', pointerEvents: 'none', display: 'flex' }}><IconSearch /></span>
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Pesquisar por palavra-chave — ex: impressora, VPN, acesso..."
          style={{ ...estilos.input, paddingLeft: 40, fontSize: 14 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIAS.map(c => {
          const contagem = c === 'all' ? solucoes.length : solucoes.filter(t => t.category === c).length
          const ativo = filtroCategoria === c
          return (
            <button key={c} onClick={() => setFiltroCategoria(c)}
              style={{ background: ativo ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', color: ativo ? '#4ade80' : '#7b92b4', border: `1px solid ${ativo ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: ativo ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {LABEL_CATEGORIA[c]}
              <span style={{ background: ativo ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', color: ativo ? '#4ade80' : '#4a5f7a', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{contagem}</span>
            </button>
          )
        })}
      </div>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {filtradas.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ color: '#4a5f7a', marginBottom: 14, display: 'flex', justifyContent: 'center' }}><IconSearch width={36} height={36} /></div>
            <div style={{ color: '#7b92b4', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Nenhuma solução encontrada</div>
            <div style={{ color: '#4a5f7a', fontSize: 14 }}>{busca ? `Nenhum resultado para "${busca}"` : 'Nenhuma solução conhecida nesta categoria ainda'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtradas.map(chamado => {
              const ocorrencias = chamado.ocorrenciasCategoria ?? 1
              return (
                <div key={chamado.id} style={{ ...estilos.card, border: '1px solid rgba(34,197,94,0.14)', borderLeft: '3px solid #22c55e', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 7, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ background: 'rgba(255,255,255,0.06)', color: '#7b92b4', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category]}</span>
                        <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Solução conhecida</span>
                        <span style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconBarChart width={13} height={13} /> {ocorrencias} ocorrência{ocorrencias !== 1 ? 's' : ''} em {LABEL_CATEGORIA[chamado.category]}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#f0f4ff', margin: 0, lineHeight: 1.4 }}>{chamado.summary}</h3>
                      <p style={{ color: '#7b92b4', fontSize: 13, margin: '4px 0 0', lineHeight: 1.5 }}>{chamado.description.slice(0, 120)}{chamado.description.length > 120 ? '…' : ''}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#4a5f7a', fontSize: 11 }}>Resolvido em</div>
                      <div style={{ color: '#7b92b4', fontSize: 12, marginTop: 2 }}>{formatarData(chamado.resolution.resolvedAt)}</div>
                      <div style={{ color: '#4a5f7a', fontSize: 11, marginTop: 2 }}>por {chamado.resolution.resolvedBy}</div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'rgba(34,197,94,0.1)' }} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 12, color: '#4ade80', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Como foi resolvido</span>
                    </div>
                    <p style={{ color: '#a7f3d0', fontSize: 14, margin: 0, lineHeight: 1.75, background: 'rgba(34,197,94,0.04)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(34,197,94,0.1)', whiteSpace: 'pre-wrap' }}>
                      {chamado.resolution.text}
                    </p>
                  </div>

                  {chamado.resolution.hasImage && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,120,81,0.14)', borderRadius: 10, padding: 14 }}>
                      <div style={estilos.label}>Print anexado</div>
                      <img src={`${URL_BASE}${chamado.resolution.imagemUrl}`} alt="Print da solução" onClick={() => setImagemAmpliada(`${URL_BASE}${chamado.resolution.imagemUrl}`)}
                        style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, display: 'block', cursor: 'zoom-in' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </EstadoRequisicao>

      <ImageLightbox src={imagemAmpliada} alt="Imagem ampliada" onClose={() => setImagemAmpliada(null)} />
    </div>
  )
}

export default ITSolutions
