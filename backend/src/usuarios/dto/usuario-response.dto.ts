import { TipoUsuario } from '../../common/enums/tipo-usuario.enum';
import { Usuario } from '../entities/usuario.entity';

// DTO de SAÍDA: existe pra garantir que `senhaHash` nunca vaza numa
// resposta HTTP, mesmo que alguém esqueça de removê-lo manualmente em algum
// service novo. Toda resposta que envolve um Usuario passa por
// `mapUsuarioParaResposta` em vez de devolver a entity crua.
export class UsuarioResponseDto {
  id: number;
  // Nulos quando a conta foi resetada (e-mail de cargo aguardando novo
  // responsável completar o Primeiro Acesso) — ver `emAguardoDeCadastro`.
  nome: string | null;
  email: string;
  cargo: string | null;
  departamento: string;
  tipo: TipoUsuario;
  // Calculado a partir de `senhaHash === null` — verdadeiro só entre um
  // reset e o próximo Primeiro Acesso completado para aquele e-mail.
  emAguardoDeCadastro: boolean;
  // true só pros técnicos recém-seedados que ainda não trocaram a senha de
  // bootstrap do .env — o frontend usa isso pra forçar a tela de troca de
  // senha antes de liberar o Painel TI.
  deveTrocarSenha: boolean;
}

export function mapUsuarioParaResposta(usuario: Usuario): UsuarioResponseDto {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
    departamento: usuario.departamento,
    tipo: usuario.tipo,
    emAguardoDeCadastro: usuario.senhaHash === null,
    deveTrocarSenha: usuario.deveTrocarSenha,
  };
}
