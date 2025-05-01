import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginCommand } from '../login.command';
import { UsersService } from '../../../users/users.service';
import { UserMapper } from '../../mapper/user.mapper';
import { UserLoginResponseDto } from '../../dto/user-login-response.dto';
import { TokenType } from '@common/globals.constants';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userMapper: UserMapper,
  ) {}

  async execute(command: LoginCommand): Promise<UserLoginResponseDto> {
    const { email, password } = command.loginDto;

    const user = await this.usersService.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

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
      user: this.userMapper.toResponse({ ...user }),
      accessToken,
      accessTokenExpiresIn: decodedAccessToken.exp,
      refreshToken,
      refreshTokenExpiresIn: decodedRefreshToken.exp,
    };
  }
}
