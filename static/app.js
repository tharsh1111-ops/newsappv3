let newsSources = {};
let preparedUrls = {};
let rows = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadNewsSources();
    initializeRows(6);
    refreshSessions();
});

// Load news sources from API
async function loadNewsSources() {
    try {
        const response = await fetch('/api/sources');
        newsSources = await response.json();
        buildNewsPanel();
    } catch (error) {
        console.error('Error loading news sources:', error);
    }
}

// Build news sources panel with tabs
function buildNewsPanel() {
    const tabsContainer = document.getElementById('newsTabs');
    const contentContainer = document.getElementById('tabContent');
    
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    
    let firstRegion = true;
    
    for (const [region, sources] of Object.entries(newsSources)) {
        // Create tab
        const tab = document.createElement('div');
        tab.className = `tab ${firstRegion ? 'active' : ''}`;
        tab.textContent = region;
        tab.onclick = () => switchTab(region);
        tabsContainer.appendChild(tab);
        
        // Create tab content
        const content = document.createElement('div');
        content.className = `region-content ${firstRegion ? 'active' : ''}`;
        content.id = `region-${region.replace(/\s+/g, '-')}`;
        
        // Filter box
        const filterBox = document.createElement('div');
        filterBox.className = 'filter-box';
        filterBox.innerHTML = `
            <input type="text" placeholder="Filter sources..." oninput="filterSources('${region}', this.value)">
        `;
        content.appendChild(filterBox);
        
        // Sources list
        const sourcesList = document.createElement('div');
        sourcesList.className = 'sources-list';
        sourcesList.id = `sources-${region.replace(/\s+/g, '-')}`;
        
        for (const [name, url] of Object.entries(sources)) {
            const sourceItem = document.createElement('div');
            sourceItem.className = 'source-item';
            sourceItem.dataset.name = name.toLowerCase();
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `source-${region}-${name}`;
            checkbox.dataset.region = region;
            checkbox.dataset.name = name;
            checkbox.dataset.url = url;
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = name;
            
            sourceItem.appendChild(checkbox);
            sourceItem.appendChild(label);
            sourceItem.onclick = (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
            };
            
            sourcesList.appendChild(sourceItem);
            
            // Store URL template for quick access
            if (!preparedUrls[region]) preparedUrls[region] = {};
            preparedUrls[region][name] = url;
        }
        
        content.appendChild(sourcesList);
        
        // Region keyword input
        const keywordBox = document.createElement('div');
        keywordBox.className = 'region-keyword';
        keywordBox.innerHTML = `
            <label>Region Keyword:</label>
            <input type="text" id="keyword-${region.replace(/\s+/g, '-')}" placeholder="Override global keyword">
        `;
        content.appendChild(keywordBox);
        
        // Controls
        const controls = document.createElement('div');
        controls.className = 'region-controls';
        controls.innerHTML = `
            <button onclick="selectAllInRegion('${region}')">Select All</button>
            <button onclick="clearAllInRegion('${region}')">Clear All</button>
            <button class="btn-success" onclick="openSelectedFromRegion('${region}')">Open Selected</button>
            <button class="btn-primary" onclick="addSelectedFromRegion('${region}')">Add to Rows</button>
        `;
        content.appendChild(controls);
        
        contentContainer.appendChild(content);
        firstRegion = false;
    }
}

// Switch between tabs
function switchTab(region) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent === region);
    });
    document.querySelectorAll('.region-content').forEach(content => {
        content.classList.toggle('active', content.id === `region-${region.replace(/\s+/g, '-')}`);
    });
}

// Filter sources
function filterSources(region, query) {
    const sourcesList = document.getElementById(`sources-${region.replace(/\s+/g, '-')}`);
    const items = sourcesList.querySelectorAll('.source-item');
    const q = query.toLowerCase();
    
    items.forEach(item => {
        const name = item.dataset.name;
        item.style.display = name.includes(q) ? 'flex' : 'none';
    });
}

// Select all sources in region
function selectAllInRegion(region) {
    const sourcesList = document.getElementById(`sources-${region.replace(/\s+/g, '-')}`);
    sourcesList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.closest('.source-item').style.display !== 'none') {
            cb.checked = true;
        }
    });
}

// Clear all sources in region
function clearAllInRegion(region) {
    const sourcesList = document.getElementById(`sources-${region.replace(/\s+/g, '-')}`);
    sourcesList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
}

