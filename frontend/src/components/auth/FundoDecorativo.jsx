// Camada decorativa do lado CLARO das 4 telas de autenticação (login
// colaborador, login TI, primeiro acesso, troca de senha) — o `<main>`
// de cada uma ficava "seco"/vazio atrás do card flutuante, então esta
// camada soma 3 elementos bem sutis: uma textura de linhas diagonais, e
// dois círculos suaves ecoando o azul/verde da marca, um em cada canto
// (mesma técnica do círculo de BrandPanel.jsx, só que numa versão bem
// mais discreta, pensada pra não competir com a leitura do formulário).
//
// Renderizado como o PRIMEIRO filho de `<main style={estilosAuth.principal}>`,
// antes do card — `position: absolute, inset: 0, zIndex: 0` faz cobrir o
// `<main>` inteiro, deitado atrás do card (que já ganhou `zIndex: 1` em
// authTheme.js). `pointerEvents: none` garante que não intercepta nenhum
// clique, mesmo nas áreas do `<main>` que sobram fora do card.
function FundoDecorativo() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Textura de linhas diagonais — bem fina (1px, espaçadas 16px),
          usa a cor "tinta" da paleta em opacidade baixíssima, então lê
          como uma leve granulação de papel, não como um padrão gráfico. */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(16,35,31,0.055) 0px, rgba(16,35,31,0.055) 1px, transparent 1px, transparent 16px)',
      }} />

      {/* Círculo azul — canto superior direito. */}
      <div style={{
        position: 'absolute', top: -170, right: -170, width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, rgba(0,73,192,0.07), rgba(0,73,192,0) 70%)',
      }} />

      {/* Círculo verde — canto inferior esquerdo. */}
      <div style={{
        position: 'absolute', bottom: -170, left: -170, width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle at 65% 65%, rgba(29,158,117,0.07), rgba(29,158,117,0) 70%)',
      }} />
    </div>
  )
}

export default FundoDecorativo
