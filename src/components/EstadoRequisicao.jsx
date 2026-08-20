import { estilos } from '../styles/theme'

// Bloco padrão de "carregando" / "deu erro" / conteúdo — toda tela que
// busca dados da API passa por um desses três estados, então esse
// componente evita repetir o mesmo JSX de loading/erro em cada uma delas.
// Uso: <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>{conteúdo real}</EstadoRequisicao>
function EstadoRequisicao({ carregando, erro, aoTentarNovamente, children }) {
  if (carregando) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#7b92b4', fontSize: 14 }}>
        Carregando...
      </div>
    )
  }

  if (erro) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#f87171', fontSize: 14, margin: '0 0 14px' }}>{erro}</p>
        {aoTentarNovamente && (
          <button onClick={aoTentarNovamente} style={estilos.btnGhost}>
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  return children
}

export default EstadoRequisicao
