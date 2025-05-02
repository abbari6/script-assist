import { CacheService } from '@common/services/cache.service';
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
