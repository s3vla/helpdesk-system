// Enums do TypeScript viram, no banco, uma coluna de texto com valores
// restritos (TypeORM cria um CHECK constraint / enum nativo dependendo do
// dialeto). Usar enum em vez de string solta é o que permite ao TypeScript
// (e ao class-validator, via @IsEnum) recusar valores inválidos em tempo de
// compilação e de request, em vez de só descobrir o erro em produção.
export enum TipoUsuario {
  COLABORADOR = 'COLABORADOR',
  TECNICO = 'TECNICO',
}
