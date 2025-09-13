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
    const { db, chatSessions } = await import('./db/index');
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

// Register chat routes
import { chatRoutes } from './routes/chat';
import { AgentService } from './services/AgentService';

server.register(chatRoutes);

// Initialize Agent Service for Socket.io
const agentService = new AgentService();

// Initialize Socket.io before starting server
const io = new Server({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.io event handlers with ReAct agent integration
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.emit('connection_status', { 
    status: 'connected', 
    message: 'Connected to PartSelect AI Assistant with ReAct Agent' 
  });

  socket.on('chat_message', async (data) => {
    console.log('Received message:', data);
    
    try {
      // Process message through ReAct agent
      const response = await agentService.processMessage({
        message: data.message,
        sessionId: data.sessionId || `socket_${socket.id}`,
        context: { socketId: socket.id, ...data.context },
        userPreferences: data.userPreferences
      });

      // Emit the agent response
      socket.emit('ai_response', {
        id: Date.now().toString(),
        content: response.finalAnswer,
        metadata: {
          reasoning: response.reasoning,
          confidence: response.confidence,
          ...response.metadata
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error processing chat message:', error);
      
      socket.emit('ai_response', {
        id: Date.now().toString(),
        content: 'I encountered an error while processing your request. Please try again.',
        metadata: { 
          error: true, 
          errorMessage: error.message 
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server with Socket.io
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    
    // Attach Socket.io to the server
    io.attach(server.server);
    
    console.log(`🚀 PartSelect Chat Backend running on port ${port}`);
    console.log(`🔌 Socket.io enabled for real-time communication`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();