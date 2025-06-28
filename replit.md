# 9-Ball Pool Score Tracker

## Overview

This is a full-stack web application for tracking 9-ball pool matches using the American Poolplayers Association (APA) handicap system. The application allows players to set up matches with different skill levels, track ball states during games, and automatically calculate scores based on APA rules.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom pool table themed colors
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API**: RESTful endpoints for match and game management
- **Development**: Hot reload with Vite integration in development mode

### Data Storage Solutions
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via Neon serverless)
- **Development Storage**: In-memory storage implementation for development/testing
- **Schema**: Shared TypeScript schemas between client and server

## Key Components

### Database Schema
- **Matches Table**: Stores player information, skill levels, scores, current game state, and ball states
- **Games Table**: Individual game records within matches with points and completion status
- **Ball State Tracking**: JSON field storing the state of all 9 balls (active, scored, dead)

### API Endpoints
- `GET /api/match/current` - Retrieve the current active match
- `POST /api/match` - Create a new match with player details
- `PATCH /api/match/:id` - Update match information
- `PATCH /api/match/:id/balls` - Update ball states during gameplay

### APA Handicap System
- Skill levels 1-9 with different point targets for winning
- Points awarded based on ball pocketed (1 point for balls 1-8, 2 points for the 9-ball)
- Progressive scoring system where higher skill levels need more points to win

### UI Components
- **Ball Rack**: Interactive display of all 9 balls with visual state indicators
- **Player Scores**: Real-time score tracking with progress bars toward handicap targets
- **Game Modals**: Win notifications and match completion dialogs
- **Player Setup**: Configuration for new matches with skill level selection

## Data Flow

1. **Match Creation**: Players enter names and skill levels, creating a new match record
2. **Game Play**: Ball states are updated in real-time as balls are pocketed or marked dead
3. **Score Calculation**: Points are automatically calculated based on APA rules when balls are scored
4. **Game Completion**: When the 9-ball is pocketed, the game ends and scores are updated
5. **Match Progression**: Multiple games continue until a player reaches their handicap target
6. **Match Completion**: Final winner is determined when handicap is reached

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Query)
- Express.js for server framework
- Drizzle ORM with PostgreSQL adapter
- Neon Database for serverless PostgreSQL

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for icons
- Class Variance Authority for component variants

### Development Tools
- Vite for build tooling and development server
- TypeScript for type safety
- Replit-specific plugins for development environment integration

## Deployment Strategy

### Build Process
1. Frontend builds to `dist/public` directory using Vite
2. Backend bundles server code with esbuild to `dist/index.js`
3. Production serves static files from Express with fallback to React app

### Deployment Configuration Issue
- **Issue**: Static deployment expects `index.html` directly in `dist` but build outputs to `dist/public`
- **Root Cause**: Build configuration outputs frontend to `dist/public` subdirectory
- **Solutions Available**:
  1. Use Autoscale deployment (recommended for full-stack apps)
  2. Manual file restructuring after build (`cp -r dist/public/* dist/ && rm -rf dist/public`)
  3. Use provided `prepare-deploy.js` script for automated restructuring

### Environment Configuration
- Database URL required via `DATABASE_URL` environment variable
- Development mode uses Vite middleware for hot reload
- Production mode serves pre-built static assets
- **Recommended**: Use Autoscale deployment type for proper full-stack support

### Database Management
- Drizzle migrations stored in `./migrations` directory
- Schema defined in shared TypeScript files
- Push-based deployment with `db:push` command

## Changelog
- June 28, 2025: Initial setup
- June 28, 2025: Complete match completion system implemented with winner banner and undo functionality
- June 28, 2025: Fixed final point scoring logic to properly register scores before match completion
- June 28, 2025: Enhanced PlayerScores component with override capability for immediate final score display
- June 28, 2025: Resolved ball state timing issue - winning ball now correctly resets when undo is pressed
- June 28, 2025: Implemented deep cloning for proper undo state management
- June 28, 2025: Updated terminology from "New Game" to "New Match" throughout interface
- June 28, 2025: Fixed winner banner re-display issue after undo - now shows correctly on repeated wins
- June 28, 2025: Resolved production deployment issue by implementing PostgreSQL database storage
- June 28, 2025: App now automatically switches between memory storage (development) and database storage (production)

## User Preferences

Preferred communication style: Simple, everyday language.