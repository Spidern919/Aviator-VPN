// Global variables
let currentUser = null;
let clients = [];
let predictions = [];
let settings = {
    algorithm: 'random',
    updateFrequency: 5,
    successThreshold: 70
};
let clientConnections = new Map(); // Track client connections (keys are stringified client IDs)

// Database instance
let db = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Wait for database to be ready
    if (window.virtualDB) {
        db = window.virtualDB;
        loadData();
        updateDashboard();
        startPredictionTimer();
        updateConnectionStatus();
        setupClientRegistration();
        setupEditClientForm();
    } else {
        // Fallback if database is not ready
        setTimeout(() => {
            if (window.virtualDB) {
                db = window.virtualDB;
                loadData();
                updateDashboard();
                startPredictionTimer();
                updateConnectionStatus();
                setupClientRegistration();
                setupEditClientForm();
            }
        }, 100);
    }
});

// Data management functions
function loadData() {
    if (!db) {
        console.error('Database not initialized');
        return;
    }
    
    try {
        // Load data from virtual database
        clients = db.getAllClients();
        predictions = db.getAllPredictions();
        settings = db.getSettings();
        
        // Load connections
        const connections = db.getAllConnections();
        clientConnections.clear();
        Object.entries(connections).forEach(([clientId, connection]) => {
            clientConnections.set(String(clientId), connection);
        });
        
        // Initialize with sample data if empty
        if (clients.length === 0) {
            const sampleClients = [
                { name: 'John Doe', phone: '+1234567890', country: 'United States', subscription: '3 Months', code: 'CLIENT001', status: 'active', receiptUploaded: true, receiptName: 'receipt_001.pdf' },
                { name: 'Jane Smith', phone: '+1987654321', country: 'Canada', subscription: '3 Months', code: 'CLIENT002', status: 'active', receiptUploaded: true, receiptName: 'receipt_002.pdf' },
                { name: 'Mike Johnson', phone: '+1122334455', country: 'United Kingdom', subscription: '3 Months', code: 'CLIENT003', status: 'inactive', receiptUploaded: false, receiptName: null }
            ];
            
            sampleClients.forEach(clientData => {
                try {
                    db.createClient(clientData);
                } catch (error) {
                    console.error('Error creating sample client:', error);
                }
            });
            
            clients = db.getAllClients();
        }
        
        if (predictions.length === 0) {
            const samplePredictions = [
                { multiplier: 2.5, status: 'completed', result: 'success', timestamp: Date.now() - 3600000 },
                { multiplier: 1.8, status: 'completed', result: 'failed', timestamp: Date.now() - 1800000 },
                { multiplier: 3.2, status: 'active', result: null, timestamp: Date.now() }
            ];
            
            samplePredictions.forEach(predictionData => {
                try {
                    db.createPrediction(predictionData);
                } catch (error) {
                    console.error('Error creating sample prediction:', error);
                }
            });
            
            predictions = db.getAllPredictions();
        }
        
        console.log('Data loaded successfully from virtual database');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function saveClients() {
    if (db) {
        // Data is automatically saved by the database
        clients = db.getAllClients();
    }
}

function savePredictions() {
    if (db) {
        // Data is automatically saved by the database
        predictions = db.getAllPredictions();
    }
}

function saveSettings() {
    if (db) {
        // Data is automatically saved by the database
        settings = db.getSettings();
    }
}

// Login functions
function showLoginTab(tab) {
    const adminLogin = document.getElementById('adminLogin');
    const clientLogin = document.getElementById('clientLogin');
    const adminTab = document.querySelector('.tab-btn:first-child');
    const clientTab = document.querySelector('.tab-btn:last-child');
    
    if (tab === 'admin') {
        adminLogin.style.display = 'block';
        clientLogin.style.display = 'none';
        adminTab.classList.add('active');
        clientTab.classList.remove('active');
    } else {
        adminLogin.style.display = 'none';
        clientLogin.style.display = 'block';
        adminTab.classList.remove('active');
        clientTab.classList.add('active');
    }
}

function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === 'admin' && password === 'admin123') {
        currentUser = { type: 'admin', username: username };
        showAdminPanel();
        updateDashboard();
    } else {
        alert('Invalid admin credentials!');
    }
}

