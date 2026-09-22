import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

const useSocket = (onMessage) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('priceUpdate', (data) => {
      if (onMessage && typeof onMessage === 'function') {
        onMessage(data);
      }
    });

    socketRef.current.on('orderUpdate', (data) => {
      console.log('Order update:', data);
    });

    socketRef.current.on('tradeUpdate', (data) => {
      console.log('Trade update:', data);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onMessage]);

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const subscribe = (channel) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe', channel);
    }
  };

  const unsubscribe = (channel) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe', channel);
    }
  };

  return { emit, subscribe, unsubscribe, socket: socketRef.current };
};

export default useSocket;