// GameplayAuth interface for GameServer <-> AuthServer

export interface SessionValidationResult {
  valid: boolean;
  userId?: string;
  reason?: string;
  banned?: boolean;
}

export interface GameplayAuth {
  validateSessionToken(token: string): Promise<SessionValidationResult>;
  checkAccountBan(userId: string): Promise<{ banned: boolean; reason?: string }>;
  logGameplayEvent(userId: string, event: string, meta?: Record<string, any>): Promise<void>;
}
