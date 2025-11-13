import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { initializeDatabase } from './init-db';
import { globalLimiter, burstLimiter, requestSizeLimiter } from './utils/rate-limit';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import instructionsRoutes from './routes/instructions.routes';
import eventsRoutes from './routes/events.routes';
import favoritesRoutes from './routes/favorites.routes';
import notesRoutes from './routes/notes.routes';
import progressRoutes from './routes/progress.routes';
import commentsRoutes from './routes/comments.routes';
import newsRoutes from './routes/news.routes';
import recordingsRoutes from './routes/recordings.routes';
import faqRoutes from './routes/faq.routes';
import adminNewsRoutes from './routes/admin/news.routes';
import adminRecordingsRoutes from './routes/admin/recordings.routes';
import adminFaqRoutes from './routes/admin/faq.routes';
import adminUsersRoutes from './routes/admin/users.routes';
import adminEmailsRoutes from './routes/admin/emails.routes';
import adminInitialPasswordsRoutes from './routes/admin/initial-passwords.routes';
import passwordResetRoutes from './routes/password-reset.routes';
import setupPasswordRoutes from './routes/setup-password.routes';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
// Use port 5000 in production (for deployment), 3001 in development
const PORT = parseInt(process.env.PORT || (isProduction ? '5000' : '3001'), 10);

// Trust proxy for rate limiting behind reverse proxy (Replit)
app.set('trust proxy', 1);

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

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/', globalLimiter);
app.use('/api/', burstLimiter);
app.use('/api/', requestSizeLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api', setupPasswordRoutes);
app.use('/api/instructions', instructionsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/comments', commentsRoutes);

// Public content routes (no authentication required)
app.use('/api/news', newsRoutes);
app.use('/api/recordings', recordingsRoutes);
app.use('/api/faq', faqRoutes);

// Admin routes
app.use('/api/admin/news', adminNewsRoutes);
app.use('/api/admin/recordings', adminRecordingsRoutes);
app.use('/api/admin/faq', adminFaqRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/emails', adminEmailsRoutes);
app.use('/api/admin', adminInitialPasswordsRoutes);

// Root endpoint - always return fast JSON for health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ЛАБС Server',
    environment: isProduction ? 'production' : 'development',
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

// Only initialize database in development mode
// In production (Autoscale), database should already be set up via migrations
async function initDB() {
  // Skip database initialization in production for fast Autoscale startup
  if (isProduction) {
    console.log('Production mode: Skipping automatic database initialization');
    console.log('Run "npm run migrate" separately to initialize database schema');
    return;
  }
  
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Server will continue running, but database operations may fail');
  }
}

// Start server immediately for fast health check response
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`Server listening on 0.0.0.0:${PORT}`);
  
  // Initialize database only in development mode
  initDB();
});
