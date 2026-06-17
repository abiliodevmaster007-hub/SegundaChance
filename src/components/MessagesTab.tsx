import React, { useRef, useEffect } from 'react';
import { User, Chat, Message } from '../types';
import { Inbox, MessageSquare, Loader2, Send } from 'lucide-react';

interface MessagesTabProps {
  currentUser: User | null;
  chats: Chat[];
  chatsLoading: boolean;
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
  messages: Message[];
  messagesLoading: boolean;
  typedMessage: string;
  setTypedMessage: (val: string) => void;
  messageSending: boolean;
  onSendMessage: (e: React.FormEvent) => void;
}

export default function MessagesTab({
  currentUser,
  chats,
  chatsLoading,
  selectedChat,
  setSelectedChat,
  messages,
  messagesLoading,
  typedMessage,
  setTypedMessage,
  messageSending,
  onSendMessage
}: MessagesTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll bottom whenever messages list is received or updated
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-1 overflow-hidden w-full bg-white">
      
      {/* Chats Pane List */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 ${
        selectedChat ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="font-display text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <Inbox className="h-5 w-5 text-indigo-600" />
            <span>As Minhas Negociações</span>
          </h2>
          <p className="text-[11px] text-slate-450 font-bold font-mono uppercase tracking-wider mt-0.5">Bate-papo em tempo real com utilizadores</p>
        </div>

        {chatsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-50/30">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <span className="text-sm font-bold text-slate-700">Sem negociações ativas</span>
            <p className="text-xs text-slate-400 mt-1">Navegue pelos anúncios e clique em contactar vendedor para começar.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {chats.map((chat) => {
              const isUserSeller = chat.sellerId === currentUser?.id;
              const contactName = isUserSeller ? chat.buyerName : chat.sellerName;
              const isSelected = selectedChat?.id === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 flex items-center space-x-3 cursor-pointer transition ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={chat.listingImageUrl}
                    alt={chat.listingTitle}
                    className="h-12 w-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-800 truncate">{contactName}</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">
                        {new Date(chat.lastMessageTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-xs font-bold text-indigo-650 truncate mt-0.5">{chat.listingTitle}</p>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{chat.lastMessageText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Active Chat Conversation Flow */}
      <div className={`flex-1 flex flex-col bg-slate-50 ${
        !selectedChat ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedChat ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 mr-1 font-bold text-xs"
                >
                  ← Voltar
                </button>
                
                <img
                  src={selectedChat.listingImageUrl}
                  alt={selectedChat.listingTitle}
                  className="h-10 w-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-150"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {selectedChat.sellerId === currentUser?.id ? selectedChat.buyerName : selectedChat.sellerName}
                  </h3>
                  <p className="text-xs text-indigo-650 font-bold">
                    Artigo: {selectedChat.listingTitle} — <span className="font-mono text-slate-900">{selectedChat.listingPrice.toLocaleString('pt-PT')} Kz</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Message Stream */}
            <div 
              id="chat-messages-scroll"
              className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col"
            >
              {messagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Comece a negociar!</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed font-semibold">
                    Indique se tem interesse, pergunte sobre o estado ou proponha um local público seguro próximo de si.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'} animate-fadeIn`}
                    >
                      <div className={`p-3.5 rounded-xl text-sm font-semibold leading-relaxed ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm shadow-indigo-600/10' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono font-bold mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              {/* Dummy bottom element for auto scrolling */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Submission Bar */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={onSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Escreva a sua mensagem aqui..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 font-semibold"
                />
                <button
                  type="submit"
                  disabled={messageSending || !typedMessage.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shrink-0 inline-flex items-center justify-center cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-450 bg-slate-50/40">
            <div className="h-14 w-14 rounded-full bg-white shadow-sm border border-slate-200/50 flex items-center justify-center text-indigo-500 mb-4">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="font-display text-base font-black text-slate-700 uppercase tracking-tight">Selecione uma Discussão</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-semibold">
              Escolha uma conversa no painel esquerdo para planear a sua troca com o vendedor de forma transparente e segura.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
