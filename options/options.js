
import { 
    getBookmarks, 
    setBookmarks, 
    deleteBookmark, 
    clearAllBookmarks, 
    getFolders, 
    setFolders, 
    addFolder, 
    deleteFolder,
    updateBookmark
} from '../background/utils/storage.js'; 


const folderList = document.getElementById('folderList');
const newFolderNameInput = document.getElementById('newFolderName');
const addFolderBtn = document.getElementById('addFolderBtn');

const bookmarkList = document.getElementById('bookmarkList');
const clearAllBtn = document.getElementById('clearAllBtn');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFile');
const messageBox = document.getElementById('messageBox');


let allBookmarks = []; 
let allFolders = []; 
const INBOX_FOLDER_ID = 'inbox';
let isDragging = false;
let currentDragBookmarkId = null;



const showMessage = (message, isError = false) => {
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    messageBox.style.backgroundColor = isError ? '#d32f2f' : '#388e3c';
    messageBox.style.color = 'white';
    messageBox.style.padding = '10px';
    messageBox.style.borderRadius = '4px';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 4000);
};



const renderFolders = (foldersToRender) => {
    folderList.innerHTML = '';
    
    if (foldersToRender.length === 0) {
        folderList.innerHTML = '<li class="text-center">No custom folders created.</li>';
        return;
    }

    foldersToRender.forEach(folder => {
        const li = document.createElement('li');
        li.dataset.id = folder.id;
        li.classList.add('folder-item');
        li.setAttribute('draggable', folder.id !== INBOX_FOLDER_ID ? 'true' : 'false');

        const count = allBookmarks.filter(b => b.folderId === folder.id).length;
        
        li.innerHTML = `
            <span class="folder-name">${folder.name} (${count} bookmarks)</span>
            <div class="folder-actions">
                <button class="rename-folder-btn utility-btn" data-id="${folder.id}" title="Rename" ${folder.id === INBOX_FOLDER_ID ? 'disabled' : ''}>📝</button>
                ${folder.id !== INBOX_FOLDER_ID ? 
                    `<button class="delete-folder-btn danger-btn" data-id="${folder.id}" title="Delete Folder">🗑</button>` :
                    `<span class="note">(System Folder)</span>`
                }
            </div>
        `;
        folderList.appendChild(li);
    });
};

const handleFolderClick = async (event) => {
    const target = event.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('delete-folder-btn')) {
        handleDeleteFolder(id);
    } else if (target.classList.contains('rename-folder-btn')) {
 
        const folderItem = target.closest('.folder-item');
        const span = folderItem.querySelector('.folder-name');
        const currentName = span.textContent.split(' (')[0]; 
        const newName = window.prompt(`Rename folder "${currentName}" to:`, currentName);
        
        if (newName && newName.trim() !== currentName) {
            try {
                const folderIndex = allFolders.findIndex(f => f.id === id);
                if (folderIndex !== -1) {
                    allFolders[folderIndex].name = newName.trim();
                    await setFolders(allFolders); 
                    await loadAndDisplayAllData();
                    showMessage(`Folder renamed to "${newName.trim()}" successfully.`);
                }
            } catch (e) {
                showMessage(`Error renaming folder: ${e.message}`, true);
            }
        }
    }
};

const handleAddFolder = async () => {
    const name = newFolderNameInput.value.trim();
    if (!name) return;

    if (allFolders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        showMessage(`A folder named "${name}" already exists.`, true);
        return;
    }

    try {
        await addFolder(name);
        newFolderNameInput.value = '';
        await loadAndDisplayAllData(); 
        showMessage(`Folder "${name}" created successfully.`);
    } catch (e) {
        showMessage(`Error creating folder: ${e.message}`, true);
    }
};

