// GamePersistence interface for GameServer <-> Persistence

export interface CreatureRecord {
  id: string;
  species: string;
  level: number;
  experience: number;
  ownerId: string;
  stats: Record<string, number>;
  moves: string[];
  isEgg: boolean;
}

export interface InventoryRecord {
  ownerId: string;
  items: { itemId: string; count: number }[];
}

export interface PlayerProgress {
  ownerId: string;
  badges: string[];
  mapPosition: { x: number; y: number; mapId: string };
}

export interface TradeRecord {
  id: string;
  partyA: string;
  partyB: string;
  offeredA: string[];
  offeredB: string[];
  status: 'pending' | 'accepted' | 'declined' | 'completed';
}

export interface LeaderboardEntry {
  playerId: string;
  score: number;
  rank: number;
}

export interface GamePersistence {
  getPlayerCreatures(playerId: string): Promise<CreatureRecord[]>;
  saveCreature(creature: CreatureRecord): Promise<void>;
  getInventory(playerId: string): Promise<InventoryRecord | null>;
  updateInventory(inv: InventoryRecord): Promise<void>;
  savePlayerProgress(progress: PlayerProgress): Promise<void>;
  loadPlayerProgress(playerId: string): Promise<PlayerProgress | null>;

  createTrade(record: TradeRecord): Promise<string>;
  getTrade(tradeId: string): Promise<TradeRecord | null>;
  updateTradeStatus(tradeId: string, status: TradeRecord['status']): Promise<void>;

  getLeaderboard(topN: number): Promise<LeaderboardEntry[]>;
}
