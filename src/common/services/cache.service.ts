import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly redis: Redis;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      password: '',
    });
  }

  // Set value in cache with TTL (Time to Live)
  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      // Serialize the value to store complex objects
      const serializedValue = JSON.stringify(value);

      // Set the cache value with TTL
      await this.redis.setex(key, ttlSeconds, serializedValue);
    } catch (error) {
      console.error(`Error setting cache for key: ${key}`, error);
      throw new Error('Cache set operation failed');
    }
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key);

      if (!result) {
        return null;
      }

      // Deserialize the value back to its original type
      return JSON.parse(result) as T;
    } catch (error) {
      console.error(`Error getting cache for key: ${key}`, error);
      return null;
    }
  }

  // Delete a specific cache key
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0; // Returns number of keys deleted
    } catch (error) {
      console.error(`Error deleting cache for key: ${key}`, error);
      return false;
    }
  }

  // Clear all keys in the cache
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb(); // Removes all keys in the DB
    } catch (error) {
      console.error('Error clearing cache', error);
    }
  }

  // Check if a key exists in cache
  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists > 0;
    } catch (error) {
      console.error(`Error checking cache for key: ${key}`, error);
      return false;
    }
  }
}
