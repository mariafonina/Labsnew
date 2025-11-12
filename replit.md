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
- **Admin Functionality:** Dedicated API endpoints and managers for news, recordings, FAQ, and events.
- **User Features:** Notes, favorites, progress tracking, user profiles, and an event calendar.

## External Dependencies
- **Database:** PostgreSQL (external server: `maridb.mashtab.io`, schema: `labs`)
- **Authentication:** JWT, bcrypt
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
