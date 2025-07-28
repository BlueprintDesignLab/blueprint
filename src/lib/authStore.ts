import { onAuthStateChanged, signInWithCustomToken, type User } from 'firebase/auth';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

import { auth } from '$lib/firebase';
import { readable } from 'svelte/store';

export const user = readable<User | null>(null, (set) =>
  onAuthStateChanged(auth, set)
);

export function initDeepLinkAuth() {
  // JS-only listener
 onOpenUrl(async (urls) => {
    const url = new URL(urls[0]);
    if (url.pathname === '/login') {
      const token = url.searchParams.get('token');
      if (token) {
        // sign in with the token (custom token or exchange for Firebase)
        await signInWithCustomToken(auth, token);
      }
    }
  });
}