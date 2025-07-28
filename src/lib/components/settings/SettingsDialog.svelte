<script lang="ts">
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

  import { Bolt, Bot, CircleUser, Heart } from "lucide-svelte";

  import SettingsLlm from "./SettingsLLM.svelte";
  import SettingsFeedback from "./SettingsFeedback.svelte";
  import SettingsAccount from "./SettingsAccount.svelte";
	
	const data = {
		nav: [
			{ name: "LLM", icon: Bot },
			{ name: "Feedback", icon: Heart },
			{ name: "Account", icon: CircleUser },
		],
	};

	let open = $state(false);
	let active = $state(0);

	let pages = [SettingsLlm, SettingsFeedback, SettingsAccount];

	let ActivePage = $derived(pages[active]);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button size="sm" {...props}><Bolt /></Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content
		class="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
		trapFocus={false}
	>
		<Dialog.Title class="sr-only">Settings</Dialog.Title>
		<Dialog.Description class="sr-only">Customize your settings here.</Dialog.Description>
		<Sidebar.Provider class="items-start">
			<Sidebar.Root collapsible="none" class="hidden md:flex">
				<Sidebar.Content>
					<Sidebar.Group>
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								{#each data.nav as item, i}
									<Sidebar.MenuItem>
										<Sidebar.MenuButton
											isActive={i === active}
										>
											{#snippet child({ props })}
												<a href="##" {...props} onclick={() => active = i}>
													<item.icon />
													<span>{item.name}</span>
												</a>
											{/snippet}
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								{/each}
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>
			</Sidebar.Root>
			<main class="flex h-[480px] flex-1 flex-col overflow-hidden">
				<!-- <header
					class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
				>
					<div class="flex items-center gap-2 px-4">
						<Breadcrumb.Root>
							<Breadcrumb.List>
								<Breadcrumb.Item class="hidden md:block">
									<Breadcrumb.Link href="#">Settings</Breadcrumb.Link>
								</Breadcrumb.Item>
								<Breadcrumb.Separator class="hidden md:block" />
								<Breadcrumb.Item>
									<Breadcrumb.Page>Messages & media</Breadcrumb.Page>
								</Breadcrumb.Item>
							</Breadcrumb.List>
						</Breadcrumb.Root>
					</div>
				</header> -->
				<div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
					<ActivePage />
				</div>
			</main>
		</Sidebar.Provider>
	</Dialog.Content>
</Dialog.Root>
