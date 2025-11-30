import {AuthGuard} from '@nestjs/passport';
import {JsonWebTokenError} from '@nestjs/jwt';
import {UnauthorizedException} from '@nestjs/common';

export class JwtGuard extends AuthGuard('jwt') {
    constructor() {
        super();
    }

    handleRequest(err: any, user: any, info: any, context: any, status: any) {
        if (info instanceof JsonWebTokenError) {
            throw new UnauthorizedException('Invalid token');
        }
        return super.handleRequest(err, user, info, context, status);
    }
}
