import {useState} from 'react'
import LoginScreen from './components/LoginScreen'

function App(){
  const[usuarioLogado, setUsuarioLogado] = useState(null)

  function handleLoginSucesso(email){
    setUsuarioLogado(email)
  }


  return(
    <div>
      {usuarioLogado ? (
        <h1>Bem-vindo, {usuarioLogado}! (tela principal viria aqui)</h1>
      ) : (
        <LoginScreen onLogin={handleLoginSucesso}/>
      )}
    </div>
  )
}

export default App