import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SeedService } from './seed.service';

@Module({
  imports: [UsuariosModule],
  providers: [SeedService],
})
export class SeedModule {}
