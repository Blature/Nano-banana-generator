# Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **PostgreSQL Database**
   - Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
   - Create a database:
     ```sql
     CREATE DATABASE nano_banana_bot;
     ```

3. **Telegram Bot Token**
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Create a new bot with `/newbot`
   - Copy the bot token

4. **Gemini API Key**
   - Get your API key from Google AI Studio or Google Cloud Console
   - Ensure you have access to Gemini 3 Pro Nano Banana API

## Installation Steps

1. **Clone and navigate to the project:**
   ```bash
   cd Nano-banana-generator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   Create a `.env` file in the root directory with the following content:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-pro-nano-banana:generateContent
   ROOT_ADMIN_IDS=7544822519,218078175
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nano_banana_bot
   DB_USER=postgres
   DB_PASSWORD=your_db_password_here
   NODE_ENV=development
   PORT=3000
   ```

4. **Update the `.env` file with your actual values:**
   - Replace `your_telegram_bot_token_here` with your Telegram bot token
   - Replace `your_gemini_api_key_here` with your Gemini API key
   - Update database credentials if different
   - Adjust `ROOT_ADMIN_IDS` if needed (comma-separated Telegram user IDs)

5. **Run the application:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

6. **Verify setup:**
   - The bot should connect to Telegram
   - Database tables should be created automatically
   - Root admins should be initialized
   - Check logs for any errors

## Testing

1. **Test as Root Admin:**
   - Start a chat with your bot on Telegram
   - Send `/start`
   - You should see admin options if you're a root admin

2. **Test Image Generation:**
   - Send a text prompt to generate an image
   - Wait for the generated image
   - Use "Cancel Session" button to reset

3. **Test Image Editing:**
   - Send an image with a caption (prompt)
   - Or send an image first, then send a prompt
   - The image should be edited based on the prompt

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure the database exists

### Telegram Bot Not Responding
- Verify the bot token is correct
- Check if the bot is started (not stopped in BotFather)
- Check network connectivity

### Gemini API Errors
- Verify the API key is correct
- Check API quota/limits
- Verify the API endpoint URL is correct
- Note: The API response structure may need adjustment based on actual Gemini API implementation

### Permission Errors
- Ensure non-admin users are added by root admins
- Check user status in the database

## Notes

- The Gemini API response parsing may need adjustment based on the actual API response format
- Image data is stored in base64 format in the database
- Sessions are automatically managed and can be canceled by users
- All interactions are logged in the database for history

