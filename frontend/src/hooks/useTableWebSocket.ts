import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { TableResponse } from '../types';

export function useTableWebSocket(shareToken: string | undefined, onUpdate: (table: TableResponse) => void) {
  const clientRef = useRef<Client | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!shareToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws') as unknown as WebSocket,
      reconnectDelay: 3000,
      debug: (msg) => {
        if (import.meta.env.DEV && msg.startsWith('<<< ')) {
          console.debug('[STOMP]', msg);
        }
      },
    });

    client.onConnect = () => {
      client.subscribe(`/topic/tables/${shareToken}`, (message) => {
        const table = JSON.parse(message.body) as TableResponse;
        onUpdateRef.current(table);
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [shareToken]);
}
