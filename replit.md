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
- July 1, 2025: FIXED timeout reset logic - timeouts now correctly reset each game (not each match) by resetting counters during rerack operations
- July 1, 2025: ENHANCED player setup modal - made non-dismissible until both player names are entered, added visual validation feedback with colored borders, removed close button (X)
- July 1, 2025: FIXED match history compatibility with timeout system - updated database schema to properly include timeout fields
- July 1, 2025: FIXED match history timing - history now writes immediately when match winner modal appears, not when next match starts
- July 1, 2025: Added offline indicator next to innings count and improved current player outline visibility with thicker green border and ring effect
- July 1, 2025: RESOLVED match history cookie storage issue - implemented comprehensive debugging system with multi-tier fallback (cookie → localStorage) and 48-hour expiration
- July 1, 2025: Fixed cookie verification failures with enhanced storage methods, overwrite detection, and automatic index rebuilding from orphaned cookies
- January 1, 2025: Added safety tracking button for defensive shots per APA requirements with counter display showing current usage
- January 1, 2025: Implemented APA scoresheet printing system with precise overlay on official PDF format for league submission
- January 1, 2025: Reorganized UI controls - End Turn, Safety, and Timeout horizontally on top row with proper spacing
- January 1, 2025: New Match and Reset Match buttons positioned lower on page, vertically aligned with Safety button width
- January 1, 2025: Updated APA scoresheet to new format with both players in top rectangle section and precise grid alignment
- January 1, 2025: Fixed match history white screen issue with proper error handling for missing event data
- January 1, 2025: Undo Action button repositioned between Safety and New Match buttons with consistent sizing
- January 1, 2025: Enhanced safety button with undo functionality - added minus button to decrement safety count matching timeout system design
- January 1, 2025: Updated development environment to use memory storage while keeping production database unchanged
- January 2, 2025: Implemented pixel-perfect scoresheet system using exact coordinate arrays for precise mark placement
- January 2, 2025: Added game-based slash direction system (forward slashes for odd games, backslashes for even games)
- July 2, 2025: FIXED dead ball functionality after IndexedDB changes - issue was ball state updates not syncing with React Query cache:
  - Enhanced ball state updates to trigger immediate local state changes alongside storage updates
  - Added setCurrentMatch calls after direct storage updates to ensure UI reflects changes immediately
  - Applied fixes to all ball transitions: scored → dead → active
  - Fixed dead ball visual indicators (red X) and point deductions working properly
  - NOTE: TypeScript type conflicts between string IDs (new storage) and legacy number ID references causing server instability
- July 2, 2025: FIXED re-rack functionality after dropping the nine ball:
  - Added missing setCurrentMatch() call to sync local state with storage updates immediately
  - Enhanced re-rack to reset timeouts and safeties for new games
  - Game number increments correctly and all ball states reset to active
- July 2, 2025: FIXED scoresheet tally mark issues:
  - Implemented proper event filtering to exclude dead balls from tally marks
  - Dead balls no longer generate tally marks on scoresheet
  - Fixed excessive tally mark counts by filtering out invalid ball_scored events
  - Added validation to ensure only legitimate scores appear on APA scoresheet
- July 2, 2025: FIXED 9-ball second tally mark positioning in PDF generator:
  - Second 9-ball tally mark now appears in the next consecutive position instead of overlapping the first
  - Both tally marks for 9-ball are now visible and properly spaced on printed scoresheets
  - Updated Unicode box drawing characters (╱ ╲) for cleaner tally mark appearance
- July 2, 2025: ENHANCED tally mark positioning for better visual alignment:
  - Backslash symbol (╲) for even-numbered games now shifted 3 pixels left on both player grids
  - Forward slash symbol (╱) for odd-numbered games maintains original positioning
  - Applied to both PDF generation and on-screen scoresheet display for consistency
- July 2, 2025: UPDATED game separator character to Unicode box drawing:
  - Replaced standard vertical line | with Unicode box drawing character │ for cleaner appearance
  - Applied to both PDF generation and scoresheet display for consistent visual separation between games
  - Enhanced boldness with increased line width in PDFs and text shadow effects in scoresheet display
  - ENHANCED vertical bar boldness with double │ character technique: positioned second │ character 1 pixel to the right
  - Applied double character method to both scoresheet display (using CSS absolute positioning) and PDF generation (canvas rendering)
  - Creates significantly bolder game separators while maintaining clean Unicode character appearance
- July 2, 2025: ADDED match history access from player setup screen:
  - Added "View Match History" button to player setup modal for easy access without clearing current state
  - Button appears below form controls with History icon and navigation to /match-history route
  - Allows users to review past matches while maintaining current match data
