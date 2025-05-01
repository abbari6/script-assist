import { CreateUserHandler } from './create-user.handler';
import { UpdateUserHandler } from './update-user.handler';
import { RemoveUserHandler } from './remove-user.handler';

export const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  RemoveUserHandler,
];
