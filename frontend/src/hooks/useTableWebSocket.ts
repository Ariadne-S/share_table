import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getUserId, getUserName } from '../userStorage';
import type { PresenceUpdate, TableResponse } from '../types';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useTableWebSocket(
  shareToken: string | undefined,
  onUpdate: (table: TableResponse) => void,
  options?: { onPresence?: (update: PresenceUpdate) => void }
) {
  const clientRef = useRef<Client | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onPresenceRef = useRef(options?.onPresence);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onPresenceRef.current = options?.onPresence;
  });

  useEffect(() => {
    if (!shareToken) {
      queueMicrotask(() => setConnectionState('disconnected'));
      return;
    }

    queueMicrotask(() => setConnectionState('connecting'));
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
      setConnectionState('connected');
      client.subscribe(`/topic/tables/${shareToken}`, (message) => {
        const table = JSON.parse(message.body) as TableResponse;
        onUpdateRef.current(table);
      });
      if (onPresenceRef.current) {
        client.subscribe(`/topic/tables/${shareToken}/presence`, (message) => {
          const presence = JSON.parse(message.body) as PresenceUpdate;
          onPresenceRef.current?.(presence);
        });
      }
      client.publish({
        destination: `/app/presence/join/${shareToken}`,
        body: JSON.stringify({
          userId: getUserId(),
          displayName: getUserName(),
        }),
      });
    };

    client.onWebSocketClose = () => setConnectionState('disconnected');
    client.onStompError = () => setConnectionState('error');

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [shareToken]);

  return { connectionState };
}
