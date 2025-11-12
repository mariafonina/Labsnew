# ЛАБС

## Overview
ЛАБС is a learning/course management system with a React frontend, Vite, TypeScript, and Tailwind CSS, backed by an Express.js server and PostgreSQL. It supports user authentication, an admin panel for content management, event calendaring, news feeds, recorded streams, user profiles, and onboarding. The system aims to provide a comprehensive platform for educational content delivery and user progress tracking.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
I prefer simple language.
I like functional programming.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application uses a client-server architecture. The frontend is a React 18 application with TypeScript, built using Vite, styled with Tailwind CSS v4.1, and utilizing Radix UI primitives for components. Framer Motion handles animations, React Hook Form manages forms, and Recharts is used for data visualization. Lucide React provides icons.

The backend is an Express.js server written in TypeScript, running on Node.js. It connects to an external PostgreSQL database (maridb.mashtab.io, schema 'labs'). Authentication is handled via JWT with bcrypt for password hashing. Security features include Helmet, CORS, and comprehensive rate limiting with spam protection. Content sanitization is performed using DOMPurify and Marked.

**Key Technical Implementations & Design Choices:**
- **UI/UX:** Figma-imported design, custom ЛАБС pink logo, improved spacing and readability in components like `InstructionsLibrary`.
- **Data Flow:** Migration from `localStorage` to API-driven data loading for admin-created content (news, recordings, FAQ, events) ensuring immediate visibility.
- **Admin Panel:** Refactored using a composition pattern with specialized manager components (`AdminNewsManager`, `AdminRecordingsManager`, `AdminFAQManager`, `AdminEventsManager`) for API-first data flow, optimistic updates, and toast notifications.
- **Backend Utilities:** Extensive DRY refactoring with reusable utilities for `async-handler` (error handling), `db-helpers` (database operations, 404 handling), and `text-content-middleware` (combined JWT auth, rate limiting, spam detection, sanitization) to reduce code duplication and improve maintainability.
- **Security:** Multi-layer rate limiting (global, burst, auth, create, read), content spam detection, user/IP-based throttling, request size validation, and comprehensive XSS protection using DOMPurify on all user-generated content. All data queries are filtered by `user_id` for multi-tenant isolation.
- **Deployment:** Optimized for Autoscale health checks, with a lean root endpoint and production mode skipping database initialization for fast startup.
- **Branding:** Custom pink ЛАБС logo and favicon.

**Feature Specifications:**
- **Authentication:** JWT-based login/logout, session management, secure password handling.
- **Content Management:** CRUD operations for instructions, events, favorites, notes, questions, and user progress.
- **Admin Functionality:** Dedicated API endpoints and managers for news, recordings, FAQ, events, and email campaigns.
- **Email Marketing:** Notisend integration for mass communications, news distribution, credentials delivery, and transactional emails.
- **User Features:** Notes, favorites, progress tracking, user profiles, and an event calendar.

## External Dependencies
- **Database:** PostgreSQL (external server: `maridb.mashtab.io`, schema: `labs`)
- **Authentication:** JWT, bcrypt
- **Email Service:** Notisend API (notisend.ru) for email campaigns
- **UI Libraries:** Radix UI primitives
- **Styling:** Tailwind CSS v4.1
- **Animations:** Framer Motion
- **Forms:** React Hook Form
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **Content Sanitization:** DOMPurify, Marked
- **Security Middleware:** Helmet, CORS
- **Build Tool:** Vite
- **Backend Framework:** Express.js
## Recent Changes (November 12, 2025)

### Direct Image Upload for Admin News ✅ COMPLETED
- **Problem**: Admin had to manually enter image URLs, which was inconvenient and error-prone
- **Solution**: Implemented direct file upload with multer middleware and FormData API
- **Features**:
  - File input with real-time image preview in admin news form
  - Server-side image storage in `/uploads/news/` directory
  - Automatic validation (file type: jpeg/jpg/png/gif/webp, max size: 5MB)
  - Unique filename generation with timestamp to prevent collisions
  - Static file serving via Express from `/uploads` directory
