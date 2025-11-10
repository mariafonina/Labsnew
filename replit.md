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
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS v4.1 (embedded in CSS)
- **UI Components**: Radix UI primitives
- **Additional Libraries**: 
  - Framer Motion for animations
  - React Hook Form for forms
  - Recharts for data visualization
  - Lucide React for icons

## Project Structure
- `src/components/` - React components including UI primitives and feature components
- `src/contexts/` - React context providers
- `src/styles/` - Global CSS styles
- `src/assets/` - Static assets

## Development
- Port: 5000 (configured for Replit)
- Host: 0.0.0.0 (allows proxy access)
- HMR: Configured for WSS on port 443
- **Important**: `allowedHosts: true` in Vite config is required for Replit's dynamic proxy domains

## Recent Changes (November 10, 2025)
- Initial setup in Replit environment
- Added TypeScript configuration files (tsconfig.json, tsconfig.node.json)
- Configured Vite for Replit (port 5000, host 0.0.0.0, HMR settings, allowedHosts)
- Added missing TypeScript dependencies
- Installed all npm packages
- Created .gitignore for Node.js projects
- Fixed "Blocked request" error by enabling allowedHosts in Vite config
- **Added custom ЛАБС pink logo**:
  - Replaced Figma placeholder logo with custom pink ЛАБС branding
  - Updated Logo component to use `src/assets/logo.png`
  - Added favicon (`public/favicon.png`)
  - Updated Vite alias to point to new logo
  - Logo displays across all components: Login, UserSidebar, AdminPanel, AdminSidebar, Onboarding, and mobile header
- Verified application runs successfully with proper proxy support

## Branding
- **Logo**: Pink ЛАБС logo located at `src/assets/logo.png`
- **Favicon**: `public/favicon.png` (same as logo)
- **Logo Usage**: Imported via Logo component from `src/components/Logo.tsx`
- Supports multiple sizes: sm (h-6), md (h-8), lg (h-12), xl (h-16)

## Notes
- The project uses Tailwind CSS v4.1 with embedded utilities in src/index.css
- No tailwind.config.js or postcss.config.js needed unless custom Tailwind generation is required
- TypeScript path alias '@' maps to './src' directory
- Image assets are typed via `src/vite-env.d.ts` for TypeScript support
