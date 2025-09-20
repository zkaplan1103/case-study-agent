import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, WifiOff, AlertCircle, RotateCcw } from 'lucide-react';
import { sendChatMessage, checkHealth } from '../api/api';

const ChatInterface = () => {
  // Load messages from localStorage or use default welcome message
  const getInitialMessages = () => {
    try {
      const savedMessages = localStorage.getItem('partselect-chat-messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    
    // Default welcome message
    return [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your PartSelect AI assistant. I can help you find refrigerator and dishwasher parts, check compatibility, and provide installation guidance. How can I assist you today?',
        timestamp: new Date()
      }
    ];
  };

  const [messages, setMessages] = useState(getInitialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showDisconnectionAlert, setShowDisconnectionAlert] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => 'session_' + Date.now());
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Combined effect for messages: scroll and save to localStorage
  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem('partselect-chat-messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages, scrollToBottom]);

  // Check backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      const healthy = await checkHealth();
      const wasConnected = isConnected;
      setIsConnected(healthy);
      
      if (healthy) {
        console.log('Connected to PartSelect Chat Backend');
        setShowDisconnectionAlert(false);
      } else {
        console.log('Disconnected from PartSelect Chat Backend');
        if (wasConnected) {
          setShowDisconnectionAlert(true);
        }
      }
    };

    checkBackendHealth();
    
    // Check health every 30 seconds
    const healthInterval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(healthInterval);
  }, [isConnected]);

  const handleSendMessage = useCallback(async (e) => {
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
      // Console log user message for context
      console.group('User Message Sent');
      console.log('Message:', currentMessage);
      console.log('Session ID:', sessionId);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
      
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
  }, [inputMessage, isTyping, sessionId]);

  const clearChatHistory = useCallback(() => {
    const defaultMessage = {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your PartSelect AI assistant. I can help you find refrigerator and dishwasher parts, check compatibility, and provide installation guidance. How can I assist you today?',
      timestamp: new Date()
    };
    setMessages([defaultMessage]);
  }, []);

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
            
            <div className="flex items-center gap-3">
              {/* Clear Chat Button */}
              <button
                onClick={clearChatHistory}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear chat history"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Chat
              </button>
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

        {/* Disconnection Alert Popup */}
        {showDisconnectionAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <WifiOff className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Backend Disconnected</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Lost connection to the PartSelect Chat Backend. Please check your internet connection or try refreshing the page.
              </p>
              <button
                onClick={() => setShowDisconnectionAlert(false)}
                className="w-full bg-partselect-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Dismiss
              </button>
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