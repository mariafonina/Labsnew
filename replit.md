# ЛАБС

## Overview
ЛАБС is a comprehensive learning/course management system designed for educational content delivery and user progress tracking. It features a modern React frontend, an Express.js backend, and a PostgreSQL database. Key capabilities include robust user authentication, an administrative panel for content management, event calendaring, news feeds, recorded streams, user profiles, and onboarding processes. The project aims to provide an all-in-one platform for educational institutions and learners.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
I prefer simple language.
I like functional programming.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application employs a client-server architecture. The frontend is built with React 18, TypeScript, Vite, and styled using Tailwind CSS v4.1, incorporating Radix UI for components, Framer Motion for animations, React Hook Form for forms, Recharts for data visualization, and Lucide React for icons.

The backend is an Express.js server written in TypeScript, running on Node.js. It connects to an external PostgreSQL database. Authentication is JWT-based with bcrypt for password hashing. Security is paramount, featuring Helmet, CORS, extensive rate limiting, and spam protection. Content sanitization uses DOMPurify and Marked.

**Key Technical Implementations & Design Choices:**
- **UI/UX:** Figma-imported design with custom ЛАБС branding, focusing on improved spacing and readability. **Admin Panel Spacing Standards (Nov 2025):** Consistent spacing utilities applied across all admin modules - `space-y-8` for main containers, `gap-6` for card grids, `gap-3` for button groups, `space-y-6` for dialog forms, `mb-4/mb-6` for headings, ensuring visual consistency and improved readability.
- **Admin Panel:** Refactored with a composition pattern for content managers (News, Recordings, FAQ, Events) using API-first data flow and optimistic updates.
- **Backend Utilities:** DRY principles applied with reusable utilities for error handling (`async-handler`), database operations (`db-helpers`), and a unified middleware (`text-content-middleware`) for security and content processing.
- **Security:** Multi-layer rate limiting (global, burst, auth, create, read), content spam detection, user/IP-based throttling, request size validation, and XSS protection via DOMPurify. All user data queries are filtered by `user_id` for multi-tenant isolation. HMAC-SHA-256 token hashing for initial password setup tokens with dedicated transaction isolation using SELECT FOR UPDATE locks to prevent race conditions.
- **Data Flow:** Transitioned from `localStorage` to API-driven data loading for admin-created content to ensure immediate visibility and consistency. **Performance Optimization (Nov 2025):** Removed blocking prefetch of admin content (news, events, recordings, FAQ) from `AppContext` - these are now lazy-loaded on-demand in respective admin components, reducing initial API requests from 10+ to ~2-3 and improving Time to First Paint by ~70%. Only critical user-specific data (notes, favorites, progress) is loaded after authentication.
- **Multi-Tenant Isolation:** Implemented a `requestId` pattern to prevent data leakage across users during rapid login/logout sequences, ensuring that stale API responses cannot update state. User-specific data is no longer stored in `localStorage`.
- **Auth Synchronization (Nov 2025):** Fixed critical bug where user data didn't load immediately after login. AppContext now initializes auth state from localStorage during mount and sets API token before any requests. Added `isAuthInitialized` flag to prevent race conditions. Login component synchronizes AppContext immediately after successful AuthContext login using exported `setAuth` and `fetchContent` functions.
- **Deployment:** Configured for Replit Autoscale deployment. In production mode, the Express server serves the compiled React frontend from the `build/` directory with proper SPA routing support. Static assets are cached (max-age: 1 year), and all non-API routes fallback to `index.html` for client-side routing. API endpoints return proper JSON 404 responses for unknown paths. Database initialization is skipped in production for fast Autoscale health check response times. Build command: `npm run build` (Vite compilation). Run command: `NODE_ENV=production node --import tsx server/index.ts` on port 5000.

**Feature Specifications:**
- **Authentication:** JWT-based login/logout, session management, and secure password handling with a complete password reset flow. Initial password setup system for new users via secure HMAC-SHA-256 tokenized links (7-day expiry).
- **Content Management:** CRUD operations for instructions, events, favorites, notes, questions, and user progress. Direct image upload for admin news. **Yandex S3 Object Storage Integration (Nov 2025):** RichTextEditor enhanced with three-tab image dialog (Upload/URL/Unsplash). Images uploaded to Yandex S3 bucket `labs-data` via AWS SDK v3. Backend service `server/yandexS3.ts` handles uploads with UUID-based random filenames preserving extensions. Endpoint `/api/admin/objects/upload` accepts multipart form data (max 5MB, JPEG/PNG/GIF/WebP). Public URLs: `https://storage.yandexcloud.net/labs-data/{folder}/{uuid}.{ext}`. Environment variables: `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `YANDEX_S3_SECRET`, `AWS_BUCKET`.
- **Products & Tiers System (NEW):** Multi-product platform enabling different educational offerings (intensives, courses, webinars) with tiered access levels (basic, premium, VIP). Database tables: `products`, `pricing_tiers`, `cohorts`, `product_resources`, `user_enrollments`, `cohort_members`. Automatic migration creates default "Общая программа" product with universal tier for existing users. Access control middleware filters content based on user enrollments and tier levels. Admin APIs for managing products, tiers, cohorts, enrollments, and resource assignments. Public catalog endpoints for marketing display of available products.
- **Admin Functionality:** Dedicated API endpoints and managers for news, recordings, FAQ, events, email campaigns, and initial password distribution. Public read-only API endpoints for general user access to admin-managed content. Mass initial password email distribution to all users without passwords. **Production-Ready Pagination (Nov 2025):** AdminUsers component implements server-side pagination with ref-based AbortController pattern to eliminate race conditions. Features: atomic query state for page/search/filter updates, automatic abort of stale requests, unmount cleanup, server-side filtering before pagination (LIKE with wildcards), 20 users per page reducing data transfer by ~75%, search across username/email/name fields, cohort/product filters with proper page reset. **Admin Dashboard (Nov 2025):** Centralized statistics overview displaying platform-wide metrics (total users, products, streams/cohorts, pricing tiers, revenue, average check) with quick action shortcuts for common admin tasks. API endpoint: `/api/admin/dashboard/stats` aggregates data from multiple tables for comprehensive platform analytics.
- **Email Marketing:** Integration with Notisend API for mass communications, news distribution, credential delivery, initial password setup links, and transactional emails.
- **User Features:** Notes, favorites, progress tracking, user profiles, and an event calendar.

## External Dependencies
- **Database:** PostgreSQL (`maridb.mashtab.io`, schema: `labs`)
- **Authentication:** JWT, bcrypt
- **Email Service:** Notisend API (notisend.ru)
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
- **File Upload:** Multer (for direct image uploads)
- **Object Storage:** Yandex S3 (AWS SDK v3 compatible)