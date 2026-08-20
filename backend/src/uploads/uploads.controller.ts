import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp'];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB

// Upload "versão simples" combinado no desenho: sem serviço externo (S3 etc),
// só salva o arquivo numa pasta local (uploads/) e devolve o caminho pra
// guardar no chamado. FileInterceptor('arquivo') diz ao Multer (a lib que o
// Express usa para parsear multipart/form-data) pra procurar um campo de
// arquivo chamado "arquivo" no corpo da requisição.
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads',
        // Nome aleatório (não o nome original do arquivo) evita dois
        // problemas de uma vez: colisão de nomes iguais de usuários
        // diferentes, e um usuário malicioso tentando manipular o caminho
        // do arquivo através do nome (path traversal).
        filename: (_req, file, callback) => {
          const nomeUnico = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, nomeUnico);
        },
      }),
      limits: { fileSize: TAMANHO_MAXIMO_BYTES },
      fileFilter: (_req, file, callback) => {
        const aceito = TIPOS_ACEITOS.includes(file.mimetype);
        callback(
          aceito
            ? null
            : new BadRequestException('Envie apenas imagens PNG, JPEG ou WEBP'),
          aceito,
        );
      },
    }),
  )
  enviar(@UploadedFile() arquivo: Express.Multer.File) {
    if (!arquivo) throw new BadRequestException('Nenhum arquivo enviado');
    // O front usa essa URL direto num <img src="..."> — ver
    // app.useStaticAssets em main.ts, que serve tudo dentro de uploads/
    // sob o prefixo /uploads/.
    return { url: `/uploads/${arquivo.filename}` };
  }
}
