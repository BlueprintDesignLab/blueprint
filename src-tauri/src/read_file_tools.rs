// src-tauri/src/fs_tools.rs (replaces the previous walker)
use anyhow::{Context, Result};
use ignore::WalkBuilder;
use std::{ffi::OsStr, path::PathBuf};
use std::fmt::Write as _;
use std::path::Path;
use tauri::{command, Window};
use tokio::{fs, task};

use crate::resolve;
use crate::{project::get_window_root};

#[command]
pub async fn read_file(path: String, window: Window) -> Result<String, String> {
    let root: PathBuf = get_window_root(&window).unwrap();
    let rel: PathBuf = path.into();

    let full = resolve(root, &rel).map_err(|e| e.to_string())?;

    fs::read_to_string(&full)
        .await
        .with_context(|| format!("Failed to read file: {}", full.display()))
        .map_err(|e| e.to_string())
}

#[command]
pub async fn list_directory_tree(
    path: String,
    window: Window
) -> Result<String, String> {
    let root: PathBuf = get_window_root(&window).unwrap();
    let rel: PathBuf = path.into();

    let full = resolve(root, &rel).map_err(|e| e.to_string())?;

    let tree = task::spawn_blocking(move || -> Result<String> {
        let walker = WalkBuilder::new(&full)
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
