import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private inMemoryFallback = new Map<string, { value: string; expiresAt: number }>();

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    try {
      this.client = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 2) return null;
          return Math.min(times * 150, 1000);
        },
      });

      this.client.on('error', () => {
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully.');
      });

      this.client.connect().catch(() => {
        this.isConnected = false;
        this.logger.log('Redis server not detected at localhost:6379. Using in-memory fallback storage.');
      });
    } catch {
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit().catch(() => {});
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async setUserSession(userId: string, token: string, ttlSeconds = 86400): Promise<void> {
    const key = `session:${userId}`;
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, token, 'EX', ttlSeconds);
        return;
      } catch {}
    }
    // In-memory fallback
    this.inMemoryFallback.set(key, {
      value: token,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getUserSession(userId: string): Promise<string | null> {
    const key = `session:${userId}`;
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {}
    }
    // In-memory fallback
    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  async removeUserSession(userId: string): Promise<number> {
    const key = `session:${userId}`;
    if (this.isConnected && this.client) {
      try {
        return await this.client.del(key);
      } catch {}
    }
    // In-memory fallback
    return this.inMemoryFallback.delete(key) ? 1 : 0;
  }
}

