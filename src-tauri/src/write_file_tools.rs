// src-tauri/src/write_file_tools.rs
use anyhow::{Context, Result};
use tauri::{Window};
use tokio::fs;

use crate::{project::get_window_root};

use std::path::{Path, PathBuf};

/// Same safety guarantee as `resolve`, but never touches the disk.
fn resolve_no_canonicalize(root: PathBuf, user_rel: &Path) -> Result<PathBuf, String> {
    // Treat absolute paths as relative to root
    let rel = match user_rel.components().next() {
        Some(std::path::Component::RootDir) => {
            user_rel
                .strip_prefix(std::path::Component::RootDir)
                .map_err(|_| "Invalid absolute path".to_string())?
        }
        _ => user_rel,
    };

    // Simple logical join
    let full = root.join(rel);

    // Root-escape check on the *logical* path
    if !full.starts_with(root) {
        return Err("Access outside project root is forbidden".to_string());
    }

    Ok(full)
}

#[tauri::command]
pub async fn write_project_file(
    path: String,
    content: String,
    window: Window,
) -> Result<(), String> {
    let root: PathBuf = get_window_root(&window).unwrap();
    
    // ── A. clean & validate ──────────────────────────────────────────────
    let rel: PathBuf = path.into();
    let full = resolve_no_canonicalize(root, &rel).unwrap();

    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    } else {
        return Err("Path has no parent directory".into());
    }

    // ── C. write ─────────────────────────────────────────────────────────
    fs::write(&full, content)
        .await
        .with_context(|| format!("Failed to write file: {}", full.display()))
        .map_err(|e| e.to_string())
}
