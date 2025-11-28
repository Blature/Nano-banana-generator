require('dotenv').config();

module.exports = {
  // Telegram Configuration
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },

  // Gemini API Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    modelName: process.env.GEMINI_MODEL_NAME || 'gemini-3-pro-image-preview',
  },

  // Root Admin IDs
  rootAdmins: (process.env.ROOT_ADMIN_IDS || '7544822519,218078175')
    .split(',')
    .map(id => id.trim()),

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  port: process.env.PORT || 3000,
};