function clientLogin() {
    const clientCode = document.getElementById('clientCode').value;
    const client = db ? db.getClientByCode(clientCode) : clients.find(c => c.code === clientCode);
    
    if (client && client.status === 'active') {
        // Check if client has uploaded receipt
        if (!client.receiptUploaded) {
            alert('Cannot connect: Payment receipt not uploaded. Please contact admin to upload your receipt.');
            return;
        }
        
        currentUser = { type: 'client', client: client };
        const connectionData = { connected: true, timestamp: Date.now() };
        clientConnections.set(String(client.id), connectionData);
        
        // Save connection to database
        if (db) {
            db.setClientConnection(client.id, connectionData);
        }
        
        showClientInterface();
        updateClientInterface();
        updateConnectionStatus();
    } else {
        alert('Invalid client code or inactive client!');
    }
}

function showClientRegistration() {
    document.getElementById('clientRegistrationModal').style.display = 'flex';
}

function disconnectClient() {
    if (currentUser && currentUser.type === 'client') {
        const connectionData = { connected: false, timestamp: Date.now() };
        clientConnections.set(String(currentUser.client.id), connectionData);
        
        // Save connection to database
        if (db) {
            db.setClientConnection(currentUser.client.id, connectionData);
        }
        
        currentUser = null;
        showLoginSection();
        updateConnectionStatus();
    }
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const clientStatusElement = document.getElementById('clientConnectionStatus');
    
    if (currentUser && currentUser.type === 'client') {
        const connection = clientConnections.get(currentUser.client.id);
        if (connection && connection.connected) {
            if (statusElement) statusElement.textContent = 'Connected';
            if (statusElement) statusElement.className = 'status-indicator connected';
            if (clientStatusElement) clientStatusElement.textContent = 'Connected';
            if (clientStatusElement) clientStatusElement.className = 'status-indicator connected';
        } else {
            if (statusElement) statusElement.textContent = 'Disconnected';
            if (statusElement) statusElement.className = 'status-indicator disconnected';
            if (clientStatusElement) clientStatusElement.textContent = 'Disconnected';
            if (clientStatusElement) clientStatusElement.className = 'status-indicator disconnected';
        }
    } else {
        if (statusElement) statusElement.textContent = 'Disconnected';
        if (statusElement) statusElement.className = 'status-indicator disconnected';
    }
}

function logout() {
    currentUser = null;
    showLoginSection();
}

// UI display functions
function showLoginSection() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('clientInterface').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('clientInterface').style.display = 'none';
}

function showClientInterface() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('clientInterface').style.display = 'block';
}