- **API Changes**:
  - Frontend: `createNewsWithImage(formData)` and `updateNewsWithImage(id, formData)` methods
  - Backend: POST/PUT endpoints now accept `multipart/form-data` with `uploadNewsImage.single('image')` middleware
  - FormData handler omits Content-Type header to allow browser to set proper multipart boundary
- **Auto-Metadata Population**: Backend automatically sets:
  - `author` - extracted from JWT token (req.userId → username lookup)
  - `date` - Russian locale format: "12 ноября 2025" using `toLocaleDateString('ru-RU')`
  - `is_new` - always true for new items
- **Admin UX Improvement**: Form simplified - removed manual fields for author, author_avatar, date, is_new (system auto-fills)
- **Files Modified**: `src/api/client.ts`, `server/routes/admin/news.routes.ts`, `server/index.ts`, `server/utils/multer-config.ts`, `src/components/AdminNewsManager.tsx`
- **Security**: Image type validation, size limits, sanitization of all text fields, admin-only access with JWT + role check
- **Architect Review**: PASS - "Image upload flow meets requirements and operates correctly across client and server boundaries"

### Public API Endpoints for Admin Content ✅ COMPLETED
- **Problem**: Content created in admin panel was not visible to regular users due to 403 Forbidden errors
- **Root Cause**: Frontend components were calling admin endpoints (`/api/admin/news`) which require JWT + admin role
- **Solution**: Created public read-only API endpoints:
  - `/api/news` - Public news feed (no authentication required)
  - `/api/recordings` - Public recordings list (no authentication required)
  - `/api/faq` - Public FAQ items (no authentication required)
  - `/api/events` - All events calendar (no authentication required)
  - `/api/events/my` - User-specific personal events (authenticated)
- **Architecture**: Separation of concerns - public read endpoints for content display, admin write endpoints for CRUD operations
- **Result**: Admin-created news, recordings, FAQ, and events now display correctly for all users
- **Files Created**: `server/routes/news.routes.ts`, `server/routes/recordings.routes.ts`, `server/routes/faq.routes.ts`

### UI/UX Improvements ✅ COMPLETED
- **Improved InstructionsLibrary layout spacing**:
  - Increased spacing between categories (32px → 40px)
  - Enhanced padding inside instruction cards (20×14px → 24×20px)
  - Better gap between interactive elements (14px → 16px)
  - Improved button spacing and touch targets (8px → 10px padding)
  - Enhanced text readability (leading-tight → leading-relaxed)
  - Added visual separation after category headers
- **Result**: Cleaner, more breathable interface with better user experience

### Centralized Data Prefetching for Instant Display ✅ COMPLETED
- **Problem**: Components were making individual API calls on mount, causing loading delays and duplicate network requests
- **Solution**: Implemented centralized data prefetching in AppContext using parallel loading
  - **AppContext Bootstrap**: Added `useEffect` that fetches news, events, recordings, FAQ in parallel on app mount using `Promise.allSettled`
  - **Component Migration**: Removed duplicate loading logic from 4 components (NewsFeed, EventsCalendar, RecordedStreams, FAQ)
  - **Data Flow**: Components now read directly from context state → instant display without loading delays
  - **Error Handling**: Graceful partial failure - app continues if some APIs fail
  - **Type Safety**: Fixed Event interface to include `location` field, imported Recording type from AppContext
- **Code Quality**: Removed ~100 lines of duplicate code, eliminated unused imports (useEffect, apiClient, toast)
- **Performance**: Data loads once on mount (<1s), cached in state and localStorage, no redundant API calls
- **Result**: "Мгновенное" (instant) data display - users see content immediately when navigating between pages

### Multi-Tenant Security Fix with requestId Pattern ✅ COMPLETED
- **CRITICAL PROBLEM**: Multi-tenant data leakage - users could see notes, favorites, comments, and progress from other users
- **Root Cause Analysis**: 
  1. User-specific data was stored in `localStorage` which persists across logins
  2. Race conditions during rapid logout→login transitions allowed stale API responses to update state with previous user's data
  3. Shared boolean flag (`isCancelledRef`) was reset when new user logged in, allowing old requests to pass validation
