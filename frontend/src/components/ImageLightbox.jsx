// Overlay simples pra ampliar uma imagem em tamanho maior — usado em todo
// lugar que mostra uma galeria de thumbnails (prints do chamado, prints da
// solução, imagens anexadas num comentário), sempre do mesmo jeito: clique
// no thumbnail abre, clique em qualquer lugar (menos na própria imagem)
// fecha. Recebe a GALERIA inteira (`imagens`, array de URLs relativas) +
// `indice` (qual delas está ampliada agora) — não só uma imagem isolada —
// pra poder navegar com ←/→ sem fechar e reabrir. Não faz nada quando
// `imagens`/`indice` vêm vazios/nulos — os componentes que usam isso podem
// simplesmente renderizar `<ImageLightbox imagens={...} indice={...} .../>`
// incondicionalmente, mesmo padrão de antes com `src`.
import { useEffect } from 'react'
import { CORES_APP } from '../styles/theme'
import { URL_BASE } from '../services/apiClient'
import { IconChevronRight } from './icons'

function ImageLightbox({ imagens, indice, alt, onClose, onIndiceChange }) {
  const aberto = !!imagens?.length && indice != null
  const temAnterior = aberto && indice > 0
  const temProxima = aberto && indice < imagens.length - 1

  // ESC fecha, ←/→ navegam — só registra o listener enquanto está aberto
  // (senão ESC/setas de uma tela sem lightbox nenhum aberto seriam
  // capturadas à toa). Para no início/fim de propósito (não circula) —
  // comportamento mais comum em galerias, evita a pessoa "passar direto"
  // sem perceber que voltou pro começo.
  useEffect(() => {
    if (!aberto) return
    function aoTeclar(e) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && temProxima) onIndiceChange(indice + 1)
      else if (e.key === 'ArrowLeft' && temAnterior) onIndiceChange(indice - 1)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto, indice, temAnterior, temProxima, onClose, onIndiceChange])

  if (!aberto) return null
  const src = `${URL_BASE}${imagens[indice]}`

  const estiloBotaoNav = {
    position: 'fixed', top: '50%', transform: 'translateY(-50%)', background: 'rgba(16,35,31,0.55)', border: 'none',
    color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: CORES_APP.overlay, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, cursor: 'zoom-out' }}
      className="animate-fade-up">
      <button onClick={onClose}
        style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(16,35,31,0.55)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ×
      </button>
      {imagens.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); if (temAnterior) onIndiceChange(indice - 1) }} disabled={!temAnterior} title="Imagem anterior (←)"
            style={{ ...estiloBotaoNav, left: 20, opacity: temAnterior ? 1 : 0.3, cursor: temAnterior ? 'pointer' : 'default' }}>
            <IconChevronRight width={18} height={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button onClick={e => { e.stopPropagation(); if (temProxima) onIndiceChange(indice + 1) }} disabled={!temProxima} title="Próxima imagem (→)"
            style={{ ...estiloBotaoNav, right: 20, opacity: temProxima ? 1 : 0.3, cursor: temProxima ? 'pointer' : 'default' }}>
            <IconChevronRight width={18} height={18} />
          </button>
          <span style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 13, fontFamily: 'Outfit, sans-serif', background: 'rgba(16,35,31,0.55)', padding: '4px 12px', borderRadius: 99 }}>
            {indice + 1} / {imagens.length}
          </span>
        </>
      )}
      <img src={src} alt={alt} onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10, boxShadow: '0 20px 60px rgba(16,35,31,0.22)', cursor: 'default' }} />
    </div>
  )
}

export default ImageLightbox
