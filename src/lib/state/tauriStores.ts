// ------------------------- Tauri store -------------------------
import { LazyStore } from '@tauri-apps/plugin-store';

export const settingsStore = new LazyStore('settings.dat');

export const projectRoot = (window as any).__TAURI_INITIAL_DATA__?.projectRoot ?? null;

// console.log(projectRoot);
export const historyStore = new LazyStore(`chat-${projectRoot}.dat`);


export const chatStyleStore = new LazyStore(`chat-style.dat`);