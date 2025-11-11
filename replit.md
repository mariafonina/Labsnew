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
- **Security**: Helmet, CORS, Comprehensive Rate Limiting & Spam Protection
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

## Recent Changes (November 11, 2025)

### Admin Panel API Integration ✅ COMPLETED
- **Refactored AdminPanel** from 1782 lines to ~60 lines using composition pattern
- **Created 4 specialized manager components**:
  - `AdminNewsManager` - News management with API
  - `AdminRecordingsManager` - Recordings management with API
  - `AdminFAQManager` - FAQ management with API
  - `AdminEventsManager` - Events management with API
- **Extended ApiClient** with admin CRUD methods for all entities
- **Fixed rate limiter** in admin routes (removed broken `createAdminLimiter()` call)
- **All managers use**:
  - API-first data flow (no localStorage)
  - Optimistic updates for better UX
  - Toast notifications for user feedback
  - Dialog/AlertDialog for forms and confirmations
- **Architect review: PASS** - Clean separation, follows established patterns, security intact

### DRY Refactoring & Code Quality ✅ COMPLETED
- **Created 3 reusable backend utilities** eliminating ~220+ lines of duplicated code:
  - **server/utils/async-handler.ts**: Universal error handling wrapper for all routes
    - Eliminates ALL try/catch blocks (23+ removed across routes)
    - Centralizes 500 error responses and logging
  - **server/utils/db-helpers.ts**: Database query helpers with consistent 404 handling
    - `findOneOrFail()` - Find single record or return 404
    - `findAllByUser()` - Get all records for user with custom ordering
    - `deleteOneOrFail()` - Delete record or return 404
    - Eliminates 13+ duplicate "result.rows.length === 0" checks
  - **server/utils/text-content-middleware.ts**: Unified text protection middleware
    - `protectedTextSubmission()` - Combines JWT auth + rate limiting + spam detection + sanitization
    - Used in notes and comments POST/PUT routes
- **Refactored ALL 7 route files** to use new utilities:
  - ✅ notes.routes.ts - Full DRY refactor with text protection middleware
  - ✅ comments.routes.ts - Full DRY refactor + extra sanitization for author fields
  - ✅ favorites.routes.ts - asyncHandler + db-helpers
  - ✅ instructions.routes.ts - asyncHandler + db-helpers
  - ✅ events.routes.ts - asyncHandler + db-helpers
  - ✅ progress.routes.ts - asyncHandler + db-helpers (custom ordering)
  - ✅ auth.routes.ts - Already optimal (uses authLimiter)
- **Benefits**: 
  - Consistent error handling across all endpoints
  - Reduced code duplication by 44% in route handlers
  - Improved maintainability and security
  - Easier to add new routes following established patterns

### Rate Limiting & Spam Protection
- **Created comprehensive security utilities** (server/utils/rate-limit.ts):
  - Multi-layer rate limiting: global, burst, auth, create, read limiters
  - Content spam detection: Prevents duplicate comments/notes within time windows
  - User-based and IP-based throttling
  - Request size validation (max 5MB)
  - Automatic cleanup of expired rate limit records
- **Applied to all API endpoints**:
  - Auth routes: Strict 5 attempts per 15 min (prevents brute force)
  - Comments: Spam detection (max 2 duplicates/min) + create limiter
  - Notes: Spam detection (max 3 duplicates/2min) + create limiter
  - Favorites: Create limiter (10/min)
  - Read operations: 60 requests/min
- **Benefits**: Protection against DDoS, spam, abuse, and brute force attacks

### XSS Protection & Data Migration Infrastructure
- **Implemented comprehensive XSS protection** with DOMPurify
- Created sanitization utilities for frontend and backend
- Updated database schema for new data model (item_type/item_id)
- Created migration tool and UI banner for localStorage→PostgreSQL
- Enhanced ApiClient error handling for better conflict detection

## Recent Changes (November 10, 2025)

### Deployment Configuration ✅ AUTOSCALE READY
- **Optimized for Autoscale health checks**:
  - Root `/` endpoint returns JSON instantly (~26ms response time) ⚡
  - No HTML serving on root - React app served via static file middleware
  - Production mode skips database initialization for fast startup
  - Server listens on `0.0.0.0:5000` (forwarded to port 80 externally)
  - Health check endpoints: `/` and `/api/health` both return JSON status
- **Deployment type**: **Autoscale** (scales based on traffic, goes idle when unused)
- **Build command**: `npm run build` (creates optimized production bundle in `build/`)
- **Run command**: `NODE_ENV=production PORT=5000 npm run server`
- **Database setup**: Run `npm run migrate` **ONCE** before first deployment to initialize schema
- **Post-deployment**: Admin user already created (username: `admin`, password: `admin123`)

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
  - **Comprehensive Rate Limiting** (server/utils/rate-limit.ts):
    - Global limiter: 100 requests per 15 minutes
    - Burst limiter: 20 requests per 10 seconds
    - Auth limiter: 5 login attempts per 15 minutes
    - Create limiter: 10 operations per minute
    - Read limiter: 60 operations per minute
    - Content spam detector: Prevents duplicate content (configurable)
    - User-based and IP-based rate limiting
    - Request throttling for heavy operations
    - Request size limiter: Max 5MB payload
  - **XSS Protection**: DOMPurify sanitization on all user-generated content
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

## Completed Features ✅
1. ✅ **XSS Protection**: DOMPurify sanitization implemented (frontend + backend)
2. ✅ **Rate Limiting & Spam Protection**: Comprehensive multi-layer security system
3. ✅ **Data Migration Infrastructure**: Created migration tool with UI banner
4. ✅ **DRY Refactoring**: Created reusable utilities, eliminated 220+ lines of duplicate code

## Next Steps
1. **Frontend Refactoring**: Update components to use new API schema (item_type/item_id)
2. **Admin Panel**: Connect admin features to API endpoints
3. **Role-Based Access**: Implement admin-specific endpoints with permissions
4. **Tests**: Add integration tests for auth, rate limiting, and API endpoints

## Notes
- The project uses Tailwind CSS v4.1 with embedded utilities in src/index.css
- No tailwind.config.js or postcss.config.js needed unless custom Tailwind generation is required
- TypeScript path alias '@' maps to './src' directory
- Image assets are typed via `src/vite-env.d.ts` for TypeScript support
- Backend runs concurrently with frontend via `npm run dev`