- July 2, 2025: IMPLEMENTED 20-character limit for player names:
  - Added maxLength={20} HTML attribute to both player name input fields
  - Real-time truncation using .slice(0, 20) in onChange handlers prevents typing beyond limit
  - State initialization and save function also apply 20-character truncation for data consistency
  - Multi-layer validation ensures names never exceed 20 characters in UI or storage
- July 2, 2025: ADDED "LAG" tag to Player 1 score display:
  - Small green tag (light green background, darker green text) appears next to Player 1's name
  - Indicates Player 1 won the lag (break) in pool terminology
  - Uses flexbox layout to maintain centered alignment without disrupting existing score card design
  - LAG tag is visual-only element, not included in actual name data values
- July 2, 2025: IMPLEMENTED coordinate-based markup system for comprehensive scoresheet PDF generation:
  - Enhanced renderScoresheetToCanvas to support matchData parameter with player names, skill levels, handicaps, scores, innings, dead balls, safeties, and timestamps
  - Added precise coordinate positioning for all match data elements using bottom-left text anchoring
  - Updated scoresheet display component with renderMatchDataMarkup function for visual preview
  - Player 1 gets "(LAG)" designation on both display and PDF output
  - Player 2 score coordinate updated to [1073,446] per specification
  - Text alignment uses bottom-left anchoring for precise positioning control
  - Both on-screen scoresheet and PDF generation use identical coordinate system for consistency
- July 2, 2025: ADDED dynamic text sizing for player names to prevent overflow:
  - Implemented font size calculation based on text width constraints
  - Player 1 name constrained to right edge at [810,322]
  - Player 2 name constrained to right edge at [810,465]
  - Automatic font shrinking from 48px down to minimum 12px to fit within boundaries
  - Both PDF generation (canvas) and scoresheet display use identical sizing algorithms
  - Text measurements ensure proper fit while maintaining readability
- July 2, 2025: STANDARDIZED scoresheet markup color to blue:
  - Updated PDF generation canvas context to use blue fillStyle for all text markups
  - Scoresheet display component already configured with blue color for all coordinate-based text overlays
  - Consistent blue appearance across both visual preview and generated PDF output
- July 2, 2025: ADDED second total innings coordinate at [2533,333]:
  - Added duplicate total innings display for additional scoresheet field
  - Both PDF generation and scoresheet display now show innings count at two locations
  - Reuses same calculated totalInnings value for consistency
- July 2, 2025: CORRECTED all scoresheet markup coordinates to match final specifications:
  - Player names: [488,326] (Player1), [488,456] (Player2) - limited to 18 characters, non-bold, 32px font
  - Skill levels: [841,228] (Player1), [841,370] (Player2)
  - Handicaps/Targets: [892,468] (Player1), [892,326] (Player2)
  - Final scores: [1073,236] (Player1), [1077,446] (Player2) - should equal tallies
  - Total innings: [1075,308] (primary), [2533,333] (secondary)
  - Total dead balls: [1075,382]
  - Timestamps: [2465,76] (start time), [2941,76] (end time)
  - Updated both PDF generation and scoresheet display components with correct positioning
- July 2, 2025: SEPARATED LAG tag display between scoresheet and PDF output:
  - LAG tag appears on scoresheet display for visual reference but NOT in PDF generation
  - PDF output shows clean player names without LAG designation for official APA submission
  - Scoresheet display retains LAG tag for user interface clarity
  - Maintains separation between visual preview and official printed documentation
- January 2, 2025: Enhanced target scoring with smart circling only on skill level positions (1,5,10,14,19,25,31,35,38,46,50,55,60,65,70,75)
- January 2, 2025: Fixed port configuration - reverted to port 5000 for Replit preview console compatibility
- January 2, 2025: RESOLVED "431 Request Header Fields Too Large" service worker error:
  - Implemented hybrid cookie/localStorage strategy: essential data in cookies, large data in localStorage with tracking flags
  - Added emergency cookie cleanup system that automatically removes oversized cookies on app startup
  - Smart size detection prevents large match history and events from being stored in cookies
  - Maintained persistence while eliminating header size issues that were crashing the entire app
  - App now loads reliably without cookie-related 431 errors
  - Fixed match history disappearing issue by preserving history cookies in emergency cleanup
  - Added automatic recovery system that restores match history from localStorage if cookies are accidentally cleared
  - Enhanced migration system to detect and restore lost match history data
  - Reverted to cookie-only storage with intelligent compression for match history
  - Implemented data compression that keeps only essential match info and key events
  - Added manual recovery button in match history modal to restore from localStorage backup
  - All match data now stored exclusively in cookies with automatic size management
