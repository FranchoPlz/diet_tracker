use tauri_plugin_shell::ShellExt;

#[tauri::command]
async fn parse_pdf(app: tauri::AppHandle, path: String) -> Result<String, String> {
    if !std::path::Path::new(&path).exists() {
        return Err(format!("Archivo no encontrado: {}", path));
    }
    let output = app.shell()
        .sidecar("diet_parser")
        .map_err(|e| format!("Error iniciando sidecar: {}", e))?
        .args(["parse", &path])
        .output()
        .await
        .map_err(|e| format!("Error ejecutando sidecar: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Error del parser (path={}): {}", path, stderr))
    }
}

#[tauri::command]
async fn calculate_totals(
    app: tauri::AppHandle,
    pdf_path: String,
    selection_json: String,
) -> Result<String, String> {
    let temp_path = std::env::temp_dir().join("diet_selection.json");
    std::fs::write(&temp_path, &selection_json).map_err(|e| e.to_string())?;
    let temp_str = temp_path.to_string_lossy().to_string();

    let output = app.shell()
        .sidecar("diet_parser")
        .map_err(|e| e.to_string())?
        .args(["calculate", &pdf_path, &temp_str])
        .output()
        .await
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn export_csv(
    app: tauri::AppHandle,
    totals_json: String,
    output_path: String,
) -> Result<String, String> {
    let temp_path = std::env::temp_dir().join("diet_totals.json");
    std::fs::write(&temp_path, &totals_json).map_err(|e| e.to_string())?;
    let temp_str = temp_path.to_string_lossy().to_string();

    let output = app.shell()
        .sidecar("diet_parser")
        .map_err(|e| e.to_string())?
        .args(["export", &temp_str, &output_path])
        .output()
        .await
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::env::set_var("PYTHONUTF8", "1");
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![parse_pdf, calculate_totals, export_csv])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
