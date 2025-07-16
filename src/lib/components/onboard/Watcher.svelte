<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { listen }   from "@tauri-apps/api/event";
    import { onMount }  from "svelte";
    import { toast }    from "svelte-sonner";

    type FsEvent = {
        kind: string;
        paths: string[];
    };

    onMount(async () => {
        await invoke("start_watcher");

        await listen<FsEvent>("fs-event", ({ payload }) => {
            const { kind, paths } = payload;

            // pretty title
            const title = kind
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, c => c.toUpperCase())
                .trim();

            // decide what to show
            const hasData    = kind.includes("data");
            const hasMeta    = kind.includes("meta");
            const showDetail = hasData || hasMeta;

            const description = showDetail
                ? `${title} · ${paths.join(", ")}`
                : JSON.stringify(payload, null, 2);

            // choose toast style
            const variant = kind.includes("Delete") || kind === "remove"
                ? "destructive"
                : "default";

            toast[variant === "destructive" ? "error" : "success"](description, {
                title,
                duration: 4_000,
                richColors: true,
            });
        });
    });
</script>

<!-- nothing to render – toasts are enough -->