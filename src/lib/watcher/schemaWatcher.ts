import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

type SchemaChangedEvent = {
  path: string
};

export const schemaCompiledWatcher = new (class {
  #started = false;
  #unlisteners: (() => void)[] = [];

  async addListener(cb: (e: SchemaChangedEvent) => void) {
    const unlisten = await listen(
      'schema-changed',
      ({ payload }) => cb(payload as SchemaChangedEvent)
    );
    this.#unlisteners.push(unlisten);

    if (!this.#started) {
      await invoke('start_schema_watcher');
      console.log("invoked schema watcher");
      this.#started = true;
    }

    return () => {
      unlisten();
      this.#unlisteners = this.#unlisteners.filter(u => u !== unlisten);
    };
  }

  removeAllListeners() {
    this.#unlisteners.forEach(u => u());
    this.#unlisteners = [];
  }
})();