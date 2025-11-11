# ЛАБС

A React application built with Vite, TypeScript, and Tailwind CSS v4. Originally imported from a Figma design.

## Overview
This is a learning/course management system with features for:
- User authentication and login
- Admin panel for managing users, instructions, and questions
- Event calendar and questions
- News feed and favorites
- Recorded streams and notes
- User profiles and onboarding

## Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS v4.1 (embedded in CSS)
- **UI Components**: Radix UI primitives
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (external server maridb.mashtab.io, schema 'labs')
- **Authentication**: JWT with bcrypt
- **Security**: Helmet, CORS, Rate Limiting (100 req/15min)
- **Additional Libraries**: 
  - Framer Motion for animations
  - React Hook Form for forms
  - Recharts for data visualization
  - Lucide React for icons
  - DOMPurify & Marked for content sanitization

## Project Structure
- `src/components/` - React components including UI primitives and feature components
- `src/contexts/` - React context providers (AuthContext, AppContext)
- `src/api/` - API client for backend communication
- `src/styles/` - Global CSS styles
- `src/assets/` - Static assets
- `server/` - Express backend (API, database, authentication)
  - `server/index.ts` - Main Express server
  - `server/db.ts` - PostgreSQL connection pool
  - `server/auth.ts` - JWT authentication middleware
  - `server/init-db.ts` - Database schema initialization
  - `server/routes/` - API route handlers

## Development
- **Frontend**: Port 5000 (Vite dev server)
  - Host: 0.0.0.0 (allows proxy access)
  - HMR: Configured for WSS on port 443
  - **Important**: `allowedHosts: true` in Vite config is required for Replit's dynamic proxy domains
- **Backend**: Port 3001 (Express API server)
  - Auto-initializes database schema on startup
  - Hot-reload via tsx watch
- **Run Command**: `npm run dev` (runs both frontend and backend concurrently)

## Recent Changes (November 10, 2025)

### Deployment Configuration ✅ READY FOR AUTOSCALE
- **Instant startup for Autoscale deployments**:
  - Server starts in ~60ms (production mode skips database initialization)
  - Root `/` endpoint responds with 200 OK immediately for health checks
  - Server listens on `0.0.0.0:5000` (forwarded to port 80 externally)
  - Serves built React app and API from single Express server
  - Health check endpoint: `/api/health` returns JSON status
  - Deployment type: **Autoscale** (scales based on traffic, goes idle when unused)
  - Build step: `npm run build` creates optimized production bundle
  - Run step: `NODE_ENV=production PORT=5000 npm run server`
  - Database schema: One-time setup via `npm run migrate` (already completed)

### Initial Setup
- Initial setup in Replit environment
- Added TypeScript configuration files (tsconfig.json, tsconfig.node.json)
- Configured Vite for Replit (port 5000, host 0.0.0.0, HMR settings, allowedHosts)
- Added missing TypeScript dependencies
- Installed all npm packages
- Created .gitignore for Node.js projects
- Fixed "Blocked request" error by enabling allowedHosts in Vite config

### Branding
- **Added custom ЛАБС pink logo**:
  - Replaced Figma placeholder logo with custom pink ЛАБС branding
  - Updated Logo component to use `src/assets/logo.png`
  - Added favicon (`public/favicon.png`)
  - Updated Vite alias to point to new logo
  - Logo displays across all components: Login, UserSidebar, AdminPanel, AdminSidebar, Onboarding, and mobile header

### PostgreSQL Database Integration
- **Connected to external PostgreSQL server**: maridb.mashtab.io:5432
- **Created dedicated schema**: `labs` (isolated from other projects)
- **Database Tables**:
  - `users` - User accounts with bcrypt-hashed passwords
  - `instructions` - Course materials and lessons
  - `events` - Scheduled events and live sessions
  - `favorites` - User bookmarks
  - `notes` - User notes on materials
  - `questions` - Q&A system
  - `progress` - User completion tracking
- **Indexes**: Optimized queries on user_id, category, dates, etc.
- **Credentials**: Stored securely in Replit Secrets (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)

### Backend API
- **Express server** on port 3001 with TypeScript
- **JWT Authentication**: Secure token-based auth with 7-day expiry
- **Password Security**: bcrypt with salt rounds = 10
- **API Endpoints**:
  - `/api/auth/register` - User registration
  - `/api/auth/login` - User login
  - `/api/instructions/*` - CRUD for course materials
  - `/api/events/*` - Event management
  - `/api/favorites/*` - Favorites management
  - `/api/notes/*` - Notes system
  - `/api/progress/*` - Progress tracking
- **Security Features**:
  - Rate limiting: 100 requests per 15 minutes
  - CORS enabled for frontend
  - Helmet.js for HTTP headers
  - JWT_SECRET stored in Replit Secrets
- **Data Isolation**: All queries filter by user_id for multi-tenant security

### Frontend Updates
- **AuthContext**: New context for authentication state management
- **API Client**: Centralized HTTP client with automatic token handling
- **Login Component**: Updated with tabs for login/registration
- **App Integration**: Migrated from localStorage-based auth to API-based auth
- **Dynamic API URL**: Auto-detects Replit environment vs localhost
- **Fixed imports**: Corrected all sonner package imports

### Testing
- ✅ Database connection and schema initialization
- ✅ User registration endpoint
- ✅ User login endpoint with JWT
- ✅ Frontend login screen renders
- ✅ Health check endpoint
- ✅ Production build successful with esbuild minification

## Branding
- **Logo**: Pink ЛАБС logo located at `src/assets/logo.png`
- **Favicon**: `public/favicon.png` (same as logo)
- **Logo Usage**: Imported via Logo component from `src/components/Logo.tsx`
- Supports multiple sizes: sm (h-6), md (h-8), lg (h-12), xl (h-16)

## Database Schema
All tables are in the `labs` schema on the external PostgreSQL server.

### Security & Access Control
- Every data table includes `user_id` foreign key for multi-tenant isolation
- All API endpoints verify JWT token and filter by authenticated user
- Passwords are hashed with bcrypt (never stored in plaintext)
- Rate limiting prevents brute force attacks

### Environment Variables (Replit Secrets)
Required secrets:
- `DB_HOST` - PostgreSQL server hostname
- `DB_PORT` - PostgreSQL port (5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)

Optional:
- `VITE_API_URL` - Override API base URL (auto-detected if not set)

## Next Steps
1. **XSS Protection**: Implement DOMPurify sanitization for user-generated content
2. **Data Migration**: Migrate existing localStorage data to PostgreSQL
3. **Admin Panel**: Update admin features to use API endpoints
4. **Role-Based Access**: Implement admin-specific endpoints
5. **Tests**: Add integration tests for auth and API endpoints

## Notes
- The project uses Tailwind CSS v4.1 with embedded utilities in src/index.css
- No tailwind.config.js or postcss.config.js needed unless custom Tailwind generation is required
- TypeScript path alias '@' maps to './src' directory
- Image assets are typed via `src/vite-env.d.ts` for TypeScript support
- Backend runs concurrently with frontend via `npm run dev`
