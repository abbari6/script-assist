import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  accessTokenExpiresIn: number;

  @ApiProperty()
  refreshTokenExpiresIn: number;
}
