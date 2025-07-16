// ------------------------- Tauri store -------------------------
import { LazyStore } from '@tauri-apps/plugin-store';

export const tauriStore = new LazyStore('onboard.dat');