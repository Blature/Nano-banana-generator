# Nano Banana Generator - Telegram Bot

A Telegram bot for image generation and editing using Gemini 3 Pro Nano Banana API.

## Features

- **Admin Management**: Root admin users can manage bot access
- **Image Generation**: Generate images from text prompts
- **Image Editing**: Edit images using text prompts
- **Session Management**: Maintain context for image editing sessions
- **PostgreSQL Persistence**: Store all interactions and session data
- **User Access Control**: Only authorized users can use the bot

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Telegram Bot Token (from @BotFather)
- Gemini API Key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Nano-banana-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
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

4. Create the PostgreSQL database:
```sql
CREATE DATABASE nano_banana_bot;
```

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Project Structure

```
Nano-banana-generator/
├── config/
│   ├── config.js          # Configuration management
│   └── database.js        # PostgreSQL connection
├── controllers/
│   ├── adminController.js # Admin operations
│   └── botController.js   # Bot message handling
├── database/
│   └── migrations.js      # Database schema initialization
├── middleware/
│   └── authMiddleware.js  # Authentication and authorization
├── models/
│   ├── Interaction.js     # Interaction model
│   ├── Session.js         # Session model
│   └── User.js            # User model
├── routes/
│   └── botRoutes.js       # Bot route handlers
├── services/
│   ├── geminiService.js   # Gemini API integration
│   └── telegramService.js # Telegram bot service
├── utils/
│   └── logger.js          # Logging utility
├── .env                   # Environment variables (create this)
├── .gitignore
├── package.json
├── README.md
└── server.js              # Application entry point
```

## Usage

### For Users

1. Start the bot by sending `/start`
2. Send a text prompt to generate an image
3. Send an image with a text prompt to edit it
4. Use "Cancel Session" button to reset and start fresh

### For Root Admins

1. Start the bot with `/start`
2. Access "User Management" to add/remove users
3. Use "Start Image Generation" to use the bot normally

## Root Admins

The following Telegram user IDs are root admins by default:
- `7544822519`
- `218078175`

These can be configured in the `.env` file.

## Database Schema

The bot creates three main tables:

- **users**: Stores user information and access status
- **sessions**: Tracks active image generation/editing sessions
- **interactions**: Stores all image generation and editing history

## Error Handling

The bot includes comprehensive error handling and logging. Errors are logged to:
- `error.log` - Error-level logs
- `combined.log` - All logs

In development mode, logs are also displayed in the console.

## Development vs Production

- **Development Mode**: Detailed logging, debug information
- **Production Mode**: Optimized logging, minimal console output

Set `NODE_ENV=production` in `.env` for production mode.

## License

ISC

