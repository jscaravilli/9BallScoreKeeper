# 9-Ball Pool Score Tracker

A professional-grade web application for tracking APA 9-ball pool matches with realistic 3D ball graphics and tournament-quality scoring.

## Features

🎱 **APA Handicap System** - Official American Poolplayers Association scoring rules  
📱 **Mobile PWA** - Install as an app on your phone or tablet  
🎮 **Real-time Scoring** - Track ball states and calculate points instantly  
🎯 **Visual Ball Rack** - Interactive 3D pool balls with authentic appearance  
📊 **Match History** - Detailed scoring events with timestamps  
⏪ **Advanced Undo** - Rewind up to 10 turns with visual counter  
🏆 **Tournament Ready** - Professional scoring system for serious players

## Quick Start

1. **Play Online**: Visit the deployed app and start scoring immediately
2. **Install as App**: Use "Add to Home Screen" on mobile devices
3. **Convert to Android**: Follow `PWA_TO_APK_INSTRUCTIONS.md` for APK generation

## How to Play

1. **Setup Match**: Enter player names and APA skill levels (1-9)
2. **Track Balls**: Tap balls as they're pocketed, marked dead, or reracked
3. **Automatic Scoring**: Points calculated based on APA handicap rules
4. **Win Detection**: Game ends when 9-ball is pocketed, match ends when handicap reached

## APA Scoring System

- **Balls 1-8**: 1 point each when pocketed
- **9-Ball**: 2 points when pocketed (game winner)
- **Handicap Targets**: Based on skill level (1=14 points, 9=70 points)
- **Progressive System**: Higher skill levels need more points to win

## Technical Features

- **Offline Support**: Works without internet after first load
- **Real-time Updates**: Instant score calculation and ball state tracking
- **Turn-based Logic**: Sophisticated inning and turn management
- **State Persistence**: Matches saved locally with full history
- **Cache Management**: Smart updates with manual cache clearing option

## Installation

### Web App
- Visit the deployed URL
- Bookmark or use "Add to Home Screen"

### Android APK
- Deploy the web app to any hosting service
- Use PWABuilder.com to generate APK
- See `PWA_TO_APK_INSTRUCTIONS.md` for detailed steps

## Development

Built with React, TypeScript, and Tailwind CSS. Features sophisticated 3D ball rendering, localStorage persistence, and PWA capabilities for mobile app conversion.

**Version**: 1.0.5 - PWA-enabled with Android APK conversion support

---

Perfect for pool halls, tournaments, practice sessions, and serious players tracking their APA league performance.