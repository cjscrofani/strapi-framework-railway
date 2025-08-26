/**
 * Cache Manager Service
 * Redis-based caching layer for Railway deployment
 */

import Redis, { Redis as RedisClient, RedisOptions } from 'ioredis';
import railwayConfig from '../config/railway';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  totalKeys: number;
  usedMemory: string;
  connectedClients: number;
  uptime: number;
}

export interface CacheKey {
  key: string;
  prefix: string;
  fullKey: string;
  ttl: number;
  size: number;
  type: string;
  createdAt: Date;
  expiresAt?: Date;
}

class CacheManager {
  private redis: RedisClient;
  private config: ReturnType<typeof railwayConfig.getConfig>;
  private defaultTtl: number = 3600; // 1 hour
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  } = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  constructor() {
    this.config = railwayConfig.getConfig();
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisConfig = this.config.redis;
    
    if (!redisConfig) {
      console.warn('Redis not configured, using in-memory fallback');
      return;
    }

    const options: RedisOptions = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      connectTimeout: redisConfig.connectTimeout,
      lazyConnect: redisConfig.lazyConnect,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      retryDelayOnFailover: redisConfig.retryDelayOnFailover,
      enableReadyCheck: true,
      maxLoadingTimeout: 5000,
    };

    this.redis = new Redis(options);

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      console.log('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  }

  // Basic Cache Operations
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      if (!this.redis) {
        return null;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const value = await this.redis.get(fullKey);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      if (options.serialize !== false) {
        try {
          return JSON.parse(value);
        } catch (error) {
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTtl;
      
      let serializedValue: string;
      
      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      // Compress if requested and value is large
      if (options.compress && serializedValue.length > 1024) {
        const zlib = require('zlib');
        serializedValue = zlib.gzipSync(serializedValue).toString('base64');
        // Add compression marker
        serializedValue = `__compressed__:${serializedValue}`;
      }

      const result = await this.redis.setex(fullKey, ttl, serializedValue);
      
      if (result === 'OK') {
        this.stats.sets++;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redis.del(fullKey);
      
      if (result > 0) {
        this.stats.deletes++;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redis.exists(fullKey);
      
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redis.expire(fullKey, ttl);
      
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  // Advanced Operations
  async getMultiple<T = any>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    try {
      if (!this.redis || keys.length === 0) {
        return keys.map(() => null);
      }

      const fullKeys = keys.map(key => this.buildKey(key, options.prefix));
      const values = await this.redis.mget(...fullKeys);

      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;

        if (options.serialize !== false) {
          try {
            return JSON.parse(value);
          } catch (error) {
            return value as T;
          }
        }

        return value as T;
      });
    } catch (error) {
      console.error('Cache getMultiple error:', error);
      return keys.map(() => null);
    }
  }

  async setMultiple<T = any>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.redis || keyValuePairs.length === 0) {
        return false;
      }

      const pipeline = this.redis.pipeline();

      for (const { key, value, ttl } of keyValuePairs) {
        const fullKey = this.buildKey(key, options.prefix);
        const expiry = ttl || options.ttl || this.defaultTtl;
        
        let serializedValue: string;
        
        if (options.serialize !== false) {
          serializedValue = JSON.stringify(value);
        } else {
          serializedValue = value as string;
        }

        pipeline.setex(fullKey, expiry, serializedValue);
      }

      const results = await pipeline.exec();
      
      if (results && results.every(([error, result]) => error === null && result === 'OK')) {
        this.stats.sets += keyValuePairs.length;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Cache setMultiple error:', error);
      return false;
    }
  }

  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    try {
      if (!this.redis) {
        return 0;
      }

      const fullPattern = this.buildKey(pattern, options.prefix);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.stats.deletes += result;

      return result;
    } catch (error) {
      console.error('Cache deletePattern error:', error);
      return 0;
    }
  }

  // Hash Operations
  async hget<T = any>(key: string, field: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      if (!this.redis) {
        return null;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const value = await this.redis.hget(fullKey, field);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      if (options.serialize !== false) {
        try {
          return JSON.parse(value);
        } catch (error) {
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  }

  async hset<T = any>(key: string, field: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      const fullKey = this.buildKey(key, options.prefix);
      
      let serializedValue: string;
      
      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      const result = await this.redis.hset(fullKey, field, serializedValue);
      
      // Set TTL if specified
      if (options.ttl) {
        await this.redis.expire(fullKey, options.ttl);
      }

      this.stats.sets++;
      return result >= 0;
    } catch (error) {
      console.error('Cache hset error:', error);
      return false;
    }
  }

  async hgetall<T = any>(key: string, options: CacheOptions = {}): Promise<Record<string, T> | null> {
    try {
      if (!this.redis) {
        return null;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const hash = await this.redis.hgetall(fullKey);

      if (Object.keys(hash).length === 0) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      if (options.serialize !== false) {
        const result: Record<string, T> = {};
        
        for (const [field, value] of Object.entries(hash)) {
          try {
            result[field] = JSON.parse(value);
          } catch (error) {
            result[field] = value as T;
          }
        }

        return result;
      }

      return hash as Record<string, T>;
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return null;
    }
  }

  async hdel(key: string, fields: string | string[], options: CacheOptions = {}): Promise<number> {
    try {
      if (!this.redis) {
        return 0;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const fieldsArray = Array.isArray(fields) ? fields : [fields];
      
      const result = await this.redis.hdel(fullKey, ...fieldsArray);
      this.stats.deletes += result;

      return result;
    } catch (error) {
      console.error('Cache hdel error:', error);
      return 0;
    }
  }

  // List Operations
  async lpush<T = any>(key: string, values: T | T[], options: CacheOptions = {}): Promise<number> {
    try {
      if (!this.redis) {
        return 0;
      }

      const fullKey = this.buildKey(key, options.prefix);
      const valueArray = Array.isArray(values) ? values : [values];
      
      const serializedValues = valueArray.map(value => {
        if (options.serialize !== false) {
          return JSON.stringify(value);
        }
        return value as string;
      });

      const result = await this.redis.lpush(fullKey, ...serializedValues);
      
      // Set TTL if specified
      if (options.ttl) {
        await this.redis.expire(fullKey, options.ttl);
      }

      return result;
    } catch (error) {
      console.error('Cache lpush error:', error);
      return 0;
    }
  }

  async lrange<T = any>(key: string, start: number, stop: number, options: CacheOptions = {}): Promise<T[]> {
    try {
      if (!this.redis) {
        return [];
      }

      const fullKey = this.buildKey(key, options.prefix);
      const values = await this.redis.lrange(fullKey, start, stop);

      if (options.serialize !== false) {
        return values.map(value => {
          try {
            return JSON.parse(value);
          } catch (error) {
            return value as T;
          }
        });
      }

      return values as T[];
    } catch (error) {
      console.error('Cache lrange error:', error);
      return [];
    }
  }

  // Caching Patterns
  async remember<T = any>(key: string, factory: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    try {
      // Try to get from cache first
      let value = await this.get<T>(key, options);
      
      if (value !== null) {
        return value;
      }

      // Not in cache, call factory function
      value = await factory();
      
      // Store in cache
      await this.set(key, value, options);
      
      return value;
    } catch (error) {
      console.error('Cache remember error:', error);
      // Fallback to factory function
      return await factory();
    }
  }

  async rememberForever<T = any>(key: string, factory: () => Promise<T>, options: Omit<CacheOptions, 'ttl'> = {}): Promise<T> {
    return this.remember(key, factory, { ...options, ttl: -1 });
  }

  // Session Management
  async getSession(sessionId: string): Promise<Record<string, any> | null> {
    return this.hgetall(`session:${sessionId}`, { ttl: 86400 }); // 24 hours
  }

  async setSessionData(sessionId: string, data: Record<string, any>): Promise<boolean> {
    return this.hset('session', sessionId, data, { ttl: 86400 });
  }

  async destroySession(sessionId: string): Promise<boolean> {
    return this.delete(`session:${sessionId}`);
  }

  // Rate Limiting
  async rateLimit(key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    try {
      if (!this.redis) {
        return { allowed: true, remaining: limit - 1, resetTime: new Date() };
      }

      const fullKey = this.buildKey(`rate_limit:${key}`);
      const now = Date.now();
      const windowStart = now - (window * 1000);

      // Use sorted set to track requests in time window
      const pipeline = this.redis.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(fullKey, '-inf', windowStart);
      
      // Add current request
      pipeline.zadd(fullKey, now, now);
      
      // Get current count
      pipeline.zcard(fullKey);
      
      // Set expiry
      pipeline.expire(fullKey, window);
      
      const results = await pipeline.exec();
      
      if (!results) {
        return { allowed: false, remaining: 0, resetTime: new Date(now + window * 1000) };
      }

      const currentCount = results[2][1] as number;
      const allowed = currentCount <= limit;
      const remaining = Math.max(0, limit - currentCount);
      const resetTime = new Date(now + window * 1000);

      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error('Rate limit error:', error);
      return { allowed: true, remaining: limit - 1, resetTime: new Date() };
    }
  }

  // Cache Statistics and Management
  async getStats(): Promise<CacheStats> {
    try {
      let redisInfo: any = {};
      
      if (this.redis) {
        const info = await this.redis.info();
        redisInfo = this.parseRedisInfo(info);
      }

      const hitRate = this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0;

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        sets: this.stats.sets,
        deletes: this.stats.deletes,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys: redisInfo.db0_keys || 0,
        usedMemory: redisInfo.used_memory_human || '0B',
        connectedClients: redisInfo.connected_clients || 0,
        uptime: redisInfo.uptime_in_seconds || 0,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        sets: this.stats.sets,
        deletes: this.stats.deletes,
        hitRate: 0,
        totalKeys: 0,
        usedMemory: '0B',
        connectedClients: 0,
        uptime: 0,
      };
    }
  }

  async getAllKeys(pattern?: string): Promise<CacheKey[]> {
    try {
      if (!this.redis) {
        return [];
      }

      const searchPattern = pattern || '*';
      const keys = await this.redis.keys(searchPattern);
      const cacheKeys: CacheKey[] = [];

      for (const key of keys) {
        try {
          const ttl = await this.redis.ttl(key);
          const type = await this.redis.type(key);
          
          let size = 0;
          try {
            size = await this.redis.memory('usage', key);
          } catch (error) {
            // MEMORY USAGE command might not be available in all Redis versions
          }

          const cacheKey: CacheKey = {
            key: key.replace(this.config.redis?.keyPrefix || '', ''),
            prefix: this.config.redis?.keyPrefix || '',
            fullKey: key,
            ttl,
            size,
            type,
            createdAt: new Date(), // We can't get exact creation time from Redis
            expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined,
          };

          cacheKeys.push(cacheKey);
        } catch (error) {
          console.warn(`Failed to get info for key ${key}:`, error);
        }
      }

      return cacheKeys.sort((a, b) => a.key.localeCompare(b.key));
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  async flushAll(): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      await this.redis.flushall();
      
      // Reset local stats
      this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
      
      return true;
    } catch (error) {
      console.error('Failed to flush cache:', error);
      return false;
    }
  }

  // Utility Methods
  private buildKey(key: string, prefix?: string): string {
    if (prefix) {
      return `${prefix}:${key}`;
    }
    return key;
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const parsed: Record<string, any> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        
        // Try to parse numeric values
        if (/^\d+$/.test(value)) {
          parsed[key] = parseInt(value, 10);
        } else if (/^\d+\.\d+$/.test(value)) {
          parsed[key] = parseFloat(value);
        } else {
          parsed[key] = value;
        }
      }
    }

    return parsed;
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export default CacheManager;