// Admin panel functions
function showAdminSection(section) {
    // Hide all sections
    const sections = ['dashboardSection', 'clientsSection', 'predictionsSection', 'settingsSection', 'databaseSection'];
    sections.forEach(s => {
        document.getElementById(s).style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(section + 'Section').style.display = 'block';
    
    // Update active sidebar button
    document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Load section-specific data
    switch(section) {
        case 'clients':
            loadClientsTable();
            break;
        case 'predictions':
            loadPredictionsGrid();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'database':
            loadDatabaseSection();
            break;
    }
}

function updateDashboard() {
    const totalClients = clients.length;
    const activePredictions = predictions.filter(p => p.status === 'active').length;
    const completedPredictions = predictions.filter(p => p.status === 'completed');
    const successRate = completedPredictions.length > 0 
        ? Math.round((completedPredictions.filter(p => p.result === 'success').length / completedPredictions.length) * 100)
        : 0;
    const todayGames = predictions.filter(p => {
        const today = new Date().toDateString();
        const predDate = new Date(p.timestamp).toDateString();
        return today === predDate;
    }).length;
    
    document.getElementById('totalClients').textContent = totalClients;
    document.getElementById('activePredictions').textContent = activePredictions;
    document.getElementById('successRate').textContent = successRate + '%';
    document.getElementById('todayGames').textContent = todayGames;
}

// Client management functions
function loadClientsTable() {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = '';
    
    clients.forEach(client => {
        const connection = clientConnections.get(String(client.id));
        const isConnected = connection && connection.connected;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.code}</td>
            <td>${client.name}</td>
            <td>${client.phone || 'N/A'}</td>
            <td>${client.country || 'N/A'}</td>
            <td>${client.subscription || 'N/A'}</td>
            <td>
                ${client.receiptUploaded ? 
                    `<span class="receipt-badge uploaded">✓ ${client.receiptName || 'Uploaded'}</span>` : 
                    '<span class="receipt-badge missing">✗ Missing</span>'
                }
            </td>
            <td><span class="status-badge ${client.status}">${client.status}</span></td>
            <td>${client.createdDate}</td>
            <td>
                <span class="connection-badge ${isConnected ? 'connected' : 'disconnected'}">
                    ${isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </td>
            <td class="connection-action-buttons">
                ${isConnected ? 
                    `<button class="disconnect-btn-admin" onclick="adminDisconnectClient('${String(client.id)}')">Disconnect</button>` :
                    `<button class="connect-btn-admin" onclick="adminConnectClient('${String(client.id)}')">Connect</button>`
                }
            </td>
            <td class="action-buttons">
                <button class="edit-btn" onclick="editClient('${String(client.id)}')">Edit</button>
                <button class="delete-btn" onclick="deleteClient('${String(client.id)}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddClientModal() {
    document.getElementById('addClientModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function addNewClient() {
    showAddClientModal();
}

// Handle form submission for adding client
document.getElementById('addClientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('newClientName').value;
    const phone = document.getElementById('newClientPhone').value;
    const country = document.getElementById('newClientCountry').value;
    const subscription = document.getElementById('newClientSubscription').value;
    const receipt = document.getElementById('newClientReceipt').files[0];
    const customCode = document.getElementById('newClientCode').value;
    
    if (!receipt) {
        alert('Please upload a payment receipt!');
        return;
    }
    
    // Generate client code if not provided
    const clientCode = customCode || generateClientCode();
    
    // Check if code already exists
    if (clients.find(c => c.code === clientCode)) {
        alert('Client code already exists! Please choose a different code.');
        return;
    }
    
    // Create new client with extended information
    const clientData = {
        name: name,
        phone: phone,
        country: country,
        subscription: subscription,
        code: clientCode,
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0],
        receiptUploaded: true,
        receiptName: receipt.name
    };
    
    try {
        const newClient = db ? db.createClient(clientData) : {
            id: Date.now(),
            ...clientData
        };
        
        if (!db) {
            clients.push(newClient);
        } else {
            clients = db.getAllClients();
        }
        
        loadClientsTable();
        updateDashboard();
        closeModal('addClientModal');
    } catch (error) {
        alert('Error creating client: ' + error.message);
        return;
    }
    
    // Clear form
    document.getElementById('addClientForm').reset();
    
    // Show success message with generated code
    alert(`Client registered successfully!\n\nClient Code: ${clientCode}\n\nPlease provide this code to the client for login.`);
});

// Setup client registration form
function setupClientRegistration() {
    document.getElementById('clientRegistrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('regClientName').value;
        const phone = document.getElementById('regClientPhone').value;
        const country = document.getElementById('regClientCountry').value;
        const subscription = document.getElementById('regClientSubscription').value;
        const receipt = document.getElementById('regClientReceipt').files[0];
        const customCode = document.getElementById('regClientCode').value;
        
        if (!receipt) {
            alert('Please upload a payment receipt!');
            return;
        }
        
        // Generate client code if not provided
        const clientCode = customCode || generateClientCode();
        
        // Check if code already exists
        if (clients.find(c => c.code === clientCode)) {
            alert('Client code already exists! Please choose a different code.');
            return;
        }
        
        // Create new client with extended information
        const clientData = {
            name: name,
            phone: phone,
            country: country,
            subscription: subscription,
            code: clientCode,
            status: 'active',
            createdDate: new Date().toISOString().split('T')[0],
            receiptUploaded: true,
            receiptName: receipt.name
        };
        
        try {
            const newClient = db ? db.createClient(clientData) : {
                id: Date.now(),
                ...clientData
            };
            
            if (!db) {
                clients.push(newClient);
            } else {
                clients = db.getAllClients();
            }
            
            // Auto-login the new client (receipt is already uploaded during registration)
            currentUser = { type: 'client', client: newClient };
            const connectionData = { connected: true, timestamp: Date.now() };
            clientConnections.set(newClient.id, connectionData);
            
            // Save connection to database
            if (db) {
                db.setClientConnection(newClient.id, connectionData);
            }
            
            closeModal('clientRegistrationModal');
            showClientInterface();
            updateClientInterface();
            updateConnectionStatus();
        } catch (error) {
            alert('Error creating client: ' + error.message);
            return;
        }
        
        // Clear form
        document.getElementById('clientRegistrationForm').reset();
        
        alert(`Registration successful! Your client code is: ${clientCode}`);
    });
}

// Setup edit client form
function setupEditClientForm() {
    document.getElementById('editClientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const clientIdAttr = this.getAttribute('data-client-id');
        const clientId = isNaN(Number(clientIdAttr)) ? clientIdAttr : Number(clientIdAttr);
        const name = document.getElementById('editClientName').value;
        const phone = document.getElementById('editClientPhone').value;
        const country = document.getElementById('editClientCountry').value;
        const subscription = document.getElementById('editClientSubscription').value;
        const status = document.getElementById('editClientStatus').value;
        const receipt = document.getElementById('editClientReceipt').files[0];
        
        const updateData = {
            name: name,
            phone: phone,
            country: country,
            subscription: subscription,
            status: status
        };
        
        // Handle receipt upload if provided
        if (receipt) {
            updateData.receiptUploaded = true;
            updateData.receiptName = receipt.name;
        }
        
        try {
            if (db) {
                db.updateClient(clientId, updateData);
                clients = db.getAllClients();
            } else {
                const clientIndex = clients.findIndex(c => String(c.id) === String(clientId));
                if (clientIndex !== -1) {
                    clients[clientIndex] = { ...clients[clientIndex], ...updateData };
                }
            }
            
            loadClientsTable();
            updateDashboard();
            closeModal('editClientModal');
            
            // Clear form
            document.getElementById('editClientForm').reset();
            document.getElementById('editClientForm').removeAttribute('data-client-id');
            
            alert('Client updated successfully!');
        } catch (error) {
            alert('Error updating client: ' + error.message);
        }
    });
}

function generateClientCode() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CLIENT${timestamp}${random}`;
}

function editClient(clientId) {
    const id = typeof clientId === 'string' ? clientId : String(clientId);
    const client = clients.find(c => String(c.id) === id);
    if (client) {
        // Populate edit form with client data
        document.getElementById('editClientName').value = client.name || '';
        document.getElementById('editClientPhone').value = client.phone || '';
        document.getElementById('editClientCountry').value = client.country || '';
        document.getElementById('editClientSubscription').value = client.subscription || '';
        document.getElementById('editClientStatus').value = client.status || 'active';
        document.getElementById('editClientCode').value = client.code || '';
        
        // Store client ID for form submission
        document.getElementById('editClientForm').setAttribute('data-client-id', id);
        
        // Show edit modal
        document.getElementById('editClientModal').style.display = 'flex';
    }
}

function deleteClient(clientId) {
    const id = typeof clientId === 'string' ? clientId : String(clientId);
    if (confirm('Are you sure you want to delete this client?')) {
        try {
            if (db) {
                db.deleteClient(isNaN(Number(id)) ? id : Number(id));
                clients = db.getAllClients();
            } else {
                clients = clients.filter(c => String(c.id) !== id);
            }
            
            loadClientsTable();
            updateDashboard();
        } catch (error) {
            alert('Error deleting client: ' + error.message);
        }
    }
}

// Admin connection management functions
function adminConnectClient(clientId) {
    const id = typeof clientId === 'string' ? clientId : String(clientId);
    const client = clients.find(c => String(c.id) === id);
    if (client) {
        // Check if client has uploaded receipt
        if (!client.receiptUploaded) {
            alert(`Cannot connect client ${client.name}: Payment receipt not uploaded. Please upload receipt first.`);
            return;
        }
        
        const connectionData = { connected: true, timestamp: Date.now() };
        clientConnections.set(String(id), connectionData);
        
        // Save connection to database
        if (db) {
            db.setClientConnection(isNaN(Number(id)) ? id : Number(id), connectionData);
        }
        
        loadClientsTable();
        updateDashboard();
        console.log(`Admin connected client: ${client.name} (${client.code})`);
    }
}

function adminDisconnectClient(clientId) {
    const id = typeof clientId === 'string' ? clientId : String(clientId);
    const client = clients.find(c => String(c.id) === id);
    if (client) {
        const connectionData = { connected: false, timestamp: Date.now() };
        clientConnections.set(String(id), connectionData);
        
        // Save connection to database
        if (db) {
            db.setClientConnection(isNaN(Number(id)) ? id : Number(id), connectionData);
        }
        
        loadClientsTable();
        updateDashboard();
        console.log(`Admin disconnected client: ${client.name} (${client.code})`);
    }
}

// Prediction functions
function generateNewPrediction() {
    const multiplier = generatePredictionMultiplier();
    const predictionData = {
        multiplier: parseFloat(multiplier),
        status: 'active',
        result: null,
        timestamp: Date.now()
    };
    
    try {
        const newPrediction = db ? db.createPrediction(predictionData) : {
            id: Date.now(),
            ...predictionData
        };
        
        if (!db) {
            predictions.push(newPrediction);
        } else {
            predictions = db.getAllPredictions();
        }
        
        if (currentUser && currentUser.type === 'admin') {
            loadPredictionsGrid();
            updateDashboard();
        }
        
        // Update client interfaces
        updateAllClientInterfaces();
    } catch (error) {
        console.error('Error creating prediction:', error);
    }
}

function generatePredictionMultiplier() {
    switch(settings.algorithm) {
        case 'random':
            return (Math.random() * 4 + 1).toFixed(2);
        case 'pattern':
            return generatePatternBasedPrediction();
        case 'ai':
            return generateAIPrediction();
        default:
            return (Math.random() * 4 + 1).toFixed(2);
    }
}

function generatePatternBasedPrediction() {
    // Simple pattern-based algorithm
    const recentPredictions = predictions.slice(-5);
    if (recentPredictions.length === 0) {
        return (Math.random() * 4 + 1).toFixed(2);
    }
    
    const avgMultiplier = recentPredictions.reduce((sum, p) => sum + p.multiplier, 0) / recentPredictions.length;
    const variance = Math.random() * 2 - 1; // -1 to 1
    const newMultiplier = Math.max(1, avgMultiplier + variance);
    
    return newMultiplier.toFixed(2);
}

function generateAIPrediction() {
    // Simulated AI algorithm
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Higher multipliers during peak hours
    let baseMultiplier = 1.5;
    if (timeOfDay >= 18 || timeOfDay <= 6) {
        baseMultiplier = 2.5; // Evening/night hours
    }
    
    // Weekend effect
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseMultiplier *= 1.2;
    }
    
    const randomFactor = Math.random() * 2 + 0.5;
    const finalMultiplier = baseMultiplier * randomFactor;
    
    return Math.min(5, finalMultiplier).toFixed(2);
}

function loadPredictionsGrid() {
    const grid = document.getElementById('predictionsGrid');
    const filter = document.getElementById('predictionFilter').value;
    
    let filteredPredictions = predictions;
    if (filter === 'active') {
        filteredPredictions = predictions.filter(p => p.status === 'active');
    } else if (filter === 'completed') {
        filteredPredictions = predictions.filter(p => p.status === 'completed');
    }
    
    grid.innerHTML = '';
    
    filteredPredictions.forEach(prediction => {
        const card = document.createElement('div');
        card.className = `prediction-card ${prediction.status}`;
        
        const statusClass = prediction.status === 'active' ? 'active' : 'completed';
        const resultText = prediction.result ? (prediction.result === 'success' ? 'Success' : 'Failed') : 'Pending';
        
        card.innerHTML = `
            <div class="prediction-header">
                <span class="prediction-multiplier">${prediction.multiplier}x</span>
                <span class="prediction-status ${statusClass}">${resultText}</span>
            </div>
            <div class="prediction-details">
                <p>Generated: ${new Date(prediction.timestamp).toLocaleString()}</p>
                <p>ID: ${prediction.id}</p>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function filterPredictions() {
    loadPredictionsGrid();
}

// Settings functions
function loadSettings() {
    document.getElementById('algorithmSelect').value = settings.algorithm;
    document.getElementById('updateFrequency').value = settings.updateFrequency;
    document.getElementById('successThreshold').value = settings.successThreshold;
}

function saveSettings() {
    const newSettings = {
        algorithm: document.getElementById('algorithmSelect').value,
        updateFrequency: parseInt(document.getElementById('updateFrequency').value),
        successThreshold: parseInt(document.getElementById('successThreshold').value)
    };
    
    try {
        if (db) {
            db.updateSettings(newSettings);
            settings = db.getSettings();
        } else {
            settings = { ...settings, ...newSettings };
        }
        
        alert('Settings saved successfully!');
    } catch (error) {
        alert('Error saving settings: ' + error.message);
    }
}

// Update client details panel for VPN UI
function updateClientDetails(client) {
    document.getElementById('clientDetailName').textContent = client.name || '-';
    document.getElementById('clientDetailPhone').textContent = client.phone || '-';
    document.getElementById('clientDetailCountry').textContent = client.country || '-';
    document.getElementById('clientDetailSubscription').textContent = client.subscription || '-';
    document.getElementById('clientDetailCode').textContent = client.code || '-';
}

// Update VPN connect button state
function updateVpnConnectButton() {
    const btn = document.getElementById('vpnConnectBtn');
    const text = document.getElementById('vpnConnectText');
    const isConnected = clientConnections.get(String(currentUser.client.id))?.connected || false;
    if (isConnected) {
        btn.className = 'vpn-connect-btn connected';
        text.textContent = 'Connected';
        btn.querySelector('i').className = 'fas fa-power-off';
    } else {
        btn.className = 'vpn-connect-btn disconnected';
        text.textContent = 'Connect';
        btn.querySelector('i').className = 'fas fa-power-off';
    }
}

function toggleConnection() {
    if (currentUser && currentUser.type === 'client') {
        const clientId = String(currentUser.client.id);
        const currentConnection = clientConnections.get(clientId);
        const newStatus = !(currentConnection?.connected || false);
        const connectionData = {
            connected: newStatus,
            timestamp: Date.now()
        };
        
        clientConnections.set(clientId, connectionData);
        
        // Save connection to database
        if (db) {
            db.setClientConnection(isNaN(Number(clientId)) ? clientId : Number(clientId), connectionData);
        }
        
        updateVpnConnectButton();
    }
}

// Update signal transfer text with client's country
function updateSignalTransferText(country) {
    const countrySpan = document.getElementById('clientCountrySignal');
    countrySpan.textContent = country || 'your country';
}

// Update client interface for VPN UI
function updateClientInterface() {
    if (currentUser && currentUser.type === 'client') {
        const client = currentUser.client;
        updateClientDetails(client);
        updateVpnConnectButton();
        updateSignalTransferText(client.country);
    }
}

function updateClientHistory() {
    const historyContainer = document.getElementById('predictionHistory');
    const recentPredictions = predictions.slice(-10).reverse();
    
    historyContainer.innerHTML = '';
    
    recentPredictions.forEach(prediction => {
        if (prediction.status === 'completed') {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const resultClass = prediction.result === 'success' ? 'success' : 'failed';
            const resultText = prediction.result === 'success' ? 'Success' : 'Failed';
            
            historyItem.innerHTML = `
                <span class="history-multiplier">${prediction.multiplier}x</span>
                <span class="history-result ${resultClass}">${resultText}</span>
            `;
            
            historyContainer.appendChild(historyItem);
        }
    });
}

function updateClientStats() {
    const completedPredictions = predictions.filter(p => p.status === 'completed');
    const successCount = completedPredictions.filter(p => p.result === 'success').length;
    const successRate = completedPredictions.length > 0 
        ? Math.round((successCount / completedPredictions.length) * 100)
        : 0;
    
    document.getElementById('clientSuccessRate').textContent = successRate + '%';
    document.getElementById('clientTotalPredictions').textContent = completedPredictions.length;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
}

function updateAllClientInterfaces() {
    // This would update all active client sessions
    // For now, just update the current client if they're logged in
    if (currentUser && currentUser.type === 'client') {
        updateClientInterface();
    }
}

// Timer functions
function startPredictionTimer() {
    setInterval(() => {
        // Complete active predictions randomly
        const activePredictions = predictions.filter(p => p.status === 'active');
        let predictionsUpdated = false;
        
        activePredictions.forEach(prediction => {
            if (Math.random() < 0.3) { // 30% chance to complete each prediction
                const updateData = {
                    status: 'completed',
                    result: Math.random() < 0.6 ? 'success' : 'failed' // 60% success rate
                };
                
                try {
                    if (db) {
                        db.updatePrediction(prediction.id, updateData);
                    } else {
                        prediction.status = updateData.status;
                        prediction.result = updateData.result;
                    }
                    predictionsUpdated = true;
                } catch (error) {
                    console.error('Error updating prediction:', error);
                }
            }
        });
        
        if (predictionsUpdated) {
            if (db) {
                predictions = db.getAllPredictions();
            }
            updateDashboard();
            updateAllClientInterfaces();
        }
        
        // Generate new predictions based on frequency
        if (Math.random() < 0.2) { // 20% chance every interval
            generateNewPrediction();
        }
    }, settings.updateFrequency * 60 * 1000); // Convert minutes to milliseconds
}

// Quick action functions
function viewAllPredictions() {
    showAdminSection('predictions');
}

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString();
}

