import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    this.client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    });

    this.client.connect().catch((err: Error) => {
      console.warn('Redis connection failed:', err.message);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async setUserSession(userId: string, token: string, ttlSeconds = 86400): Promise<void> {
    try {
      const key = `session:${userId}`;
      await this.client.set(key, token, 'EX', ttlSeconds);
    } catch (err: any) {
      console.warn('Redis setUserSession warning:', err?.message || err);
    }
  }

  async getUserSession(userId: string): Promise<string | null> {
    try {
      const key = `session:${userId}`;
      return await this.client.get(key);
    } catch (err: any) {
      console.warn('Redis getUserSession warning:', err?.message || err);
      return null;
    }
  }

  async removeUserSession(userId: string): Promise<number> {
    try {
      const key = `session:${userId}`;
      return await this.client.del(key);
    } catch (err: any) {
      console.warn('Redis removeUserSession warning:', err?.message || err);
      return 0;
    }
  }
}
