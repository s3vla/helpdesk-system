import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    // registerAsync (em vez de register) porque o segredo/expiração vêm do
    // .env via ConfigService, que só fica pronto depois que o ConfigModule
    // termina de carregar — o Nest espera essa Promise antes de montar o
    // JwtModule de verdade.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        // `as any` só no valor: a lib tipa `expiresIn` com um literal
        // (`StringValue`, ex: "8h") em vez de `string` genérico — como esse
        // valor vem do .env (sempre `string` em tempo de compilação), o
        // TypeScript não consegue provar que bate com o formato esperado,
        // mesmo sabendo que em runtime o valor é válido.
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '8h') as any,
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
