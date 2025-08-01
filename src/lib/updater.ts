import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForAppUpdates() {
  let update = null;
  try {
    update = await check();
  } catch (e) {
    console.error(e);
  }

  if (update) {
    const yes = await ask(`Update ${update.version} is ready. Install now?`);
    if (yes) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }
}