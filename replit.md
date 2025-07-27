# Sports Facility Booking & Tracking App

## Overview

This is a comprehensive sports facility booking and tracking system built with React frontend and Express.js backend. The application supports multi-institution management with role-based access control for colleges, schools, and sports arenas. Features include advanced booking logic with capacity management, group restrictions, sports tracking analytics, and mobile-responsive design optimized for institutional use.

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
- **Database**: PostgreSQL (Supabase production database)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: @neondatabase/serverless for database connectivity
- **Production Setup**: Supabase credentials configured via environment secrets (July 26, 2025)

## Key Components

### Multi-Institution Architecture
- Support for multiple institutions (colleges, schools, sports arenas)
- Institution types: Private (controlled access) and Public (open registration)
- Institution-specific court and user management
- Centralized system with distributed access control

### Advanced Authentication System
- Session-based authentication using Passport.js
- Password hashing with scrypt and salt
- Four-tier role system: Super Admin, Staff, Student, Public User
- Auto-generated student IDs with format: {InstituteCode}_{Group}_{Sequential}
- Institution-specific user management and access control

### Group Management System
- Student organization into groups/sections (A1, A2, B1, etc.)
- Group-based booking restrictions and permissions
- Hierarchical user management within institutions
- Staff control over group access to specific time slots

### Enhanced Court Management
- Multi-institution court management
- Sport-specific categorization (tennis, basketball, football, badminton)
- Court type classification (indoor, outdoor, synthetic)
- Capacity-based booking with dynamic availability tracking
- Institution-specific court visibility and access

### Advanced Booking System
- Capacity-aware time slot management
- Group-restricted booking permissions
- One-slot-per-day enforcement options
- Real-time availability with player count tracking
- Repeat slot creation for recurring schedules
- Institution-isolated booking data

### Sports Tracking & Analytics
- User activity tracking across multiple sports
- Institution-specific performance analytics
- Group-based participation statistics
- Individual and institutional reporting
- Sports progression and usage patterns

### Enhanced Admin Dashboard
- Multi-level administration (Super Admin vs Staff)
- Institution-specific management interfaces
- Advanced user creation and group assignment
- Comprehensive booking and usage analytics
- Court utilization and revenue tracking

### Mobile-First Responsive Design
- Touch-optimized interface for mobile devices
- Bottom navigation for primary actions
- Responsive layout adapting to all screen sizes
- Institution branding and customization support

## Data Flow

### Enhanced Authentication Flow
1. User provides credentials via login form
2. Server validates credentials using Passport.js with institution context
3. Session is created and stored with role and institution data
4. Client receives user data including role, institution, and group information
5. Protected routes check authentication status and role permissions
6. Institution-specific data filtering applied based on user context

### Advanced Booking Flow
1. User selects sport type and views available courts for their institution
2. System filters courts based on user's group permissions and institution
3. Available time slots displayed with capacity and group restrictions
4. User selects time slot, system validates:
   - Slot capacity availability
   - Group permission compliance
   - One-slot-per-day restrictions (if enabled)
   - Institution access rights
5. Booking is created and slot capacity updated automatically
6. Sports tracking data recorded for analytics

### Multi-Institution Management Flow
1. Super Admin creates new institutions with type (private/public)
2. Staff users are assigned to specific institutions
3. Staff creates groups/sections for student organization
4. Students are added with auto-generated IDs: {InstituteCode}_{Group}_{Number}
5. Courts are created within institution context
6. Time slots are configured with group restrictions and capacity limits

### Group-Based Access Control Flow
1. Staff defines which groups can access specific time slots
2. Students can only see and book slots allowed for their group
3. Public users (for public institutions) have unrestricted access
4. System enforces group permissions at both API and UI levels

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

## Recent Changes

### July 27, 2025 - Enhanced Multi-Role Architecture Implementation
- Implemented comprehensive multi-role database architecture matching technical specification
- Added support for App Admin, Organization Admin, Staff, and User roles with proper separation
- Enhanced database schema with facilities, user-organization mapping, sections, and payments
- Switched to PostgreSQL-based storage with proper Supabase integration
- Created robust permission system with role-based access control
- Successfully deployed enhanced schema to production Supabase database

### July 26, 2025 - Production Database Integration
- Integrated Supabase PostgreSQL database for production deployment
- Configured secure environment secrets for database credentials
- Successfully deployed database schema using Drizzle migrations
- Verified authentication system working with production database
- Created default admin user (username: admin, password: admin123)
- Confirmed role-based access control functionality

### System Status
- ✓ Database: Connected to Supabase PostgreSQL
- ✓ Authentication: Working with session management
- ✓ Role System: Super Admin, Staff, Student, Public User roles implemented
- ✓ Multi-Institution: Private/public institution support
- ✓ Booking System: Capacity management and group restrictions
- ✓ Admin Dashboard: Multi-level administration interface

The application follows modern full-stack patterns with clear separation of concerns, type safety throughout, and mobile-first responsive design principles.