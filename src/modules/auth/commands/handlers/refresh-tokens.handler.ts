import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokensCommand } from '../refresh-tokens.command';
import { TokenResponseDto } from '../../dto/token-response.dto';
import { TokenType } from '@common/globals.constants';

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensHandler implements ICommandHandler<RefreshTokensCommand> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: RefreshTokensCommand): Promise<TokenResponseDto> {
    const { data } = command;
    const { user } = data;

    // Generate access token
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        tokenType: TokenType.Access,
        role: user.role,
      },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      },
    );
    const decodedAccessToken: any = this.jwtService.decode(accessToken);

    // Generate refresh token
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        tokenType: TokenType.Refresh,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('jwt.jwtRefreshSecret'),
        expiresIn: this.configService.get<string>('jwt.jwtRefreshExpiresIn'),
      },
    );
    const decodedRefreshToken: any = this.jwtService.decode(refreshToken);

    return {
      accessToken,
      accessTokenExpiresIn: decodedAccessToken.exp,
      refreshToken,
      refreshTokenExpiresIn: decodedRefreshToken.exp,
    };
  }
}
