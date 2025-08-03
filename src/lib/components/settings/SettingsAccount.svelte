<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { ArrowRight, Sparkles, User, CheckCircle } from 'lucide-svelte';
  import { auth } from '$lib/firebase';
  import { signOut } from 'firebase/auth';

  import { user } from '$lib/authStore';
  import { openUrl } from '@tauri-apps/plugin-opener';

  let loading = $state(true);
  let error = $state<string | null>(null);

  function landingPageLogin() {
    const url = "https://blueprintlab.io/dashboard";
    openUrl(url);
    loading = true;
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
      Sign in with Blueprint for convenient access to better in-house models
    </p>

    {#if error}
      <p class="text-xs text-red-500">{error}</p>
    {/if}

    <Button disabled={loading} onclick={landingPageLogin} size="sm">
      <!-- {#if loading}
        <Loader2Icon class="animate-spin" />
      {:else} -->
        <User class="mr-2 h-4 w-4" />
      <!-- {/if} -->
      Login
      <ArrowRight class="ml-2 h-4 w-4" />
    </Button>
  </div>
{/if}