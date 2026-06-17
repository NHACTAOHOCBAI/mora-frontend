import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MapPin, Loader2, Search } from 'lucide-react';
import type { Message } from '../types';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onCitationClick: (pageNumber: number, documentId?: number) => void;
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
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50/30 border-r border-slate-200/80 text-slate-800">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-200/80 backdrop-blur-md">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">Trợ Lý Học Tập AI</h2>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sẵn sàng hỗ trợ dựa trên tài liệu
          </p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 animate-bounce">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">Đặt câu hỏi đầu tiên</h3>
              <p className="text-sm text-slate-500 mt-1">
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
                      ? 'bg-white border-slate-200 text-indigo-600 shadow-sm'
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
                        ? 'bg-white border-slate-200/80 text-slate-800 shadow-sm'
                        : 'bg-indigo-600/5 border-indigo-500/10 text-indigo-950 font-medium'
                    }`}
                  >
                    {message.text}
                  </div>
                  
                  {isAI && message.condensedQuestion && (
                    <div className="text-[11px] text-slate-400 pl-1 italic flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Câu hỏi tối ưu: {message.condensedQuestion}</span>
                    </div>
                  )}

                  {/* Citations */}
                  {isAI && message.citations && message.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 pl-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1 py-1">
                        <MapPin className="w-3.5 h-3.5" /> Nguồn trích dẫn:
                      </span>
                      {message.citations.map((citation, idx) => {
                        const docId = (citation as any).documentId;
                        return (
                          <button
                            key={idx}
                            onClick={() => onCitationClick(citation.pageNumber, docId)}
                            title={`"${citation.quote}"`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            {citation.documentName 
                              ? `${citation.documentName} - ` 
                              : docId 
                                ? `Tài liệu #${docId} - ` 
                                : ''
                            }Trang {citation.pageNumber}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-4 max-w-[85%] mr-auto">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-white border-slate-200 text-indigo-600 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-500 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>AI đang phân tích tài liệu...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t border-slate-200/80 backdrop-blur-md flex gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Hỏi bất cứ điều gì về tài liệu này..."
          disabled={isLoading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:scale-100 hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
