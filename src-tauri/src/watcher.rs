use ignore::gitignore::{Gitignore, GitignoreBuilder};
use notify::{
    event::{ModifyKind, RenameMode},
    Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
    sync::mpsc,
    time::UNIX_EPOCH,
};
use tauri::{command, Emitter, Manager, Window};

use crate::ProjectRoot;

// inside src/watcher.rs
#[derive(Serialize, Clone)]
struct FsEvent {
    kind: String,        // human-readable kind
    paths: Vec<PathBuf>, // filtered paths
}

// ---------- same structs as before ----------
#[derive(Serialize, Deserialize, Debug, Clone)]
struct FileMeta {
    mtime: u64,
    size: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Snapshot {
    files: HashMap<String, FileMeta>,
}

const WATCHER_PATH: &str = ".blueprint/blueprintwatcher.json";

// ---------- helper utilities ----------
fn build_gitignore(root: &Path) -> Gitignore {
    let mut builder = GitignoreBuilder::new(root);

    // 1. built-ins that always apply
    builder.add_line(None, ".git/").unwrap();
    builder.add_line(None, ".svn/").unwrap();
    builder.add_line(None, ".hg/").unwrap();
    builder.add_line(None, WATCHER_PATH).unwrap();

    // 2. project .gitignore
    let _ = builder.add(root.join(".gitignore"));
    let _ = builder.add(root.join(".blueprintignore"));

    builder.build().unwrap_or_else(|_| Gitignore::empty())
}

fn is_ignored(gi: &Gitignore, p: &Path) -> bool {
    matches!(
        gi.matched_path_or_any_parents(p, p.is_dir()),
        ignore::Match::Ignore(_)
    )
}

fn scan_dir(root: &Path, gi: &Gitignore) -> HashMap<String, FileMeta> {
    let mut files = HashMap::new();
    for entry in walkdir::WalkDir::new(root).into_iter().flatten() {
        let path = entry.path();
        if path.is_file() && !is_ignored(gi, path) {
            if let Ok(rel) = path.strip_prefix(root) {
                if let Some(meta) = get_file_meta(path) {
                    files.insert(rel.to_string_lossy().to_string(), meta);
                }
            }
        }
    }
    files
}

fn get_file_meta(path: &Path) -> Option<FileMeta> {
    fs::metadata(path).ok().and_then(|m| {
        let mtime = m
            .modified()
            .ok()?
            .duration_since(UNIX_EPOCH)
            .ok()?
            .as_secs();
        Some(FileMeta {
            mtime,
            size: m.len(),
        })
    })
}

// ---------- Tauri command ----------
#[command]
pub async fn start_watcher(window: Window) -> Result<(), String> {
    let root = window.state::<ProjectRoot>().0.clone();
    let root_path = PathBuf::from(&root);

    let gi = build_gitignore(&root_path);

    // offline snapshot logic (optional but kept for parity)
    let snapshot_file = root_path.join(WATCHER_PATH);
    let old = load_snapshot(&snapshot_file);
    let new_files = scan_dir(&root_path, &gi);
    let new_snapshot = Snapshot { files: new_files };
    if let Some(old_snap) = old {
        compare_snapshots(&old_snap, &new_snapshot);
    }
    save_snapshot(&snapshot_file, &new_snapshot);

    // spawn the actual watcher on a dedicated thread
    std::thread::spawn(move || {
        let (tx, rx) = mpsc::channel::<notify::Result<Event>>();
        let mut watcher =
            RecommendedWatcher::new(tx, notify::Config::default()).map_err(|e| e.to_string())?;

        watcher
            .watch(&root_path, RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;

        // keep the thread alive until the channel is closed
        while let Ok(res) = rx.recv() {
            // inside the watcher loop
            if let Ok(mut ev) = res {
                ev.paths.retain(|p| !is_ignored(&gi, p));
                if !ev.paths.is_empty() {
                    let kind = match ev.kind {
                        EventKind::Create(_) => "create",
                        EventKind::Modify(ModifyKind::Data(_)) => "modify_data",
                        EventKind::Modify(ModifyKind::Metadata(_)) => "modify_meta",
                        EventKind::Modify(ModifyKind::Name(mode)) => match mode {
                            RenameMode::From => "modNameDelete", // single path → file vanished
                            RenameMode::To => "modNameCreate",   // single path → file appeared
                            RenameMode::Both => "modNameRename", // two paths   → old -> new
                            RenameMode::Any => "modNameMove",    // fallback
                            RenameMode::Other => "modNameOther",
                        },
                        EventKind::Remove(_) => "remove",
                        _ => "other",
                    };
                    let _ = window.emit(
                        "fs-event",
                        FsEvent {
                            kind: kind.to_string(),
                            paths: ev.paths,
                        },
                    );
                }
            }
        }
        Ok::<(), String>(())
    });

    Ok(())
}

// ---------- snapshot helpers (unchanged) ----------
fn load_snapshot(path: &Path) -> Option<Snapshot> {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn save_snapshot(path: &Path, snap: &Snapshot) {
    let _ = fs::write(path, serde_json::to_string_pretty(snap).unwrap_or_default());
}

fn compare_snapshots(old: &Snapshot, new: &Snapshot) {
    let old_set: HashSet<_> = old.files.keys().collect();
    let new_set: HashSet<_> = new.files.keys().collect();

    for added in new_set.difference(&old_set) {
        println!("[OFFLINE] Added: {}", added);
    }
    for removed in old_set.difference(&new_set) {
        println!("[OFFLINE] Removed: {}", removed);
    }
    for f in old_set.intersection(&new_set) {
        let o = &old.files[*f];
        let n = &new.files[*f];
        if o.mtime != n.mtime || o.size != n.size {
            println!("[OFFLINE] Modified: {}", f);
        }
    }
}
