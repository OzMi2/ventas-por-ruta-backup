# Ventas por Ruta - Sales Route Management System

## Overview

This is a sales route management application designed for route salespeople, auditors, and administrators. The system enables mobile vendors to manage customers, products, inventory, and sales transactions while working on their assigned routes. It features offline-first capabilities with sync support, discount management by customer and volume, and role-based access control.

The application is a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for data persistence. It's designed to connect to external REST APIs for legacy system integration while also providing its own backend API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit deployment
- **Routing**: Wouter (lightweight React router)
- **State Management**: Custom React Context-based store with localStorage persistence (`client/src/store/`)
- **Data Fetching**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with TSX for development
- **API Design**: RESTful JSON API with JWT authentication
- **Build**: esbuild for production bundling with selective dependency bundling

### Authentication & Authorization
- **Method**: JWT tokens with bcrypt password hashing
- **Role-based Access**: Three roles - `vendedor` (salesperson), `auditor`, `admin`
- **Session Storage**: Client-side token storage in localStorage
- **Middleware**: Custom Express middleware for route protection

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with push-based schema sync
- **Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod

### Key Design Patterns
- **Shared Code**: The `shared/` directory contains schema definitions used by both frontend and backend
- **API Service Layer**: Frontend uses a centralized API client (`client/src/lib/api.ts`) with typed responses
- **Offline Support**: Pending sales stored in localStorage for later sync with idempotency via event_id/client_tx_id
- **Inventory Validation**: Backend validates stock availability before accepting sales (no negative stock allowed)
- **Payment Method**: Cash only (efectivo)

### API Endpoints
- `POST /api/auth/login` - JWT authentication
- `GET /api/me/bootstrap` - Initial data download (clients, products, inventory for route)
- `POST /api/sync/push` - Upload offline sales with idempotency
- `GET /api/ventas` - Sales history (filtered by role: vendedor sees own, admin/auditor by route/client)
- `GET /api/descuentos` - Volume discount rules
- `POST /api/descuentos` - Create discount rule (admin only)
- `DELETE /api/descuentos/:id` - Delete discount rule (admin only)
- `GET /api/rutas` - List routes (admin/auditor)
- `GET /api/clientes` - List clients (filtered by route)

### Test Credentials (password: 1234)
- `vendedor1` - Salesperson assigned to "Ruta Centro"
- `vendedor2` - Salesperson assigned to "Ruta Norte"  
- `auditor` - Auditor role (can view all routes)
- `admin` - Administrator role (full access)

### Discount System Architecture
The application implements a volume-based discount system with:
- Fixed monetary discounts (not percentages) per unit
- Customer-specific discount rules
- Tiered pricing based on quantity thresholds
- Support for different sale modes: PIEZA (piece), KG (weight), MIXTO (mixed)

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database client and query builder

### Authentication
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing

### External API Integration
- The frontend is designed to optionally connect to an external REST API (configurable via `VITE_API_BASE_URL`)
- API calls include Bearer token authentication
- The Settings page allows runtime configuration of the API base URL

### UI Framework Dependencies
- **Radix UI**: Full suite of accessible UI primitives
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class merging utility

### Build & Development
- **Vite**: Frontend build and dev server
- **esbuild**: Server bundling for production
- **TSX**: TypeScript execution for development

### PWA / Offline-First Architecture
- **Service Worker** (`client/public/sw.js`): Version 8 with three caching strategies:
  - `cacheFirstWithOfflineFallback`: Static assets, falls back to offline.html
  - `staleWhileRevalidate`: API GETs for bootstrap, productos, rutas, clientes, descuentos
  - `networkFirst`: Other API requests
- **Offline Page** (`client/public/offline.html`): Shows pending sales count, auto-redirects on reconnect
- **Reconnect Flow**: `useOnlineStatus` hook detects reconnection, fires `app:reconnected` event, clears bootstrap cache to force fresh data
- **Stock Adjustment**: `fetchProductos()` subtracts pending offline sales from displayed stock
- **Cart Persistence**: Cart stored in localStorage via store reducer
- **Icons**: Optimized icons at all sizes, separate maskable icons with safe-zone padding
- **TWA Support**: `assetlinks.json` placeholder at `.well-known/assetlinks.json`

### Key PWA Files
- `client/public/sw.js` - Service Worker v8
- `client/public/offline.html` - Offline fallback page
- `client/public/manifest.json` - Web App Manifest
- `client/public/.well-known/assetlinks.json` - Android App Links
- `client/src/hooks/useOffline.ts` - Online status and reconnect hooks
- `client/src/services/offlineCache.ts` - LocalStorage cache utilities
- `client/src/services/productos.ts` - Includes pending stock adjustment logic

### Advanced PWA Features
- **Lazy Loading**: All routes use React.lazy() with Suspense for faster initial load
- **Splash Screen**: Animated splash with progress bar, shown once per session
- **Compression**: Express middleware with gzip/deflate, level 6, threshold 1024 bytes
- **Low Data Mode**: `useLowDataMode` hook detects slow connections via Network Information API
- **Background Sync**: SW registers 'sync-ventas' tag, listener posts message to clients
- **Periodic Background Sync**: 'sync-ventas-periodic' for automatic scheduled sync
- **Push Notifications**: SW handles push events, requires VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars
- **Price History**: Table historial_precios tracks price changes per product with user and timestamp
- **Daily Reports**: GET /api/reportes/ventas-dia returns sales summary JSON for PDF generation

### Push Notification Setup
To enable push notifications, set these environment variables:
- `VAPID_PUBLIC_KEY`: Base64 URL-safe public key
- `VAPID_PRIVATE_KEY`: Base64 URL-safe private key

Generate VAPID keys: `npx web-push generate-vapid-keys`

### New Hooks
- `client/src/hooks/usePushNotifications.ts` - Subscribe/unsubscribe to push notifications
- `client/src/hooks/useLowDataMode.ts` - Detect slow network connections