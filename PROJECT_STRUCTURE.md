# Project Structure

```
Nano-banana-generator/
│
├── config/                    # Configuration files
│   ├── config.js             # Application configuration (env vars, settings)
│   └── database.js           # PostgreSQL connection pool
│
├── controllers/              # Business logic controllers
│   ├── adminController.js    # Admin operations (user management)
│   └── botController.js      # Bot message and command handling
│
├── database/                 # Database setup
│   └── migrations.js         # Table creation and root admin initialization
│
├── middleware/               # Middleware functions
│   └── authMiddleware.js     # Access control and authentication
│
├── models/                   # Database models (data access layer)
│   ├── Interaction.js        # Interaction history model
│   ├── Session.js            # Session management model
│   └── User.js               # User model with access control
│
├── routes/                   # Route handlers
│   └── botRoutes.js          # Telegram bot event handlers
│
├── services/                 # External API services
│   ├── geminiService.js      # Gemini API integration for image generation/editing
│   └── telegramService.js    # Telegram Bot API wrapper
│
├── utils/                    # Utility functions
│   └── logger.js             # Winston logger configuration
│
├── .env                      # Environment variables (create this)
├── .gitignore                # Git ignore rules
├── package.json              # Node.js dependencies and scripts
├── README.md                 # Main documentation
├── SETUP.md                  # Setup instructions
├── PROJECT_STRUCTURE.md      # This file
└── server.js                 # Application entry point
```

## File Responsibilities

### Configuration
- **config/config.js**: Centralized configuration management from environment variables
- **config/database.js**: PostgreSQL connection pool setup

### Controllers
- **controllers/botController.js**: Handles all bot interactions (start, text, photos, sessions)
- **controllers/adminController.js**: Manages admin-only operations (add/remove users, list users)

### Models
- **models/User.js**: User CRUD operations, access control, admin checks
- **models/Session.js**: Session lifecycle management (create, update, cancel)
- **models/Interaction.js**: Interaction history logging

### Services
- **services/telegramService.js**: Telegram Bot API wrapper with helper methods
- **services/geminiService.js**: Gemini API integration for image operations

### Routes
- **routes/botRoutes.js**: Sets up all Telegram bot event listeners and routes

### Database
- **database/migrations.js**: Creates tables and initializes root admins

### Middleware
- **middleware/authMiddleware.js**: Checks user access and admin status

### Utils
- **utils/logger.js**: Winston logger with development/production modes

### Entry Point
- **server.js**: Initializes database, sets up bot routes, starts Express server

## Data Flow

1. **User sends message** → `routes/botRoutes.js`
2. **Route handler** → `controllers/botController.js` or `controllers/adminController.js`
3. **Controller** → `middleware/authMiddleware.js` (access check)
4. **Controller** → `models/User.js`, `models/Session.js` (data operations)
5. **Controller** → `services/geminiService.js` or `services/telegramService.js` (API calls)
6. **Controller** → `models/Interaction.js` (save history)
7. **Response** → User via Telegram

## Key Features Implementation

- **Access Control**: `middleware/authMiddleware.js` + `models/User.js`
- **Session Management**: `models/Session.js` + `controllers/botController.js`
- **Image Generation**: `services/geminiService.js` → `controllers/botController.js`
- **Image Editing**: `services/geminiService.js` → `controllers/botController.js`
- **Admin Functions**: `controllers/adminController.js` + `models/User.js`
- **Persistence**: All models save to PostgreSQL via `config/database.js`

