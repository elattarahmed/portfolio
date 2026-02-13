# Portfolio Website Architecture

This document describes the current architecture and implementation of the portfolio website.

## 1. Backend: Rust (Axum)

- **Path**: `/Users/ahmelatt/Documents/GIT/portfolio/rust`
- **Framework**: Axum
- **Function**:
     - Serves static assets from `assets/static` (including the bundled React app).
     - Provides an API endpoint `/api/content` which serves the `content.json` file.
     - **Crucial Note**: The `main.rs` reads `assets/content.json` on each request to ensure live updates without restarting the server. It uses `no-cache` headers.

## 2. Data Source: `content.json`

- **Primary Location**: `/Users/ahmelatt/Documents/GIT/portfolio/content.json`
- **Server Location**: `/Users/ahmelatt/Documents/GIT/portfolio/rust/assets/content.json`
- **Synchronization**: These two files are **hard-linked**. Modifying one instantly modifies the other (same inode).
- **Structure**: Contains all site text (Hero, About, Education, Projects, etc.).

## 3. Frontend: React + Bundled Assets

- **Path**: `/Users/ahmelatt/Documents/GIT/portfolio/rust/assets/static`
- **Stack**: React (bundled with Vite).
- **Entry Point**: `index.html`.
- **Bundled Files**: `tj-assets/index-*.js`, `tj-assets/index-*.css`.
- **Limitation**: The bundled React application **does not** contain logic to dynamically render:
     - The "Last Modified" date in the Hero section.
     - The detailed sub-items for the Education section (e.g., specific courses for each year).

## 4. The Patch Mechanism (`patch.js`)

To solve the limitation above without rebuilding the React app from source (which we don't have access to modify easily), a manual patch script is injected.

- **File**: `/Users/ahmelatt/Documents/GIT/portfolio/rust/assets/static/patch.js`
- **Injection**: It is referenced at the end of `body` in `index.html`.
- **Workflow**:
     1. Fetches `/api/content`.
     2. Waits for the DOM to be rendered by the React bundle.
     3. **Hero Date**:
           - Finds the "green" date element (class `text-terminal-dim` or `text-primary`).
           - Updates its text with the date from `content.json`.
           - **Important**: Removes duplicate "Dernière mise à jour :" text from the white description paragraph to avoid redundancy.
     4. **Education Details**:
           - Finds the "ESGI" header.
           - Locates the correct container (inside the card).
           - Appends a new `div` with class `.patched-details`.
           - Iterates through `sub_items` in `content.json` and renders them as styled HTML lists.

## 5. Development Workflow

- **Run Server**: `cargo run` inside `portfolio/rust`.
- **Modify Content**: Edit `portfolio/content.json`.
- **Visual Check**: Refresh `http://localhost:8443`.
- **Assets**: Frontend static files are in `portfolio/rust/assets/static`.

## Key Files

- `portfolio/content.json` (Data source)
- `portfolio/rust/src/main.rs` (Backend logic)
- `portfolio/rust/assets/static/index.html` (Entry point)
- `portfolio/rust/assets/static/patch.js` (DOM manipulation script)
