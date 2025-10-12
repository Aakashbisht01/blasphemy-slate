const browserAPI = window.browser || window.chrome;
const BOOKMARK_KEY = 'blasphemySlateBookmarks'; 
const FOLDER_KEY = 'blasphemySlateFolders'; 

// FOLDER Management Functions 

export async function getFolders() {
    try {
        const result = await browserAPI.storage.local.get({ [FOLDER_KEY]: [] });
        return result[FOLDER_KEY];
    } catch (error) {
        console.error("Storage Error: Failed to retrieve folders.", error);
        return [];
    }
}

export async function setFolders(folders) {
    try {
        await browserAPI.storage.local.set({ [FOLDER_KEY]: folders });
        return "Folders saved successfully.";
    } catch (error) {
        console.error("Storage Error: Failed to set folders.", error);
        return "Error: Failed to set folders.";
    }
}

export async function addFolder(name) {
    if (!name) {
        throw new Error("Folder name is required.");
    }

    const currentFolders = await getFolders();
    

    const newFolder = {
        id: name.toLowerCase().replace(/\s/g, '-') + '-' + Date.now().toString().slice(-4),
        name: name,
        timestamp: Date.now()
    };
    
    const updatedFolders = [...currentFolders, newFolder];
    await setFolders(updatedFolders);
    return "Folder added.";
}

export async function deleteFolder(idToDelete) {
    if (!idToDelete || idToDelete === 'inbox') {
        throw new Error("Cannot delete the default Inbox folder or missing ID.");
    }
    
    const currentFolders = await getFolders();
    const updatedFolders = currentFolders.filter(f => f.id !== idToDelete);
    
    await setFolders(updatedFolders);
    return "Folder deleted.";
}


// BOOKMARK Management Functions 

export async function getBookmarks() {
    try {
        const result = await browserAPI.storage.local.get({ [BOOKMARK_KEY]: [] });
        return result[BOOKMARK_KEY];
    } catch (error) {
        console.error("Storage Error: Failed to retrieve bookmarks.", error);
        return [];
    }
}


export async function setBookmarks(bookmarks) {
    try {
        await browserAPI.storage.local.set({ [BOOKMARK_KEY]: bookmarks });
        return "Bookmarks saved successfully.";
    } catch (error) {
        console.error("Storage Error: Failed to set bookmarks.", error);
        return "Error: Failed to set bookmarks.";
    }
}


export async function saveBookmark(newBookmarkData) {
    if (!newBookmarkData || !newBookmarkData.url || !newBookmarkData.title) {
        return "Error: Bookmark must have a URL and Title.";
    }

    try {
        const currentBookmarks = await getBookmarks();

        if (currentBookmarks.some(b => b.url === newBookmarkData.url)) {
            return "Error: URL already saved as a bookmark.";
        }

        const newBookmark = {
            ...newBookmarkData,
            id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()) 
        };

        const updatedBookmarks = [...currentBookmarks, newBookmark];
        await setBookmarks(updatedBookmarks);
        return "Bookmark saved successfully.";
    } catch (error) {
        console.error("Storage Error: Failed to save bookmark.", error);
        return `Error: Failed to save bookmark. ${error.message}`;
    }
}


export async function updateBookmark(id, updates) {
    if (!id || !updates) {
        return "Error: ID and update data required for modification.";
    }

    try {
        let currentBookmarks = await getBookmarks();
        const index = currentBookmarks.findIndex(b => b.id === id);

        if (index === -1) {
            return "Error: Bookmark not found.";
        }

        currentBookmarks[index] = {
            ...currentBookmarks[index],
            ...updates
        };

        await setBookmarks(currentBookmarks);
        return "Bookmark updated successfully.";

    } catch (error) {
        console.error("Storage Error: Failed to update bookmark.", error);
        return `Error: Failed to update bookmark. ${error.message}`;
    }
}


export async function deleteBookmark(idToDelete) {
    if (!idToDelete) {
        return "Error: No ID provided for deletion.";
    }

    try {
        const currentBookmarks = await getBookmarks();
        const updatedBookmarks = currentBookmarks.filter(b => b.id !== idToDelete);

        if (currentBookmarks.length === updatedBookmarks.length) {
            return "Error: Bookmark not found for deletion.";
        }

        await setBookmarks(updatedBookmarks);
        return "Bookmark deleted successfully.";
    } catch (error) {
        console.error("Storage Error: Failed to delete bookmark.", error);
        return `Error: Failed to delete bookmark. ${error.message}`;
    }
}

export async function clearAllBookmarks() {
    try {
        await browserAPI.storage.local.set({ [BOOKMARK_KEY]: [] }); 
        return "All bookmarks cleared successfully.";
    } catch (error) {
        console.error("Storage Error: Failed to clear all bookmarks.", error);
        return `Error: Failed to clear all bookmarks. ${error.message}`;
    }
}