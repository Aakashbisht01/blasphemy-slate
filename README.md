# Blasphemy Slate: Minimalist Bookmark Manager

[!(https://user-images.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/assets/popup-screenshot.png)]() A local-first, high-performance Chrome extension offering a fast and private alternative to standard browser bookmarks. It focuses on speed, organization, and data portability, working without any cloud dependency.

---

## ✨ Core Features

### 1. Quick Saving & Editing (The Popup)
* **Auto-Capture:** Automatically grabs the current tab's title and URL.
* **Tagging:** Add custom tags to organize and search your bookmarks.
* **Folder Selection:** Assign new links to custom folders (or the default "Inbox").
* **Real-time Search:** Instantly filter all bookmarks by title, URL, tag, or folder.

### 2. Full Management Dashboard (The Options Page)
* **Folder Management:** Create, rename, and delete custom folders.
* **Drag-and-Drop:** Easily move bookmarks into folders by dragging and dropping them.
* **Full CRUD:** A complete interface to Create, Read, Update, and Delete all bookmarks.
* **Clear All:** A utility to wipe all bookmarks and custom folders to start fresh.

### 3. Data Portability
* **Export (HTML):** Download all your bookmarks and folders as a standard HTML file, compatible with any browser.
* **Import (HTML):** Import bookmarks from any standard HTML file (e.g., from Chrome, Firefox). New folders are created automatically.

---

## Project File Structure

This extension uses a standard, modular structure:
Blasphemy-Slate/ │ ├── manifest.json (Core extension manifest) │ ├── background/ │ ├── background.js (Service worker for context menus, notifications) │ └── utils/ │ └── storage.js (Handles all logic for talking to chrome.storage) │ ├── icons/ │ ├── icon16.png │ ├── icon48.png │ └── icon128.png │ ├── options/ │ ├── options.html (The main management dashboard UI) │ ├── options.css │ └── options.js (Logic for the dashboard, folders, import/export) │ └── popup/ ├── popup.html (The main extension popup UI) ├── popup.css └── popup.js (Logic for the popup, quick-saving, search)
---

## ⚙ Installation (Developer Mode)

To run this extension locally:

1.  **Clone or Download:** Get this project's files onto your local machine.
    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
    ```
2.  **Open Extensions:** Navigate to `chrome://extensions` in your browser (Chrome, Edge, etc.).
3.  **Enable Developer Mode:** Toggle the **Developer Mode** switch in the top-right corner.
4.  **Load Unpacked:** Click the **Load unpacked** button that appears.
5.  **Select Folder:** Select the top-level project directory (the one containing `manifest.json`).

The Blasphemy Slate icon should now appear in your browser's toolbar.

---

## 📖 Usage Guide

### A. The Popup (`popup/popup.html`)
1.  **Click the Icon:** Click the extension icon in your toolbar to open the popup.
2.  **Save:** Review the auto-filled Title and URL, add optional Tags, select a Folder, and click **Save Bookmark**.
3.  **Search:** Use the search bar to find bookmarks by any keyword.
4.  **Go to Settings:** Click the **Settings gear (⚙️)** icon at the top to open the full Options Page dashboard.

### B. The Options Page (`options/options.html`)
*Access this page via the Settings (⚙️) icon in the popup.*

* **Folder Organization:** Use the input field and **Create Folder** button to add new categories. Use the 🗑 icon next to a custom folder to delete it (this moves its bookmarks to the Inbox).
* **Bookmark Management:** Click and drag a bookmark from the "Manage Bookmarks" section and drop it onto the desired folder name in the "Folder Organization" section to move it.
* **Data Utilities:**
    * **Export:** Click **Export Bookmarks (HTML)** to download a backup.
    * **Import:** Click **Import Bookmarks** to select and upload an HTML file.
    * **Clear All:** Use the **Clear All Bookmarks** button with caution to reset all extension data.
