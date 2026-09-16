// Escopo de quem deve ver um aviso do Mural (ver Aviso.destinatarioTipo).
// GRUPO/USUARIO usam Aviso.grupo/Aviso.usuario respectivamente — só um dos
// dois é preenchido, validado em AvisosService (não dá pra expressar essa
// exclusividade só com o enum + FKs nullable).
export enum DestinatarioAvisoTipo {
  TODOS = 'TODOS',
  GRUPO = 'GRUPO',
  USUARIO = 'USUARIO',
}
