pub mod read_file_tools;
pub mod write_file_tools;

pub mod system_tools;

pub use read_file_tools::{get_project_root, list_directory_tree, read_file, read_graph_yaml};
pub use system_tools::run_command;

pub use write_file_tools::{write_blueprint_file, write_project_file};

use tauri::menu::{MenuBuilder, MenuEvent, SubmenuBuilder};

use tauri::Wry;

type Menu    = tauri::menu::Menu<Wry>;
type Submenu = tauri::menu::Submenu<Wry>;

use tauri::{
    webview::{WebviewWindowBuilder},
    WebviewUrl
};
use tauri_plugin_dialog::{DialogExt, FilePath::{Path, Url}};
use uuid::Uuid;

use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{Emitter};


use std::path::{PathBuf};
use std::collections::HashMap;
use std::sync::Mutex;

type Projects = Mutex<HashMap<String, PathBuf>>;   // label → projectRoot

fn build_app_menu(app: &tauri::AppHandle) -> Submenu {
    SubmenuBuilder::new(app, "blueprint")
        .text("about", "About")
        .separator()
        .quit()
        .build()
        .expect("Failed to build app menu")
}

fn build_file_menu(app: &tauri::AppHandle) -> Submenu {
    SubmenuBuilder::new(app, "File")
        .text("select_project", "Select Project…")
        .separator()
        .build()
        .expect("Failed to build file menu")
}

pub fn build_menu(app: &tauri::AppHandle) -> Menu {
    let app_menu = build_app_menu(app);
    let file_menu = build_file_menu(app);

    // --- Edit submenu with cross-platform shortcuts --------------------------
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .separator()
        .select_all()
        .build()
        .expect("failed to build Edit submenu");

    // --- Assemble the root menubar ------------------------------------------
    MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu, &edit_menu])
        .build()
        .expect("failed to build application menu")
}

/// Spawns a new project window and closes the current one
pub fn spawn_project_window(
    app_handle: &tauri::AppHandle,
    project_root: PathBuf,
) -> tauri::Result<()> {
    // 1️⃣ unique, collision-proof label
    let label = format!("proj-{}", Uuid::new_v4());
    let url = WebviewUrl::App("index.html".into());

    // 3️⃣ use folder name as the window title
    let title = project_root
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Project")
        .to_owned();

    // 4️⃣ launch on the async runtime to dodge the Windows dead-lock
    let app_clone = app_handle.clone();
    // let _current = current_window.clone();
    tauri::async_runtime::spawn(async move {
        if let Ok(new_win) = WebviewWindowBuilder::new(&app_clone, label, url)
            .title(title)
            .build()
        {
            // // close the caller once the fresh window exists
            // new_win.once("tauri://created", move |_| {
            //     let _ = current.close();
            // });
        }
    });

    Ok(())
}

fn handle_menu_event(app_handle: &tauri::AppHandle, event: MenuEvent) {
    if event.id().0 == "select_project" {
        let app = app_handle.clone();                // Arc → owned, 'static

        app.dialog()
            .file()
            .pick_folder(move |folder| {
                match folder {
                    Some(Path(p)) => {
                        println!("Picked folder: {p:?}");
                        // borrow _within_ the clone, not the stack var
                        let _ = spawn_project_window(&app, p);
                    }
                    Some(Url(u)) => eprintln!("Chose virtual folder: {u}"),
                    None => println!("Folder selection cancelled"),
                }
            });
    }
}

fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        app.handle().plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )?;
    }

    let handle = app.handle();
    let thread_app = handle.clone();

    // let path = "/Users/yao/blueprint/blueprint/test-pokemon";
    // let (tx, rx) = std::sync::mpsc::channel();

    // // watcher lives in its own thread
    // std::thread::spawn(move || {
    //     let mut watcher = RecommendedWatcher::new(tx, Config::default()).unwrap();
    //     watcher.watch(path.as_ref(), RecursiveMode::Recursive).unwrap(); // real watching!

    //     for res in rx {
    //         if let Ok(event) = res {
    //             // purely backend work here; remove this block if you don't need UI
    //             thread_app.emit("fs-event", &event).unwrap();
    //         }
    //     }
    // });

    let menu = build_menu(&handle);
    app.set_menu(menu)?;
    app.on_menu_event(handle_menu_event);

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_pty::init())
        .manage(read_file_tools::ProjectRoot(
            "/Users/yao/blueprint/blueprint/test-pokemon".into(),
        ))
        .setup(setup_app)
        .invoke_handler(tauri::generate_handler![
            get_project_root,
            read_file,
            list_directory_tree,
            read_graph_yaml,
            write_blueprint_file,
            write_project_file,
            run_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