- January 2, 2025: FIXED multiple scoresheet issues:
  - Corrected scorePosition tracking to use consecutive coordinates without skipping
  - Vertical bars now indicate game transitions but don't affect tally placement continuity
  - Enhanced both Player 1 and Player 2 coordinate mapping for accurate dual-player scoresheets
  - Updated canvas-based PDF generation to match corrected spacing logic
  - FIXED 9-ball double tally issue - 9-ball now correctly places 2 tally marks in consecutive positions
  - FIXED skill level target circles - corrected to use actual APA handicap values (SL5=38, not 35)
  - Implemented centralized game tracking to synchronize slash directions between players
  - FIXED tally mark overlapping - simplified coordinate indexing to prevent rendering conflicts
  - Corrected target circle positioning with proper 0-indexed coordinate conversion for both players
  - FIXED vertical bar placement for mixed game winners - both players now get vertical bars when ANY player wins a game
  - Implemented centralized game ending detection to ensure consistent bar placement regardless of who wins each game
- January 2, 2025: RESOLVED scoresheet tally rendering and print functionality issues:
  - Fixed incorrect APA handicap values in PDF generator (SL5 was using 35 instead of 38)
  - IDENTIFIED root cause: Cookie storage system hitting browser size limits, truncating match events
  - Cookie analysis revealed events arrays cut off after ~15-20 events, losing later game data
  - IMPLEMENTED hybrid storage solution: Essential ball_scored events in cookies, complete backup in localStorage
  - Added automatic fallback system that uses localStorage when cookie data is incomplete
  - Enhanced event storage with size monitoring and verification checks
  - FIXED print button functionality by updating PDF generator to handle hybrid storage data
  - Corrected target circle positioning arrays in PDF generator to match scoresheet display
  - RESOLVED HTTP 431 "Request Header Fields Too Large" errors with emergency cookie cleanup system
  - Implemented automatic cookie size monitoring and cleanup to prevent browser header limit issues
  - Added proactive cookie management with reduced total size limits (8KB) and emergency cleanup on app startup
  - SIMPLIFIED match history to single-match storage system to prevent cookie overflow
  - Added confirmation dialog when starting new match that warns about clearing previous match history
  - System now maintains only 1 match history at a time with automatic cleanup of old data
  - New match creation automatically clears all previous match cookies to prevent 431 errors
  - ENHANCED cookie optimization with advanced compression, chunking, and timestamp optimization:
    * Comprehensive JSON compression with 50+ shortened property names (player1Name → p1n, ball_scored → bsc, etc.)
    * Timestamp optimization: ISO strings → Unix timestamps (saves ~15 chars per timestamp: "2025-01-02T23:03:19.123Z" → "t1735862599123")
    * Advanced chunking system with metadata tracking (chunk count, total size, compression status)
    * Intelligent compression ratio analysis and logging for optimization monitoring
    * Smart event filtering prioritizes scoresheet-essential data with time-based retention
    * Multi-tier storage: compressed single cookie → chunked compression → localStorage backup → ultra-filtered cookies
    * Automatic decompression, timestamp restoration, and chunk reassembly with integrity verification
    * Legacy compatibility support for old-style chunked cookies during migration
    * Comprehensive cleanup system prevents orphaned chunks and metadata corruption
  - IMPLEMENTED IndexedDB with maintained interface compatibility:
    * Adaptive storage system automatically chooses IndexedDB or enhanced cookies
    * IndexedDB provides unlimited storage capacity with no HTTP 431 errors
    * In-memory cache layer enables synchronous interface while using async IndexedDB
    * Automatic migration from cookie storage to IndexedDB on browser support detection
    * Seamless fallback to enhanced cookie storage if IndexedDB unavailable
    * Maintains exact same interface as existing cookieStorageAPI for zero code changes
    * Real-time storage method reporting and capacity monitoring
    * Production-grade reliability with comprehensive error handling and fallbacks
- January 2, 2025: Implemented automated canvas-based PDF generation system:
  - Replaced HTML-based printing with direct PNG+markup rendering using HTML5 Canvas
  - Added jsPDF library for automatic single-page PDF creation and download
  - Canvas renders scoresheet PNG as base, then burns in blue tally marks and circles at exact pixel coordinates
  - PDF automatically sized for letter paper (landscape) with proper margins and centering
  - Match history print buttons now generate timestamped PDFs with player names in filename
  - No more browser print dialogs - direct PDF download with canvas-rendered scoresheet image
  - Enhanced to render tallies for both Player 1 (lag winner) and Player 2 with separate coordinate arrays
  - Added target circles for both players based on their individual skill levels
  - PDF opens in new window with manual print instruction, no automatic printing
  - Fixed vertical bar placement to appear between games without covering tallies
  - Corrected tally tracking so inactive players don't get spaces added when games end
  - Enhanced game separator positioning to halfway point between tally positions

## User Preferences

Preferred communication style: Simple, everyday language.