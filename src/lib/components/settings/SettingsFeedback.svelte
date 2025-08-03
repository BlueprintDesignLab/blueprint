<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { ArrowRight, Sparkles } from 'lucide-svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';

	function openDiscord() {
		// await openUrl('discord://discord.gg/aT2mYAVVzk');
        openUrl('https://discord.gg/aT2mYAVVzk')

        // setTimeout(() => , 1000);
	}
</script>

<div class="flex flex-col gap-4 items-center justify-center h-full">
	<Sparkles class="h-6 w-6 text-indigo-500" />
	<h2 class="text-lg font-semibold">Shape the future of blueprint</h2>

	<p class="text-sm text-muted-foreground text-center max-w-xs">
		We’re a small, passionate crew—every new voice makes a huge difference.
	</p>

	<!-- <div class="flex items-center gap-1 text-xs text-muted-foreground">
		<Users class="h-3 w-3" />
		<span>1 member online</span>
	</div> -->

	<Button onclick={openDiscord} size="sm">
		Join our Discord
		<ArrowRight class="ml-2 h-4 w-4" />
	</Button>
</div>