import { Component } from 'react'
import { CORES_APP, estilos } from '../styles/theme'

// Rede de segurança genérica: se qualquer tela do app quebrar durante a
// renderização (ex: um TypeError não previsto), mostra uma mensagem amigável
// em vez de deixar o React desmontar a árvore inteira e sobrar uma tela
// branca sem nenhuma pista pro usuário. Não substitui tratamento de erro
// específico de cada tela — é só o último recurso.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { comErro: false }
  }

  static getDerivedStateFromError() {
    return { comErro: true }
  }

  componentDidCatch(erro, infoDoErro) {
    console.error('Erro não tratado numa tela:', erro, infoDoErro)
  }

  render() {
    if (!this.state.comErro) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: CORES_APP.fundo, padding: 24,
      }}>
        <div style={{ ...estilos.card, padding: 32, maxWidth: 420, textAlign: 'center' }}>
          <h2 style={{ ...estilos.sectionTitle, fontSize: 20 }}>Algo deu errado</h2>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: '8px 0 20px' }}>
            Essa tela encontrou um problema inesperado. Tente recarregar a página. Se o erro continuar, avise a equipe de TI.
          </p>
          <button style={estilos.btnPrimary} onClick={() => window.location.reload()}>
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
