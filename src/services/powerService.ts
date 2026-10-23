import { APP_CONFIG } from '../config';

export interface PowerStatus {
  queue: string;
  city: string;
  isOnline: boolean;
  nextSwitchTime: string;
  message: string;
}

// Початковий сервіс-агент для перевірки стану світла
export class PowerAgent {
  static async checkQueueStatus(): Promise<PowerStatus> {
    // Тут ми згодом зробимо запит до парсера або локального кешу,
    // а поки агент видає актуальну логіку для черги 4.1
    const { queue, city } = APP_CONFIG.powerGrid;
    
    // Імітація розумної перевірки (можеш підв'язати сюди парсинг сайту обленерго)
    return {
      queue,
      city,
      isOnline: true, 
      nextSwitchTime: "16:00",
      message: `Черга ${queue} (${city}): світло є. Наступне планове відключення о 16:00.`
    };
  }
}