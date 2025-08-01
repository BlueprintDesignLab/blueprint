pub mod read_file_tools;
pub mod write_file_tools;
// pub mod system_tools;

pub mod menu;
pub mod project;
pub mod schema_watcher;
pub mod watcher;
pub mod checkpoint;

use anyhow::{bail, Context, Result};

use std::{
    collections::HashMap,
    path::{Component, PathBuf},
    sync::RwLock,
};

use serde::{Deserialize, Serialize};

use crate::{
    menu::{build_menu, handle_menu_event},
    project::{get_project_root, open_project},
    read_file_tools::{list_directory_tree, read_file},
    schema_watcher::start_schema_watcher,
    watcher::start_watcher,
    write_file_tools::write_project_file,
    checkpoint::{ai_checkpoint, restore_checkpoint},
};

#[derive(Debug, Serialize, Deserialize)]
struct ProjectRoots(RwLock<HashMap<String, PathBuf>>);

impl Default for ProjectRoots {
    fn default() -> Self {
        Self(RwLock::new(HashMap::new()))
    }
}

pub(crate) fn resolve(root: PathBuf, user_rel: &PathBuf) -> Result<PathBuf> {
    // Treat `/foo/bar` as `foo/bar`
    let rel = match user_rel.components().next() {
        Some(Component::RootDir) => user_rel.strip_prefix(Component::RootDir)?,
        _ => user_rel,
    };

    // Join and canonicalise (may fail on non-existing components)
    let full = root
        .join(rel)
        .canonicalize()
        .with_context(|| format!("Cannot canonicalise path: {}", user_rel.display()))?;

    // Still enforce staying within the project root
    if !full.starts_with(&root) {
        bail!("Access outside project root is forbidden");
    }

    Ok(full)
}

fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        app.handle().plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )?;
    }

    let handle = app.handle();

    let menu = build_menu(&handle);
    app.set_menu(menu)?;
    app.on_menu_event(handle_menu_event);

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ProjectRoots::default())
        .plugin(tauri_plugin_opener::init())
        // .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_pty::init())
        .setup(setup_app)
        .invoke_handler(tauri::generate_handler![
            get_project_root,
            read_file,
            list_directory_tree,
            write_project_file,
            open_project,
            start_watcher,
            start_schema_watcher,
            ai_checkpoint,
            restore_checkpoint,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
