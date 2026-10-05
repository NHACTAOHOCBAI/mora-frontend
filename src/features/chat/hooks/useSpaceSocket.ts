import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import type { Message, TypingNotification } from '../types';

interface UseSpaceSocketProps {
  spaceId?: number;
  onMessageReceived?: (message: Message) => void;
  onTypingReceived?: (typingInfo: TypingNotification) => void;
}

export const useSpaceSocket = ({
  spaceId,
  onMessageReceived,
  onTypingReceived,
}: UseSpaceSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Lưu callbacks vào ref để tránh re-subscribe không cần thiết khi callback thay đổi
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onTypingReceivedRef = useRef(onTypingReceived);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onTypingReceivedRef.current = onTypingReceived;
  }, [onTypingReceived]);

  useEffect(() => {
    if (!spaceId) return;

    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:8080';

    // Chuyển đổi http/https sang ws/wss cho native WebSocket
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws';

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);

        // 1. Subscribe channel nhận tin nhắn
        client.subscribe(`/topic/spaces/${spaceId}/messages`, (stompMessage) => {
          try {
            const raw = JSON.parse(stompMessage.body);
            const msg: Message = {
              id: raw.id,
              sender: raw.sender,
              messageType: raw.messageType,
              text: raw.text,
              userId: raw.userId,
              userName: raw.userName,
              userAvatar: raw.userAvatar,
              timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date(),
              citations: raw.citations,
              condensedQuestion: raw.condensedQuestion,
              promptSent: raw.promptSent,
              selectedDocumentIds: raw.selectedDocumentIds,
            };
            onMessageReceivedRef.current?.(msg);
          } catch (e) {
            console.error('[WebSocket] Failed to parse message payload:', e);
          }
        });

        // 2. Subscribe channel typing indicator
        client.subscribe(`/topic/spaces/${spaceId}/typing`, (stompMessage) => {
          try {
            const typingInfo: TypingNotification = JSON.parse(stompMessage.body);
            onTypingReceivedRef.current?.(typingInfo);
          } catch (e) {
            console.error('[WebSocket] Failed to parse typing payload:', e);
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('[WebSocket STOMP error]:', frame.headers['message'], frame.body);
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
      setIsConnected(false);
    };
  }, [spaceId]);

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (!spaceId || !clientRef.current || !clientRef.current.connected) return;

      try {
        clientRef.current.publish({
          destination: `/app/spaces/${spaceId}/typing`,
          body: JSON.stringify({ typing }),
        });
      } catch (e) {
        console.error('[WebSocket] Failed to send typing event:', e);
      }
    },
    [spaceId]
  );

  return {
    isConnected,
    sendTyping,
  };
};
