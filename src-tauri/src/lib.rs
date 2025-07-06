pub mod file_tools;
pub mod system_tools;

pub use file_tools::{read_file, list_directory};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(file_tools::ProjectRoot("/Users/yao/Documents/projects/blueprint/static".into()))   // canonicalise here if you want
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      read_file,
      list_directory,
      // run_command,
      // freezeTest
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}