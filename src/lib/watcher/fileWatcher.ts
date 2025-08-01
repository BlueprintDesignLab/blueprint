import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

type FsEvent = { kind: string; paths: string[] };

export const fileWatcher = new (class {
  #started = false;
  #unlisteners: (() => void)[] = [];

  async addListener(cb: (e: FsEvent) => void) {
    // ensure the Rust side is started only once
    // if (!this.#started) {
    //   await invoke('start_watcher');
    //   this.#started = true;
    // }

    const unlisten = await listen('fs-event', ({ payload }) => cb(payload as FsEvent));
    this.#unlisteners.push(unlisten);

    // return an individual un-listen function so the caller
    // can remove this specific handler if desired
    return () => {
      unlisten();
      this.#unlisteners = this.#unlisteners.filter(u => u !== unlisten);
    };
  }

  /** Remove every registered listener */
  removeAllListeners() {
    this.#unlisteners.forEach(u => u());
    this.#unlisteners = [];
  }
})();