const handleDeleteFolder = async (folderId) => {
    const folder = allFolders.find(f => f.id === folderId);
    if (!folder) return;
    
    const count = allBookmarks.filter(b => b.folderId === folderId).length;
    
    if (!window.confirm(`WARNING: Are you sure you want to delete the folder "${folder.name}"? It contains ${count} bookmarks which will be moved to the Inbox.`)) {
        return;
    }

    try {
        const bookmarksToMove = allBookmarks.filter(b => b.folderId === folderId);
        
       
        const movePromises = bookmarksToMove.map(b => 
            updateBookmark(b.id, { folderId: INBOX_FOLDER_ID })
        );
        await Promise.all(movePromises);

    
        await deleteFolder(folderId);

   
        await loadAndDisplayAllData(); 
        showMessage(`Folder "${folder.name}" deleted. ${count} bookmarks moved to Inbox.`);
    } catch (e) {
        showMessage(`Error deleting folder: ${e.message}`, true);
    }
};



const renderBookmarks = (bookmarksToRender) => {
    bookmarkList.innerHTML = ''; 

    if (bookmarksToRender.length === 0) {
        bookmarkList.innerHTML = '<li class="text-center no-bookmarks">You have no saved bookmarks to manage.</li>';
        return;
    }
    
    bookmarksToRender.sort((a, b) => parseInt(b.id) - parseInt(a.id)); 

    bookmarksToRender.forEach(b => {
        const li = document.createElement('li');
        li.dataset.id = b.id;
        li.classList.add('url-item');
        li.setAttribute('draggable', 'true'); 

        const folderName = allFolders.find(f => f.id === (b.folderId || INBOX_FOLDER_ID))?.name || 'Inbox';

        li.innerHTML = `
            <div class="bookmark-view" data-id="${b.id}">
                <a href="${b.url}" target="_blank" title="${b.url}">
                    <strong>${b.title}</strong>
                </a>
                <p class="bookmark-meta">
                    <span class="folder-context">📁 ${folderName}</span> 
                    ${b.tags ? `<span class="tags-context"> | Tags: ${b.tags}</span>` : ''}
                </p>
                <button type="button" class="edit-btn utility-btn" data-id="${b.id}" title="Edit Bookmark">📝</button>
                <button type="button" class="delete-btn danger-btn" data-id="${b.id}" title="Delete Bookmark">🗑</button>
            </div>
            ${createEditForm(b)}
        `;
        bookmarkList.appendChild(li);
    });
};


const createEditForm = (b) => {
    const folderOptions = allFolders.map(f => 
        `<option value="${f.id}" ${f.id === (b.folderId || INBOX_FOLDER_ID) ? 'selected' : ''}>${f.name}</option>`
    ).join('');

    return `
        <form class="edit-form" data-id="${b.id}" style="display:none;">
            <input type="text" name="title" value="${b.title || ''}" placeholder="Title" required>
            <input type="url" name="url" value="${b.url || ''}" placeholder="URL" required>
            <input type="text" name="tags" value="${b.tags || ''}" placeholder="Tags (comma-separated)">
            <select name="folderId">${folderOptions}</select>
            <button type="submit" class="save-edit-btn utility-btn">Save</button>
            <button type="button" class="cancel-edit-btn danger-btn">Cancel</button>
        </form>
    `;
};


const handleBookmarkListClick = async (event) => {
    const target = event.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('delete-btn')) {
        handleDeleteBookmark(id);

    } else if (target.classList.contains('edit-btn')) {
        const listItem = target.closest('.url-item');
        listItem.querySelector('.bookmark-view').style.display = 'none';
        listItem.querySelector('.edit-form').style.display = 'flex';
        listItem.querySelector('.edit-form input[name="title"]').focus();

    } else if (target.classList.contains('cancel-edit-btn')) {
        const listItem = target.closest('.url-item');
        listItem.querySelector('.bookmark-view').style.display = 'flex';
        listItem.querySelector('.edit-form').style.display = 'none';
    }
};

const handleEditSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const id = form.dataset.id;
    
    const updates = {
        title: form.title.value.trim(),
        url: form.url.value.trim(),
        tags: form.tags.value.trim(),
        folderId: form.folderId.value
    };

    try {
        await updateBookmark(id, updates);
        await loadAndDisplayAllData();
        showMessage("Bookmark updated successfully.");
    } catch (e) {
        showMessage(`Error updating bookmark: ${e.message}`, true);
    }
};