// Event listeners for keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        if (currentUser && currentUser.type === 'admin') {
            generateNewPrediction();
        }
    }
});

// Auto-save data periodically (handled by virtual database)
// The virtual database automatically saves data every 30 seconds 

// Go back to login screen
function goBackToLogin() {
    // Clear current user session
    currentUser = null;
    
    // Hide client interface
    document.getElementById('clientInterface').style.display = 'none';
    
    // Show login section
    document.getElementById('loginSection').style.display = 'flex';
    
    // Reset connection status
    document.getElementById('connectionStatus').className = 'status-indicator disconnected';
    document.getElementById('connectionStatus').textContent = 'Disconnected';
    
    console.log('User returned to login screen');
}

// Database Management Functions
function loadDatabaseSection() {
    if (!db) {
        console.error('Database not available');
        return;
    }
    
    try {
        const stats = db.getStatistics();
        
        // Update database statistics
        document.getElementById('dbSize').textContent = stats.databaseSize + ' KB';
        document.getElementById('totalRecords').textContent = 
            stats.totalClients + stats.totalPredictions + stats.connectedClients;
        document.getElementById('lastBackup').textContent = 
            stats.lastBackup === 'Never' ? 'Never' : new Date(stats.lastBackup).toLocaleString();
        document.getElementById('autoSaveStatus').textContent = 'Active';
        
        // Load available backups
        loadBackupsList();
    } catch (error) {
        console.error('Error loading database section:', error);
    }
}

