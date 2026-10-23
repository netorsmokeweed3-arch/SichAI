import { StorageService } from '../services/storageService';

export interface BatteryActionStatus {
  shouldSavePower: boolean;
  reason: string;
  actionTaken: boolean;
}

export class BatteryAgent {
  static async checkAndProtectBattery(): Promise<BatteryActionStatus> {
    const cachedSchedule = StorageService.getPowerCache();
    
    // Тут ми аналізуємо графік з кешу та час
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    // Імітація розумного аналізу: якщо найближче вимкнення скоро, а режим сну/активності критичний
    // У майбутньому сюди додамо реальний хук на рівень заряду батареї пристрою
    let shouldSave = false;
    let reason = "Стан енергосистеми стабільний.";

    if (cachedSchedule && cachedSchedule.nextOutageHour) {
      const hoursLeft = cachedSchedule.nextOutageHour - currentHour;
      if (hoursLeft > 0 && hoursLeft <= 3) {
        shouldSave = true;
        reason = `Увага! До відключення світла залишилося менше ${hoursLeft} год. Агент активує захист батареї.`;
      }
    }

    return {
      shouldSavePower: shouldSave,
      reason,
      actionTaken: shouldSave, // Тут спрацює нативний тригер економії
    };
  }
}