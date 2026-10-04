/**
 * SERVIÇO WEBSOCKET REAL (SegundaChance Angola)
 *
 * Implementa ligação WebSocket STOMP over SockJS autenticada via JWT (cabeçalho Authorization Bearer),
 * ciclo de vida explícito connect(token) / disconnect(), gestão multi-listener por tópico e
 * sincronização local via BroadcastChannel no modo gateway full-stack integrado.
 */

import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { WS_BASE_URL } from './apiConfig';

type CallbackType = (message: any) => void;

class WebSocketService {
  private stompClient: Client | null = null;
  private connected: boolean = false;
  private currentToken: string | null = null;
  private connectionListeners: (() => void)[] = [];
  private topicListeners: Map<string, Set<CallbackType>> = new Map();
  private activeStompSubscriptions: Map<string, StompSubscription> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private readonly hasExternalSpringUrl: boolean;

  constructor() {
    this.hasExternalSpringUrl = Boolean(
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
      } catch {
        // Ignorar se BroadcastChannel estiver restrito no navegador
      }
    }

    if (!this.hasExternalSpringUrl) {
      this.connected = true;
    }
  }

  /**
   * Inicia ou atualiza a conexão STOMP autenticada com o token JWT do utilizador.
   */
  public connect(token?: string | null) {
    const normalizedToken = token ? token.trim() : null;

    if (!this.hasExternalSpringUrl) {
      this.currentToken = normalizedToken;
      this.connected = true;
      return;
    }

    if (!normalizedToken) {
      this.disconnect();
      return;
    }

    // Se já estiver ligado com o mesmo token JWT, mantém a sessão ativa
    if (this.stompClient && this.stompClient.active && this.currentToken === normalizedToken) {
      return;
    }

    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
      } catch {}
      this.activeStompSubscriptions.clear();
    }

    this.currentToken = normalizedToken;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_BASE_URL) as any,
      connectHeaders: {
        Authorization: `Bearer ${normalizedToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      this.connected = true;
      this.connectionListeners.forEach((listener) => {
        try {
          listener();
        } catch {}
      });
      this.connectionListeners = [];

      // Re-subscreve todos os tópicos ativos após conexão ou reconexão STOMP
      this.topicListeners.forEach((callbacks, destination) => {
        if (callbacks.size > 0) {
          this.ensureStompSubscription(destination);
        }
      });
    };

    this.stompClient.onDisconnect = () => {
      this.connected = false;
      this.activeStompSubscriptions.clear();
    };

    this.stompClient.onStompError = () => {
      this.connected = false;
    };

    this.stompClient.onWebSocketClose = () => {
      this.connected = false;
      this.activeStompSubscriptions.clear();
    };

    this.stompClient.activate();
  }

  /**
   * Encerra a sessão WebSocket STOMP e limpa subscrições remotas no logout.
   */
  public disconnect() {
    this.currentToken = null;
    this.activeStompSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {}
    });
    this.activeStompSubscriptions.clear();

    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
      } catch {}
      this.stompClient = null;
    }

    this.connected = !this.hasExternalSpringUrl;
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
    const listeners = this.topicListeners.get(destination);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(body);
        } catch {}
      });
    }
  }

  /**
   * Subscreve um tópico STOMP/local com suporte seguro a múltiplos ouvintes simultâneos.
   */
  public subscribe(destination: string, callback: CallbackType) {
    if (!this.topicListeners.has(destination)) {
      this.topicListeners.set(destination, new Set());
    }
    const listeners = this.topicListeners.get(destination)!;
    listeners.add(callback);

    if (this.stompClient && this.connected) {
      this.ensureStompSubscription(destination);
    }

    return {
      unsubscribe: () => {
        const currentSet = this.topicListeners.get(destination);
        if (currentSet) {
          currentSet.delete(callback);
          if (currentSet.size === 0) {
            this.topicListeners.delete(destination);
            const stompSub = this.activeStompSubscriptions.get(destination);
            if (stompSub) {
              try {
                stompSub.unsubscribe();
              } catch {}
              this.activeStompSubscriptions.delete(destination);
            }
          }
        }
      },
    };
  }

  private ensureStompSubscription(destination: string) {
    if (!this.stompClient || !this.connected || this.activeStompSubscriptions.has(destination)) {
      return;
    }

    const sub = this.stompClient.subscribe(destination, (stompMessage: IMessage) => {
      try {
        const parsedBody = JSON.parse(stompMessage.body);
        this.dispatchLocalMessage(destination, parsedBody);
      } catch {}
    });

    this.activeStompSubscriptions.set(destination, sub);
  }

  /**
   * Propaga uma mensagem já persistida pela API REST (POST /api/chats/{chatId}/messages)
   * para ouvintes locais e outras abas do navegador sem duplicar a persistência no backend.
   */
  public broadcastPersistedMessage(savedMessage: any) {
    if (!savedMessage) return;

    if (savedMessage.chatId) {
      const chatTopic = `/topic/chats/${savedMessage.chatId}`;
      this.dispatchLocalMessage(chatTopic, savedMessage);
      try {
        this.broadcastChannel?.postMessage({ destination: chatTopic, body: savedMessage });
      } catch {}
    }

    if (savedMessage.recipientId) {
      const recipientTopic = `/topic/messages/${savedMessage.recipientId}`;
      this.dispatchLocalMessage(recipientTopic, savedMessage);
      try {
        this.broadcastChannel?.postMessage({ destination: recipientTopic, body: savedMessage });
      } catch {}
    }
  }

  /**
   * Envia eventos efémeros (ex: indicador de digitação /app/chat.typing) via STOMP.
   */
  public send(destination: string, body: any) {
    if (this.stompClient && this.connected) {
      this.stompClient.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  }
}

export const webSocketService = new WebSocketService();
