/**
 * Virtual Database System for Aviator Predictor
 * Provides persistent data storage with backup and recovery capabilities
 */

class VirtualDatabase {
    constructor() {
        this.dbName = 'aviator_predictor_db';
        this.version = '1.0';
        this.tables = {
            clients: 'clients',
            predictions: 'predictions',
            settings: 'settings',
            connections: 'connections',
            logs: 'logs'
        };
        
        // Initialize database
        this.init();
    }

    /**
     * Initialize the database and load existing data
     */
    init() {
        try {
            this.loadFromStorage();
            this.createBackup();
            console.log('Virtual Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.handleError('Database initialization failed', error);
        }
    }

    /**
     * Load data from localStorage
     */
    loadFromStorage() {
        const data = {
            clients: this.getFromStorage('aviatorClients', []),
            predictions: this.getFromStorage('aviatorPredictions', []),
            settings: this.getFromStorage('aviatorSettings', {
                algorithm: 'random',
                updateFrequency: 5,
                successThreshold: 70
            }),
            connections: this.getFromStorage('aviatorConnections', {}),
            logs: this.getFromStorage('aviatorLogs', [])
        };

        // Store in memory
        this.data = data;
        
        // Add metadata
        this.metadata = {
            lastUpdated: new Date().toISOString(),
            version: this.version,
            recordCounts: {
                clients: data.clients.length,
                predictions: data.predictions.length,
                connections: Object.keys(data.connections).length,
                logs: data.logs.length
            }
        };

        this.log('Database loaded from storage', 'info');
    }

    /**
     * Get data from localStorage with fallback
     */
    getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key} from storage:`, error);
            return defaultValue;
        }
    }

    /**
     * Save data to localStorage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key} to storage:`, error);
            this.handleError(`Failed to save ${key}`, error);
            return false;
        }
    }

    /**
     * CLIENT OPERATIONS
     */
    
    // Create a new client
    createClient(clientData) {
        try {
            // Validate client data
            if (!this.validateClientData(clientData)) {
                throw new Error('Invalid client data');
            }

            // Generate unique ID if not provided
            if (!clientData.id) {
                clientData.id = this.generateId();
            }

            // Check for duplicate client code
            if (this.getClientByCode(clientData.code)) {
                throw new Error('Client code already exists');
            }

            // Add metadata
            clientData.createdAt = new Date().toISOString();
            clientData.updatedAt = new Date().toISOString();
            clientData.status = clientData.status || 'active';

            // Add to database
            this.data.clients.push(clientData);
            this.saveClients();
            this.updateMetadata();
            this.log(`Client created: ${clientData.name} (${clientData.code})`, 'info');

            return clientData;
        } catch (error) {
            this.handleError('Failed to create client', error);
            throw error;
        }
    }

    // Get all clients
    getAllClients() {
        return this.data.clients || [];
    }

    // Get client by ID
    getClientById(id) {
        return this.data.clients.find(client => client.id === id);
    }

    // Get client by code
    getClientByCode(code) {
        return this.data.clients.find(client => client.code === code);
    }

    // Update client
    updateClient(id, updateData) {
        try {
            const clientIndex = this.data.clients.findIndex(client => client.id === id);
            if (clientIndex === -1) {
                throw new Error('Client not found');
            }

            // Validate update data
            if (!this.validateClientUpdate(updateData)) {
                throw new Error('Invalid update data');
            }

            // Update client
            this.data.clients[clientIndex] = {
                ...this.data.clients[clientIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            this.saveClients();
            this.updateMetadata();
            this.log(`Client updated: ${this.data.clients[clientIndex].name}`, 'info');

            return this.data.clients[clientIndex];
        } catch (error) {
            this.handleError('Failed to update client', error);
            throw error;
        }
    }

    // Delete client
    deleteClient(id) {
        try {
            const clientIndex = this.data.clients.findIndex(client => client.id === id);
            if (clientIndex === -1) {
                throw new Error('Client not found');
            }

            const client = this.data.clients[clientIndex];
            this.data.clients.splice(clientIndex, 1);
            
            // Also remove connection data
            delete this.data.connections[id];
            
            this.saveClients();
            this.saveConnections();
            this.updateMetadata();
            this.log(`Client deleted: ${client.name} (${client.code})`, 'warning');

            return true;
        } catch (error) {
            this.handleError('Failed to delete client', error);
            throw error;
        }
    }

    /**
     * PREDICTION OPERATIONS
     */
    
    // Create a new prediction
    createPrediction(predictionData) {
        try {
            // Validate prediction data
            if (!this.validatePredictionData(predictionData)) {
                throw new Error('Invalid prediction data');
            }

            // Generate unique ID if not provided
            if (!predictionData.id) {
                predictionData.id = this.generateId();
            }

            // Add metadata
            predictionData.createdAt = new Date().toISOString();
            predictionData.updatedAt = new Date().toISOString();
            predictionData.status = predictionData.status || 'active';

            // Add to database
            this.data.predictions.push(predictionData);
            this.savePredictions();
            this.updateMetadata();
            this.log(`Prediction created: ${predictionData.multiplier}x`, 'info');

            return predictionData;
        } catch (error) {
            this.handleError('Failed to create prediction', error);
            throw error;
        }
    }

    // Get all predictions
    getAllPredictions() {
        return this.data.predictions || [];
    }

    // Get prediction by ID
    getPredictionById(id) {
        return this.data.predictions.find(prediction => prediction.id === id);
    }

    // Get active predictions
    getActivePredictions() {
        return this.data.predictions.filter(prediction => prediction.status === 'active');
    }

    // Update prediction
    updatePrediction(id, updateData) {
        try {
            const predictionIndex = this.data.predictions.findIndex(prediction => prediction.id === id);
            if (predictionIndex === -1) {
                throw new Error('Prediction not found');
            }

            // Update prediction
            this.data.predictions[predictionIndex] = {
                ...this.data.predictions[predictionIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            this.savePredictions();
            this.updateMetadata();
            this.log(`Prediction updated: ${this.data.predictions[predictionIndex].multiplier}x`, 'info');

            return this.data.predictions[predictionIndex];
        } catch (error) {
            this.handleError('Failed to update prediction', error);
            throw error;
        }
    }

    // Delete prediction
    deletePrediction(id) {
        try {
            const predictionIndex = this.data.predictions.findIndex(prediction => prediction.id === id);
            if (predictionIndex === -1) {
                throw new Error('Prediction not found');
            }

            const prediction = this.data.predictions[predictionIndex];
            this.data.predictions.splice(predictionIndex, 1);
            
            this.savePredictions();
            this.updateMetadata();
            this.log(`Prediction deleted: ${prediction.multiplier}x`, 'warning');

            return true;
        } catch (error) {
            this.handleError('Failed to delete prediction', error);
            throw error;
        }
    }

    /**
     * SETTINGS OPERATIONS
     */
    
    // Get settings
    getSettings() {
        return this.data.settings || {};
    }

    // Update settings
    updateSettings(newSettings) {
        try {
            this.data.settings = {
                ...this.data.settings,
                ...newSettings,
                updatedAt: new Date().toISOString()
            };

            this.saveSettings();
            this.log('Settings updated', 'info');
            return this.data.settings;
        } catch (error) {
            this.handleError('Failed to update settings', error);
            throw error;
        }
    }

    /**
     * CONNECTION OPERATIONS
     */
    
    // Set client connection status
    setClientConnection(clientId, connectionData) {
        try {
            this.data.connections[clientId] = {
                ...connectionData,
                updatedAt: new Date().toISOString()
            };

            this.saveConnections();
            this.log(`Client connection updated: ${clientId}`, 'info');
            return this.data.connections[clientId];
        } catch (error) {
            this.handleError('Failed to update client connection', error);
            throw error;
        }
    }

    // Get client connection
    getClientConnection(clientId) {
        return this.data.connections[clientId] || null;
    }

    // Get all connections
    getAllConnections() {
        return this.data.connections || {};
    }

    /**
     * DATA PERSISTENCE METHODS
     */
    
    saveClients() {
        return this.saveToStorage('aviatorClients', this.data.clients);
    }

    savePredictions() {
        return this.saveToStorage('aviatorPredictions', this.data.predictions);
    }

    saveSettings() {
        return this.saveToStorage('aviatorSettings', this.data.settings);
    }

    saveConnections() {
        return this.saveToStorage('aviatorConnections', this.data.connections);
    }

    saveLogs() {
        return this.saveToStorage('aviatorLogs', this.data.logs);
    }

    // Save all data
    saveAll() {
        try {
            this.saveClients();
            this.savePredictions();
            this.saveSettings();
            this.saveConnections();
            this.saveLogs();
            this.updateMetadata();
            this.log('All data saved successfully', 'info');
            return true;
        } catch (error) {
            this.handleError('Failed to save all data', error);
            return false;
        }
    }

    /**
     * BACKUP AND RECOVERY
     */
    
    // Create backup
    createBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: this.version,
                data: { ...this.data },
                metadata: { ...this.metadata }
            };

            const backupKey = `aviator_backup_${Date.now()}`;
            this.saveToStorage(backupKey, backup);
            
            // Keep only last 5 backups
            this.cleanupOldBackups();
            
            this.log('Backup created successfully', 'info');
            return backupKey;
        } catch (error) {
            this.handleError('Failed to create backup', error);
            return null;
        }
    }

    // Restore from backup
    restoreFromBackup(backupKey) {
        try {
            const backup = this.getFromStorage(backupKey);
            if (!backup) {
                throw new Error('Backup not found');
            }

            this.data = backup.data;
            this.metadata = backup.metadata;
            
            this.saveAll();
            this.log(`Restored from backup: ${backupKey}`, 'info');
            return true;
        } catch (error) {
            this.handleError('Failed to restore from backup', error);
            return false;
        }
    }

    // Get available backups
    getAvailableBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('aviator_backup_')) {
                const backup = this.getFromStorage(key);
                if (backup) {
                    backups.push({
                        key: key,
                        timestamp: backup.timestamp,
                        version: backup.version,
                        recordCounts: backup.metadata?.recordCounts || {}
                    });
                }
            }
        }
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Cleanup old backups
    cleanupOldBackups() {
        const backups = this.getAvailableBackups();
        if (backups.length > 5) {
            const toDelete = backups.slice(5);
            toDelete.forEach(backup => {
                localStorage.removeItem(backup.key);
            });
        }
    }

    /**
     * EXPORT/IMPORT FUNCTIONALITY
     */
    
    // Export all data
    exportData() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                version: this.version,
                data: { ...this.data },
                metadata: { ...this.metadata }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `aviator_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.log('Data exported successfully', 'info');
            return true;
        } catch (error) {
            this.handleError('Failed to export data', error);
            return false;
        }
    }

    // Import data
    importData(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        // Validate import data
                        if (!this.validateImportData(importData)) {
                            throw new Error('Invalid import data format');
                        }

                        // Create backup before import
                        this.createBackup();

                        // Import data
                        this.data = importData.data;
                        this.metadata = importData.metadata;
                        
                        this.saveAll();
                        this.log('Data imported successfully', 'info');
                        resolve(true);
                    } catch (error) {
                        this.handleError('Failed to import data', error);
                        reject(error);
                    }
                };
                reader.readAsText(file);
            } catch (error) {
                this.handleError('Failed to read import file', error);
                reject(error);
            }
        });
    }

    /**
     * VALIDATION METHODS
     */
    
    validateClientData(clientData) {
        return clientData && 
               typeof clientData.name === 'string' && clientData.name.trim() !== '' &&
               typeof clientData.code === 'string' && clientData.code.trim() !== '' &&
               typeof clientData.phone === 'string' && clientData.phone.trim() !== '' &&
               typeof clientData.country === 'string' && clientData.country.trim() !== '';
    }

    validateClientUpdate(updateData) {
        // Allow partial updates, but validate existing fields
        const allowedFields = ['name', 'phone', 'country', 'subscription', 'status', 'receiptUploaded', 'receiptName'];
        return Object.keys(updateData).every(key => allowedFields.includes(key));
    }

    validatePredictionData(predictionData) {
        return predictionData && 
               typeof predictionData.multiplier === 'number' && predictionData.multiplier > 0;
    }

    validateImportData(importData) {
        return importData && 
               importData.data && 
               Array.isArray(importData.data.clients) &&
               Array.isArray(importData.data.predictions);
    }

    /**
     * UTILITY METHODS
     */
    
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    updateMetadata() {
        this.metadata = {
            ...this.metadata,
            lastUpdated: new Date().toISOString(),
            recordCounts: {
                clients: this.data.clients.length,
                predictions: this.data.predictions.length,
                connections: Object.keys(this.data.connections).length,
                logs: this.data.logs.length
            }
        };
    }

    log(message, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message
        };
        
        this.data.logs.push(logEntry);
        
        // Keep only last 1000 log entries
        if (this.data.logs.length > 1000) {
            this.data.logs = this.data.logs.slice(-1000);
        }
        
        this.saveLogs();
        console.log(`[${level.toUpperCase()}] ${message}`);
    }

    handleError(message, error) {
        this.log(`${message}: ${error.message}`, 'error');
        console.error(message, error);
    }

    /**
     * STATISTICS AND ANALYTICS
     */
    
    getStatistics() {
        const clients = this.getAllClients();
        const predictions = this.getAllPredictions();
        const connections = this.getAllConnections();

        return {
            totalClients: clients.length,
            activeClients: clients.filter(c => c.status === 'active').length,
            totalPredictions: predictions.length,
            activePredictions: predictions.filter(p => p.status === 'active').length,
            completedPredictions: predictions.filter(p => p.status === 'completed').length,
            connectedClients: Object.values(connections).filter(c => c.connected).length,
            successRate: this.calculateSuccessRate(),
            lastBackup: this.getAvailableBackups()[0]?.timestamp || 'Never',
            databaseSize: this.getDatabaseSize()
        };
    }

    calculateSuccessRate() {
        const completedPredictions = this.data.predictions.filter(p => p.status === 'completed');
        if (completedPredictions.length === 0) return 0;
        
        const successfulPredictions = completedPredictions.filter(p => p.result === 'success');
        return Math.round((successfulPredictions.length / completedPredictions.length) * 100);
    }

    getDatabaseSize() {
        try {
            const dataStr = JSON.stringify(this.data);
            return Math.round(dataStr.length / 1024); // Size in KB
        } catch (error) {
            return 0;
        }
    }

    /**
     * MAINTENANCE METHODS
     */
    
    // Clean up old data
    cleanup() {
        try {
            // Remove old completed predictions (older than 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            this.data.predictions = this.data.predictions.filter(prediction => {
                if (prediction.status === 'completed') {
                    const predictionDate = new Date(prediction.createdAt || prediction.timestamp);
                    return predictionDate > thirtyDaysAgo;
                }
                return true;
            });

            // Clean up old logs (keep last 1000)
            if (this.data.logs.length > 1000) {
                this.data.logs = this.data.logs.slice(-1000);
            }

            this.saveAll();
            this.log('Database cleanup completed', 'info');
            return true;
        } catch (error) {
            this.handleError('Failed to cleanup database', error);
            return false;
        }
    }

    // Reset database
    reset() {
        try {
            // Create final backup before reset
            this.createBackup();
            
            // Reset data
            this.data = {
                clients: [],
                predictions: [],
                settings: {
                    algorithm: 'random',
                    updateFrequency: 5,
                    successThreshold: 70
                },
                connections: {},
                logs: []
            };
            
            this.saveAll();
            this.log('Database reset completed', 'warning');
            return true;
        } catch (error) {
            this.handleError('Failed to reset database', error);
            return false;
        }
    }
}

// Create global database instance
window.virtualDB = new VirtualDatabase();

// Auto-save every 30 seconds
setInterval(() => {
    if (window.virtualDB) {
        window.virtualDB.saveAll();
    }
}, 30000);

// Create backup every hour
setInterval(() => {
    if (window.virtualDB) {
        window.virtualDB.createBackup();
    }
}, 3600000);

// Cleanup every 24 hours
setInterval(() => {
    if (window.virtualDB) {
        window.virtualDB.cleanup();
    }
}, 86400000);

console.log('Virtual Database System loaded successfully');
