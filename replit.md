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
- **Client Storage**: IndexedDB with adaptive fallback to cookies, stores up to 20 match history entries
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

### Player Color Customization
- **Billiards Cloth Colors**: 6 authentic options (Championship Green, Electric Blue, Wine Red, Championship Black, Tournament Blue, Charcoal Gray)
- **Dynamic Backgrounds**: Scoring area and ball rack change to active player's color
- **Cloth Texture**: 45-degree diagonal weave pattern with fiber noise for realistic felt appearance
- **Simple Selection**: Streamlined dropdown interface with color preview dots
- **Default Colors**: Player 1 = Championship Green, Player 2 = Electric Blue

### UI Components
- **Ball Rack**: Interactive display of all 9 balls with visual state indicators and dynamic player-colored background
- **Player Scores**: Real-time score tracking with progress bars and dynamic player-colored backgrounds
- **Game Modals**: Win notifications and match completion dialogs
- **Player Setup**: Configuration for new matches with skill level and color selection (streamlined dropdown)

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

### Static Deployment - SIMPLIFIED SOLUTION
- **Approach**: Pure static deployment using client-only build
- **Build Process**: Vite builds to `client/dist`, then copied to root `dist` directory
- **No Server Required**: App runs entirely in browser with localStorage persistence

### Static Build Script
- **`build-static-only.js`** - Clean, simple static build process
- **Process**: 
  1. Cleans `dist` directory
  2. Runs `vite build` (outputs to `client/dist`)
  3. Copies files to root `dist` for deployment
  4. Verifies `index.html` placement

### Static Deployment Settings
- **Type**: Static
- **Public Directory**: `dist`
- **Build Command**: `node build-static-only.js`
- **Result**: Ready-to-deploy static files in `dist/`

### Why Static Works Better
- **Simpler Setup**: No server configuration needed
- **Faster Deployment**: Direct static file serving
- **Client Storage**: Uses localStorage for match data
- **Universal Hosting**: Works on any static hosting service

**Status**: Static deployment fully configured and tested.

### Environment Configuration
- Client-only application - no server environment variables needed
- Development mode uses Vite middleware for hot reload
- Production uses static file serving with localStorage persistence

### Database Management
- Drizzle migrations stored in `./migrations` directory
- Schema defined in shared TypeScript files
- Push-based deployment with `db:push` command

## Recent Changes (January 6, 2025)

### Color Selection UI Redesign
- **Changed**: Moved color selection from full-width dropdowns to compact square dropdowns
- **Location**: Right-aligned next to player name headers in setup modal
- **Files Modified**: `client/src/components/player-setup-modal.tsx`
- **Impact**: More streamlined, less intrusive interface while preserving all functionality

### Enhanced Match History Storage  
- **Enhanced**: IndexedDB storage now preserves 20 completed matches (previously 1)
- **Files Modified**: `client/src/lib/indexedDBStorage.ts`, `client/src/lib/adaptiveStorage.ts`
- **Impact**: Better match tracking and history retention for users

### Server Connection Fixes
- **Fixed**: Simplified port binding logic to resolve connection issues
- **Files Modified**: `server/index.ts`
- **Impact**: More reliable development server startup