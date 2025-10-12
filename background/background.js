import { saveBookmark } from './utils/storage.js'; 

const CONTEXT_MENU_ID = "bookmark-current-page";
const INBOX_FOLDER_ID = 'inbox'; 

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: "Save Page to Blasphemy Slate",
        contexts: ["page"] 
    });
    console.log("Context menu item created.");
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID) {
        if (tab && tab.url && tab.url.startsWith('http')) {
            const bookmarkData = {
                url: tab.url,
                title: tab.title || "Untitled Page", 
                tags: "quick-add", 
                folderId: INBOX_FOLDER_ID, 
                timestamp: Date.now()
            };

            try {
                const response = await saveBookmark(bookmarkData); 
                
                if (response.startsWith("Error")) {
                    console.error("Failed to save bookmark via background:", response);
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: '../icons/icon48.png', 
                        title: 'Blasphemy Slate Error',
                        message: 'Failed to save bookmark: ' + response,
                    });
                } else {
                    console.log("Bookmark saved successfully via background:", bookmarkData.title);
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: '../icons/icon48.png',
                        title: 'Bookmark Saved!',
                        message: `Saved: ${bookmarkData.title}`,
                        silent: true
                    });
                }
            } catch (error) {
                console.error("Storage API error in background service worker:", error);
            }
        } else {
            console.warn("Cannot bookmark this system page or non-HTTP URL.");
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon48.png',
                title: 'Blasphemy Slate',
                message: 'Cannot save this type of page (e.g., system page or local file).',
            });
        }
    }
});