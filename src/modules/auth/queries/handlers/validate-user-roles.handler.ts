import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ValidateUserRolesQuery } from '../validate-user-roles.query';

@QueryHandler(ValidateUserRolesQuery)
export class ValidateUserRolesHandler implements IQueryHandler<ValidateUserRolesQuery> {
  constructor() {}

  async execute(query: ValidateUserRolesQuery): Promise<boolean> {
    // In this implementation, we're always returning true
    // In a real application, you would check if the user has the required roles
    return true;
  }
}
