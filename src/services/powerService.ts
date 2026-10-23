import { APP_CONFIG } from '../config';

export interface PowerStatus {
  queue: string;
  city: string;
  isOnline: boolean;
  nextSwitchTime: string;
  message: string;
}

// Сервіс-агент для перевірки стану світла через хмарний бекенд на Render
export class PowerAgent {
  static async checkQueueStatus(): Promise<PowerStatus> {
    const { queue, city } = APP_CONFIG.powerGrid;

    try {
      // Робимо реальний запит до твого Telegram-моніторингового сервера
      const response = await fetch('https://sichai.onrender.com/get-schedule');
      const data = await response.json();

      // Якщо сервер повернув дані графіку
      if (data && data.schedule) {
        return {
          queue,
          city,
          isOnline: data.isOnline ?? true,
          nextSwitchTime: data.nextSwitchTime || "16:00",
          message: `Черга ${queue} (${city}): ${data.schedule}`
        };
      }
    } catch (error) {
      console.log('Помилка запиту до Render-сервера у PowerAgent:', error);
    }

    // Fallback-значення, якщо сервер недоступний або ще не відповів
    return {
      queue,
      city,
      isOnline: true,
      nextSwitchTime: "16:00",
      message: `Черга ${queue} (${city}): світло є. (Очікування синхронізації з хмарою)`
    };
  }
}