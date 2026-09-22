import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Chamado } from '../chamados/entities/chamado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Aviso } from '../avisos/entities/aviso.entity';
import { PrioridadeChamado } from '../common/enums/prioridade-chamado.enum';
import { TipoAviso } from '../common/enums/tipo-aviso.enum';
import { EMAILS_TECNICO_AUTORIZADOS } from '../config/emails-autorizados';

const LABEL_PRIORIDADE: Record<PrioridadeChamado, string> = {
  [PrioridadeChamado.BAIXA]: 'Baixa',
  [PrioridadeChamado.MEDIA]: 'Média',
  [PrioridadeChamado.ALTA]: 'Alta',
};

const LABEL_TIPO_AVISO: Record<TipoAviso, string> = {
  [TipoAviso.INFORMATIVO]: 'Informativo',
  [TipoAviso.ALERTA]: 'Alerta',
  [TipoAviso.MANUTENCAO]: 'Manutenção',
};

// Cor de marca (mesma usada em estilos.btnPrimary no frontend, theme.js) —
// duplicada aqui pelo mesmo motivo dos LABEL_*: o backend não importa nada
// do frontend, e um e-mail precisa de CSS inline próprio de qualquer forma
// (a maioria dos clientes de e-mail ignora <style> externo).
const COR_MARCA = '#007851';
const COR_FUNDO_BLOCO = '#f4f7f5';
const COR_TEXTO = '#1f2a26';
const COR_TEXTO_FRACO = '#6b7a75';

// Mesma conta de frontend/src/utils/numeroChamado.js — o "número do
// chamado" mostrado pra usuário nunca é gravado no banco, é sempre
// id + 1000 na hora de exibir.
function numeroChamado(id: number): string {
  return `#${id + 1000}`;
}

