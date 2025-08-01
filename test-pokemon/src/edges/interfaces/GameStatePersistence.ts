// GameStatePersistence.ts
// Interface for saving/loading game state between GameEngine and Persistence

import { PlayerState, Party, MapData } from '../../DataContracts';

export interface GameStatePersistence {
  saveGameState(state: {
    player: PlayerState;
    party: Party;
    map: MapData;
  }): Promise<void>;

  loadGameState(): Promise<{
    player: PlayerState;
    party: Party;
    map: MapData;
  } | null>;
}

// Used by GameEngine to persist and restore player, party, and progress data.