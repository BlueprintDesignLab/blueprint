use std::path::PathBuf;

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, Window};

use crate::ProjectRoot;

use tokio::fs::{create_dir, metadata, OpenOptions};
use tokio::io::AsyncWriteExt;

#[tauri::command]
pub async fn open_project(app: AppHandle, folder_path: PathBuf) -> Result<(), String> {
    let bp_dir = folder_path.join(".blueprint");
    if !bp_dir.exists() {
        create_dir(&bp_dir)
            .await
            .map_err(|e| format!("failed to create .blueprint dir: {e}"))?;
    }

    // append to .gitignore (creates it if missing)
    let gitignore_path = folder_path.join(".gitignore");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&gitignore_path)
        .await
        .map_err(|e| format!("failed to open .gitignore: {e}"))?;

    // avoid adding duplicates
    let expected_lines = ["/.blueprint/view.json", "/.blueprint/blueprintwatcher.json"];

    let contents = tokio::fs::read_to_string(&gitignore_path)
        .await
        .unwrap_or_default();

    for line in expected_lines {
        if !contents.contains(line) {
            file.write_all(format!("{}\n", line).as_bytes())
                .await
                .map_err(|e| format!("failed to append to .gitignore: {e}"))?;
        }
    }

    // create empty .blueprintignore
    let bpignore_path = folder_path.join(".blueprintignore");
    if !metadata(&bpignore_path).await.is_ok() {
        tokio::fs::write(&bpignore_path, "")
            .await
            .map_err(|e| format!("failed to write .blueprintignore: {e}"))?;
    }

    spawn_project_window(&app, folder_path).await
}

/// Called from **inside** a project window.
#[tauri::command]
pub fn get_project_root(window: Window) -> Result<PathBuf, String> {
    let state = window.state::<ProjectRoot>();
    Ok(state.0.clone())
}

pub async fn spawn_project_window(app: &AppHandle, root: PathBuf) -> Result<(), String> {
    let label = uuid::Uuid::new_v4().to_string();
    let url = WebviewUrl::App("index.html".into());

    let win = WebviewWindowBuilder::new(app, label, url)
        .title(root.file_name().unwrap().to_string_lossy().into_owned())
        .initialization_script(&format!(
            "window.__TAURI_INITIAL_DATA__ = {};",
            serde_json::json!({
                "mode": "project",
                "projectRoot": root.to_string_lossy(), // <-- String or &str
            })
        ))
        .inner_size(1200.0, 800.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    win.manage(ProjectRoot(root));
    Ok(())
}
