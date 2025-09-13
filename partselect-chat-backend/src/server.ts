import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { PartSelectAgent } from './agents/PartSelectAgent';
import { DeepSeekService } from './services/DeepSeekService';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const deepSeekService = new DeepSeekService();
const partSelectAgent = new PartSelectAgent(deepSeekService);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'PartSelect Chat Backend'
  });
});

// Simple chat endpoint - handles all chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    console.log(`Processing chat message: "${message}"`);
    
    // Process message with PartSelect agent
    const agentResponse = await partSelectAgent.process(message, {
      sessionId: sessionId || 'default',
      timestamp: new Date().toISOString()
    });

    res.json({
      response: agentResponse.finalAnswer,
      reasoning: agentResponse.reasoning,
      confidence: agentResponse.confidence,
      sessionId: sessionId || 'default',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to process your request. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong processing your request'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PartSelect Chat Backend running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🤖 DeepSeek integration: ${deepSeekService ? 'Ready' : 'Not configured'}`);
});

export default app;