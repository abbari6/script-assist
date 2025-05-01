import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ValidateUserQuery } from '../validate-user.query';
import { UsersService } from '../../../users/users.service';

@QueryHandler(ValidateUserQuery)
export class ValidateUserHandler implements IQueryHandler<ValidateUserQuery> {
  constructor(private readonly usersService: UsersService) {}

  async execute(query: ValidateUserQuery): Promise<any> {
    const { userId } = query;
    
    const user = await this.usersService.findOneById(userId);
    
    if (!user) {
      return null;
    }
    
    return user;
  }
}
