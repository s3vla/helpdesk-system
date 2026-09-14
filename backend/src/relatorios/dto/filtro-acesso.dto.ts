import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

// GET /admin/relatorios/acesso?diasInatividade= — default 30 (aplicado no
// service, não aqui, mesmo padrão de PaginacaoDto/FiltrosChamadoDto: o DTO
// só valida o formato, quem decide o valor padrão é o service.
export class FiltroAcessoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  diasInatividade?: number;
}
