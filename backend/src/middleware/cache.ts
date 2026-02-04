import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

/**
 * Generate cache key based on request parameters
 */
const generateCacheKey = (req: Request, prefix: string): string => {
  const userId = (req.user as any)?._id?.toString() || 'anonymous';
  const role = (req.user as any)?.role || 'guest';
  const queryString = JSON.stringify(req.query);
  
  return `${prefix}:user:${userId}:role:${role}:query:${queryString}`;
};

/**
 * Cache middleware factory
 * @param prefix - Cache key prefix (e.g., 'bookings', 'gigs')
 * @param ttl - Time to live in seconds (default: 600 = 10 minutes)
 */
export const cacheMiddleware = (prefix: string, ttl: number = 600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if Redis is not available
    if (!redisClient.isAvailable()) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req, prefix);

    try {
      // Try to get cached data
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Cache hit - return cached data
        const data = JSON.parse(cachedData);
        console.log(`[Cache] HIT - ${cacheKey}`);
        
        return res.json({
          ...data,
          cached: true,
          cacheTimestamp: new Date().toISOString(),
        });
      }

      // Cache miss - store original json method
      console.log(`[Cache] MISS - ${cacheKey}`);
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Store in cache asynchronously (don't wait)
          redisClient.set(cacheKey, JSON.stringify(body), ttl).catch((err) => {
            console.error('[Cache] Failed to store:', err);
          });
        }

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('[Cache] Middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Invalidate cache for a specific prefix and user
 */
export const invalidateCache = async (
  userId: string,
  prefix: string,
  role?: string
): Promise<number> => {
  if (!redisClient.isAvailable()) {
    return 0;
  }

  try {
    // Build pattern to match all cache keys for this user and prefix
    const pattern = role 
      ? `${prefix}:user:${userId}:role:${role}:*`
      : `${prefix}:user:${userId}:*`;
    
    const deletedCount = await redisClient.delPattern(pattern);
    
    if (deletedCount > 0) {
      console.log(`[Cache] Invalidated ${deletedCount} keys matching: ${pattern}`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
    return 0;
  }
};

/**
 * Invalidate all cache entries for a prefix (use sparingly)
 */
export const invalidateAllCache = async (prefix: string): Promise<number> => {
  if (!redisClient.isAvailable()) {
    return 0;
  }

  try {
    const pattern = `${prefix}:*`;
    const deletedCount = await redisClient.delPattern(pattern);
    
    if (deletedCount > 0) {
      console.log(`[Cache] Invalidated ALL ${deletedCount} keys for prefix: ${prefix}`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('[Cache] Full invalidation error:', error);
    return 0;
  }
};

/**
 * Invalidate cache for related entities
 * Example: When a booking is created, invalidate both student and teacher caches
 */
export const invalidateRelatedCache = async (
  userIds: string[],
  prefix: string
): Promise<number> => {
  if (!redisClient.isAvailable()) {
    return 0;
  }

  let totalDeleted = 0;

  for (const userId of userIds) {
    const deleted = await invalidateCache(userId, prefix);
    totalDeleted += deleted;
  }

  return totalDeleted;
};
