import { EncodeDataArgs } from '../auth.types';

export class RefreshTokensCommand {
  constructor(public readonly data: EncodeDataArgs) {}
}
