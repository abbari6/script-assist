import { TokenType } from '@common/globals.constants';
import { User } from '@modules/users/entities/user.entity';

export type JwtPayload = {
  sub: string;
  email: string;
  tokenType?: TokenType;
  id: string;
};

export type TokenResponse = {
  token: string;
  tokenExpiresIn: number;
};

export type AuthPayload = {
  userId?: string;
  userType: string;
  error: boolean;
};

export type EncodeDataArgs = {
  user: User;
  tokenType?: TokenType;
};
