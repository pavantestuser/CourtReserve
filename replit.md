# Sports Facility Management System

## Overview

This is a full-stack sports facility management system built with a React frontend and Express.js backend. The application allows users to book sports courts, track their sports activities, and provides administrative functionality for managing facilities. It uses a PostgreSQL database with Drizzle ORM for data management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: Express session with PostgreSQL session store
- **Password Security**: Node.js crypto module with scrypt for hashing

### Database Architecture
- **Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: @neondatabase/serverless for database connectivity

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with scrypt and salt
- Role-based access control (user/admin)
- Protected routes on both client and server

### Court Management
- CRUD operations for sports courts
- Support for different court types (tennis, basketball, football)
- Court availability tracking
- Hourly rate and capacity management

### Booking System
- Time slot-based booking system
- User booking history and management
- Real-time availability checking
- Booking status tracking (confirmed, cancelled, completed)

### Sports Tracking
- User activity tracking and analytics
- Performance metrics and statistics
- Weekly/monthly activity summaries

### Admin Dashboard
- Court management interface
- System analytics and reporting
- User management capabilities

### Mobile-First UI
- Responsive design optimized for mobile devices
- Bottom navigation for mobile experience
- Side drawer navigation
- Touch-friendly interactions

## Data Flow

### Authentication Flow
1. User provides credentials via login form
2. Server validates credentials using Passport.js
3. Session is created and stored in PostgreSQL
4. Client receives user data and updates global state
5. Protected routes check authentication status

### Booking Flow
1. User selects court and desired time slot
2. Client checks availability via API
3. Server validates booking constraints
4. Booking is created and stored in database
5. Client updates UI to reflect new booking

### Court Management Flow (Admin)
1. Admin accesses court management interface
2. CRUD operations are performed via API
3. Server validates admin permissions
4. Database is updated accordingly
5. Client refreshes court list

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Query
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Routing**: Wouter for lightweight routing
- **Forms**: React Hook Form with Zod validation
- **Database**: Drizzle ORM, Neon Database client
- **Authentication**: Passport.js, express-session
- **Styling**: Tailwind CSS, class-variance-authority

### Development Dependencies
- **Build Tools**: Vite, esbuild for production builds
- **TypeScript**: Full TypeScript support across the stack
- **Development**: tsx for development server, Replit integration

### Session Management
- **Storage**: connect-pg-simple for PostgreSQL session storage
- **Security**: Secure session configuration with proper secrets

## Deployment Strategy

### Development Environment
- Vite development server for hot module replacement
- tsx for running TypeScript server code
- Concurrent development of client and server

### Production Build
- Vite builds optimized client bundle
- esbuild bundles server code for production
- Static files served from Express server

### Database Management
- Drizzle migrations for schema changes
- Environment-based database configuration
- Connection pooling via Neon serverless client

### Environment Configuration
- Environment variables for database URLs
- Session secrets for security
- Replit-specific configurations for deployment

The application follows modern full-stack patterns with clear separation of concerns, type safety throughout, and mobile-first responsive design principles.