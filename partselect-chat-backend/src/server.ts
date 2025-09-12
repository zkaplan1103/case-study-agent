import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';

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

// Health check endpoint
server.get('/health', async (request, reply) => {
  return { status: 'ok', message: 'PartSelect Chat Backend Running' };
});

// API routes placeholder
server.get('/api/chat/health', async (request, reply) => {
  return { 
    status: 'ready', 
    message: 'PartSelect AI Chat Agent Ready',
    features: ['DeepSeek Integration', 'Product Search', 'Compatibility Check', 'Installation Guides']
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 PartSelect Chat Backend running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();