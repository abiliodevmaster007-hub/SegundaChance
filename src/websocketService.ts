/**
 * SERVIÇO WEBSOCKET SIMULADO (SegundaChance Angola)
 * 
 * Este ficheiro simula uma ligação WebSocket usando STOMP over SockJS para integração futura com Spring Boot.
 * No ambiente real, use bibliotecas como '@stomp/stompjs' e 'sockjs-client':
 * 
 * Exemplo de conexão futura com Spring Boot:
 * ```typescript
 * import SockJS from 'sockjs-client';
 * import { Client } from '@stomp/stompjs';
 * 
 * const socket = new SockJS('http://localhost:8080/ws');
 * const stompClient = new Client({
 *   webSocketFactory: () => socket,
 *   onConnect: (frame) => {
 *     console.log('Connected: ' + frame);
 *     stompClient.subscribe('/topic/messages/' + userId, (msg) => {
 *       const message = JSON.parse(msg.body);
 *       handleIncomingMessage(message);
 *     });
 *   }
 * });
 * stompClient.activate();
 * ```
 */

import { Message } from './types';

type CallbackType = (message: any) => void;

class WebSocketService {
  private subscriptions: Map<string, CallbackType[]> = new Map();
  private connected: boolean = false;
  private connectionListeners: (() => void)[] = [];

  constructor() {
    // Simula a tentativa de ligação automática
    this.simulateConnection();
  }

  private simulateConnection() {
    setTimeout(() => {
      this.connected = true;
      console.log('[WebSocket] Conectado com sucesso com STOMP over SockJS');
      this.connectionListeners.forEach(listener => listener());
    }, 1000);
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
   * Ponto de Integração Futuro: subscrever a tópicos Spring Boot.
   * Endpoint futuro: stompClient.subscribe('/topic/messages/' + userId, callback)
   */
  public subscribe(destination: string, callback: CallbackType) {
    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, []);
    }
    this.subscriptions.get(destination)!.push(callback);

    console.log(`[WebSocket] Subscrito com sucesso ao canal: ${destination}`);

    // Retorna uma função de des-subscrição
    return {
      unsubscribe: () => {
        const list = this.subscriptions.get(destination);
        if (list) {
          const index = list.indexOf(callback);
          if (index !== -1) {
            list.splice(index, 1);
            console.log(`[WebSocket] Cancelou subscrição do canal: ${destination}`);
          }
        }
      }
    };
  }

  /**
   * Ponto de Integração Futuro: publicar mensagens para o Spring Boot.
   * Endpoint futuro: stompClient.publish({ destination: '/app/chat.send', body: JSON.stringify(message) })
   */
  public send(destination: string, body: any) {
    console.log(`[WebSocket] Mensagem enviada para ${destination} via STOMP:`, body);

    // Se estiver a enviar uma nova mensagem de chat, simula o comportamento do servidor
    if (destination === '/app/chat.send') {
      const incomingMsg = { ...body };
      
      // Simula a difusão do servidor para os destinatários correspondentes
      // No Spring Boot real, a mensagem seria gravada na BD e enviada para /topic/messages/{destid}
      const chatRecipientTopic = `/topic/messages/${incomingMsg.recipientId}`;
      const chatSenderTopic = `/topic/messages/${incomingMsg.senderId}`;

      // Envia imediatamente com delay nulo para o próprio remetente (confirmação visual)
      setTimeout(() => {
        this.emit(chatSenderTopic, incomingMsg);
      }, 100);

      // Simula a recepção pelo outro utilizador recebendo uma notificação/resposta simuladora após 3 segundos
      setTimeout(() => {
        this.emit(chatRecipientTopic, incomingMsg);

        // Se o utilizador comprou ou perguntou algo ao bot/vendedor simulado, gera uma resposta IA ou automática
        this.generateSimulatedReply(incomingMsg);
      }, 1500);
    }
  }

  // Gera uma resposta simulada inteligente do vendedor/comprador
  private generateSimulatedReply(originalMsg: Message) {
    const chatTopic = `/topic/messages/${originalMsg.senderId}`; // vai responder para quem enviou

    const responses = [
      "Olá! Sim, o artigo ainda está disponível em ótimo estado. Podemos combinar no Belas Shopping amanhã?",
      "O preço é ligeiramente negociável. Estaria interessado em fechar por um valor ligeiramente mais baixo?",
      "Excelente! Combinamos uma hora para ver pessoalmente. O que lhe dá mais jeito: de manhã ou à tarde?",
      "Sim, todos os meus artigos são higienizados e autênticos. Pode comprovar pessoalmente durante a troca.",
      "Consigo entregar em mão hoje mesmo na centralidade do Kilamba! O que acha?"
    ];

    const randomResponseText = responses[Math.floor(Math.random() * responses.length)];

    setTimeout(() => {
      const simulatedReply: Message = {
        id: 'reply-' + Math.random().toString(36).substr(2, 9),
        chatId: originalMsg.chatId,
        senderId: originalMsg.recipientId, // O destinatário original agora é quem responde
        recipientId: originalMsg.senderId,
        text: randomResponseText,
        createdAt: new Date().toISOString()
      };

      // Emite no tópico do remetente
      this.emit(chatTopic, simulatedReply);
      console.log('[WebSocket] Resposta simulada enviada para o canal:', chatTopic);
    }, 2000);
  }

  // Dispara localmente as subscrições ativas
  private emit(destination: string, payload: any) {
    const list = this.subscriptions.get(destination);
    if (list) {
      list.forEach(callback => {
        try {
          callback(payload);
        } catch (e) {
          console.error('[WebSocket] Erro ao chamar callback da subscrição:', e);
        }
      });
    }
  }
}

export const webSocketService = new WebSocketService();
