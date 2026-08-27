import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { detectarTipoImagem } from './detectar-tipo-imagem.util';

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB
const PASTA_UPLOADS = join(__dirname, '..', '..', 'uploads');

// Upload "versão simples" combinado no desenho: sem serviço externo (S3 etc),
// só salva o arquivo numa pasta local (uploads/) e devolve o caminho pra
// guardar no chamado. FileInterceptor('arquivo') diz ao Multer (a lib que o
// Express usa para parsear multipart/form-data) pra procurar um campo de
// arquivo chamado "arquivo" no corpo da requisição.
//
// `memoryStorage` (em vez do antigo `diskStorage`) é o que permite VALIDAR
// o conteúdo de verdade antes de decidir nome/extensão do arquivo salvo —
// com diskStorage, o multer já grava o arquivo em disco enquanto o corpo
// ainda está chegando, e o `fileFilter` só enxerga metadados declarados
// pelo cliente (nome original, mimetype), nunca os bytes de fato. Isso
// deixava o sistema aceitar QUALQUER conteúdo desde que o cliente
// mentisse um Content-Type de imagem — auditoria de segurança confirmou
// isso na prática (upload de HTML com <script>, servido de volta como
// text/html real). Com memoryStorage, o arquivo inteiro (até
// TAMANHO_MAXIMO_BYTES) fica no buffer antes de decidirmos o que fazer —
// tamanho pequeno o bastante (5MB) pra isso ser tranquilo.
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: TAMANHO_MAXIMO_BYTES },
    }),
  )
  async enviar(@UploadedFile() arquivo: Express.Multer.File) {
    if (!arquivo) throw new BadRequestException('Nenhum arquivo enviado');

    // Detecta o tipo PELO CONTEÚDO real (assinatura/magic bytes) — nunca
    // pelo `arquivo.mimetype` (só um cabeçalho declarado pelo cliente) nem
    // pelo `arquivo.originalname` (nome de arquivo também escolhido pelo
    // cliente). Os dois são ignorados de propósito a partir daqui.
    const tipoDetectado = detectarTipoImagem(arquivo.buffer);
    if (!tipoDetectado) {
      throw new BadRequestException('Envie apenas imagens PNG, JPEG ou WEBP');
    }

    // Nome E extensão vêm só do que foi detectado no conteúdo — nunca do
    // nome original enviado pelo navegador (evita path traversal/
    // sobrescrita, mesmo cuidado de antes) E nunca fica sujeito ao cliente
    // escolher uma extensão perigosa (.html, .svg etc) pra um conteúdo que
    // passou pela checagem de conteúdo com outro tipo.
    const nomeUnico = `${randomUUID()}.${tipoDetectado.extensao}`;
    await writeFile(join(PASTA_UPLOADS, nomeUnico), arquivo.buffer);

    // O front usa essa URL direto num <img src="..."> — ver
    // app.useStaticAssets em main.ts, que serve tudo dentro de uploads/
    // sob o prefixo /uploads/.
    return { url: `/uploads/${nomeUnico}` };
  }
}
