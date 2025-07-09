pub mod write_file_tools;
pub mod read_file_tools;

pub mod system_tools;

pub use read_file_tools::{read_file, list_directory_tree, read_graph_yaml};
pub use write_file_tools::{write_blueprint_file, write_project_file};
pub use system_tools::{run_command};

use tauri::{
  menu::{MenuBuilder, SubmenuBuilder, MenuEvent},
};
use tauri_plugin_dialog::DialogExt;
// use tauri_plugin_fs::

fn build_app_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::menu::Submenu<R> {
    SubmenuBuilder::new(app, "blueprint")
        .text("about", "About")
        .separator()
        .quit()
        .build()
        .expect("Failed to build app menu")
}

fn build_file_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::menu::Submenu<R> {
    SubmenuBuilder::new(app, "File")
        .text("select_project", "Select Project…")
        .separator()
        .quit()
        .build()
        .expect("Failed to build file menu")
}

fn build_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::menu::Menu<R> {
    let app_menu = build_app_menu(app);
    let file_menu = build_file_menu(app);
    MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu])
        .build()
        .expect("Failed to build full menu")
}

fn handle_menu_event<R: tauri::Runtime>(app_handle: &tauri::AppHandle<R>, event: MenuEvent) {
    println!("menu event: {:?}", event.id());

    match event.id().0.as_str() {
        "select_project" => {
            println!("TODO, change ProjectRoot!!!");

            app_handle
                .dialog()
                .file()
                .pick_folder(|folder| {
                    match folder {
                        Some(path) => println!("Picked folder: {}", path),
                        None => println!("Folder selection cancelled"),
                    }
                });
            
        }
        _ => {}
    }
}


fn setup_app<R: tauri::Runtime>(app: &mut tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        app.handle().plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )?;
    }

    let handle = app.handle();
    let menu = build_menu(&handle);
    app.set_menu(menu)?;

    app.on_menu_event(handle_menu_event);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .manage(read_file_tools::ProjectRoot("/Users/yao/blueprint/blueprint/testPokemon2".into()))
    .setup(setup_app)
    .invoke_handler(tauri::generate_handler![
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