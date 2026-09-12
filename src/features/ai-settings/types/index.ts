export interface UserAiSetting {
  hasApiKey: boolean;
  maskedApiKey: string;
  chatModel: string;
  routerModel: string;
  evaluatorModel: string;
  parserModel: string;
  summarizerModel: string;
  temperature: number;
}

export interface UserAiSettingRequest {
  geminiApiKey: string;
  chatModel?: string;
  routerModel?: string;
  evaluatorModel?: string;
  parserModel?: string;
  summarizerModel?: string;
  temperature?: number;
}

export interface ModelQuota {
  modelName: string;
  displayName: string;
  agentRole: string;
  todayRequests: number;
  dailyLimit: number;
  usagePercent: number;
  status: 'SAFE' | 'WARNING' | 'DANGER';
  recommendation: string;
}

export interface TestApiKeyRequest {
  apiKey: string;
  modelName?: string;
}

export interface TestApiKeyResponse {
  valid: boolean;
  message: string;
}
