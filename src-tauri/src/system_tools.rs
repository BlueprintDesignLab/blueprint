// use tauri::command;
// use tokio::process::Command;
// use anyhow::{Context, Result};

// #[command]
// pub async fn run_command(command: String, args: Vec<String>) -> Result<String, String> {
//     let output = Command::new(&command)
//         .args(&args)
//         .output()
//         .await
//         .with_context(|| format!("Failed to run command: {}", command))
//         .map_err(|e| e.to_string())?;

//     let stdout = String::from_utf8_lossy(&output.stdout);
//     let stderr = String::from_utf8_lossy(&output.stderr);
//     Ok(format!("{}{}", stdout, stderr))
// }
