import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initializeDatabase } from './init-db';
import authRoutes from './routes/auth.routes';
import instructionsRoutes from './routes/instructions.routes';
import eventsRoutes from './routes/events.routes';
import favoritesRoutes from './routes/favorites.routes';
import notesRoutes from './routes/notes.routes';
import progressRoutes from './routes/progress.routes';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
// Use port 5000 in production (for deployment), 3001 in development
const PORT = parseInt(process.env.PORT || (isProduction ? '5000' : '3001'), 10);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/instructions', instructionsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/progress', progressRoutes);

// Root endpoint for health checks - must respond quickly
app.get('/', (req, res) => {
  // If Accept header prefers JSON or this is explicitly a health check, return JSON
  if (req.accepts('json') && !req.accepts('html')) {
    return res.json({ 
      status: 'ok', 
      message: 'ЛАБС Server',
      environment: isProduction ? 'production' : 'development',
      timestamp: new Date().toISOString() 
    });
  }
  
  // In production, serve the React app HTML
  if (isProduction) {
    const buildPath = path.join(process.cwd(), 'build');
    return res.sendFile(path.join(buildPath, 'index.html'));
  }
  
  // In development, return JSON health check
  res.json({ 
    status: 'ok', 
    message: 'ЛАБС API Server (Development)',
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production, serve static assets and handle SPA routing
if (isProduction) {
  const buildPath = path.join(process.cwd(), 'build');
  
  console.log(`Serving static files from: ${buildPath}`);
  
  // Serve static assets (CSS, JS, images, etc.)
  app.use(express.static(buildPath));
  
  // Handle SPA routing for all other requests (except those already handled above)
  app.use((req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend API server running on port ${PORT}`);
      console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
      console.log(`Server listening on 0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
