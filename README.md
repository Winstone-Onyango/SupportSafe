# SupportSafe

**An AI-powered platform for gender-based violence (GBV) support, reporting, and awareness.**

SupportSafe is a full-stack application that combines a Django backend, Next.js frontend, and an AI avatar to help victims and survivors of gender-based violence. It provides secure reporting, AI-powered text analysis, steganography for hidden communication, and integration with social media for awareness campaigns.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [AI Avatar](#ai-avatar)
- [Troubleshooting](#troubleshooting)

---

## Overview

SupportSafe addresses gender-based violence through technology:

1. **Secure Reporting** - Victims can submit reports stored securely in MongoDB
2. **AI Analysis** - Gemini AI analyzes and structures victim reports
3. **Steganography** - Hide secret messages in images for covert communication
4. **Social Media Integration** - Post awareness messages on Twitter and Telegram
5. **AI Avatar** - An interactive 3D avatar that guides users through the platform

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                        │
│                     http://localhost:3000                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (:3000)                      │
│  - React components with Material UI                            │

---

## Features

### Backend (Django)
- **Authentication** - JWT-based register/login with secure password hashing
- **Text Generation** - AI-powered expansion of victim reports using Gemini
- **Image Generation** - Create illustrative images for posts
- **Text Decomposition** - Extract structured data from free-text reports
- **Steganography** - Hide and recover secret messages in PNG images
- **Social Integration** - Post to Twitter and Telegram
- **Admin Dashboard** - Manage and review reports
- **Vector Search** - Find similar reports using embeddings
- **Lawbot** - Upload and query legal documents (PDFs)

### Frontend (Next.js)
- **Responsive UI** - Material UI components with custom theming
- **Authentication** - Clerk-powered sign-in/sign-up
- **Dashboard** - View and manage reports
- **Post Creation** - Submit new reports with AI assistance
- **Community Forum** - View and interact with posts
- **Support Resources** - Access help and information

### AI Avatar
- **3D Interactive Avatar** - Built with React Three Fiber
- **Voice Interaction** - Speech recognition and synthesis
- **Emotional Responses** - Avatar reacts to user input

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.14, Django 6.1 |
| **Frontend** | Next.js 15, React 19, Material UI 6 |
| **AI Avatar** | React Three Fiber, Vite, Three.js |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT (backend), Clerk (frontend) |
| **AI/ML** | Google Gemini, Groq |
| **Storage** | Supabase |
| **APIs** | Twitter/X API, Telegram Bot API |

---

## Project Structure

```
SupportSafe/
├── backend_django/              # Django backend
│   ├── config/                  # Project settings
│   │   ├── settings.py          # Django configuration
│   │   ├── urls.py              # Root URL routing
│   │   ├── wsgi.py              # WSGI entry point
│   │   └── asgi.py              # ASGI entry point
│   ├── haven/                   # Main application
│   │   ├── views.py             # API endpoint handlers
│   │   ├── auth_api.py          # Authentication endpoints
│   │   ├── db.py                # MongoDB connection
│   │   ├── images.py            # Image generation endpoints
│   │   ├── prompts.py           # AI prompt templates
│   │   ├── urls.py              # App URL routing
│   │   └── utils/               # Utility modules
│   │       ├── common.py        # Shared helpers
│   │       ├── embedding.py     # Vector embeddings
│   │       ├── steganography.py # Image steganography
│   │       ├── text_llm.py      # LLM integration
│   │       ├── twitter.py       # Twitter API
│   │       └── regex_ptr.py     # Regex patterns
│   ├── manage.py                # Django management
│   └── seed_admin.py            # Admin user seeder
│

---

## Getting Started

### Prerequisites

- **Python 3.14** - [Download](https://www.python.org/downloads/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **MongoDB Atlas** - [Create cluster](https://www.mongodb.com/atlas)
- **npm** - Comes with Node.js

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Winstone-Onyango/SupportSafe.git
   cd SupportSafe
   ```

2. **Set up Python virtual environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # macOS/Linux
   ```

3. **Install backend dependencies:**
   ```bash
   pip install -r backend_django/requirements.txt
   ```

4. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Install AI avatar dependencies:**
   ```bash
   cd ai-avatar/ai-avatar-backend
   npm install
   cd ../ai-avatar-frontend
   npm install
   cd ../..
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Atlas
MONGO_ENDPOINT=mongodb://username:password@cluster.mongodb.net:27017,...
MONGO_DB_NAME=SupportSafe

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Groq (optional, for additional LLM)
GROQ_API_TOKEN=your_groq_token

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co/
SUPABASE_KEY=your_supabase_key
SUPABASE_STORAGE_BUCKET=generated-images

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=@your_channel

# Twitter/X API
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_CONSUMER_KEY=your_consumer_key
TWITTER_CONSUMER_SECRET=your_consumer_secret
TWITTER_ACCESS_TOKEN=your_access_token

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Login, receive JWT |
| GET | `/auth/me` | Get current user profile |

### Core API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/text-generation` | Expand report using Gemini |
| POST | `/img-generation` | Generate image for post |
| POST | `/text-decomposition` | Extract structured data |
| POST | `/save-extracted-data` | Save report to database |
| GET | `/get-post/<id>` | Get single post |
| GET | `/get-admin-posts` | List all posts (admin) |
| POST | `/close-issue/<id>` | Mark issue as resolved |

### Steganography
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/encode` | Hide message in image |
| POST | `/decode` | Recover message from image |
| POST | `/encode-image` | Encode URL image with message |

### Social Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send-message` | Post SOS tweet |
| POST | `/send-to-telegram` | Forward to Telegram |
| GET | `/telegram-reports` | List Telegram reports |
| GET | `/telegram-image` | Get Telegram image |
| GET | `/hashtag-reports` | Get tweets by hashtag |

### AI Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-image` | Create image from prompt |
| POST | `/generate-text` | Generate text with LLM |
| POST | `/decompose` | Decompose free text |
| POST | `/find-match` | Find similar posts |
| POST | `/upload_embeddings` | Upload lawbot documents |

---

## AI Avatar

The AI avatar provides an interactive 3D interface for users:

**Features:**
- 3D character rendered with React Three Fiber
- Speech recognition for voice commands
- Text-to-speech responses
- Emotional state visualization

**Running the avatar:**
```bash
cd ai-avatar/ai-avatar-backend
npm start

# In another terminal
cd ai-avatar/ai-avatar-frontend
npm run dev
```

---

## Database

**MongoDB Atlas** is used with the following collections:

- **users** - User accounts and profiles
- **posts** - Reports and posts
- **embeddings** - Vector embeddings for similarity search
- **telegram_reports** - Reports from Telegram
- **sessions** - Active user sessions

---

## Troubleshooting

### Common Issues

**Django won't start:**
- Check virtual environment is activated
- Verify all packages installed: `pip install -r requirements.txt`
- Check MongoDB connection string in `.env`

**Frontend 500 error:**
- Check `node_modules` exists: `npm install`
- Verify `.env.local` has correct backend URL
- Check browser console for specific errors

**MongoDB connection failed:**
- Whitelist your IP in MongoDB Atlas
- Verify connection string format
- Check network connectivity

**AI services not working:**
- Verify Gemini API key is valid
- Check Groq token if using fallback
- Ensure Supabase credentials are correct

### Getting Help

1. Check the logs in terminal output
2. Review browser console (F12)
3. Check Django logs: `backend_django_server.log`
4. Open an issue on GitHub

---

## License

This project is part of a capstone project for Samsung AI.

---

## Acknowledgments

- Google Gemini for AI capabilities
- MongoDB Atlas for database hosting
- Supabase for storage
- Clerk for authentication
- React Three Fiber for 3D avatar

---

**Developed by Winstone Onyango**
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

### Running the Application

**Option 1: One-command startup (Windows PowerShell):**
```powershell
.\run.ps1
```

**Option 2: Manual startup:**

1. **Start Django backend:**
   ```bash
   cd backend_django
   python manage.py runserver 127.0.0.1:8000
   ```

2. **Start Next.js frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://127.0.0.1:8000
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/             # API routes (proxy to Django)
│   │   │   ├── community/       # Community forum
│   │   │   ├── support/         # Support resources
│   │   │   ├── signin/          # Sign in page
│   │   │   ├── signup/          # Sign up page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── page.tsx         # Home page
│   │   ├── lib/
│   │   │   ├── auth.ts          # Auth utilities
│   │   │   └── utils.ts         # Helper functions
│   │   └── middleware.ts        # Next.js middleware
│   ├── .env.local               # Frontend environment
│   └── package.json
│
├── ai-avatar/                   # AI Avatar
│   ├── ai-avatar-backend/       # Node.js backend
│   └── ai-avatar-frontend/      # Vite frontend
│
├── .env                         # Backend environment variables
├── .env.example                 # Example environment file
├── run.ps1                      # One-command startup script
└── .gitignore
```
│  - Clerk authentication                                         │
│  - API routes that proxy to Django backend                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Django Backend (:8000)                        │
│  - REST API endpoints                                           │
│  - JWT authentication                                           │
│  - MongoDB integration                                          │
│  - AI/ML services (Gemini, Groq)                                │
│  - Supabase storage                                             │
│  - Twitter/X API                                                │
│  - Telegram Bot API                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       External Services                         │
│  - MongoDB Atlas (database)                                     │
│  - Google Gemini (text generation)                              │
│  - Groq (language models)                                       │
│  - Supabase (image storage)                                     │
│  - Twitter/X API (social posting)                               │
│  - Telegram Bot API (notifications)                             │
└─────────────────────────────────────────────────────────────────┘
```