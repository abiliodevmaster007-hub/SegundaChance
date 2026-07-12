/**
 * SERVIÇO WEBSOCKET REAL (SegundaChance Angola)
 * 
 * Este ficheiro implementa uma ligação WebSocket real usando STOMP over SockJS
 * para comunicação bidirecional de alta performance com o backend Spring Boot.
 */

import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { WS_BASE_URL } from './apiConfig';

type CallbackType = (message: any) => void;

class WebSocketService {
  private stompClient: Client;
  private connected: boolean = false;
  private connectionListeners: (() => void)[] = [];
  private pendingSubscriptions: Map<string, CallbackType[]> = new Map();
  private activeSubscriptions: Map<string, any> = new Map();

  constructor() {
    console.log('[WebSocket] Inicializando ligação STOMP real sobre SockJS...');
    
    // Configura o Cliente STOMP do @stomp/stompjs com o SockJS
    this.stompClient = new Client({
      // Como estamos a usar SockJS, omitimos brokerURL e fornecemos a webSocketFactory
      webSocketFactory: () => {
        return new SockJS(WS_BASE_URL) as any;
      },
      reconnectDelay: 5000, // Reconecta automaticamente a cada 5 segundos se cair
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      this.connected = true;
      console.log('[WebSocket] Conectado com sucesso ao Servidor Spring Boot!', frame);
      
      // Executa ouvintes de conexão bem-sucedida
      this.connectionListeners.forEach(listener => {
        try {
          listener();
        } catch (e) {
          console.warn('[WebSocket] Erro ao disparar onConnect callback:', e);
        }
      });
      this.connectionListeners = [];

      // Processa e ativa inscrições que foram solicitadas antes da conexão estar pronta
      this.pendingSubscriptions.forEach((callbacks, destination) => {
        this.subscribeToDestination(destination, callbacks);
      });
      this.pendingSubscriptions.clear();
    };

    this.stompClient.onDisconnect = () => {
      this.connected = false;
      console.log('[WebSocket] Desconectado do Servidor STOMP.');
    };

    this.stompClient.onStompError = (frame) => {
      console.warn('[WebSocket] Erro severo vindo do broker STOMP:', frame.headers['message']);
      console.warn('[WebSocket] Detalhes adicionais do erro:', frame.body);
    };

    this.stompClient.onWebSocketError = (event) => {
      console.warn('[WebSocket] Falha na conexão WebSocket. Verifique se o backend Spring Boot está a correr localmente:', event);
    };

    // Ativa a conexão STOMP
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

  /**
   * Subscrever a tópicos em tempo real do Spring Boot (ex: `/topic/messages/{userId}`).
   */
  public subscribe(destination: string, callback: CallbackType) {
    console.log(`[WebSocket] Registo de subscrição solicitado para: ${destination}`);
    
    if (!this.connected) {
      // Guarda para assinar assim que a conexão se estabelecer
      if (!this.pendingSubscriptions.has(destination)) {
        this.pendingSubscriptions.set(destination, []);
      }
      this.pendingSubscriptions.get(destination)!.push(callback);
      
      return {
        unsubscribe: () => {
          const list = this.pendingSubscriptions.get(destination);
          if (list) {
            const index = list.indexOf(callback);
            if (index !== -1) list.splice(index, 1);
          }
        }
      };
    }

    // Se estiver conectado de imediato, subscreve no broker STOMP
    return this.subscribeToDestination(destination, [callback]);
  }

  private subscribeToDestination(destination: string, callbacks: CallbackType[]) {
    // Subscreve e captura o token de subscrição
    const subscription = this.stompClient.subscribe(destination, (stompMessage: IMessage) => {
      try {
        const parsedBody = JSON.parse(stompMessage.body);
        callbacks.forEach(cb => cb(parsedBody));
      } catch (e) {
        console.warn('[WebSocket] Erro ao processar mensagem recebida no tópico:', destination, e);
      }
    });

    // Mapeia para permitir des-subscrição futura
    this.activeSubscriptions.set(destination, subscription);

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
        this.activeSubscriptions.delete(destination);
        console.log(`[WebSocket] Removida subscrição ativa do canal: ${destination}`);
      }
    };
  }

  /**
   * Publicar mensagens em canais Spring Boot (ex: `/app/chat.send`).
   */
  public send(destination: string, body: any) {
    if (!this.connected) {
      console.warn('[WebSocket] Tentativa de envio falhou: Não conectado ao servidor de WebSockets.');
      return;
    }

    console.log(`[WebSocket] Enviando para ${destination} via STOMP:`, body);
    
    this.stompClient.publish({
      destination: destination,
      body: JSON.stringify(body)
    });
  }
}

export const webSocketService = new WebSocketService();
