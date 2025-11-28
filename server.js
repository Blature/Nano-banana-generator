const express = require('express');
const setupBotRoutes = require('./routes/botRoutes');
const { createTables, initializeRootAdmins } = require('./database/migrations');
const logger = require('./utils/logger');
const config = require('./config/config');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and bot
async function initialize() {
  try {
    logger.info('Initializing application...');
    
    // Create database tables
    await createTables();
    
    // Initialize root admins
    await initializeRootAdmins();
    
    // Setup bot routes
    setupBotRoutes();
    
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Error initializing application:', error);
    process.exit(1);
  }
}

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
  initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;

