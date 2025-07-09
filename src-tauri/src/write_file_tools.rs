// src-tauri/src/write_file_tools.rs
use anyhow::{Context, Result};
use std::path::{Component, Path, PathBuf};
use tauri::State;
use tokio::fs;

use crate::read_file_tools::ProjectRoot;

/// Write (or overwrite) a text file inside the `.blueprint` sandbox.
///
/// * `path` is **relative to `.blueprint`**—e.g. `"graph.yaml"` or
///   `"edges/audio_bus/spec.txt"`.
/// * Parent directories are created automatically.
/// * Any attempt to escape `.blueprint` (via `..` or symlinks) is rejected.
#[tauri::command]
pub async fn write_blueprint_file(
    path: String,
    content: String,
    root: State<'_, ProjectRoot>,
) -> Result<(), String> {
    // Reject absolute or empty paths early.
    let rel = Path::new(&path);
    if rel.components().count() == 0 || rel.is_absolute() {
        return Err("Path must be relative to .blueprint".into());
    }

    // `.blueprint` root (may not exist yet).
    let blueprint_root = root.0.join(".blueprint");

    // Ensure sandbox dir exists.
    fs::create_dir_all(&blueprint_root)
        .await
        .map_err(|e| e.to_string())?;

    // Full target path.
    let full: PathBuf = blueprint_root.join(rel);

    // Make sure parent dirs exist for the new file.
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }

    // Canonicalise parent dir to block `../` tricks and symlink escapes.
    let canon_parent = full
        .parent()
        .expect("has parent")
        .canonicalize()
        .map_err(|e| e.to_string())?;

    let canon_blueprint = blueprint_root.canonicalize().map_err(|e| e.to_string())?;

    if !canon_parent.starts_with(&canon_blueprint) {
        return Err("Access outside .blueprint is forbidden".into());
    }

    // Finally write the file.
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
    // 1) Early sanity: non-empty, relative, no `..` segments
    let rel = Path::new(&path);
    if rel.as_os_str().is_empty()
        || rel.is_absolute()
        || rel.components().any(|c| c == Component::ParentDir)
    {
        return Err("`path` must be a non-empty, relative path with no `..`".into());
    }

    // 2) Compute the absolute target location
    let full = root.0.join(rel);

    // 3) Create parent dirs, then immediately verify they sit under root
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;

        let canon_parent = parent.canonicalize().map_err(|e| e.to_string())?;
        let canon_root = root.0.canonicalize().map_err(|e| e.to_string())?;

        if !canon_parent.starts_with(&canon_root) {
            return Err("Access outside project root is forbidden".into());
        }
    }

    // 4) Finally write the file
    fs::write(&full, content)
        .await
        .with_context(|| format!("Failed to write file: {}", full.display()))
        .map_err(|e| e.to_string())
}
