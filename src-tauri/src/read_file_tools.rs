// src-tauri/src/fs_tools.rs (replaces the previous walker)
use anyhow::{bail, Context, Result};
use ignore::WalkBuilder;
use std::ffi::OsStr;
use std::fmt::Write as _;
use std::path::{Path, PathBuf};
use tauri::{command, State};
use tokio::{fs, task};

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
    pub(crate) fn resolve(&self, user_rel: &Path) -> Result<PathBuf> {
        let full = self.0.join(user_rel).canonicalize().with_context(|| {
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

#[command]
pub async fn read_file(mut path: String, root: State<'_, ProjectRoot>) -> Result<String, String> {
    // Treat "/" (or empty) as "./"
    if path.trim() == "/" || path.trim().is_empty() {
        path = ".".into();
    }

    let full = root.resolve(Path::new(&path)).map_err(|e| e.to_string())?;

    fs::read_to_string(&full)
        .await
        .with_context(|| format!("Failed to read file: {}", full.display()))
        .map_err(|e| e.to_string())
}

#[command]
pub async fn list_directory_tree(
    mut path: String,
    root: State<'_, ProjectRoot>,
) -> Result<String, String> {
    // Treat "/" (or empty) as "./"
    if path.trim() == "/" || path.trim().is_empty() {
        path = ".".into();
    }

    let dir = root.resolve(Path::new(&path)).map_err(|e| e.to_string())?;

    let tree = task::spawn_blocking(move || -> Result<String> {
        let walker = WalkBuilder::new(&dir)
            .add_custom_ignore_filename(".blueprintignore")
            .standard_filters(false)
            .follow_links(false)
            .sort_by_file_name(|a: &OsStr, b: &OsStr| a.cmp(b))
            .build();

        let mut buf = String::new();
        writeln!(buf, "./")?;

        for dent in walker {
            let dent = dent?;
            if dent.depth() == 0 {
                continue;
            }
            let indent = dent.depth() * 2;
            let name = dent.file_name().to_string_lossy();

            if dent.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                writeln!(buf, "{:indent$}{name}/", "", indent = indent)?;
            } else {
                writeln!(buf, "{:indent$}{name}", "", indent = indent)?;
            }
        }
        Ok(buf)
    })
    .await
    .map_err(|e| e.to_string())? // JoinError
    .map_err(|e| e.to_string())?; // anyhow::Error

    Ok(tree)
}

#[command]
pub async fn read_graph_yaml(root: State<'_, ProjectRoot>) -> Result<String, String> {
    // Relative path inside the project
    let rel = Path::new(".blueprint").join("graph.yaml");

    // Canonicalise & sandbox-check
    let full = root.resolve(&rel).map_err(|e| e.to_string())?;

    // Async read
    fs::read_to_string(&full)
        .await
        .with_context(|| format!("Failed to read file: {}", full.display()))
        .map_err(|e| e.to_string())
}
