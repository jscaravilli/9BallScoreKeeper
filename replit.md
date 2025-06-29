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

### Deployment Configuration - RESOLVED
- **Previous Issue**: Static deployment expected `index.html` directly in `dist` but build output went to `dist/public`
- **Solution Implemented**: Created automated deployment preparation scripts
- **Available Scripts**:
  1. `prepare-static-deploy.js` - Node.js script that builds frontend and restructures files
  2. `deploy-static.sh` - Shell script wrapper with deployment instructions
- **Process**: Build outputs to `dist/public`, then files are moved to `dist` root for static deployment compatibility

### Static Deployment Instructions
1. **Prepare for deployment**: Run `./deploy-static.sh` or `node prepare-static-deploy.js`
2. **Deploy settings**: Use "Static" deployment type with public directory set to `dist`
3. **Verification**: Check that `index.html` exists in `dist/` directory after preparation
4. **Result**: App will be deployed as a client-only application using localStorage for data persistence

**Note**: The deployment preparation script automatically resolves the build output mismatch by moving files from `dist/public` to `dist` root directory, ensuring compatibility with static deployment requirements.

### Environment Configuration
- Client-only application - no server environment variables needed
- Development mode uses Vite middleware for hot reload
- Production uses static file serving with localStorage persistence

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
- June 28, 2025: Created complete production deployment with working server and frontend
- June 28, 2025: Fixed port conflicts and API endpoints for production environment
- June 28, 2025: Successfully resolved all deployment issues with simplified production server
- June 28, 2025: Final production build ready for deployment with working API endpoints
- June 28, 2025: Converted to client-only application using localStorage for match data persistence
- June 28, 2025: Created static build system for deployment to any static hosting service
- June 28, 2025: RESOLVED deployment issue - created automated scripts to restructure build output for static deployment
- June 28, 2025: Fixed "index.html not found" error by moving files from dist/public to dist root directory
- June 28, 2025: Added deployment preparation scripts (prepare-static-deploy.js and deploy-static.sh) for easy static deployment
- June 28, 2025: Enhanced match history with detailed ball scoring events, timestamps, and expandable timelines
- June 28, 2025: Cleaned up UI by removing ball controls from main screen and making navigation scroll with content
- June 28, 2025: Enhanced undo functionality to support multiple turn rewinds (up to 10 turns) with visual counter
- June 28, 2025: Perfected 9-ball undo system with proper rerack event handling and clean state transitions
- June 28, 2025: RESOLVED static deployment issue - deployment preparation script now successfully moves files from dist/public to dist root
- June 28, 2025: Created executable deploy-static.sh wrapper for streamlined deployment preparation workflow
- June 28, 2025: FIXED ball locking persistence issue after rerack undo operations - balls scored by other players now remain properly locked
- June 28, 2025: Updated UI terminology - changed "Ball Rack" to "Rack" and removed "Player Setup" from hamburger menu

## User Preferences

Preferred communication style: Simple, everyday language.