use chrono::Utc;

#[tauri::command]
pub async fn ai_checkpoint() -> Result<String, String> {
    std::process::Command::new("git")
        .args(["add", "-A"])
        .status()
        .map_err(|e| format!("git add failed: {e}"))?;

    let msg = format!("ai-checkpoint {}", Utc::now().format("%Y%m%d-%H%M%S"));
    std::process::Command::new("git")
        .args(["commit", "-m", &msg])
        .status()
        .map_err(|e| format!("git commit failed: {e}"))?;

    let output = std::process::Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .map_err(|e| format!("git rev-parse failed: {e}"))?;

    let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(hash)
}