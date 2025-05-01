import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EncodeDataArgs, TokenResponse } from './auth.types';
import { TokenType } from '@common/globals.constants';
import { ConfigService } from '@nestjs/config';
import { TokenResponseDto } from './dto/token-response.dto';
import { UserLoginResponseDto } from './dto/user-login-response.dto';
import { LoginCommand } from './commands/login.command';
import { RegisterCommand } from './commands/register.command';
import { RefreshTokensCommand } from './commands/refresh-tokens.command';
import { ValidateUserQuery } from './queries/validate-user.query';
import { ValidateUserRolesQuery } from './queries/validate-user-roles.query';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async login(loginDto: LoginDto): Promise<UserLoginResponseDto> {
    return this.commandBus.execute(new LoginCommand(loginDto));
  }

  async register(registerDto: RegisterDto): Promise<UserLoginResponseDto> {
    return this.commandBus.execute(new RegisterCommand(registerDto));
  }

  async validateUser(userId: string): Promise<any> {
    return this.queryBus.execute(new ValidateUserQuery(userId));
  }

  async validateUserRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    return this.queryBus.execute(new ValidateUserRolesQuery(userId, requiredRoles));
  }

  public getAccessToken(data: EncodeDataArgs): TokenResponse {
    const tokenType = data.tokenType || TokenType.Access;
    const secret = this.configService.get('jwt.secret');

    const expiresInKey =
      tokenType === TokenType.Verify ? 'jwt.jwtVerifyExpiresIn' : 'jwt.expiresIn';

    const expiresIn = this.configService.get(expiresInKey);

    // Validate that both secret and expiresIn are defined
    if (!secret || !expiresIn) {
      throw new Error('Invalid JWT configuration: Secret or expiresIn is missing');
    }

    // Sign the JWT token
    const accessToken = this.jwtService.sign(
      {
        sub: data.user.id,
        email: data.user.email,
        tokenType,
        role: data.user.role,
      },
      {
        secret: secret,
        expiresIn: expiresIn,
      },
    );

    const decodedToken: any = this.jwtService.decode(accessToken);
    if (!decodedToken || !decodedToken.exp) {
      throw new Error('Failed to decode JWT or missing expiration');
    }

    return { token: accessToken, tokenExpiresIn: decodedToken.exp };
  }

  getRefreshToken(data: EncodeDataArgs): TokenResponse {
    const refreshToken = this.jwtService.sign(
      {
        sub: data.user.id,
        email: data.user.email,
        tokenType: data.tokenType || TokenType.Refresh,
        role: data.user.role,
      },
      {
        secret: this.configService.get<string>('jwt.jwtRefreshSecret'),
        expiresIn: this.configService.get<string>('jwt.jwtRefreshExpiresIn'),
      },
    );

    const decodedToken = this.jwtService.decode(refreshToken);

    return { token: refreshToken, tokenExpiresIn: decodedToken.exp };
  }

  async getTokens(data: EncodeDataArgs): Promise<TokenResponseDto> {
    const accessToken = this.getAccessToken(data);
    const refreshToken = this.getRefreshToken(data);

    return {
      accessToken: accessToken.token,
      accessTokenExpiresIn: accessToken.tokenExpiresIn,
      refreshToken: refreshToken.token,
      refreshTokenExpiresIn: refreshToken.tokenExpiresIn,
    };
  }

  async refreshTokens(data: EncodeDataArgs): Promise<TokenResponseDto> {
    return this.commandBus.execute(new RefreshTokensCommand(data));
  }
}