function loadBackupsList() {
    if (!db) return;
    
    try {
        const backups = db.getAvailableBackups();
        const backupsList = document.getElementById('backupsList');
        const backupsListModal = document.getElementById('backupsListModal');
        
        if (backupsList) {
            backupsList.innerHTML = '';
            
            if (backups.length === 0) {
                backupsList.innerHTML = '<p class="no-backups">No backups available</p>';
            } else {
                backups.forEach(backup => {
                    const backupItem = document.createElement('div');
                    backupItem.className = 'backup-item';
                    backupItem.innerHTML = `
                        <div class="backup-info">
                            <strong>${new Date(backup.timestamp).toLocaleString()}</strong>
                            <small>Version: ${backup.version}</small>
                            <small>Records: ${backup.recordCounts.clients || 0} clients, ${backup.recordCounts.predictions || 0} predictions</small>
                        </div>
                        <button onclick="restoreFromBackup('${backup.key}')" class="restore-btn">
                            <i class="fas fa-undo"></i> Restore
                        </button>
                    `;
                    backupsList.appendChild(backupItem);
                });
            }
        }
        
        if (backupsListModal) {
            backupsListModal.innerHTML = '';
            
            if (backups.length === 0) {
                backupsListModal.innerHTML = '<p class="no-backups">No backups available</p>';
            } else {
                backups.forEach(backup => {
                    const backupItem = document.createElement('div');
                    backupItem.className = 'backup-item-modal';
                    backupItem.innerHTML = `
                        <div class="backup-info">
                            <strong>${new Date(backup.timestamp).toLocaleString()}</strong>
                            <small>Version: ${backup.version}</small>
                            <small>Records: ${backup.recordCounts.clients || 0} clients, ${backup.recordCounts.predictions || 0} predictions</small>
                        </div>
                        <button onclick="restoreFromBackup('${backup.key}'); closeModal('backupRestoreModal');" class="restore-btn">
                            <i class="fas fa-undo"></i> Restore
                        </button>
                    `;
                    backupsListModal.appendChild(backupItem);
                });
            }
        }
    } catch (error) {
        console.error('Error loading backups list:', error);
    }
}

