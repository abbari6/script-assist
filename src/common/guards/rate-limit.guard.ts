import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { CacheService } from '@common/services/cache.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService, // Inject CacheService directly
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @RateLimit() set, allow
    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);
    const key = `${identifier}:${context.getHandler().name}`;

    const now = Date.now();
    const existing = await this.cacheService.get<{ count: number; expiresAt: number }>(key);

    if (existing) {
      if (now > existing.expiresAt) {
        // Reset window
        await this.cacheService.set(
          key,
          { count: 1, expiresAt: now + rateLimitOptions.windowMs },
          rateLimitOptions.windowMs / 1000,
        );
      } else {
        if (existing.count >= rateLimitOptions.limit) {
          throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
        }
        existing.count++;
        await this.cacheService.set(key, existing, rateLimitOptions.windowMs / 1000);
      }
    } else {
      // First time
      await this.cacheService.set(
        key,
        { count: 1, expiresAt: now + rateLimitOptions.windowMs },
        rateLimitOptions.windowMs / 1000,
      );
    }

    return true;
  }

  private getIdentifier(request: any): string {
    // Get user ID if available, fallback to IP (minimal leak)
    return request.user?.id || request.ip;
  }
}
