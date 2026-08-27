// Detecta o tipo REAL de um arquivo pelos primeiros bytes (assinatura/
// "magic bytes"), em vez de confiar no `mimetype` que o multer só copia do
// cabeçalho Content-Type declarado pelo cliente na requisição multipart —
// um valor que qualquer requisição forjada (curl, Postman, um upload
// programático) pode mentir livremente, sem nenhuma relação com o conteúdo
// de fato enviado. Auditoria de segurança (ver PR) provou isso na prática:
// um arquivo HTML com <script>, declarado como "image/png", passava pelo
// fileFilter antigo (que só olhava o mimetype) e era servido de volta como
// text/html de verdade — XSS armazenado via upload.
//
// Só cobre os 3 formatos aceitos pelo sistema (PNG/JPEG/WEBP) — não é um
// detector de tipo de arquivo genérico, é a validação mínima suficiente
// pra esse conjunto fechado.
export interface TipoImagemDetectado {
  mimetype: string;
  extensao: string;
}

const ASSINATURA_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const ASSINATURAS: Array<
  TipoImagemDetectado & { combina: (buffer: Buffer) => boolean }
> = [
  {
    mimetype: 'image/png',
    extensao: 'png',
    combina: (buffer) =>
      buffer.length >= ASSINATURA_PNG.length &&
      buffer.subarray(0, ASSINATURA_PNG.length).equals(ASSINATURA_PNG),
  },
  {
    // JPEG sempre começa com o marcador SOI (Start Of Image) 0xFFD8,
    // seguido de outro marcador que começa com 0xFF — os 3 bytes
    // FF D8 FF cobrem todas as variações reais (JFIF, Exif etc).
    mimetype: 'image/jpeg',
    extensao: 'jpg',
    combina: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    // WEBP é um contêiner RIFF: 4 bytes "RIFF", 4 bytes de tamanho
    // (ignorados aqui), 4 bytes "WEBP".
    mimetype: 'image/webp',
    extensao: 'webp',
    combina: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

export function detectarTipoImagem(buffer: Buffer): TipoImagemDetectado | null {
  const encontrada = ASSINATURAS.find((assinatura) =>
    assinatura.combina(buffer),
  );
  if (!encontrada) return null;
  return { mimetype: encontrada.mimetype, extensao: encontrada.extensao };
}
