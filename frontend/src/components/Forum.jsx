import { useState } from 'react'
import ForumSugestoes from './ForumSugestoes'
import ForumDetalheSugestao from './ForumDetalheSugestao'

// Wrapper simples que alterna entre listagem e detalhe por estado local
// (`sugestaoSelecionadaId`) — App.jsx só monta <Forum/> uma vez por área
// (colaborador/técnico), sem precisar conhecer o "sub-estado" de lista vs.
// detalhe, mesmo raciocínio de FirstAccessModal alternar sua própria tela
// internamente em vez de App.jsx controlar isso.
function Forum({ podeAlterarStatus }) {
  const [sugestaoSelecionadaId, setSugestaoSelecionadaId] = useState(null)

  if (sugestaoSelecionadaId) {
    return (
      <ForumDetalheSugestao
        sugestaoId={sugestaoSelecionadaId}
        podeAlterarStatus={podeAlterarStatus}
        onVoltar={() => setSugestaoSelecionadaId(null)}
      />
    )
  }

  return <ForumSugestoes onSelecionar={setSugestaoSelecionadaId} />
}

export default Forum