function createBackup() {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    try {
        const backupKey = db.createBackup();
        if (backupKey) {
            alert('Backup created successfully!');
            loadBackupsList();
            loadDatabaseSection();
        } else {
            alert('Failed to create backup');
        }
    } catch (error) {
        alert('Error creating backup: ' + error.message);
    }
}

function exportData() {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    try {
        const success = db.exportData();
        if (success) {
            alert('Data exported successfully!');
        } else {
            alert('Failed to export data');
        }
    } catch (error) {
        alert('Error exporting data: ' + error.message);
    }
}

function showImportModal() {
    document.getElementById('importDataModal').style.display = 'flex';
}

function showBackupRestoreModal() {
    loadBackupsList();
    document.getElementById('backupRestoreModal').style.display = 'flex';
}

function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to import');
        return;
    }
    
    if (!db) {
        alert('Database not available');
        return;
    }
    
    try {
        db.importData(file).then(() => {
            alert('Data imported successfully!');
            closeModal('importDataModal');
            
            // Reload all data
            loadData();
            updateDashboard();
            loadClientsTable();
            loadPredictionsGrid();
            loadDatabaseSection();
        }).catch(error => {
            alert('Error importing data: ' + error.message);
        });
    } catch (error) {
        alert('Error importing data: ' + error.message);
    }
}

