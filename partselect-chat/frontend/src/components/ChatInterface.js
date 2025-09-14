import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { sendChatMessage, checkHealth } from '../api/api';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your PartSelect AI assistant. I can help you find refrigerator and dishwasher parts, check compatibility, and provide installation guidance. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => 'session_' + Date.now());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Check backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      const healthy = await checkHealth();
      setIsConnected(healthy);
    };

    checkBackendHealth();
    
    // Check health every 30 seconds
    const healthInterval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(healthInterval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const currentMessage = inputMessage;
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);
    
    try {
      // Send message via HTTP API
      const aiResponse = await sendChatMessage(currentMessage, sessionId);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(aiResponse.timestamp),
        metadata: aiResponse.metadata,
        products: aiResponse.products
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message);
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="partselect-container">
      <div className="partselect-card min-h-[600px] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-partselect-blue flex items-center gap-2">
                <Bot className="w-8 h-8" />
                PartSelect AI Assistant
              </h1>
              <p className="text-gray-600 text-sm">Refrigerator & Dishwasher Parts Expert</p>
            </div>
            
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-800">Connection Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-partselect-blue text-white' 
                  : 'bg-gray-100 text-partselect-blue'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-partselect-blue text-white'
                  : message.isError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => (
                    <p key={index} className={`${index === 0 ? '' : 'mt-2'} ${
                      message.role === 'user' ? 'text-white' : message.isError ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      {line}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${
                    message.role === 'user' ? 'text-blue-100' : message.isError ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.metadata?.toolsUsed && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Used: {message.metadata.toolsUsed.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-partselect-blue flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about appliance parts, compatibility, or installation..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-partselect-blue focus:border-transparent"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="partselect-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;