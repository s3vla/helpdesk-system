import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // ...
  ],

  server: {
    // Pra expor via ngrok (ou outro túnel) localmente, adicione
    // `allowedHosts: ['seu-host.ngrok-free.dev']` aqui — só localmente,
    // nunca commitado (é config de máquina, não do projeto). O plano
    // gratuito do ngrok só permite 1 túnel simultâneo, então só o
    // frontend é exposto diretamente. As chamadas de API (URL_BASE vazio em
    // apiClient.js) saem como caminho relativo à própria origem do
    // frontend — o Vite repassa (proxy) essas rotas pro backend local, sem
    // precisar de um segundo túnel nem mexer em CORS (a chamada backend
    // acontece servidor-a-servidor, não sai do navegador).
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
})
