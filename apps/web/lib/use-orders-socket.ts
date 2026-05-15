'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Order } from '@fredys/types';

interface UseOrdersSocketOptions {
  onNewOrder?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
}

export function useOrdersSocket({ onNewOrder, onOrderUpdated }: UseOrdersSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const socket = io(`${API}/orders`, { transports: ['websocket'], autoConnect: true });
    socketRef.current = socket;

    if (onNewOrder)     socket.on('order:new',     onNewOrder);
    if (onOrderUpdated) socket.on('order:updated', onOrderUpdated);

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}
