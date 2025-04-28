import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { User } from '@modules/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { instanceToPlain, plainToClass } from 'class-transformer';

@Injectable()
export class UserMapper {
  toPersistence(userDto: any): User {
    const data = instanceToPlain(userDto);
    const user = plainToClass(User, data);
    return user;
  }

  toResponse(data: any): UserResponseDto {
    const d = instanceToPlain(data);
    const response = plainToClass(UserResponseDto, d, { excludeExtraneousValues: true });
    return response;
  }
}
