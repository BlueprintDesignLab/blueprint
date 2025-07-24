use tauri::{Emitter, Window};

// ------------------------------------------------------------------
// src/schema_watcher.rs
use crate::{
    project::get_window_root,
    watcher::{build_gitignore, is_ignored},
};

use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;

use std::{
    path::{Path, PathBuf},
    sync::mpsc,
    thread,
};

#[derive(Serialize, Clone)]
struct SchemaChangedEvent {
    path: PathBuf,
}

fn collect_schemas(dir: &Path, gi: &ignore::gitignore::Gitignore) -> Vec<PathBuf> {
    walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.into_path())
        .filter(|p| {
            !is_ignored(gi, p)
                && p.file_name()
                    .and_then(|n| n.to_str())
                    .map_or(false, |n| n.ends_with(".schema.json"))
        })
        .collect()
}

#[tauri::command]
pub async fn start_schema_watcher(window: Window) -> Result<(), String> {
    let root = get_window_root(&window)?;
    let edges_dir = root.join(".blueprint").join("edges");
    if !edges_dir.is_dir() {
        return Ok(());
    }

    let gi = build_gitignore(&root);
    // log::info!("Path = {}", edges_dir.display());

    // 1️⃣  Emit existing files
    for path in collect_schemas(&edges_dir, &gi) {
        // log::info!("Path = {}", path.display());

        let rel = path.strip_prefix(&root).unwrap_or(&path);
        let _ = window.emit("schema-changed", SchemaChangedEvent {
            path: rel.to_path_buf(),
        });
    }

    // 2️⃣  Spawn the watcher thread
    thread::spawn(move || {
        let (tx, rx) = mpsc::channel();
        let mut watcher =
            RecommendedWatcher::new(tx, Default::default()).map_err(|e| e.to_string())?;

        watcher
            .watch(&edges_dir, RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;

        while let Ok(res) = rx.recv() {
            if let Ok(mut ev) = res {
                ev.paths.retain(|p| !is_ignored(&gi, p));
                ev.paths.retain(|p| {
                    p.file_name()
                        .and_then(|n| n.to_str())
                        .map_or(false, |n| n.ends_with(".schema.json"))
                });

                for path in ev.paths {
                    let rel = path.strip_prefix(&root).unwrap_or(&path);
                    let _ = window.emit("schema-changed", SchemaChangedEvent {
                        path: rel.to_path_buf(),
                    });
                }
            }
        }
        Ok::<(), String>(())
    });

    Ok(())
}
