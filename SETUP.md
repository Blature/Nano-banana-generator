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
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey) or Google Cloud Console
   - The project uses `@google/generative-ai` package
   - Model used: `gemini-3-pro-image-preview` (for image generation)

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
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Or create a `.env` file manually in the root directory with the following content:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL_NAME=gemini-3-pro-image-preview
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
   - The `GEMINI_MODEL_NAME` is set to `gemini-3-pro-image-preview` by default (you can change it if needed)
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
- Verify the API key is correct in `.env` file
- Check API quota/limits in Google AI Studio
- Verify the model name `GEMINI_MODEL_NAME` is correct (default: `gemini-3-pro-image-preview`)
- Ensure you have access to the Gemini API and the specific model
- Check that `@google/generative-ai` package is installed: `npm install`

### Permission Errors
- Ensure non-admin users are added by root admins
- Check user status in the database

## Notes

- The project uses `@google/generative-ai` package for Gemini API integration
- Model `gemini-3-pro-image-preview` is used for image generation
- Image data is stored in base64 format in the database
- Sessions are automatically managed and can be canceled by users
- All interactions are logged in the database for history
- The `.env` file is gitignored for security - never commit it to version control

