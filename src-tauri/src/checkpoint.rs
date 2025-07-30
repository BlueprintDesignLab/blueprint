use chrono::Utc;
use tauri::Window;

use crate::project::get_window_root;

#[tauri::command]
pub async fn ai_checkpoint(window: Window) -> Result<String, String> {
    let root = get_window_root(&window)?;

    std::process::Command::new("git")
        .current_dir(&root)          // <-- run inside the repo root
        .args(["add", "-A"])
        .status()
        .map_err(|e| format!("git add failed: {e}"))?;

    let msg = format!("ai-checkpoint {}", Utc::now().format("%Y%m%d-%H%M%S"));

    std::process::Command::new("git")
        .current_dir(&root)          // <-- same here
        .args(["commit", "-m", &msg])
        .status()
        .map_err(|e| format!("git commit failed: {e}"))?;

    let output = std::process::Command::new("git")
        .current_dir(&root)          // <-- and here
        .args(["rev-parse", "HEAD"])
        .output()
        .map_err(|e| format!("git rev-parse failed: {e}"))?;

    let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(hash)
}

#[tauri::command]
pub async fn restore_checkpoint(window: Window, hash: String) -> Result<(), String> {
    // 1. Get the repo root (same helper you already use)
    let root = get_window_root(&window)?;

    // 2. Hard-reset the working tree to the given commit
    std::process::Command::new("git")
        .current_dir(&root)
        .args(["reset", "--hard", &hash])
        .status()
        .map_err(|e| format!("git reset failed: {e}"))?;

    Ok(())
}