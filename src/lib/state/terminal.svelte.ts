  import { spawn, type IPty } from 'tauri-pty';

export const terminal: {
    pty: IPty | null
} = $state({
    pty: null
})