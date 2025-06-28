import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// In-memory storage for production
let currentMatch = null;
let matchCounter = 1;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

app.get('/api/match/current', (req, res) => {
  try {
    console.log('GET /api/match/current - returning:', !!currentMatch);
    res.json(currentMatch);
  } catch (error) {
    console.error('Error getting current match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/match', (req, res) => {
  try {
    console.log('POST /api/match - creating match with data:', req.body);
    
    currentMatch = {
      id: matchCounter++,
      player1Name: req.body.player1Name || 'Player 1',
      player1SkillLevel: req.body.player1SkillLevel || 5,
      player2Name: req.body.player2Name || 'Player 2', 
      player2SkillLevel: req.body.player2SkillLevel || 5,
      player1Score: 0,
      player2Score: 0,
      currentPlayer: 1,
      currentGame: 1,
      ballStates: [],
      isComplete: false,
      winnerId: null,
      createdAt: new Date().toISOString()
    };
    
    console.log('Match created successfully:', currentMatch.id);
    res.json(currentMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

app.patch('/api/match/:id', (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    console.log('PATCH /api/match/' + matchId + ' - updating with:', req.body);
    
    if (currentMatch && currentMatch.id === matchId) {
      currentMatch = { ...currentMatch, ...req.body };
      console.log('Match updated successfully');
      res.json(currentMatch);
    } else {
      res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

app.patch('/api/match/:id/balls', (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    console.log('PATCH /api/match/' + matchId + '/balls - updating ball states');
    
    if (currentMatch && currentMatch.id === matchId) {
      currentMatch.ballStates = req.body.ballStates || req.body;
      console.log('Ball states updated successfully');
      res.json(currentMatch);
    } else {
      res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    console.error('Error updating ball states:', error);
    res.status(500).json({ error: 'Failed to update ball states' });
  }
});

// Serve static files from dist/public
app.use(express.static(join(__dirname, 'dist', 'public')));

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'dist', 'public', 'index.html');
  console.log('Serving SPA route:', req.path, 'from:', indexPath);
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with port fallback
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🎱 9-Ball Pool Scorekeeper Production Server');
  console.log('✅ Server running on port', PORT);
  console.log('🌐 Access at: http://0.0.0.0:' + PORT);
  console.log('📁 Serving frontend from: dist/public/');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('Port', PORT, 'is busy, trying', (PORT + 1));
    server.listen(PORT + 1, '0.0.0.0');
  } else {
    console.error('Server error:', error);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});