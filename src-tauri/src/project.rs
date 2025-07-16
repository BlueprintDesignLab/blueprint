use std::path::{PathBuf};

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, Window};

use crate::ProjectRoot;

use tokio::fs::{create_dir, write};

#[tauri::command]
pub async fn create_project(
    app: AppHandle,
    folder_path: PathBuf,
) -> Result<(), String> {
    // 1. Create the project folder if it doesn't exist
    // create_dir(&folder_path)
    //     .await
    //     .map_err(|e| format!("failed to create project dir: {e}"))?;

    // 2. Create `.blueprint` sub-folder
    let bp_dir = folder_path.join(".blueprint");
    create_dir(&bp_dir)
        .await
        .map_err(|e| format!("failed to create .blueprint dir: {e}"))?;

    // 3. Write .gitignore
    let gitignore_path = folder_path.join(".gitignore");
    write(gitignore_path, "/.blueprint/view.json\n/.blueprint/blueprintwatcher.json\n")
        .await
        .map_err(|e| format!("failed to write .gitignore: {e}"))?;

    // 4. Create empty .blueprintignore
    let bpignore_path = folder_path.join(".blueprintignore");
    write(bpignore_path, "")
        .await
        .map_err(|e| format!("failed to write .blueprintignore: {e}"))?;

    // 5. Open the project window
    spawn_project_window(&app, folder_path).await
}

/// Called from the **launcher** window.
#[tauri::command]
pub async fn open_project(app: AppHandle, folder_path: PathBuf) -> Result<(), String> {
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