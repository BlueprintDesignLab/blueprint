import { invoke } from "@tauri-apps/api/core";
import { debounce } from "./debounce";

const srcFileDebounced = debounce((path: string, src: string) =>
  invoke('write_project_file', { path, content: src }), 1000);

export const loadSrcFile = (path: string) =>
  invoke<string>('read_file', { path }).catch(() => '');

export const saveSrcFile = srcFileDebounced;