// Add selected sources from region to rows
function addSelectedFromRegion(region) {
    const sourcesList = document.getElementById(`sources-${region.replace(/\s+/g, '-')}`);
    const checkboxes = sourcesList.querySelectorAll('input[type="checkbox"]:checked');
    const regionKeyword = document.getElementById(`keyword-${region.replace(/\s+/g, '-')}`).value.trim();
    const globalKeyword = document.getElementById('globalKeyword').value.trim();
    const keyword = regionKeyword || globalKeyword;
    
    let added = 0;
    checkboxes.forEach(cb => {
        const url = cb.dataset.url;
        addRowWithData(url, keyword);
        added++;
    });
    
    if (added === 0) {
        alert('No sources selected.');
    } else {
        alert(`Added ${added} source(s) to rows.`);
    }
}

// Open selected sources from region directly (multi-tab)
function openSelectedFromRegion(region) {
    const sourcesList = document.getElementById(`sources-${region.replace(/\s+/g, '-')}`);
    const checkboxes = sourcesList.querySelectorAll('input[type="checkbox"]:checked');
    const regionKeyword = document.getElementById(`keyword-${region.replace(/\s+/g, '-')}`).value.trim();
    const globalKeyword = document.getElementById('globalKeyword').value.trim();
    const globalDate = document.getElementById('globalDate').value.trim();
    const keyword = regionKeyword || globalKeyword;
    
    if (checkboxes.length === 0) {
        alert('No sources selected.');
        return;
    }
    
    let opened = 0;
    let blocked = 0;
    
    checkboxes.forEach(cb => {
        const urlTemplate = cb.dataset.url;
        const query = buildQuery(keyword, globalDate);
        const finalUrl = routeQuery(query, urlTemplate);
        
        console.log(`Opening: ${cb.dataset.name} - ${finalUrl}`);
        
        const newWindow = window.open(finalUrl, '_blank');
        if (newWindow) {
            opened++;
        } else {
            blocked++;
        }
    });
    
    if (blocked > 0) {
        alert(`Opened ${opened} tabs. ${blocked} tabs were blocked.\n\nPlease allow popups for this site.`);
    } else {
        console.log(`Successfully opened ${opened} tabs.`);
    }
}

// Toggle news panel visibility
function toggleNewsPanel() {
    const panel = document.getElementById('newsPanel');
    panel.classList.toggle('hidden');
}

// Row management
function initializeRows(count) {
    for (let i = 0; i < count; i++) {
        addRow();
    }
}

function addRow() {
    const rowsArea = document.getElementById('rowsArea');
    const rowIndex = rows.length;
    
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row-item';
    rowDiv.innerHTML = `
        <input type="text" name="url" placeholder="URL template" data-index="${rowIndex}">
        <input type="text" name="keyword" placeholder="Keyword" data-index="${rowIndex}">
        <button onclick="removeRow(${rowIndex})">Remove</button>
    `;
    
    rowsArea.appendChild(rowDiv);
    rows.push({ url: '', keyword: '' });
}

function addRowWithData(url, keyword) {
    // Find first empty row
    let emptyIndex = -1;
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i].url && !rows[i].keyword) {
            emptyIndex = i;
            break;
        }
    }
    
    // If no empty row found, add a new one
    if (emptyIndex === -1) {
        addRow();
        emptyIndex = rows.length - 1;
    }
    
    // Fill the row with data
    const inputs = document.querySelectorAll(`input[data-index="${emptyIndex}"]`);
    inputs[0].value = url;
    inputs[1].value = keyword;
    rows[emptyIndex] = { url, keyword };
    rows[lastIndex] = { url, keyword };
}

function removeRow(index) {
    const rowsArea = document.getElementById('rowsArea');
    const rowItems = rowsArea.querySelectorAll('.row-item');
    if (rowItems[index]) {
        rowItems[index].remove();
    }
    syncRowsData();
}

function clearAllRows() {
    const rowsArea = document.getElementById('rowsArea');
    rowsArea.innerHTML = '';
    rows = [];
    initializeRows(6);
}

function syncRowsData() {
    rows = [];
    const rowItems = document.querySelectorAll('.row-item');
    rowItems.forEach(item => {
        const urlInput = item.querySelector('input[name="url"]');
        const keywordInput = item.querySelector('input[name="keyword"]');
        rows.push({
            url: urlInput.value.trim(),
            keyword: keywordInput.value.trim()
        });
    });
}

// Date helpers
function setToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('globalDate').value = today;
}

function clearDate() {
    document.getElementById('globalDate').value = '';
}

// Build query with keyword and date
function buildQuery(keyword, dateStr) {
    const parts = [];
    if (keyword) parts.push(keyword);
    if (dateStr) parts.push(dateStr);
    return parts.join(' ').trim();
}

