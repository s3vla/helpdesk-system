import { ValueTransformer } from 'typeorm';
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

// Criptografia de campo (AES-256-GCM) pra Tarefa.titulo, Tarefa.descricao
// e Anotacao.conteudo — o objetivo é só um: se alguém abrir o banco
// direto (pgAdmin, DBeaver, um dump), esses três campos não aparecem em
// texto puro. Não protege contra nada que já tenha acesso pela API
// (RBAC/IDOR continuam sendo a defesa real ali) — é defesa em profundidade
// especificamente contra acesso direto ao banco.
//
// Formato armazenado (tudo dentro da mesma coluna text/varchar que já
// existia — nenhuma migration de schema foi necessária):
//   base64( IV[12 bytes] || AUTH_TAG[16 bytes] || CIPHERTEXT[N bytes] )

const ALGORITMO = 'aes-256-gcm';
const TAMANHO_IV = 12; // recomendado pro GCM
const TAMANHO_TAG = 16;

// A chave NUNCA é o JWT_SECRET bruto — HKDF deriva uma chave própria pra
// esse uso específico (`info` abaixo), criptograficamente independente da
// chave usada pra assinar/verificar token JWT (AuthModule/JwtStrategy),
// mesmo as duas vindo da mesma variável de ambiente na origem.
const INFO_HKDF = 'novatech-helpdesk:campo-criptografado-v1';

// Lazy + memoizada de propósito: este arquivo é importado (e o
// @Column({ transformer }) avaliado) no momento em que as entidades são
// carregadas — isso acontece ANTES do Nest instanciar o ConfigModule e
// carregar o .env (a ordem real: main.ts importa AppModule, que importa
// as entidades, tudo isso resolve antes de bootstrap() começar a rodar;
// o .env só é lido quando o ConfigService é instanciado, dentro do
// bootstrap). Se a chave fosse derivada aqui fora, na definição do
// transformer, process.env.JWT_SECRET ainda poderia estar undefined.
// Derivando só na primeira chamada real de to()/from() (que só acontece
// depois que a API já terminou de subir e já está atendendo requisição),
// a variável já está garantidamente carregada.
let chaveCache: Buffer | null = null;
function obterChave(): Buffer {
  if (chaveCache) return chaveCache;
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error(
      'JWT_SECRET não está definido — necessário tanto pra assinar token quanto agora pra criptografar Tarefa/Anotação (ver README).',
    );
  }
  chaveCache = Buffer.from(
    hkdfSync(
      'sha256',
      Buffer.from(segredo, 'utf8'),
      Buffer.alloc(0),
      INFO_HKDF,
      32,
    ),
  );
  return chaveCache;
}

export function criptografar(valorClaro: string): string {
  const chave = obterChave();
  const iv = randomBytes(TAMANHO_IV);
  const cipher = createCipheriv(ALGORITMO, chave, iv);
  const ciphertext = Buffer.concat([
    cipher.update(valorClaro, 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    'base64',
  );
}

export function descriptografar(valorArmazenado: string): string {
  // TUDO dentro do try — não só decipher.final(). setAuthTag() e até o
  // slicing implícito acima podem lançar sozinhos (ex: valor armazenado
  // curto demais pra conter um IV+tag válidos, caso clássico de dado
  // ainda em texto puro de antes da migration) ANTES de qualquer chamada
  // de descriptografia de verdade acontecer — sem envolver tudo, esses
  // casos vazavam a mensagem de erro interna do Node (ex: "Invalid
  // authentication tag length") em vez da mensagem própria abaixo.
  try {
    const chave = obterChave();
    const bruto = Buffer.from(valorArmazenado, 'base64');
    const iv = bruto.subarray(0, TAMANHO_IV);
    const authTag = bruto.subarray(TAMANHO_IV, TAMANHO_IV + TAMANHO_TAG);
    const ciphertext = bruto.subarray(TAMANHO_IV + TAMANHO_TAG);
    // authTagLength explícito — sem isso, o Node avisa (deprecation) toda
    // vez que o valor armazenado é curto demais pra conter uma tag de 16
    // bytes de verdade (exatamente o caso de dado legado em texto puro,
    // que o script de migração passa por aqui de propósito pra testar
    // "já está criptografado?").
    const decipher = createDecipheriv(ALGORITMO, chave, iv, {
      authTagLength: TAMANHO_TAG,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    // GCM falha aqui se a chave mudou desde que o dado foi salvo, o valor
    // foi corrompido/adulterado, ou (mais comum na prática) o valor nem
    // é dado criptografado — nunca "decripta errado" silenciosamente,
    // sempre lança. Isso vira um 500 tratado pelo filtro de exceção
    // padrão do Nest (erro do request específico, não derruba o
    // processo) — mas o texto da mensagem original nunca deveria vazar
    // pra resposta HTTP, então relançamos com uma mensagem própria, sem
    // detalhe interno.
    throw new Error(
      'Falha ao descriptografar campo — JWT_SECRET pode ter mudado desde que este dado foi salvo (ver README).',
    );
  }
}

export const campoCriptografado: ValueTransformer = {
  to(valorClaro: string | null | undefined): string | null | undefined {
    // null/undefined passam direto — nunca "criptografa ausência de
    // valor" (importante pro Tarefa.descricao, que é nullable).
    if (valorClaro == null) return valorClaro;
    return criptografar(valorClaro);
  },
  from(valorArmazenado: string | null | undefined): string | null | undefined {
    if (valorArmazenado == null) return valorArmazenado;
    return descriptografar(valorArmazenado);
  },
};
