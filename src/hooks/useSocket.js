import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (serverUrl = 'http://localhost:3001') => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to PartSelect Chat Backend');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [serverUrl]);

  const sendMessage = (message, sessionId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat_message', {
        message,
        sessionId,
        timestamp: new Date().toISOString()
      });
    }
  };

  const onMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('ai_response', callback);
    }
  };

  const offMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('ai_response', callback);
    }
  };

  return {
    socket: socketRef.current,
    sendMessage,
    onMessage,
    offMessage,
    isConnected
  };
};