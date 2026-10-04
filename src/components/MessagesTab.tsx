import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Chat, Message } from '../types';
import { getApiUrl } from '../apiConfig';
import { Inbox, MessageSquare, Loader2, Send, Sparkles } from 'lucide-react';

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
  onSendMessage,
}: MessagesTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    setAiSuggestions([]);
  }, [selectedChat?.id]);

  const handleLoadAiSuggestions = async () => {
    if (!selectedChat || loadingSuggestions) return;
    setLoadingSuggestions(true);
    const isSeller = selectedChat.sellerId === currentUser?.id;

    try {
      const token = localStorage.getItem('sc_token');
      const res = await fetch(getApiUrl('/api/ai/chat-suggestions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          chatId: selectedChat.id,
          roleContext: isSeller ? 'SELLER' : 'BUYER',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestedReplies || []);
      }
    } catch (e) {
      // Silencioso
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden w-full bg-white">
      {/* Chats Pane List */}
      <div
        className={`w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 ${
          selectedChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Inbox className="h-5 w-5 text-indigo-600" />
            <span>As Minhas Negociações</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conversas diretas com compradores e vendedores
          </p>
        </div>

        {chatsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-50/30">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <span className="text-sm font-bold text-slate-700">Sem negociações ativas</span>
            <p className="text-xs text-slate-400 mt-1">
              Navegue pelos anúncios e clique em contactar vendedor para começar.
            </p>
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
                    isSelected
                      ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50'
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
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {contactName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {new Date(chat.lastMessageTime).toLocaleTimeString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-indigo-600 truncate mt-0.5">
                      {chat.listingTitle}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {chat.lastMessageText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Active Chat Conversation Flow */}
      <div
        className={`flex-1 flex flex-col bg-slate-50 ${
          !selectedChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <motion.div
              key={selectedChat.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Active Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 mr-1 font-bold text-xs cursor-pointer"
                  >
                    ← Voltar
                  </button>

                  <img
                    src={selectedChat.listingImageUrl}
                    alt={selectedChat.listingTitle}
                    className="h-10 w-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {selectedChat.sellerId === currentUser?.id
                        ? selectedChat.buyerName
                        : selectedChat.sellerName}
                    </h3>
                    <p className="text-xs text-indigo-600 font-medium">
                      {selectedChat.listingTitle} ·{' '}
                      <span className="font-mono tabular-nums text-slate-900 font-semibold">
                        {selectedChat.listingPrice.toLocaleString('pt-PT')} Kz
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loadingSuggestions}
                  onClick={handleLoadAiSuggestions}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  {loadingSuggestions ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  )}
                  <span>Sugerir Resposta IA</span>
                </button>
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
                    <p className="text-xs font-bold text-slate-600">Comece a negociar!</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Indique se tem interesse, pergunte sobre o estado ou clique em "Sugerir Resposta IA" acima.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex flex-col max-w-[75%] ${
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <div
                          className={`p-3.5 rounded-xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Sugestões Rápidas do Kuenda AI */}
              <AnimatePresence>
                {aiSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="px-4 py-2.5 bg-slate-100/80 border-t border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold">
                        Sugestões de Negociação Kuenda AI (Clique para usar):
                      </span>
                      <button
                        type="button"
                        onClick={() => setAiSuggestions([])}
                        className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestions.map((reply, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTypedMessage(reply)}
                          className="text-left px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-xs text-slate-800 transition cursor-pointer"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Submission Bar */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={onSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder="Escreva a sua mensagem ou use o assistente IA..."
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={messageSending || !typedMessage.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shrink-0 inline-flex items-center justify-center cursor-pointer"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-slate-50/40"
            >
              <div className="h-14 w-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600 mb-4">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-800">
                Selecione uma Conversa
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Escolha uma conversa no painel esquerdo e utilize as sugestões do Kuenda AI para negociar com rapidez e segurança.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
