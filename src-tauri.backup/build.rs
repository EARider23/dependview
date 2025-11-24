fn main() {
  // Generate the Tauri context at build time. This sets OUT_DIR and prepares assets.
  tauri_build::generate_context!();
}
