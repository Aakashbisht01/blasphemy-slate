import { getBookmarks, saveBookmark, deleteBookmark, getFolders } from '../background/utils/storage.js'; 

// --- Global State and DOM References ---
const titleInput = document.getElementById('titleInput');
const urlInput = document.getElementById('urlInput');
const tagsInput = document.getElementById('tagsInput');
const folderSelect = document.getElementById('folderSelect'); 
const saveBtn = document.getElementById('saveBtn');
const bookmarkList = document.getElementById('bookmarkList');
const searchInput = document.getElementById('searchInput');
const goToOptionsBtn = document.getElementById('goToOptions'); 

let bookmarks = []; 
let folders = []; 
const INBOX_FOLDER_ID = 'inbox';


// --- Folder Helpers ---

const loadFoldersAndPopulateSelect = async () => {
    try {
        const fetchedFolders = await getFolders();
        
        folders = fetchedFolders || [];
        if (!folders.some(f => f.id === INBOX_FOLDER_ID)) {
            folders.unshift({ id: INBOX_FOLDER_ID, name: 'Inbox' });
        }
        
        folderSelect.innerHTML = ''; 

        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            folderSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error("Failed to load and populate folders:", error);
        folderSelect.innerHTML = '<option value="inbox">Inbox (Error)</option>';
    }
};

const getFolderNameById = (id) => {
    const folder = folders.find(f => f.id === id);
    return folder ? folder.name : 'Inbox (Missing)';
};


// --- Core Feature Functions ---

const autoFillCurrentTab = async () => {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (activeTab && activeTab.url && activeTab.title) {
            if (activeTab.url.startsWith('http')) {
                titleInput.value = activeTab.title;
                urlInput.value = activeTab.url;
            } else {
                titleInput.value = 'Local or System Page';
                urlInput.value = activeTab.url;
            }
        }
    } catch (e) {
        console.error("Could not auto-fill current tab info:", e);
        titleInput.placeholder = 'Title (Failed to auto-fill)';
        urlInput.placeholder = 'URL (Failed to auto-fill)';
    }
};

const renderBookmarks = (listToRender) => {
    bookmarkList.innerHTML = ''; 

    if (!listToRender || listToRender.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = bookmarks.length === 0 
            ? 'No bookmarks saved yet. Save one above!'
            : 'No matching bookmarks found for your search.';
        bookmarkList.appendChild(emptyMessage);
        return;
    }
    
    listToRender.sort((a, b) => parseInt(b.id) - parseInt(a.id)); 

    listToRender.forEach(bookmark => {
        const li = document.createElement('li');
        li.className = 'bookmark-item';
        li.dataset.id = bookmark.id;
        
        const folderName = getFolderNameById(bookmark.folderId || INBOX_FOLDER_ID);

        li.innerHTML = `
            <div class="bookmark-info">
                <a href="${bookmark.url}" target="_blank" class="bookmark-title" title="${bookmark.url}">${bookmark.title}</a>
                <p class="bookmark-meta">
                    <span class="bookmark-folder">📁 ${folderName}</span>
                    <span class="bookmark-tags">${bookmark.tags ? '• ' + bookmark.tags : ''}</span>
                </p>
            </div>
            <div class="bookmark-actions">
                <button class="delete-btn" data-id="${bookmark.id}" title="Delete">🗑️</button>
            </div>
        `;
        bookmarkList.appendChild(li);
    });
};

const loadAndDisplayBookmarks = async () => {
    try {
        await loadFoldersAndPopulateSelect(); 
        
        bookmarks = await getBookmarks();
        renderBookmarks(bookmarks); 
    } catch (e) {
        console.error("Initialization failed:", e);
        bookmarkList.innerHTML = '<li class="error-message">Failed to load bookmarks. Check console for details.</li>';
    }
};

const handleSave = async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const tags = tagsInput.value.trim();
    const folderId = folderSelect.value; 

    if (!title || !url) {
        alert("Title and URL are required.");
        return;
    }
    
    const newBookmarkData = {
        url,
        title,
        tags,
        folderId,
        timestamp: Date.now()
    };

    try {
        const result = await saveBookmark(newBookmarkData);
        if (result.startsWith("Error")) {
             console.error("Save failed:", result);
             alert(result);
             return;
        }

        titleInput.value = '';
        urlInput.value = '';
        tagsInput.value = '';

        await loadAndDisplayBookmarks();
    } catch (error) {
        console.error("Save failed:", error);
    }
};

const filterBookmarks = () => {
    const query = searchInput.value.toLowerCase();
    
    if (!query) {
        renderBookmarks(bookmarks);
        return;
    }

    const filtered = bookmarks.filter(b => 
        (b.title?.toLowerCase().includes(query) || false) ||
        (b.url?.toLowerCase().includes(query) || false) ||
        (b.tags?.toLowerCase().includes(query) || false) ||
        getFolderNameById(b.folderId || INBOX_FOLDER_ID).toLowerCase().includes(query)
    );

    renderBookmarks(filtered);
};

const handleListClick = async (event) => {
    const target = event.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('delete-btn')) {
        if (window.confirm('Are you sure you want to delete this bookmark?')) {
            await deleteBookmark(id);
            await loadAndDisplayBookmarks();
        }
    }
};


// --- Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    await autoFillCurrentTab(); 
    await loadAndDisplayBookmarks(); 

    document.getElementById('addBookmarkForm').addEventListener('submit', handleSave);
    bookmarkList.addEventListener('click', handleListClick);
    
    searchInput.addEventListener('input', filterBookmarks);
    
    goToOptionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});