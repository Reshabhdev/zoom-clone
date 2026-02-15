# Zoom Clone

A real-time video conferencing application built with modern web technologies. Create and join meetings with secure authentication, video/audio streaming, and instant messaging.

## Live URLs

- **Backend:** https://zoom-clone-jjia.onrender.com
- **Frontend:** https://zoom-clone-nu-drab.vercel.app

## Features

- 🔐 Secure authentication with Clerk
- 📹 Real-time video and audio streaming
- 🎥 Camera and microphone controls
- 🆔 Unique meeting IDs for easy sharing
- 💾 Meeting history and management
- 🌐 WebSocket support for real-time communication
- 📱 Responsive design for all devices

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** JWT tokens
- **Real-time:** WebSockets
- **Server:** Uvicorn
- **Deployment:** Render

### Frontend
- **Framework:** Next.js 14 (React)
- **Styling:** Tailwind CSS
- **Authentication:** Clerk
- **API Client:** Fetch API
- **Deployment:** Vercel

## Setup Instructions

### Prerequisites
- Python 3.8+ (for backend)
- Node.js 18+ (for frontend)
- PostgreSQL database
- Clerk account for authentication

### Backend Setup (Local Development)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory:
   ```
   DATABASE_URL=postgresql://user:password@localhost/zoom_clone
   SECRET_KEY=your_secret_key_here
   ```

5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup (Local Development)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

### Production Deployment

#### Vercel (Frontend)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
   CLERK_SECRET_KEY=your_secret
   NEXT_PUBLIC_API_BASE_URL=https://zoom-clone-jjia.onrender.com
   ```
4. Deploy automatically on push to main branch

#### Render (Backend)

1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard:
   ```
   DATABASE_URL=your_postgres_url
   SECRET_KEY=your_generated_secret
   ```
4. Render will automatically build and deploy

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Meetings
- `POST /meetings/create` - Create a new meeting
- `POST /meetings/join` - Join an existing meeting
- `GET /meetings/my-meetings` - Get user's meetings

### WebSocket
- `WS /ws/{meeting_id}` - Connect to meeting room

## Troubleshooting

### "Failed to fetch" Error
1. Verify `NEXT_PUBLIC_API_BASE_URL` is set in Vercel environment variables
2. Check that the backend URL is accessible and CORS is properly configured
3. Open browser DevTools console to see exact error message
4. Redeploy frontend after changing environment variables

### Database Connection Issues
1. Verify `DATABASE_URL` is set correctly in Render
2. Check PostgreSQL server is running and accessible
3. Ensure database exists and user has proper permissions

### Authentication Issues
1. Verify Clerk keys are correct in both Vercel and local `.env.local`
2. Check that Clerk project is configured with correct redirect URLs
3. Clear browser cookies and try again

## Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Code Quality
```bash
# Backend linting
cd backend
flake8 app/

# Frontend linting
cd frontend
npm run lint
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create a GitHub issue or contact the development team.