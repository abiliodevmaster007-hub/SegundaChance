/**
 * SERVIÇO WEBSOCKET REAL (SegundaChance Angola)
 *
 * Implementa ligação WebSocket usando STOMP over SockJS quando VITE_API_URL
 * aponta para uma instância externa do Spring Boot, e utiliza BroadcastChannel
 * + Event Bus em memória quando executado no gateway full-stack integrado,
 * evitando erros de polling em /ws/info.
 */

import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { WS_BASE_URL } from './apiConfig';

type CallbackType = (message: any) => void;

class WebSocketService {
  private stompClient: Client | null = null;
  private connected: boolean = false;
  private connectionListeners: (() => void)[] = [];
  private pendingSubscriptions: Map<string, CallbackType[]> = new Map();
  private activeSubscriptions: Map<string, any> = new Map();
  private localTopicListeners: Map<string, Set<CallbackType>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    const hasExternalSpringUrl = Boolean(
      (import.meta as any).env?.VITE_API_URL &&
        String((import.meta as any).env.VITE_API_URL).trim() !== ''
    );

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('segundachance_ws_channel');
        this.broadcastChannel.onmessage = (event) => {
          const { destination, body } = event.data || {};
          if (destination && body) {
            this.dispatchLocalMessage(destination, body);
          }
        };
      } catch (e) {
        // Ignorar se BroadcastChannel estiver restrito no navegador
      }
    }

    if (!hasExternalSpringUrl) {
      // Modo gateway full-stack integrado: ativo imediatamente sem polling SockJS externo
      this.connected = true;
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => {
        return new SockJS(WS_BASE_URL) as any;
      },
      reconnectDelay: 8000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      this.connected = true;
      this.connectionListeners.forEach((listener) => {
        try {
          listener();
        } catch (e) {}
      });
      this.connectionListeners = [];

      this.pendingSubscriptions.forEach((callbacks, destination) => {
        this.subscribeToDestination(destination, callbacks);
      });
      this.pendingSubscriptions.clear();
    };

    this.stompClient.onDisconnect = () => {
      this.connected = false;
    };

    this.stompClient.onStompError = () => {};
    this.stompClient.onWebSocketError = () => {};

    this.stompClient.activate();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public onConnect(callback: () => void) {
    if (this.connected) {
      callback();
    } else {
      this.connectionListeners.push(callback);
    }
  }

  private dispatchLocalMessage(destination: string, body: any) {
    const listeners = this.localTopicListeners.get(destination);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(body);
        } catch (e) {}
      });
    }
  }

  public subscribe(destination: string, callback: CallbackType) {
    if (!this.localTopicListeners.has(destination)) {
      this.localTopicListeners.set(destination, new Set());
    }
    this.localTopicListeners.get(destination)!.add(callback);

    if (!this.stompClient) {
      return {
        unsubscribe: () => {
          this.localTopicListeners.get(destination)?.delete(callback);
        },
      };
    }

    if (!this.connected) {
      if (!this.pendingSubscriptions.has(destination)) {
        this.pendingSubscriptions.set(destination, []);
      }
      this.pendingSubscriptions.get(destination)!.push(callback);

      return {
        unsubscribe: () => {
          this.localTopicListeners.get(destination)?.delete(callback);
          const list = this.pendingSubscriptions.get(destination);
          if (list) {
            const index = list.indexOf(callback);
            if (index !== -1) list.splice(index, 1);
          }
        },
      };
    }

    return this.subscribeToDestination(destination, [callback]);
  }

  private subscribeToDestination(destination: string, callbacks: CallbackType[]) {
    if (!this.stompClient) {
      return { unsubscribe: () => {} };
    }

    const subscription = this.stompClient.subscribe(destination, (stompMessage: IMessage) => {
      try {
        const parsedBody = JSON.parse(stompMessage.body);
        callbacks.forEach((cb) => cb(parsedBody));
      } catch (e) {}
    });

    this.activeSubscriptions.set(destination, subscription);

    return {
      unsubscribe: () => {
        this.localTopicListeners.get(destination)?.forEach((cb) => {
          if (callbacks.includes(cb)) {
            this.localTopicListeners.get(destination)?.delete(cb);
          }
        });
        subscription.unsubscribe();
        this.activeSubscriptions.delete(destination);
      },
    };
  }

  public send(destination: string, body: any) {
    // Se for envio de mensagem de chat, notifica destinatário localmente e entre abas
    if (destination === '/app/chat.send' && body && body.recipientId) {
      const targetTopic = `/topic/messages/${body.recipientId}`;
      this.dispatchLocalMessage(targetTopic, body);
      try {
        this.broadcastChannel?.postMessage({ destination: targetTopic, body });
      } catch (e) {}
    }

    if (this.stompClient && this.connected) {
      this.stompClient.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  }
}

export const webSocketService = new WebSocketService();
