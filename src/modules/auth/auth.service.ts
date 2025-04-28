import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { EncodeDataArgs, TokenResponse } from './auth.types';
import { TokenType } from '@common/globals.constants';
import { ConfigService } from '@nestjs/config';
import { TokenResponseDto } from './dto/token-response.dto';
import { UserLoginResponseDto } from './dto/user-login-response.dto';
import { UserMapper } from './mapper/user.mapper';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private userMapper: UserMapper,
  ) {}

  async login(loginDto: LoginDto): Promise<UserLoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.usersService.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return {
      user: this.userMapper.toResponse({ ...user }),
      ...(await this.getTokens({
        user: user,
      })),
    };
  }

  async register(registerDto: RegisterDto): Promise<UserLoginResponseDto> {
    const existingUser = await this.usersService.findOne({ where: { email: registerDto.email } });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const user = await this.usersService.create(registerDto);

    return {
      user: this.userMapper.toResponse({ ...user }),
      ...(await this.getTokens({
        user: user,
      })),
    };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      return null;
    }

    return user;
  }

  async validateUserRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    return true;
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
    return await this.getTokens(data);
  }
}