// Route query to URL
function routeQuery(query, baseUrl) {
    if (!baseUrl) return '';
    
    if (baseUrl.includes('{query}')) {
        const posPlaceholder = baseUrl.indexOf('{query}');
        const posQmark = baseUrl.indexOf('?');
        
        let encoded;
        if (posQmark === -1 || posPlaceholder < posQmark) {
            encoded = encodeURIComponent(query);
        } else {
            encoded = encodeURIComponent(query).replace(/%20/g, '+');
        }
        return baseUrl.replace('{query}', encoded);
    }
    
    if (baseUrl.includes('?')) {
        return `${baseUrl}&q=${encodeURIComponent(query).replace(/%20/g, '+')}`;
    }
    
    return `${baseUrl}?q=${encodeURIComponent(query).replace(/%20/g, '+')}`;
}

// Open all rows
function openAll() {
    syncRowsData();
    const dateVal = document.getElementById('globalDate').value.trim();
    let opened = 0;
    let blocked = 0;
    
    rows.forEach(row => {
        if (!row.url) return;
        
        const query = buildQuery(row.keyword, dateVal);
        const finalUrl = routeQuery(query, row.url);
        console.log(`Opening: ${finalUrl}`);
        
        const newWindow = window.open(finalUrl, '_blank');
        if (newWindow) {
            opened++;
        } else {
            blocked++;
        }
    });
    
    if (opened === 0 && blocked === 0) {
        alert('No URLs to open.');
    } else if (blocked > 0) {
        alert(`Opened ${opened} tabs. ${blocked} tabs were blocked by popup blocker.\n\nPlease allow popups for this site in your browser settings.`);
    } else {
        console.log(`Successfully opened ${opened} tabs.`);
    }
}

// Session management
async function saveSession() {
    const name = document.getElementById('sessionName').value.trim();
    if (!name) {
        alert('Please enter a session name.');
        return;
    }
    
    syncRowsData();
    
    try {
        const response = await fetch('/api/sessions/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rows })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message);
            refreshSessions();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error saving session: ' + error);
    }
}

async function loadSession() {
    const select = document.getElementById('sessionsList');
    const name = select.value;
    
    if (!name) {
        alert('Please select a session.');
        return;
    }
    
    try {
        const response = await fetch(`/api/sessions/load/${encodeURIComponent(name)}`);
        const data = await response.json();
        
        if (data.rows) {
            clearAllRows();
            data.rows.forEach(row => {
                addRowWithData(row.url, row.keyword);
            });
            alert('Session loaded successfully.');
        } else {
            alert('Error loading session.');
        }
    } catch (error) {
        alert('Error loading session: ' + error);
    }
}

async function refreshSessions() {
    try {
        const response = await fetch('/api/sessions/list');
        const sessions = await response.json();
        
        const select = document.getElementById('sessionsList');
        select.innerHTML = '<option value="">-- Select Session --</option>';
        
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.name;
            option.textContent = `${session.name} (${session.created_at})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error refreshing sessions:', error);
    }
}

async function deleteSession() {
    const select = document.getElementById('sessionsList');
    const name = select.value;
    
    if (!name) {
        alert('Please select a session to delete.');
        return;
    }
    
    if (!confirm(`Delete session "${name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/sessions/delete/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message);
            refreshSessions();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error deleting session: ' + error);
    }
}

// Export/Import
function exportCurrentRows() {
    syncRowsData();
    
    if (rows.every(r => !r.url && !r.keyword)) {
        alert('No row data to export.');
        return;
    }
    
    const data = {
        exported_at: new Date().toISOString(),
        rows: rows.filter(r => r.url || r.keyword)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rows_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function exportAllSessions() {
    try {
        const response = await fetch('/api/sessions/export');
        const data = await response.json();
        
        if (!data.sessions || data.sessions.length === 0) {
            alert('No sessions to export.');
            return;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sessions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error exporting sessions: ' + error);
    }
}

function importSessions() {
    document.getElementById('importFileInput').click();
}

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        let sessionsList = [];
        if (data.sessions && Array.isArray(data.sessions)) {
            sessionsList = data.sessions;
        } else if (Array.isArray(data)) {
            sessionsList = data;
        } else {
            alert('Invalid JSON format.');
            return;
        }
        
        if (sessionsList.length === 0) {
            alert('No sessions found in file.');
            return;
        }
        
        const overwrite = confirm('Overwrite existing sessions with same name?\n\nOK = Overwrite\nCancel = Skip existing');
        
        const response = await fetch('/api/sessions/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessions: sessionsList, overwrite })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message);
            refreshSessions();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error importing file: ' + error);
    }
    
    event.target.value = '';
}
