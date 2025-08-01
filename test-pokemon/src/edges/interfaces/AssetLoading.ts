// AssetLoading.ts
// TypeScript interface for asset loading API between GameEngine and AssetLoader

export interface AssetLoading {
  /**
   * Request loading of all required assets before game start or scene transition.
   * Returns a promise that resolves when all assets are loaded.
   */
  loadAllAssets(): Promise<void>;

  /**
   * Retrieve a loaded asset by key (e.g., sprite, tilemap).
   * Returns the asset object or undefined if not loaded.
   */
  getAsset<T = any>(key: string): T | undefined;

  /**
   * Check if a specific asset is loaded.
   */
  isAssetLoaded(key: string): boolean;
}
