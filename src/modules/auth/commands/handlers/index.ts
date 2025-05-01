import { LoginHandler } from './login.handler';
import { RegisterHandler } from './register.handler';
import { RefreshTokensHandler } from './refresh-tokens.handler';

export const CommandHandlers = [
  LoginHandler,
  RegisterHandler,
  RefreshTokensHandler,
];
