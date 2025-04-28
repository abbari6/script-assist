import { ApiProperty } from '@nestjs/swagger';
import { TokenResponseDto } from './token-response.dto';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';

export class UserLoginResponseDto extends TokenResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
