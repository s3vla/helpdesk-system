import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // ...
  ],

  server: {
    allowedHosts: ['regally-struggle-itinerary.ngrok-free.dev'],
    // O plano gratuito do ngrok só permite 1 túnel simultâneo, então só o
    // frontend é exposto diretamente. As chamadas de API (URL_BASE vazio em
    // apiClient.js) saem como caminho relativo à própria origem do
    // frontend — o Vite repassa (proxy) essas rotas pro backend local, sem
    // precisar de um segundo túnel nem mexer em CORS (a chamada backend
    // acontece servidor-a-servidor, não sai do navegador).
    proxy: {
      '/auth': 'http://localhost:3000',
      '/chamados': 'http://localhost:3000',
      '/usuarios': 'http://localhost:3000',
      '/solucoes-conhecidas': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/dashboard': 'http://localhost:3000',
      '/avisos': 'http://localhost:3000',
      '/tarefas': 'http://localhost:3000',
      '/anotacoes': 'http://localhost:3000',
    },
  },
})
