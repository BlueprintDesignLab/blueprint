// TestHarnessAPI.ts
// TypeScript interface for test harness integration with GameEngine

export interface TestHarnessAPI {
  /**
   * Reset the game to a known state for testing.
   * Optionally provide a partial state object.
   */
  resetGameState(state?: any): void;

  /**
   * Step the game forward by one tick/frame for deterministic testing.
   */
  stepFrame(): void;

  /**
   * Query the current game state for assertions.
   */
  getGameState(): any;

  /**
   * Simulate a user input event (e.g., move, select, battle command).
   */
  simulateInput(event: any): void;
}
