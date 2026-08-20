// Overlay simples pra ampliar uma imagem em tamanho maior — usado em todo
// lugar que mostra um thumbnail (print do chamado, print da solução
// conhecida, imagem anexada num comentário), sempre do mesmo jeito: clique
// no thumbnail abre, clique em qualquer lugar (menos na própria imagem)
// fecha. Não faz nada quando `src` é null — os componentes que usam isso
// podem simplesmente renderizar `<ImageLightbox src={imagemAmpliada} .../>`
// incondicionalmente.
function ImageLightbox({ src, alt, onClose }) {
  if (!src) return null

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,10,22,0.92)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, cursor: 'zoom-out' }}
      className="animate-fade-up">
      <button onClick={onClose}
        style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: '#f0f4ff', fontSize: 20, width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ×
      </button>
      <img src={src} alt={alt} onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', cursor: 'default' }} />
    </div>
  )
}

export default ImageLightbox
