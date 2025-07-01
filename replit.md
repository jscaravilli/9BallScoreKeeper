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
- June 28, 2025: FIXED SSL mixed content error by removing Replit development banner script from production builds
- June 28, 2025: Added Safari compatibility fixes - improved touch handling, localStorage checks, and iOS-specific meta tags
- June 29, 2025: FIXED 9-ball scoring bug after rerack - now correctly awards 2 points instead of deducting them
- June 29, 2025: Updated undo logic to only trigger when 9-ball is already scored, not when active after rerack
- June 29, 2025: Reverted complex ball locking system back to simple useEffect-based approach for stability
- June 29, 2025: Enhanced ball visual design with white circles and black numbers for balls 1-8
- June 29, 2025: Made orange ball (ball 5) more saturated and darker for better visibility
- June 29, 2025: Widened yellow stripe on 9-ball and matched ball 1 yellow to 9-ball color
- June 29, 2025: Refined ball borders to ultra-thin 0.5px for cleaner appearance
- June 29, 2025: Implemented turn-based ball visibility system - balls disappear after turn ends, not immediately
- June 29, 2025: Fixed undo operation visual bugs by synchronizing ball state calculations with immediate updates
- June 29, 2025: Added inning count display at top next to game indicator ("Game X • Inning Y")
- June 29, 2025: Fixed inning advancement logic - now only increments when both players complete their turns
- June 29, 2025: Updated reset confirmation dialog to say "Reset Match" and mention innings will be reset
- June 29, 2025: Fixed complete ball state recording with deep cloning (JSON.parse/stringify) for all scenarios
- June 29, 2025: Simplified ball visibility to disappear when scoring player's turn ends
- June 29, 2025: Updated "Undo Last Turn" to "Undo Last Action" throughout interface
- June 29, 2025: Added About button to hamburger menu with version 1.0.0 and developer credits
- June 29, 2025: Fixed ball visibility system with turnCompleted tracking to prevent reappearing when players return
- June 29, 2025: SIMPLIFIED static deployment approach - eliminated server complexity for pure client-side deployment
- June 29, 2025: Created streamlined build-static-only.js script that outputs directly to dist directory
- June 29, 2025: Updated deployment to use localStorage-only approach with no backend dependencies
- June 29, 2025: FIXED dead ball behavior - dead balls remain visible throughout rack but become non-editable after their turn ends
- June 29, 2025: RESOLVED first turn dead ball locking by preserving scoredBy value for turn completion tracking
- June 29, 2025: Implemented deployment-based cache invalidation system:
  - Build script injects unique deployment timestamp into production builds
  - Automatic cache clearing when deployment timestamp changes
  - Production-grade HTTP cache control headers (no-cache, no-store, must-revalidate)
  - Manual cache clear feature - tap version number 5 times quickly in About dialog
  - Version-specific script loading with cache-busting URL parameters
  - Preserves match data while clearing code caches to fix dead ball locking issues
- June 29, 2025: FIXED static deployment build process - resolved "index.html not found" error:
  - Updated build-static-only.js to properly move files from dist/public to dist root
  - Build script now handles Vite's output structure correctly for static hosting
  - Added fallback file copying mechanism for reliability
  - Verified deployment timestamp injection and cache-busting still work
  - Static deployment now works correctly with "dist" as public directory
- June 29, 2025: Enhanced pool balls with sophisticated 3D sphere effects:
  - Implemented radial gradients for realistic lighting and depth on all balls
  - Added inset shadows and external shadows for authentic 3D curvature
  - Created highlight reflections with blur effects using pseudo-elements
  - Enhanced white number circles with gradient depth and proper shadows
  - Fixed 9-ball to match spherical gradient depth of other balls with layered gradients
  - Enhanced 9-ball with dramatic dual-layer gradient system for maximum visual impact
  - Added hover effects for interactive visual feedback
  - Removed all borders from pool balls for cleaner, modern appearance
  - Made balls 1-7 15% darker with deeper, more saturated color gradients for authentic pool hall appearance
  - Matched 9-ball yellow section to ball 1's darker yellow gradient for visual consistency
  - Implemented advanced 3D overlay system for 9-ball with elliptical gradients, horizontal stripe spanning 50% of ball with circular cutout and 3D downward bend
  - Made white number circles smaller (1.5rem) across all balls for better proportions
  - Updated ball 1 to true yellow gradient and ball 5 to vibrant true orange for authentic pool ball colors
- June 30, 2025: FIXED game numbering system - games now properly start at 1 and increment with each new rack after winning
- June 30, 2025: FIXED production game counter persistence - replaced async mutations with direct localStorage updates for reliable state management
- June 30, 2025: Updated UI terminology - match win modal now says "Start New Match" and player setup shows "Player 1 Name (Lag Winner)"
- June 30, 2025: Version 1.0.4 - production build ready with game counter fixes and improved UI text
- June 30, 2025: CONVERTED TO PWA - added manifest.json, service worker, app icons, and offline functionality
- June 30, 2025: Version 1.0.5 - PWA-enabled production build ready for Android APK conversion
- June 30, 2025: FIXED PWA manifest serving - added proper content-type headers for PWABuilder compatibility
- June 30, 2025: UPDATED PWA icons to authentic 9-ball design - replaced generic club icon with proper yellow 9-ball pool ball graphics
- June 30, 2025: CROPPED mobile screenshot to remove Replit interface - shows pure app content for professional PWA installation experience
- June 30, 2025: Added unique PWA ID "9bsk2085082207" to manifest for proper app identification in stores and installations
- June 30, 2025: FIXED APK installation issues - changed PWA ID to "bsk9ball2025" (Android package names can't start with numbers)
- June 30, 2025: Added Digital Asset Links (.well-known/assetlinks.json) for proper APK domain verification and browser bar removal
- June 30, 2025: FIXED Android APK compatibility - added minSdkVersion 26 and android:exported="true" for Android 12+ support via pwabuilder.json configuration
- June 30, 2025: ENHANCED offline functionality - upgraded service worker for true native-like APK experience with comprehensive caching, background sync, and full offline operation using existing localStorage implementation
- July 1, 2025: UPGRADED to cookie-based storage system - replaced localStorage with more persistent browser cookies for reliable state preservation across browser refreshes and sessions
- July 1, 2025: Cookie storage automatically migrates existing localStorage data on first load to ensure smooth user transition
- July 1, 2025: IMPLEMENTED comprehensive timeout system - added timeout button with skill-level-based allocation (SL ≤3 get 2 timeouts, SL ≥4 get 1 timeout), timer modal with overtime indicator after 1:00, undo timeout functionality, and match history logging
- July 1, 2025: Added offline indicator next to innings count and improved current player outline visibility with thicker green border and ring effect

## User Preferences

Preferred communication style: Simple, everyday language.