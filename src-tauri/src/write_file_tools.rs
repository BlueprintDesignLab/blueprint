// src-tauri/src/write_file_tools.rs
use anyhow::{Context, Result};
use std::path::{Component, Path, PathBuf};
use tauri::State;
use tokio::fs;

use crate::read_file_tools::ProjectRoot;

/// Turn a user-supplied string into a *sanitised* relative `PathBuf`.
///
/// * `"/foo/bar"`  →  `"foo/bar"`
/// * `"./foo"`     →  `"./foo"`  (unchanged)  
/// * Rejects empty, `..`, drive letters, or UNC prefixes.
fn normalise_rel(user: &str) -> Result<PathBuf, String> {
    use std::path::{Component, Path};

    if user.trim().is_empty() {
        return Err("Path cannot be empty".into());
    }

    // Strip a single leading `/` so pseudo-absolute becomes relative
    let trimmed = user.trim_start_matches('/');

    // Still reject drive letters or UNC prefixes (true absolute on Windows)
    let rel = Path::new(trimmed);
    if rel.is_absolute() {
        return Err("Absolute paths are not allowed".into());
    }
    if rel.components().any(|c| c == Component::ParentDir) {
        return Err("`..` segments are forbidden".into());
    }
    Ok(rel.to_path_buf())
}

#[tauri::command]
pub async fn write_blueprint_file(
    path: String,
    content: String,
    root: State<'_, ProjectRoot>,
) -> Result<(), String> {
    // ── A. clean & validate ──────────────────────────────────────────────
    let rel = normalise_rel(&path)?;

    // ── B. paths inside the sandbox  ─────────────────────────────────────
    let blueprint_root = root.0.join(".blueprint");
    fs::create_dir_all(&blueprint_root).await.map_err(|e| e.to_string())?;

    let full = blueprint_root.join(&rel);

    // Canonical-safety check (resolves symlinks)
    let canon_parent = full
        .parent()
        .expect("file has a parent")
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let canon_blueprint = blueprint_root.canonicalize().map_err(|e| e.to_string())?;

    if !canon_parent.starts_with(&canon_blueprint) {
        return Err("Access outside .blueprint is forbidden".into());
    }

    // ── C. write ─────────────────────────────────────────────────────────
    fs::create_dir_all(canon_parent).await.map_err(|e| e.to_string())?;
    fs::write(&full, content)
        .await
        .with_context(|| format!("Failed to write file: {}", full.display()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_project_file(
    path: String,
    content: String,
    root: State<'_, ProjectRoot>,
) -> Result<(), String> {
    // ── A. clean & validate ──────────────────────────────────────────────
    let rel = normalise_rel(&path)?;

    // ── B. compute & guard ───────────────────────────────────────────────
    let full = root.0.join(&rel);

    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;

        let canon_parent = parent.canonicalize().map_err(|e| e.to_string())?;
        let canon_root = root.0.canonicalize().map_err(|e| e.to_string())?;

        if !canon_parent.starts_with(&canon_root) {
            return Err("Access outside project root is forbidden".into());
        }
    } else {
        return Err("Path has no parent directory".into());
    }

    // ── C. write ─────────────────────────────────────────────────────────
    fs::write(&full, content)
        .await
        .with_context(|| format!("Failed to write file: {}", full.display()))
        .map_err(|e| e.to_string())
}
