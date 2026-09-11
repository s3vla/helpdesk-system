import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SugestaoForum } from './entities/sugestao-forum.entity';
import { ComentarioForum } from './entities/comentario-forum.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SugestaoForum, ComentarioForum, Usuario]),
  ],
  providers: [ForumService],
  controllers: [ForumController],
})
export class ForumModule {}
