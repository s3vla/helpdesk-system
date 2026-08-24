// Gravidade do aviso no Mural — decide cor/ícone no frontend (ver
// MuralAvisos.jsx): ALERTA em vermelho, MANUTENCAO em âmbar, INFORMATIVO em
// azul neutro. Puramente de exibição — não muda nenhuma regra de negócio no
// backend, exceto ser o gatilho (futuro) de notificação por e-mail.
export enum TipoAviso {
  INFORMATIVO = 'INFORMATIVO',
  ALERTA = 'ALERTA',
  MANUTENCAO = 'MANUTENCAO',
}
