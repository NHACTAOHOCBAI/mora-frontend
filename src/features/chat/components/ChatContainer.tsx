import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MapPin, Loader2 } from 'lucide-react';
import type { Message } from '../types';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onCitationClick: (pageNumber: number) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onCitationClick,
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-950/60 border-b border-slate-800 backdrop-blur-md">
        <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/20">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-100">Trợ Lý Học Tập AI</h2>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sẵn sàng hỗ trợ dựa trên tài liệu
          </p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-full border border-slate-700/50 text-indigo-400 animate-bounce">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-slate-200">Đặt câu hỏi đầu tiên</h3>
              <p className="text-sm text-slate-400 mt-1">
                Nhập câu hỏi của bạn ở bên dưới. AI sẽ chỉ trả lời các thông tin tìm thấy trong ngữ cảnh của tài liệu này.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isAI = message.sender === 'assistant';
            return (
              <div
                key={message.id}
                className={`flex gap-4 max-w-[85%] ${
                  isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                    isAI
                      ? 'bg-slate-950 border-slate-800 text-indigo-400'
                      : 'bg-indigo-600 border-indigo-500 text-white'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                      isAI
                        ? 'bg-slate-950/40 border-slate-800 text-slate-200'
                        : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-100'
                    }`}
                  >
                    {message.text}
                  </div>

                  {/* Citations */}
                  {isAI && message.citations && message.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 pl-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1 py-1">
                        <MapPin className="w-3.5 h-3.5" /> Nguồn trích dẫn:
                      </span>
                      {message.citations.map((citation, idx) => (
                        <button
                          key={idx}
                          onClick={() => onCitationClick(citation.pageNumber)}
                          title={`"${citation.quote}"`}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          📍 Trang {citation.pageNumber}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-4 max-w-[85%] mr-auto">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-slate-950 border-slate-800 text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>AI đang phân tích tài liệu...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-slate-950/60 border-t border-slate-800 backdrop-blur-md flex gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Hỏi bất cứ điều gì về tài liệu này..."
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:scale-100 hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
