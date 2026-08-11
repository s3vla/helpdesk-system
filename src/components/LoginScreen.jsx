import {useState} from 'react'

function LoginScreen({onLogin}){
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [erro, setErro] = useState('')

    function handleLogin(){
        if (!email.endsWith('@novatechagro.com.br"')){
            setErro('Use seu e-mail corporativo @novatechagro.com.br')
            return
        }
        if(!senha){
            setErro('Informe sua senha')
            return
        }
        setErro('')
        onLogin(email)
    }
    return(
        <div>
            <h1>Bem-vindo</h1>
            <p>Acesse com seu e-mail corporativo</p>

            <input
                type="email"
                placeholder="seu.nome@novatechagro.com.br"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
            />
        
            <input
                type="password"
                placeholder="*******"
                value={senha}
                onChange={(e)=>setSenha(e.target.value)}
            />


            {erro && <p style={{ color: 'red' }}>{erro}</p>}

            <button onClick={handleLogin}>Entrar</button>
        </div>
    )
}

export default LoginScreen