// UIGameEngineAPI.ts
// TypeScript interface for UI ↔ GameEngine event and command API

export interface UIGameEngineAPI {
  /**
   * Send a user action (move, select, menu, battle command) from UI to GameEngine.
   * The action parameter should be a discriminated union or string enum for type safety.
   */
  sendUserAction(action: any): void;

  /**
   * Subscribe to game state or event updates from GameEngine (e.g., state changes, notifications).
   * The callback receives the new state or event object.
   */
  onGameEvent(callback: (event: any) => void): void;

  /**
   * Request the current game state for UI rendering.
   */
  getCurrentState(): any;
}
