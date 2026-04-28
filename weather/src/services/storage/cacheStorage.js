import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@weather_cache_';
const DEFAULT_EXPIRY = 60 * 60 * 1000;

export const cacheStorage = {
  async set(key, data, expiry = DEFAULT_EXPIRY) {
    try {
      const item = {
        data,
        expiry: Date.now() + expiry,
      };
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  },

  async get(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
      if (jsonValue === null) {
        return null;
      }

      const item = JSON.parse(jsonValue);
      
      if (Date.now() > item.expiry) {
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      
      if (error instanceof SyntaxError) {
        try {
          await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
        } catch (removeError) {
          console.error('Failed to remove corrupted cache:', removeError);
        }
      }
      
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.error('Failed to remove cache:', error);
    }
  },

  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      let size = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          size += value.length;
        }
      }
      
      return size;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  },

  async clearExpired() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      for (const key of cacheKeys) {
        try {
          const jsonValue = await AsyncStorage.getItem(key);
          if (jsonValue) {
            const item = JSON.parse(jsonValue);
            if (Date.now() > item.expiry) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.error(`Failed to process cache key ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }
};

export const generateCacheKey = (type, params) => {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${type}?${sortedParams}`;
};