function restoreFromBackup(backupKey) {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    if (!confirm('Are you sure you want to restore from this backup? This will replace all current data.')) {
        return;
    }
    
    try {
        const success = db.restoreFromBackup(backupKey);
        if (success) {
            alert('Backup restored successfully!');
            
            // Reload all data
            loadData();
            updateDashboard();
            loadClientsTable();
            loadPredictionsGrid();
            loadDatabaseSection();
        } else {
            alert('Failed to restore backup');
        }
    } catch (error) {
        alert('Error restoring backup: ' + error.message);
    }
}

function cleanupDatabase() {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    if (!confirm('Are you sure you want to cleanup old data? This will remove old completed predictions and logs.')) {
        return;
    }
    
    try {
        const success = db.cleanup();
        if (success) {
            alert('Database cleanup completed successfully!');
            loadData();
            updateDashboard();
            loadClientsTable();
            loadPredictionsGrid();
            loadDatabaseSection();
        } else {
            alert('Failed to cleanup database');
        }
    } catch (error) {
        alert('Error cleaning up database: ' + error.message);
    }
}

function resetDatabase() {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    if (!confirm('Are you sure you want to reset the database? This will delete ALL data and cannot be undone!')) {
        return;
    }
    
    if (!confirm('This action is IRREVERSIBLE. Are you absolutely sure?')) {
        return;
    }
    
    try {
        const success = db.reset();
        if (success) {
            alert('Database reset completed successfully!');
            
            // Reload all data
            loadData();
            updateDashboard();
            loadClientsTable();
            loadPredictionsGrid();
            loadDatabaseSection();
        } else {
            alert('Failed to reset database');
        }
    } catch (error) {
        alert('Error resetting database: ' + error.message);
    }
}