const handleDeleteBookmark = async (id) => {
    if (!id) return;

    if (!window.confirm("Are you sure you want to delete this specific bookmark?")) {
        return;
    }

    try {
        await deleteBookmark(id);
        await loadAndDisplayAllData(); 
        showMessage("Bookmark deleted successfully.");
    } catch (e) {
        showMessage(`Error deleting bookmark: ${e.message}`, true);
    }
};

const handleClearAll = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL your saved bookmarks AND custom folders. Are you absolutely sure?")) {
        return;
    }

    try {
        await clearAllBookmarks();
        
        const customFolderPromises = allFolders
            .filter(f => f.id !== INBOX_FOLDER_ID)
            .map(f => deleteFolder(f.id));
        
        await Promise.all(customFolderPromises);
        
        await loadAndDisplayAllData(); 
        showMessage("All data (bookmarks and custom folders) cleared successfully.");
    } catch (e) {
        showMessage(`Error clearing all data: ${e.message}`, true);
    }
};



const handleDragStart = (event) => {
    const target = event.target;
    if (target.classList.contains('url-item')) {
        currentDragBookmarkId = target.dataset.id;
        isDragging = true;
        event.dataTransfer.setData("text/plain", currentDragBookmarkId); 
        setTimeout(() => target.classList.add('dragging'), 0);
    }
};

const handleDragOver = (event) => {
    event.preventDefault(); 
    const target = event.target.closest('.folder-item'); 

    if (isDragging && target) {
        if (target.classList.contains('folder-item')) {
            target.classList.add('drag-over-folder');
        }
    }
};

const handleDragLeave = (event) => {
    event.target.classList.remove('drag-over-folder');
};

const handleDragEnd = (event) => {
    isDragging = false;
    currentDragBookmarkId = null;
    event.target.classList.remove('dragging');
    document.querySelectorAll('.drag-over-folder').forEach(el => 
        el.classList.remove('drag-over-folder')
    );
};

const handleDrop = async (event) => {
    event.preventDefault();
    const target = event.target.closest('.folder-item');

    if (!isDragging || !currentDragBookmarkId || !target) return handleDragEnd(event);

    const folderId = target.dataset.id;
    const draggedBookmark = allBookmarks.find(b => b.id === currentDragBookmarkId);

    if (draggedBookmark && draggedBookmark.folderId !== folderId) {
        await updateBookmark(currentDragBookmarkId, { folderId });
        showMessage(`Bookmark moved to folder: ${target.querySelector('.folder-name').textContent.split(' (')[0]}`);
        await loadAndDisplayAllData();
    }
    
    handleDragEnd(event);
};




const loadAndDisplayAllData = async () => {
    try {
      
        const fetchedFolders = await getFolders();
        allFolders = fetchedFolders || [];
        if (!allFolders.some(f => f.id === INBOX_FOLDER_ID)) {
            allFolders.unshift({ id: INBOX_FOLDER_ID, name: 'Inbox' });
        }
        renderFolders(allFolders);

       
        const fetchedBookmarks = await getBookmarks();
        allBookmarks = fetchedBookmarks || [];
        renderBookmarks(allBookmarks);

    } catch (e) {
        console.error("Failed to load all data:", e);
        showMessage("Failed to load extension data.", true);
    }
};




document.addEventListener('DOMContentLoaded', () => {
 
    loadAndDisplayAllData(); 

   
    addFolderBtn.addEventListener('click', handleAddFolder);
    folderList.addEventListener('click', handleFolderClick); 
    
    clearAllBtn.addEventListener('click', handleClearAll);
    bookmarkList.addEventListener('click', handleBookmarkListClick); 
    bookmarkList.addEventListener('submit', handleEditSubmit); 

 
    bookmarkList.addEventListener('dragstart', handleDragStart);
    bookmarkList.addEventListener('dragend', handleDragEnd);
    
    folderList.addEventListener('dragover', handleDragOver);
    folderList.addEventListener('dragleave', handleDragLeave);
    folderList.addEventListener('drop', handleDrop);
    

});