import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefreshTokenGuard } from '@common/guards/refresh-token.guard';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('refresh-token')
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: 'This endpoint is used to obtain a refresh token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: TokenResponseDto,
  })
  async refreshToken(@Request() req: any): Promise<TokenResponseDto> {
    const { user } = req;
    return await this.authService.refreshTokens({ user: user });
  }
}