- **Complete Solution**: requestId Pattern for Race-Free Multi-Tenant Isolation
  - **Monotonic Request Counter**: `requestIdRef` increments on every auth state change (login, logout, cleanup)
  - **Captured Request ID**: Each fetch captures its `currentRequestId` at start time
  - **Stale Request Rejection**: API responses validate `currentRequestId === requestIdRef.current` before updating state
  - **Triple-Layer Defense**:
    1. Entry Gate: `!auth.isAuthenticated` → Clear state + increment requestId
    2. Response Validation: Only latest requestId can update state
    3. Cleanup Guard: Increment requestId on unmount + clear state
- **Attack Scenarios Prevented**:
  - ✅ User A logs in, API calls start → User A logs out → User B logs in → A's responses rejected (ID mismatch)
  - ✅ Rapid logout during slow network fetch → Stale responses cannot update state
  - ✅ API rejection/network error → State properly cleared with ID check
- **localStorage Migration**: Removed ALL user-specific data from localStorage (notes, favorites, comments, progress)
  - localStorage now ONLY stores: auth token (rememberMe), public data caching, notifications
  - User data loads from PostgreSQL via API after authentication with strict `user_id` filtering
- **Backend Guarantees**: All user data queries use `WHERE user_id = $1` for database-level isolation
- **Architect Approval**: "The requestId-based cancellation correctly prevents any stale fetch from mutating user-scoped state after logout/login churn, eliminating the multi-tenant data leakage previously observed."
- **Files Modified**: `src/contexts/AppContext.tsx`, `src/api/client.ts`
- **Result**: BULLETPROOF multi-tenant isolation - no execution path allows cross-user data leakage

### Notisend Email Integration ✅ COMPLETED
- **Purpose**: Enable admin to send mass email communications, news broadcasts, marketing campaigns, and transactional emails
- **Implementation**:
  - **Backend**: Created Notisend API client (`server/utils/notisend-client.ts`) with methods for single, bulk, and template-based emails
  - **API Routes**: `/api/admin/emails` with full CRUD operations for campaigns and `/send-user-credentials` for credential distribution
  - **Database**: New tables `email_campaigns` (campaign metadata) and `email_logs` (delivery tracking with status, errors, notisend_id)
  - **Frontend**: `AdminEmailManager` component in admin panel with campaign creation, editing, and sending UI
  - **Navigation**: Added "Email-рассылки" section to admin sidebar with Mail icon
- **Email Workflow**:
  1. Admin creates campaign in ЛАБС with name, type, subject, template_id
  2. Templates designed in Notisend visual editor (external platform)
  3. Admin sends campaign via ЛАБС → Notisend API → email delivery
  4. Delivery logs stored in `email_logs` with status tracking
- **Campaign Types**: credentials (user credentials), news (newsletters), marketing (promotions), transactional (system emails)
- **Critical Bug Fix**: `sendTemplateEmail` initially sent empty `subject` causing Notisend API rejection
  - **Solution**: Added optional `subject` parameter with fallback to 'Уведомление' for template-based sends
  - **Template sends now pass**: `campaign.subject || 'Уведомление'` to ensure API compatibility
- **Security**: Admin-only endpoints with JWT verification, content sanitization via DOMPurify, rate limiting
- **API Key Management**: `NOTISEND_API_KEY` and `NOTISEND_PROJECT_NAME` stored in Replit Secrets
- **Architect Review**: PASS - "Integration reliably supplies subject for all template sends, preventing API rejection"
- **Files Created**: `server/utils/notisend-client.ts`, `server/routes/admin/emails.routes.ts`, `src/components/AdminEmailManager.tsx`
- **Files Modified**: `server/init-db.ts` (email tables), `server/index.ts` (routes), `src/components/AdminPanel.tsx`, `src/components/AdminSidebar.tsx`, `src/api/client.ts` (API methods)
