// src-tauri/src/fs_tools.rs
use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use tauri::{command, State};
use tokio::fs;

/// Store the one-and-only project root.
///
/// The path should be **absolute & canonical** when you create the struct
/// so we don’t have to re-canonicalise it on every call.
#[derive(Debug)]
pub struct ProjectRoot(pub PathBuf);

impl ProjectRoot {
    /// Resolve a user-supplied *relative* path safely inside the sandbox.
    ///
    /// * Rejects `../../etc/passwd` escapes.
    /// * Resolves symlinks so `root → tmp → /` tricks don’t slip through.
    fn resolve(&self, user_rel: &Path) -> Result<PathBuf> {
        let full = self.0.join(user_rel).canonicalize().with_context(|| {
            format!("Path does not exist or cannot be resolved: {}", user_rel.display())
        })?;

        if !full.starts_with(&self.0) {
            bail!("Access outside project root is forbidden");
        }
        Ok(full)
    }
}

#[command]
pub async fn read_file(
    path: String,
    root: State<'_, ProjectRoot>,
) -> Result<String, String> {
    let full = root
        .resolve(Path::new(&path))
        .map_err(|e| e.to_string())?;

    fs::read_to_string(&full)
        .await
        .with_context(|| format!("Failed to read file: {}", full.display()))
        .map_err(|e| e.to_string())
}

#[command]
pub async fn list_directory(
    path: String,
    root: State<'_, ProjectRoot>,
) -> Result<Vec<String>, String> {
    let dir = root
        .resolve(Path::new(&path))
        .map_err(|e| e.to_string())?;

    let mut names = Vec::new();
    let mut rd = fs::read_dir(&dir)
        .await
        .with_context(|| format!("Failed to read directory: {}", dir.display()))
        .map_err(|e| e.to_string())?;

    while let Some(entry) = rd.next_entry().await.map_err(|e| e.to_string())? {
        names.push(entry.file_name().to_string_lossy().into_owned());
    }
    Ok(names)
}