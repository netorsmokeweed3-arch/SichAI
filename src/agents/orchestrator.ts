import { PowerAgent } from '../services/powerService';
import { SecurityAgent } from './securityAgent';
import { BatteryAgent } from './batteryAgent';
import { StorageService } from '../services/storageService';

export interface HubState {
  power: any;
  security: any;
  battery: any;
  schedule: any;
  lastUpdated: string;
}

export class SichOrchestrator {
  static async runDiagnostics(): Promise<HubState> {
    // Централізований запуск усіх агентів одночасно (паралельно для швидкості)
    const [power, security, battery] = await Promise.all([
      PowerAgent.checkQueueStatus(),
      SecurityAgent.checkSecurityStatus(),
      BatteryAgent.checkAndProtectBattery(),
    ]);

    const schedule = StorageService.getPowerCache();
    const lastUpdated = new Date().toLocaleTimeString();

    return {
      power,
      security,
      battery,
      schedule,
      lastUpdated,
    };
  }
}