import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterCommand } from '../register.command';
import { UsersService } from '../../../users/users.service';
import { UserMapper } from '../../mapper/user.mapper';
import { UserLoginResponseDto } from '../../dto/user-login-response.dto';
import { TokenType } from '@common/globals.constants';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userMapper: UserMapper,
  ) {}

  async execute(command: RegisterCommand): Promise<UserLoginResponseDto> {
    const { registerDto } = command;
    
    const existingUser = await this.usersService.findOne({ where: { email: registerDto.email } });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const user = await this.usersService.create(registerDto);

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
