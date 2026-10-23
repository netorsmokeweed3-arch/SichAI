import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

const USER_CONFIG_KEY = 'sich_user_config';
const POWER_CACHE_KEY = 'sich_power_cache';

export interface UserConfig {
  city: string;
  queue: string;
  isConfigured: boolean;
}

export class StorageService {
  static saveConfig(city: string, queue: string): void {
    const config: UserConfig = { city, queue, isConfigured: true };
    storage.set(USER_CONFIG_KEY, JSON.stringify(config));
  }

  static getConfig(): UserConfig | null {
    const data = storage.getString(USER_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  }

  static savePowerCache(scheduleData: object): void {
    storage.set(POWER_CACHE_KEY, JSON.stringify(scheduleData));
  }

  static getPowerCache(): any {
    const data = storage.getString(POWER_CACHE_KEY);
    return data ? JSON.parse(data) : null;
  }
}