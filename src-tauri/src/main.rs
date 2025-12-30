#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use dotenvy::dotenv;
use serde_json::Value;

#[tauri::command]
async fn transcribe_audio(audio: Vec<u8>) -> Result<String, String> {
    dotenv().ok();

    let api_key = env::var("DEEPGRAM_API_KEY")
        .map_err(|_| "DEEPGRAM_API_KEY not found")?;

    let client = reqwest::Client::new();

    let response = client
        .post("https://api.deepgram.com/v1/listen?punctuate=true&language=en")
        .header("Authorization", format!("Token {}", api_key))
        .header("Content-Type", "audio/webm")
        .body(audio)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Value = response.json().await.map_err(|e| e.to_string())?;

    let transcript = json["results"]["channels"][0]["alternatives"][0]["transcript"]
        .as_str()
        .unwrap_or("No speech detected")
        .to_string();

    Ok(transcript)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![transcribe_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
