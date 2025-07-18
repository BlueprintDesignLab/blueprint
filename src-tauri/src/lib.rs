pub mod read_file_tools;
pub mod write_file_tools;
// pub mod system_tools;

pub mod menu;
pub mod project;
pub mod watcher;

use anyhow::{bail, Context, Result};

use std::path::{Component, PathBuf};

use serde::{Deserialize, Serialize};

use crate::{
    menu::{build_menu, handle_menu_event},
    project::{get_project_root, open_project},
    read_file_tools::{list_directory_tree, read_file, read_graph_yaml},
    watcher::start_watcher,
    write_file_tools::{write_blueprint_file, write_project_file},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectRoot(pub PathBuf);

impl ProjectRoot {
    pub(crate) fn resolve(&self, user_rel: &std::path::Path) -> Result<PathBuf> {
        // Treat `/foo/bar` as `foo/bar`
        let rel = match user_rel.components().next() {
            Some(Component::RootDir) => user_rel.strip_prefix(Component::RootDir)?,
            _ => user_rel,
        };

        let full = self.0.join(rel).canonicalize().with_context(|| {
            format!(
                "Path does not exist or cannot be resolved: {}",
                user_rel.display()
            )
        })?;

        if !full.starts_with(&self.0) {
            bail!("Access outside project root is forbidden");
        }
        Ok(full)
    }
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
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_pty::init())
        .setup(setup_app)
        .invoke_handler(tauri::generate_handler![
            get_project_root,
            read_file,
            list_directory_tree,
            read_graph_yaml,
            write_blueprint_file,
            write_project_file,
            open_project,
            start_watcher,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
