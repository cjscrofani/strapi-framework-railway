import Redis from 'redis';

class CacheService {
  private client: any;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = Redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            strapi.log.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          
          if (options.attempt > 10) {
            return undefined;
          }
          
          return Math.min(options.attempt * 100, 3000);
        },
      });

      this.client.on('connect', () => {
        strapi.log.info('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        strapi.log.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        strapi.log.info('Reconnecting to Redis');
      });

      await this.client.connect();
    } catch (error) {
      strapi.log.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      strapi.log.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      strapi.log.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      strapi.log.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      strapi.log.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      strapi.log.error('Redis FLUSH error:', error);
      return false;
    }
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      strapi.log.error('Redis KEYS error:', error);
      return [];
    }
  }

  async increment(key: string, amount: number = 1): Promise<number | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      strapi.log.error('Redis INCREMENT error:', error);
      return null;
    }
  }

  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export default new CacheService();