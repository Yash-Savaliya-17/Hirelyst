import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy as PassportJwtStrategy} from 'passport-jwt';
import {PrismaService} from "../prisma/prisma.service";
import {Request} from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(PassportJwtStrategy, 'jwt') {
  constructor(
      config: ConfigService,
      private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromHeader('authorization'),
        (request: Request) => {
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['access_token']; // assuming your JWT cookie is named 'jwt'
          }
          return token;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  validate(payload: any) {
    return this.prisma.user.findUnique({
      where: {
        sys_id: payload.userId,
      },
    });
  }
}