// Notificações por e-mail de chamados e avisos, via SMTP (nodemailer) —
// pensado pra NUNCA travar a ação principal (abrir chamado, comentar,
// mudar status, publicar aviso) se o envio falhar: cada método público já
// embrulha o próprio envio em try/catch e só loga o erro (nunca propaga),
// então quem chama não precisa (e não deve) colocar seu próprio try/catch
// em volta disso.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly remetente: string;
  private readonly urlBase: string;
  private readonly envioDesabilitado: boolean;

  constructor(private readonly configService: ConfigService) {
    this.remetente = this.configService.get<string>('EMAIL_REMETENTE') ?? '';
    this.urlBase = (
      this.configService.get<string>('APP_URL') ?? 'http://localhost:5173'
    ).replace(/\/$/, '');
    // Trava de segurança pra testes automatizados (Playwright, scripts de
    // validação): as credenciais SMTP configuradas são de produção de
    // verdade, então qualquer chamado/comentário/aviso criado durante um
    // teste dispararia e-mail real pra suporte@/ti@empresa-exemplo.com
    // e colaboradores cadastrados se isso não existisse. Nunca ligar isso
    // no .env de desenvolvimento normal — só em ambientes de teste isolados
    // (ver scripts que copiam o .env real e adicionam esta variável).
    this.envioDesabilitado =
      this.configService.get<string>('DESABILITAR_ENVIO_EMAIL') === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT') ?? 587),
      // Porta 465 é SMTPS (TLS direto na conexão); qualquer outra (587, 25)
      // começa em texto plano e sobe pra TLS via STARTTLS — nodemailer
      // decide isso sozinho a partir de `secure`, não precisa configurar
      // STARTTLS manualmente.
      secure: Number(this.configService.get<string>('SMTP_PORT')) === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  // Envolve QUALQUER envio — cada chamada pública passa por aqui, então a
  // garantia de "nunca trava a ação principal" fica num único lugar, não
  // repetida em cada método. `error?.message`/`error?.code` de propósito
  // (nunca o objeto de erro inteiro nem o transporter): alguns erros de
  // SMTP ecoam de volta parte da negociação da conexão, e não vale o risco
  // de um dia isso incluir a senha — melhor logar só o essencial.
  private async enviarComSeguranca(
    opcoes: nodemailer.SendMailOptions,
  ): Promise<void> {
    if (this.envioDesabilitado) {
      this.logger.log(
        `[DESABILITAR_ENVIO_EMAIL] e-mail "${opcoes.subject}" seria enviado para ${this.descreverDestinatarios(opcoes.to)} — envio real pulado`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.remetente, ...opcoes });
      this.logger.log(
        `E-mail "${opcoes.subject}" enviado para ${this.descreverDestinatarios(opcoes.to)}`,
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      const codigo = this.extrairCodigoErro(erro);
      this.logger.error(
        `Falha ao enviar e-mail para ${this.descreverDestinatarios(opcoes.to)}: ${mensagem}${codigo ? ` (${codigo})` : ''}`,
      );
    }
  }

  // `to` do nodemailer aceita string | Address | Array<string | Address> —
  // sem isso, um `String(endereco)` cairia em "[object Object]" pro formato
  // Address ({ name, address }).
  private descreverDestinatarios(to: nodemailer.SendMailOptions['to']): string {
    if (!to) return 'destinatário desconhecido';
    const lista = Array.isArray(to) ? to : [to];
    return lista
      .map((destino) =>
        typeof destino === 'string' ? destino : destino.address,
      )
      .join(', ');
  }

  // Erros de SMTP costumam vir como Error com um `.code` extra (ex:
  // "EAUTH", "ECONNECTION") — `erro` chega como `unknown` no catch, então
  // isso evita acesso "inseguro" de propriedade sem checar o tipo antes.
  private extrairCodigoErro(erro: unknown): string | undefined {
    if (erro && typeof erro === 'object' && 'code' in erro) {
      const codigo = (erro as { code?: unknown }).code;
      return typeof codigo === 'string' ? codigo : undefined;
    }
    return undefined;
  }

  private linkDoChamado(chamadoId: number): string {
    return `${this.urlBase}/chamados/${chamadoId}`;
  }

  // Casca comum de TODO e-mail — fonte/cor base, largura de leitura
  // confortável, e a assinatura no rodapé. Centralizar aqui é o que garante
  // os 4 tipos de e-mail (chamado novo, atendimento iniciado, atualização/
  // comentário, aviso novo) parecerem a MESMA voz, em vez de cada método
  // inventar sua própria casca.
  private envelope(corpoHtml: string): string {
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color: ${COR_TEXTO}; font-size: 15px; line-height: 1.6; max-width: 560px; margin: 0 auto;">
        ${corpoHtml}
        <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8e5; color: ${COR_TEXTO_FRACO}; font-size: 13px;">
          Sistema de Chamados — Empresa Exemplo
        </p>
      </div>
    `;
  }

  // Bloco de dados estruturados (chamado, categoria, prioridade, nível,
  // solicitante) — uma tabela simples em vez de linhas soltas "rótulo:
  // valor", pra não parecer log técnico cru. `linhas` já vem pronto (rótulo,
  // valor) de quem chama, pra este helper não precisar saber quais campos
  // cada e-mail mostra.
  private blocoDados(linhas: [string, string][]): string {
    const celulas = linhas
      .map(
        ([rotulo, valor]) => `
          <tr>
            <td style="padding: 5px 0; color: ${COR_TEXTO_FRACO}; white-space: nowrap; vertical-align: top;">${rotulo}</td>
            <td style="padding: 5px 0 5px 14px; font-weight: 600;">${valor}</td>
          </tr>
        `,
      )
      .join('');
    return `
      <table role="presentation" style="width: 100%; background: ${COR_FUNDO_BLOCO}; border-radius: 10px; padding: 4px 16px; margin: 18px 0; border-collapse: collapse; font-size: 14px;">
        ${celulas}
      </table>
    `;
  }

  // Link estilizado como botão — mesma cor de marca dos botões primários do
  // frontend (theme.js), pra manter a mesma identidade visual.
  private botaoLink(href: string, texto: string): string {
    return `
      <p style="margin: 26px 0 6px;">
        <a href="${href}" style="display: inline-block; background: ${COR_MARCA}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px;">
          ${texto}
        </a>
      </p>
    `;
  }

  private dadosChamado(chamado: Chamado): [string, string][] {
    return [
      ['Chamado', `${numeroChamado(chamado.id)} — ${chamado.titulo}`],
      [
        'Categoria',
        `${chamado.categoria.nome} &nbsp;|&nbsp; Prioridade: ${LABEL_PRIORIDADE[chamado.prioridade]} &nbsp;|&nbsp; Nível: ${chamado.nivel}`,
      ],
      ['Solicitante', chamado.solicitante.nome ?? chamado.solicitante.email],
    ];
  }

  // Dispara quando um chamado novo é criado (POST /chamados e
  // POST /chamados/tecnico) — notifica os técnicos autorizados
  // (EMAILS_TECNICO_AUTORIZADOS é a mesma lista fechada usada pra login,
  // não uma cópia solta de suporte@/ti@).
  async enviarNotificacaoChamadoNovo(chamado: Chamado): Promise<void> {
    await this.enviarComSeguranca({
      to: EMAILS_TECNICO_AUTORIZADOS,
      subject: `Novo chamado ${numeroChamado(chamado.id)} — ${chamado.titulo}`,
      html: this.envelope(`
        <p>Olá! Um novo chamado acabou de ser aberto e está aguardando atendimento.</p>
        ${this.blocoDados(this.dadosChamado(chamado))}
        ${
          chamado.descricao
            ? `<p style="margin-bottom: 4px;"><strong>Descrição do problema:</strong></p>
               <p style="margin-top: 0;">${chamado.descricao.replace(/\n/g, '<br>')}</p>`
            : ''
        }
        ${this.botaoLink(this.linkDoChamado(chamado.id), 'Ver chamado no sistema')}
      `),
    });
  }

  // Dispara especificamente na transição PARADO -> ANDAMENTO (técnico
  // clicou "Iniciar Atendimento" — seja a primeira vez, seja retomando um
  // chamado que tinha voltado pra fila) — mensagem PRÓPRIA, mais calorosa
  // ("alguém já está cuidando disso"), separada da genérica de atualização
  // que seria fria demais pra esse momento específico. `chamado.tecnicoResponsavel`
  // precisa vir carregado (RELACOES_PADRAO já cobre isso — ver
  // ChamadosService.atualizarStatus, único chamador).
  async enviarNotificacaoAtendimentoIniciado(chamado: Chamado): Promise<void> {
    const nomeTecnico =
      chamado.tecnicoResponsavel?.nome ??
      chamado.tecnicoResponsavel?.email ??
      'Um de nossos técnicos';

    await this.enviarComSeguranca({
      to: chamado.solicitante.email,
      subject: `Seu chamado ${numeroChamado(chamado.id)} já está sendo atendido`,
      html: this.envelope(`
        <p>Olá! Boas notícias: <strong>${nomeTecnico}</strong> começou a atender o seu chamado "${chamado.titulo}".</p>
        <p>Você pode acompanhar o andamento ou adicionar mais informações a qualquer momento pelo sistema.</p>
        ${this.botaoLink(this.linkDoChamado(chamado.id), 'Ver chamado no sistema')}
      `),
    });
  }

  // Dispara quando um colaborador é adicionado como observador ("Cc") de
  // um chamado — mensagem PRÓPRIA, deliberadamente diferente da genérica
  // de atualização abaixo: explica O QUE aconteceu ("você foi adicionado
  // como observador") e o que isso significa daqui pra frente (vai
  // receber as próximas atualizações), não só "o chamado mudou". Sem
  // `autorId` pra excluir — quem adiciona é sempre técnico, nunca o
  // próprio observador, então não existe o caso "notificar a própria
  // ação". `chamado.solicitante` não precisa vir carregado aqui (só usa
  // id/título/categoria/status via dadosChamado, que já lida com isso).
  async enviarNotificacaoAdicionadoComoObservador(
    chamado: Chamado,
    colaborador: Usuario,
  ): Promise<void> {
    await this.enviarComSeguranca({
      to: colaborador.email,
      subject: `Você foi adicionado ao chamado ${numeroChamado(chamado.id)} — ${chamado.titulo}`,
      html: this.envelope(`
        <p>Olá! Você foi adicionado como observador no chamado "${chamado.titulo}".</p>
        <p>A partir de agora você vai receber por e-mail as próximas atualizações desse chamado (mudança de status, novos comentários), mesmo sem ser quem abriu.</p>
        ${this.blocoDados(this.dadosChamado(chamado))}
        ${this.botaoLink(this.linkDoChamado(chamado.id), 'Ver chamado no sistema')}
      `),
    });
  }

  // Dispara em mudança de status (exceto PARADO -> ANDAMENTO, que tem
  // e-mail próprio — ver acima) ou comentário não-interno — notifica o
  // solicitante, os observadores ("Cc") E o técnico responsável (se já
  // houver um atribuído), exceto quem foi o autor da própria ação
  // (`autorId`), pra ninguém receber e-mail avisando da própria ação — é
  // essa checagem que faz um comentário do TÉCNICO notificar só o lado
  // colaborador, e um comentário do COLABORADOR notificar o técnico (antes
  // desta mudança, comentário de colaborador não notificava ninguém do lado
  // técnico depois do e-mail de abertura — só corrigido agora). Sem técnico
  // atribuído ainda (chamado PARADO, nunca teve atendimento iniciado), não
  // há ninguém específico a adicionar aqui — o aviso desse estágio continua
  // sendo só o e-mail de "Novo chamado" (broadcast pros técnicos
  // autorizados, disparado uma vez na abertura).
  // `chamado.solicitante`, `chamado.tecnicoResponsavel` e
  // `chamado.observadores.usuario` precisam já vir carregados por quem
  // chama (RELACOES_PADRAO cobre ChamadosService.atualizarStatus;
  // ComentariosService.carregarChamadoPermitido foi ajustado pra também
  // carregar tecnicoResponsavel).
  //
  // `textoComentario`/`nomeAutorComentario`: só quando a notificação foi
  // disparada por um comentário não-interno (ComentariosService.criar) —
  // inclui o texto no corpo do e-mail com o nome de quem escreveu, pra quem
  // recebe já ver a resposta sem precisar abrir o sistema. `nomeAutorComentario`
  // não assume que quem comentou é sempre técnico (um observador também
  // pode comentar) — por isso usa o nome de verdade, não um rótulo fixo.
  // Ausentes = notificação por mudança de status, mantém só o cabeçalho
  // padrão (comportamento de antes desta mudança).
  //
  // `autorEhTecnico`: obrigatório (não opcional, de propósito) — quem chama
  // sempre sabe o tipo de quem agiu, e um default errado aqui esconderia
  // silenciosamente o fallback abaixo. Usado só pra decidir o fallback:
  // chamado sem tecnicoResponsavel (ainda PARADO, ninguém assumiu) E quem
  // comentou não é técnico — sem isso, um colaborador comentando de novo
  // nesse estado não notificava NINGUÉM do lado técnico (bug encontrado ao
  // validar a correção anterior desta mesma função). Cai pro mesmo
  // broadcast do e-mail de abertura (EMAILS_TECNICO_AUTORIZADOS), pra
  // sempre ter alguém a avisar, mesmo sem responsável definido ainda.
  // ChamadosService.atualizarStatus sempre passa `true` (só técnico chama
  // aquela rota, `@Roles(TipoUsuario.TECNICO)`), então nunca aciona esse
  // fallback — só ComentariosService.criar pode.
  async enviarNotificacaoAtualizacaoChamado(
    chamado: Chamado,
    autorId: number,
    autorEhTecnico: boolean,
    textoComentario?: string,
    nomeAutorComentario?: string,
  ): Promise<void> {
    const destinatarios = new Map<number, string>();
    if (chamado.solicitante.id !== autorId) {
      destinatarios.set(chamado.solicitante.id, chamado.solicitante.email);
    }
    for (const observador of chamado.observadores) {
      if (observador.usuario.id !== autorId) {
        destinatarios.set(observador.usuario.id, observador.usuario.email);
      }
    }
    if (chamado.tecnicoResponsavel && chamado.tecnicoResponsavel.id !== autorId) {
      destinatarios.set(
        chamado.tecnicoResponsavel.id,
        chamado.tecnicoResponsavel.email,
      );
    }

    const temComentario = !!textoComentario?.trim();
    const abertura = temComentario
      ? `<p>Olá! <strong>${nomeAutorComentario}</strong> respondeu no seu chamado "${chamado.titulo}":</p>
         <blockquote style="margin: 10px 0; padding: 10px 16px; border-left: 3px solid ${COR_MARCA}; background: ${COR_FUNDO_BLOCO}; border-radius: 0 8px 8px 0;">
           ${textoComentario!.replace(/\n/g, '<br>')}
         </blockquote>`
      : `<p>Olá! Seu chamado "${chamado.titulo}" teve uma atualização de status.</p>`;

    if (!chamado.tecnicoResponsavel && !autorEhTecnico) {
      await this.enviarComSeguranca({
        to: EMAILS_TECNICO_AUTORIZADOS,
        subject: `Chamado ${numeroChamado(chamado.id)} sem atendimento tem comentário novo — ${chamado.titulo}`,
        html: this.envelope(`
          <p>Olá! O chamado "${chamado.titulo}" ainda aguarda atendimento e recebeu um novo comentário${nomeAutorComentario ? ` de <strong>${nomeAutorComentario}</strong>` : ''}:</p>
          ${temComentario ? `<blockquote style="margin: 10px 0; padding: 10px 16px; border-left: 3px solid ${COR_MARCA}; background: ${COR_FUNDO_BLOCO}; border-radius: 0 8px 8px 0;">${textoComentario!.replace(/\n/g, '<br>')}</blockquote>` : ''}
          ${this.blocoDados(this.dadosChamado(chamado))}
          ${this.botaoLink(this.linkDoChamado(chamado.id), 'Ver chamado no sistema')}
        `),
      });
    }

    if (destinatarios.size === 0) return;

    await this.enviarComSeguranca({
      to: [...destinatarios.values()],
      subject: `Atualização no chamado ${numeroChamado(chamado.id)} — ${chamado.titulo}`,
      html: this.envelope(`
        ${abertura}
        ${this.blocoDados(this.dadosChamado(chamado))}
        ${this.botaoLink(this.linkDoChamado(chamado.id), 'Ver chamado no sistema')}
      `),
    });
  }

  // Dispara quando um aviso novo é publicado (POST /avisos) — notifica
  // TODOS os colaboradores ativos, não só os técnicos. `destinatarios` já
  // vem pronto de quem chama (AvisosService, que tem o UsuarioRepository
  // pra montar essa lista) — EmailService não faz consulta própria ao
  // banco, só formata e envia, mesmo papel que já tem nos outros métodos.
  async enviarNotificacaoAvisoNovo(
    aviso: Aviso,
    destinatarios: string[],
  ): Promise<void> {
    if (destinatarios.length === 0) return;

    // ALERTA leva "[URGENTE]" no assunto — os outros dois tipos (INFORMATIVO,
    // MANUTENCAO) não precisam desse destaque adicional.
    const prefixoAssunto = aviso.tipo === TipoAviso.ALERTA ? '[URGENTE] ' : '';

    await this.enviarComSeguranca({
      to: destinatarios,
      subject: `${prefixoAssunto}Novo aviso: ${aviso.titulo}`,
      html: this.envelope(`
        <p>Olá! Um novo aviso (${LABEL_TIPO_AVISO[aviso.tipo]}) acabou de ser publicado no Mural.</p>
        <p style="margin-bottom: 4px;"><strong>${aviso.titulo}</strong></p>
        <p style="margin-top: 0;">${aviso.mensagem.replace(/\n/g, '<br>')}</p>
        ${this.botaoLink(this.urlBase, 'Ver no Mural de Avisos')}
      `),
    });
  }
}