// Excel Export Functionality
function exportToExcel() {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    try {
        // Get all data
        const clients = db.getAllClients();
        const predictions = db.getAllPredictions();
        const connections = db.getAllConnections();
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create clients sheet
        const clientsData = clients.map(client => ({
            'Client Code': client.code,
            'Name': client.name,
            'Phone': client.phone,
            'Country': client.country,
            'Subscription': client.subscription,
            'Status': client.status,
            'Receipt Uploaded': client.receiptUploaded ? 'Yes' : 'No',
            'Receipt Name': client.receiptName || 'N/A',
            'Created Date': client.createdDate,
            'Last Updated': client.updatedAt || client.createdAt,
            'Connected': connections[client.id]?.connected ? 'Yes' : 'No',
            'Last Connection': connections[client.id]?.timestamp ? new Date(connections[client.id].timestamp).toLocaleString() : 'Never'
        }));
        
        const clientsWS = XLSX.utils.json_to_sheet(clientsData);
        XLSX.utils.book_append_sheet(wb, clientsWS, 'Clients');
        
        // Create predictions sheet
        const predictionsData = predictions.map(prediction => ({
            'ID': prediction.id,
            'Multiplier': prediction.multiplier,
            'Status': prediction.status,
            'Result': prediction.result || 'Pending',
            'Created Date': new Date(prediction.timestamp || prediction.createdAt).toLocaleString(),
            'Updated Date': prediction.updatedAt ? new Date(prediction.updatedAt).toLocaleString() : 'N/A'
        }));
        
        const predictionsWS = XLSX.utils.json_to_sheet(predictionsData);
        XLSX.utils.book_append_sheet(wb, predictionsWS, 'Predictions');
        
        // Create summary sheet
        const stats = db.getStatistics();
        const summaryData = [
            { 'Metric': 'Total Clients', 'Value': stats.totalClients },
            { 'Metric': 'Active Clients', 'Value': stats.activeClients },
            { 'Metric': 'Total Predictions', 'Value': stats.totalPredictions },
            { 'Metric': 'Active Predictions', 'Value': stats.activePredictions },
            { 'Metric': 'Completed Predictions', 'Value': stats.completedPredictions },
            { 'Metric': 'Connected Clients', 'Value': stats.connectedClients },
            { 'Metric': 'Success Rate (%)', 'Value': stats.successRate },
            { 'Metric': 'Database Size (KB)', 'Value': stats.databaseSize },
            { 'Metric': 'Last Backup', 'Value': stats.lastBackup },
            { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() }
        ];
        
        const summaryWS = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
        
        // Create connections sheet
        const connectionsData = Object.entries(connections).map(([clientId, connection]) => {
            const client = clients.find(c => c.id == clientId);
            return {
                'Client ID': clientId,
                'Client Name': client ? client.name : 'Unknown',
                'Client Code': client ? client.code : 'Unknown',
                'Connected': connection.connected ? 'Yes' : 'No',
                'Last Connection': new Date(connection.timestamp).toLocaleString(),
                'Updated': connection.updatedAt ? new Date(connection.updatedAt).toLocaleString() : 'N/A'
            };
        });
        
        const connectionsWS = XLSX.utils.json_to_sheet(connectionsData);
        XLSX.utils.book_append_sheet(wb, connectionsWS, 'Connections');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `aviator_data_${timestamp}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
        
        alert('Excel file exported successfully!');
    } catch (error) {
        alert('Error exporting to Excel: ' + error.message);
        console.error('Excel export error:', error);
    }
} 