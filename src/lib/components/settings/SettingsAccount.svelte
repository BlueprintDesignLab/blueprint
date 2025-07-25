<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { ArrowRight, Sparkles, User, Loader2Icon, CheckCircle } from 'lucide-svelte';
  import { auth, googleProvider } from '$lib/firebase';
  import { signOut } from 'firebase/auth';

  import { openUrl } from '@tauri-apps/plugin-opener';
  import { open } from '@tauri-apps/plugin-shell';

  import { user } from '$lib/authStore';

  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loginWithGoogle() {
    const params = new URLSearchParams({
      client_id: '735482512776-6fnd8oromj83uku798157o9bivm4kku1.apps.googleusercontent.com',
      redirect_uri: 'http://localhost:1420/auth/callback',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    await open(url);
  }

  async function logout() {
    await signOut(auth);
  }
</script>

{#if $user}
  <!-- SIGNED-IN STATE -->
  <div class="flex flex-col gap-4 items-center justify-center h-full p-6">
    <CheckCircle class="h-6 w-6 text-green-500" />
    <h2 class="text-lg font-semibold">Welcome, {$user.displayName ?? $user.email}!</h2>
    <p class="text-sm text-muted-foreground">You’re all set.</p>
    <Button onclick={logout} size="sm" variant="outline">
      Sign out
    </Button>
  </div>
{:else}
  <!-- SIGN-IN STATE (your existing markup) -->
  <div class="flex flex-col gap-4 items-center justify-center h-full p-6">
    <Sparkles class="h-6 w-6 text-indigo-500" />
    <h2 class="text-lg font-semibold">Create a Blueprint Account (Coming Soon)</h2>
    <p class="text-sm text-muted-foreground text-center max-w-xs">
      Sign in with Blueprint so your AI usage is on us. (limited time only!)
    </p>

    {#if error}
      <p class="text-xs text-red-500">{error}</p>
    {/if}

    <Button disabled={loading} onclick={loginWithGoogle} size="sm">
      <!-- {#if loading}
        <Loader2Icon class="animate-spin" />
      {:else} -->
        <User class="mr-2 h-4 w-4" />
      <!-- {/if} -->
      Continue with Google
      <ArrowRight class="ml-2 h-4 w-4" />
    </Button>
  </div>
{/if}