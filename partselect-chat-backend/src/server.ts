import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';
import { Server } from 'socket.io';

// Load environment variables
config();

const server = fastify({ 
  logger: true 
});

// Register plugins
server.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
});

server.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '900000')
});

// Health check endpoint with database connection test
server.get('/health', async (request, reply) => {
  try {
    // Import db and schema here to avoid circular dependency issues
    const { db, chatSessions } = await import('./db/index.js');
    // Test database connection
    const result = await db.select().from(chatSessions).limit(1);
    return { 
      status: 'ok', 
      message: 'PartSelect Chat Backend Running',
      database: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return { 
      status: 'warning', 
      message: 'PartSelect Chat Backend Running',
      database: 'connection_issue',
      error: error.message || 'Unknown error'
    };
  }
});

// API routes placeholder
server.get('/api/chat/health', async (request, reply) => {
  return { 
    status: 'ready', 
    message: 'PartSelect AI Chat Agent Ready',
    features: ['DeepSeek Integration', 'Product Search', 'Compatibility Check', 'Installation Guides']
  };
});

// Start server with Socket.io
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    
    // Initialize Socket.io
    const io = new Server(server.server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    // Socket.io event handlers
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.emit('connection_status', { 
        status: 'connected', 
        message: 'Connected to PartSelect AI Assistant' 
      });

      socket.on('chat_message', async (data) => {
        console.log('Received message:', data);
        
        // TODO: Phase 2 - Process with DeepSeek AI agent
        // Placeholder response for now
        setTimeout(() => {
          socket.emit('ai_response', {
            id: Date.now().toString(),
            content: 'This is a placeholder response. DeepSeek AI integration will be implemented in Phase 2.',
            metadata: { type: 'placeholder' },
            timestamp: new Date().toISOString()
          });
        }, 1000);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
    
    console.log(`🚀 PartSelect Chat Backend running on port ${port}`);
    console.log(`🔌 Socket.io enabled for real-time communication`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();