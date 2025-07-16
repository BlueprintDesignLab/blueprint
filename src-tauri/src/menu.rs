use tauri::{menu::{MenuBuilder, MenuEvent, SubmenuBuilder}, Wry};
use tauri_plugin_dialog::{
    DialogExt,
    FilePath::{Path, Url},
};

use crate::project::spawn_project_window;

type Menu = tauri::menu::Menu<Wry>;
type Submenu = tauri::menu::Submenu<Wry>;


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

pub fn handle_menu_event(app_handle: &tauri::AppHandle, event: MenuEvent) {
    if event.id().0 == "select_project" {
        let app = app_handle.clone(); // Arc → owned, 'static

        app.dialog().file().pick_folder(move |folder| {
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