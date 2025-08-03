
// #[tauri::command]
// pub async fn pty_foreground_pgid(fd: RawFd) -> Result<pid_t, String> {
//     unsafe {
//         let pgid = tcgetpgrp(fd);
//         if pgid == -1 {
//             Err("tcgetpgrp failed".into())
//         } else {
//             Ok(pgid)
//         }
//     }
// }

#[tauri::command]
pub fn get_user_shell() -> String {
    // On Windows return "powershell" or whatever you prefer
    #[cfg(target_os = "windows")]
    {
        std::env::var("COMSPEC").unwrap_or_else(|_| "powershell.exe".into())
    }

    // On Unix‐likes read $SHELL
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".into())
    }
}