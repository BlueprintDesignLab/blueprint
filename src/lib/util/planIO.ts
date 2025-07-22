import { invoke } from "@tauri-apps/api/core";
import { debounce } from "./debounce";

const planMdDebounced    = debounce((src: string) =>
  invoke('write_project_file', { path: './.blueprint/plan.md', content: src }), 1000);

export const loadPlanFile = () =>
  invoke<string>('read_file', { path: '.blueprint/plan.md' }).catch(() => '');

export const savePlanMd    = planMdDebounced;
