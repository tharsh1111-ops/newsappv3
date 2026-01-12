let allSources = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadSources();
    populateRegionDropdown();
    displayAllSources();
    displayCategories();
});

// Load sources from API
async function loadSources() {
    try {
        const response = await fetch('/api/sources');
        allSources = await response.json();
    } catch (error) {
        console.error('Error loading sources:', error);
        alert('Error loading sources');
    }
}

// Switch between tabs
function switchManageTab(tab) {
    document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    
    if (tab === 'add') {
        document.querySelector('.manage-tab:nth-child(1)').classList.add('active');
        document.getElementById('addPanel').classList.add('active');
    } else if (tab === 'view') {
        document.querySelector('.manage-tab:nth-child(2)').classList.add('active');
        document.getElementById('viewPanel').classList.add('active');
        displayAllSources();
    } else if (tab === 'categories') {
        document.querySelector('.manage-tab:nth-child(3)').classList.add('active');
        document.getElementById('categoriesPanel').classList.add('active');
        displayCategories();
    }
}

// Populate region dropdown
function populateRegionDropdown() {
    const select = document.getElementById('addRegion');
    select.innerHTML = '<option value="">-- Select Region --</option>';
    
    Object.keys(allSources).forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        select.appendChild(option);
    });
}

// Add source form submission
document.getElementById('addSourceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const region = document.getElementById('addRegion').value || document.getElementById('newCategory').value.trim();
    const name = document.getElementById('sourceName').value.trim();
    const url = document.getElementById('sourceUrl').value.trim();
    
    if (!region || !name || !url) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region, name, url })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert('Source added successfully!');
            document.getElementById('addSourceForm').reset();
            await loadSources();
            populateRegionDropdown();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error adding source: ' + error);
    }
});

// Display all sources
function displayAllSources() {
    const container = document.getElementById('sourcesListContainer');
    container.innerHTML = '';
    
    for (const [region, sources] of Object.entries(allSources)) {
        const section = document.createElement('div');
        section.className = 'region-section';
        
        const heading = document.createElement('h3');
        heading.textContent = `${region} (${Object.keys(sources).length} sources)`;
        section.appendChild(heading);
        
        for (const [name, url] of Object.entries(sources)) {
            const card = document.createElement('div');
            card.className = 'source-card';
            
            const h4 = document.createElement('h4');
            h4.textContent = name;
            card.appendChild(h4);
            
            const urlP = document.createElement('p');
            urlP.style.color = '#6c757d';
            urlP.style.fontSize = '13px';
            urlP.style.wordBreak = 'break-all';
            urlP.textContent = url;
            card.appendChild(urlP);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'source-card-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-warning';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => editSource(region, name, url);
            actionsDiv.appendChild(editBtn);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteSource(region, name);
            actionsDiv.appendChild(deleteBtn);
            
            card.appendChild(actionsDiv);
            section.appendChild(card);
        }
        
        container.appendChild(section);
    }
}

// Edit source
function editSource(region, oldName, oldUrl) {
    const newName = prompt('Enter new name:', oldName);
    if (!newName) return;
    
    const newUrl = prompt('Enter new URL:', oldUrl);
    if (!newUrl) return;
    
    updateSource(region, oldName, newName, newUrl);
}

// Update source
async function updateSource(region, oldName, newName, newUrl) {
    try {
        console.log('Updating:', { region, oldName, newName, newUrl });
        const response = await fetch('/api/admin/sources', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region, oldName, newName, newUrl })
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Result:', result);
        
        if (result.status === 'success') {
            alert('Source updated successfully!');
            await loadSources();
            displayAllSources();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Error updating source: ' + error);
    }
}

// Delete source
async function deleteSource(region, name) {
    if (!confirm(`Delete "${name}" from ${region}?`)) {
        return;
    }
    
    try {
        console.log('Deleting:', { region, name });
        const response = await fetch('/api/admin/sources', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region, name })
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Result:', result);
        
        if (result.status === 'success') {
            alert('Source deleted successfully!');
            await loadSources();
            displayAllSources();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting source: ' + error);
    }
}

// Display categories
function displayCategories() {
    const container = document.getElementById('categoriesListContainer');
    container.innerHTML = '';
    
    for (const region of Object.keys(allSources)) {
        const card = document.createElement('div');
        card.className = 'source-card';
        
        const h4 = document.createElement('h4');
        h4.textContent = region;
        card.appendChild(h4);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'source-card-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-danger';
        deleteBtn.textContent = 'Delete Category';
        deleteBtn.onclick = () => deleteCategory(region);
        actionsDiv.appendChild(deleteBtn);
        
        card.appendChild(actionsDiv);
        container.appendChild(card);
    }
}

// Add category
async function addCategory() {
    const name = document.getElementById('newCategoryInput').value.trim();
    if (!name) {
        alert('Please enter a category name');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert('Category added successfully!');
            document.getElementById('newCategoryInput').value = '';
            await loadSources();
            populateRegionDropdown();
            displayCategories();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error adding category: ' + error);
    }
}

// Delete category
async function deleteCategory(region) {
    if (!confirm(`Delete category "${region}" and all its sources?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert('Category deleted successfully!');
            await loadSources();
            populateRegionDropdown();
            displayCategories();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error deleting category: ' + error);
    }
}
