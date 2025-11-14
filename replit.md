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
- **UI/UX:** Figma-imported design with custom ЛАБС branding, focusing on improved spacing and readability.
- **Admin Panel:** Refactored with a composition pattern for content managers (News, Recordings, FAQ, Events) using API-first data flow and optimistic updates.
- **Backend Utilities:** DRY principles applied with reusable utilities for error handling (`async-handler`), database operations (`db-helpers`), and a unified middleware (`text-content-middleware`) for security and content processing.
- **Security:** Multi-layer rate limiting (global, burst, auth, create, read), content spam detection, user/IP-based throttling, request size validation, and XSS protection via DOMPurify. All user data queries are filtered by `user_id` for multi-tenant isolation. HMAC-SHA-256 token hashing for initial password setup tokens with dedicated transaction isolation using SELECT FOR UPDATE locks to prevent race conditions.
- **Data Flow:** Transitioned from `localStorage` to API-driven data loading for admin-created content to ensure immediate visibility and consistency. Centralized data prefetching in `AppContext` uses parallel loading to eliminate loading delays and redundant API calls.
- **Multi-Tenant Isolation:** Implemented a `requestId` pattern to prevent data leakage across users during rapid login/logout sequences, ensuring that stale API responses cannot update state. User-specific data is no longer stored in `localStorage`.
- **Deployment:** Optimized for Autoscale health checks, with a lean root endpoint and production mode bypassing database initialization for quick startups.

**Feature Specifications:**
- **Authentication:** JWT-based login/logout, session management, and secure password handling with a complete password reset flow. Initial password setup system for new users via secure HMAC-SHA-256 tokenized links (7-day expiry).
- **Content Management:** CRUD operations for instructions, events, favorites, notes, questions, and user progress. Direct image upload for admin news.
- **Products & Tiers System (NEW):** Multi-product platform enabling different educational offerings (intensives, courses, webinars) with tiered access levels (basic, premium, VIP). Database tables: `products`, `pricing_tiers`, `cohorts`, `product_resources`, `user_enrollments`, `cohort_members`. Automatic migration creates default "Общая программа" product with universal tier for existing users. Access control middleware filters content based on user enrollments and tier levels. Admin APIs for managing products, tiers, cohorts, enrollments, and resource assignments. Public catalog endpoints for marketing display of available products.
- **Admin Functionality:** Dedicated API endpoints and managers for news, recordings, FAQ, events, email campaigns, and initial password distribution. Public read-only API endpoints for general user access to admin-managed content. Mass initial password email distribution to all users without passwords.
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