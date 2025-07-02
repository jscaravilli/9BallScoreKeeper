
// Production environment validation
if (process.env.NODE_ENV === 'production') {
  console.log('Production mode detected');
  console.log('Database URL available:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.warn('Warning: No DATABASE_URL in production - using memory storage');
  }
}

// Set Vite host configuration for Replit preview compatibility
process.env.VITE_HOST = '0.0.0.0';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Add CORS headers for Replit preview compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled and works with Replit preview.
  const port = Number(process.env.PORT) || 5000;
  
  // Add error handling for port conflicts
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Trying to find available port...`);
      // Try ports 5001-5010 if 5000 is in use
      const tryPort = (portToTry: number) => {
        if (portToTry > 5010) {
          console.error('Could not find available port between 5000-5010');
          process.exit(1);
        }
        server.listen(portToTry, "0.0.0.0", () => {
          log(`serving on port ${portToTry}`);
          console.log(`Server accessible at http://0.0.0.0:${portToTry}`);
        }).on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${portToTry} in use, trying ${portToTry + 1}...`);
            tryPort(portToTry + 1);
          } else {
            console.error('Server error:', err);
            process.exit(1);
          }
        });
      };
      tryPort(5001);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log(`Server accessible at http://0.0.0.0:${port}`);
  });
})();
