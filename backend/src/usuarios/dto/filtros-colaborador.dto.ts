import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

const VALORES_STATUS_CHAMADO = ['parado', 'andamento', 'finalizado'] as const;

// Query params de GET /usuarios (?busca=&pagina=&limite=&statusChamado=) —
// mesmo padrão de FiltrosChamadoDto: `busca` é texto livre, sem validação
// de formato. `statusChamado` filtra pra só devolver colaboradores com
// PELO MENOS 1 chamado nesse status (ver UsuariosService.listarColaboradores)
// — minúsculo, mesma convenção já usada nas pílulas de status de
// ITDashboard.jsx, convertido pro enum maiúsculo dentro do service.
export class FiltrosColaboradorDto extends PaginacaoDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsIn(VALORES_STATUS_CHAMADO, { message: 'Status inválido' })
  statusChamado?: (typeof VALORES_STATUS_CHAMADO)[number];
}
