# Aviator Predictor - Admin Panel & Client Management System

A comprehensive web-based application for managing Aviator game predictions with an admin panel and client interface.

## Features

### 🔐 Authentication System
- **Admin Login**: Secure admin access with username/password
- **Client Access**: Client code-based authentication
- **Session Management**: Automatic logout and session handling

### 👨‍💼 Admin Panel
- **Dashboard**: Real-time statistics and overview
- **Client Management**: Add, edit, delete, and manage client accounts
- **Predictions Management**: Generate and monitor predictions
- **Settings**: Configure prediction algorithms and system parameters

### 👥 Client Interface
- **Connection Status**: Real-time connection indicator (green/red)
- **Client Registration**: Complete registration with receipt upload
- **Real-time Predictions**: Live prediction display
- **Prediction History**: View recent prediction results
- **Statistics**: Success rate and performance metrics
- **Responsive Design**: Works on desktop and mobile devices

### 🎯 Prediction Algorithms
- **Random Algorithm**: Basic random multiplier generation
- **Pattern-Based**: Analyzes recent predictions for patterns
- **AI Enhanced**: Time-based and day-of-week analysis

## Quick Start

### 1. Open the Application
Simply open `index.html` in your web browser. No server setup required!

### 2. Admin Access
- **Username**: `admin`
- **Password**: `admin123`

### 3. Client Access
**Option 1: Register New Client**
- Click "Register New Client" button
- Fill in your details (name, phone, country)
- Select 3-month subscription
- Upload payment receipt
- Get auto-generated client code

**Option 2: Use Existing Code**
Use any of the sample client codes:
- `CLIENT001` (John Doe)
- `CLIENT002` (Jane Smith)
- `CLIENT003` (Mike Johnson - inactive)

## Admin Panel Features

### Dashboard
- Total number of clients
- Active predictions count
- Overall success rate
- Today's game count
- Quick action buttons

### Client Management
- **Comprehensive Registration**: Add new clients with full details (name, phone, country, subscription)
- **Payment Verification**: Upload and verify payment receipts for each client
- **Auto-Generated Codes**: System automatically generates unique client codes
- **Detailed Client Table**: View all client information including phone, country, subscription, and receipt status
- **Connection Monitoring**: Real-time connection status tracking
- **Connection Control**: Admin can manually connect/disconnect clients using action buttons
- **Client Management**: Edit, delete, and toggle client status
- **Receipt Tracking**: Visual indicators for uploaded/missing receipts

### Predictions Management
- Generate new predictions manually
- View all predictions with status
- Filter by active/completed predictions
- Real-time updates

### Settings
- **Prediction Algorithm**: Choose between Random, Pattern-based, or AI Enhanced
- **Update Frequency**: Set how often predictions are generated (1-60 minutes)
- **Success Rate Threshold**: Configure minimum success rate (0-100%)

### Database Management (NEW)
- **Statistics Dashboard**: View database size, record counts, and status
- **Backup Creation**: Manual backup creation with timestamps
- **Data Export**: Download complete database as JSON file
- **Data Import**: Upload and restore from JSON files
- **Backup Restoration**: Restore from automatic or manual backups
- **Data Cleanup**: Remove old completed predictions and logs
- **Database Reset**: Complete database reset with confirmation

## Client Interface Features

### Current Prediction Display
- Large, prominent multiplier display
- Real-time status updates
- Visual indicators for active/waiting states
- Connection status indicator (Connected/Disconnected)

### Prediction History
- Last 10 completed predictions
- Success/failure indicators
- Multiplier values
- Color-coded results

### Statistics Panel
- Success rate percentage
- Total predictions count
- Last update timestamp

## Technical Details

### Data Storage
- **Virtual Database**: Advanced database system with CRUD operations
- **Automatic Backups**: Backups created every hour with retention (last 5)
- **Auto-save**: Data is automatically saved every 30 seconds
- **Data Export/Import**: Full backup and restore functionality
- **Data Validation**: Comprehensive input validation and error handling
- **Persistence**: Data persists between browser sessions with enhanced reliability

### Prediction System
- **Automatic Generation**: Predictions are generated based on configured frequency
- **Random Completion**: Active predictions are randomly completed
- **Success Rate**: Configurable success rate (default 60%)

### Responsive Design
- **Mobile-friendly**: Optimized for all screen sizes
- **Modern UI**: Clean, professional interface
- **Smooth Animations**: Enhanced user experience

## File Structure

```
aviator-predictor/
├── index.html          # Main application file
├── styles.css          # All styling and responsive design
├── script.js           # Application logic and functionality
├── database.js         # Virtual database system
└── README.md           # This documentation
```

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Security Features

- **Client Code Validation**: Only active clients can access predictions
- **Admin Authentication**: Secure admin login system
- **Data Validation**: Input validation and sanitization
- **Session Management**: Automatic logout on page refresh

## Customization

### Adding New Prediction Algorithms
1. Open `script.js`
2. Add your algorithm function in the `generatePredictionMultiplier()` function
3. Update the settings dropdown in `index.html`

### Styling Customization
1. Modify `styles.css` to change colors, fonts, and layout
2. The application uses CSS custom properties for easy theming
3. Responsive breakpoints are clearly defined

### Data Structure
The application uses a virtual database system with enhanced data structures:
- **Clients**: `{id, name, phone, country, subscription, code, status, createdDate, receiptUploaded, receiptName}`
- **Predictions**: `{id, multiplier, status, result, timestamp, createdAt, updatedAt}`
- **Settings**: `{algorithm, updateFrequency, successThreshold, updatedAt}`
- **Connections**: `{clientId: {connected, timestamp, updatedAt}}`
- **Logs**: `{timestamp, level, message}`

## Troubleshooting

### Common Issues

1. **Data Not Loading**
   - Check the Database Management section for available backups
   - Use the "Restore Backup" function if needed
   - Clear browser localStorage as last resort
   - Refresh the page
   - Check browser console for errors

2. **Predictions Not Updating**
   - Check the update frequency setting
   - Ensure the page is active (not minimized)
   - Verify browser allows JavaScript execution

3. **Client Code Not Working**
   - Ensure the client is marked as 'active'
   - Check for typos in the client code
   - Verify the client exists in the system

### Performance Tips

- Close unused browser tabs
- Clear browser cache periodically
- Use a modern browser for best performance
- Keep the application tab active for real-time updates

## Future Enhancements

- [x] Virtual database system with backup/restore
- [x] Data export/import functionality
- [x] Enhanced data validation and error handling
- [ ] Real-time WebSocket connections
- [ ] Database integration (MySQL/PostgreSQL)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Advanced prediction algorithms
- [ ] User roles and permissions
- [ ] API endpoints for external integrations

## Support

For technical support or feature requests, please refer to the code comments or create an issue in the project repository.

---

**Note**: This is a demonstration application. For production use, implement proper security measures, database storage, and server-side validation. 