import { UsersService } from '@modules/users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../auth.types';
import { TokenType } from '@common/globals.constants';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('jwt.jwtRefreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const token = req.get('Authorization').replace('bearer', '').trim();

    if (payload.tokenType !== TokenType.Refresh) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException();
    }

    return { ...user, token };
  }
}
