// AuthPersistence interface for AuthServer <-> Persistence

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  antiCheatFlags: string[];
  sessionTokens: string[];
  banned: boolean;
}

export interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  issuedAt: number;
  expiresAt: number;
  valid: boolean;
}

export interface AuthPersistence {
  getUserById(id: string): Promise<UserRecord | null>;
  getUserByUsername(username: string): Promise<UserRecord | null>;
  createUser(data: Omit<UserRecord, 'id' | 'sessionTokens'> & { passwordHash: string }): Promise<UserRecord>;
  updateUser(user: UserRecord): Promise<void>;
  listUsersByFlags(flag: string): Promise<UserRecord[]>;

  storeSession(session: SessionRecord): Promise<void>;
  getSessionByToken(token: string): Promise<SessionRecord | null>;
  revokeSession(token: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
}
