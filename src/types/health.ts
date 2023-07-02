export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  redis: 'connected' | 'disconnected';
  database: 'connected' | 'disconnected';
  timestamp: string;
  version: string;
}
