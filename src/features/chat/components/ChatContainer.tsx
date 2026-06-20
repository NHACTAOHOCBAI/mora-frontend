import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MapPin, Loader2, Search } from 'lucide-react';
import type { Message } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const renderPromptContent = (promptText: string) => {
  if (!promptText) return null;
  const imgRegex = /<img\s+src="([^"]+)"\s*\/?>/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = imgRegex.exec(promptText)) !== null) {
    const textBefore = promptText.substring(lastIndex, match.index);
    if (textBefore) {
      elements.push(<span key={`text-${lastIndex}`}>{textBefore}</span>);
    }

    const imgSrc = match[1];
    elements.push(
      <div key={`img-${match.index}`} className="my-3 p-2 bg-muted rounded-lg border border-border block max-w-full">
        <img src={imgSrc} alt="Prompt Attachment" className="max-h-[200px] max-w-full object-contain rounded-md" />
      </div>
    );

    lastIndex = imgRegex.lastIndex;
  }

  const textAfter = promptText.substring(lastIndex);
  if (textAfter) {
    elements.push(<span key={`text-${lastIndex}`}>{textAfter}</span>);
  }

  return elements;
};

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
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
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
    <div className="flex flex-col flex-1 min-h-0 bg-muted/20 border-r border-border text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border/80 backdrop-blur-md">
        <div className="p-2 bg-muted text-foreground rounded-lg border border-border">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Trợ Lý Học Tập AI</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sẵn sàng hỗ trợ dựa trên tài liệu
          </p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-muted rounded-full border border-border text-foreground animate-bounce">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Đặt câu hỏi đầu tiên</h3>
              <p className="text-sm text-muted-foreground mt-1">
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
                className={`flex gap-4 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                    isAI ? 'bg-card border-border text-foreground shadow-xs' : 'bg-primary border-primary text-primary-foreground'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-2 max-w-full">
                  <div
                    onDoubleClick={() => {
                      if (isAI && message.promptSent) {
                        setSelectedPrompt(message.promptSent);
                      }
                    }}
                    title={isAI && message.promptSent ? 'Double click để xem chi tiết prompt đã gửi' : undefined}
                    className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                      isAI
                        ? 'bg-card border-border text-foreground shadow-xs hover:border-primary/30 transition-colors select-none cursor-pointer'
                        : 'bg-muted border-border/80 text-foreground font-medium'
                    }`}
                  >
                    {message.text}
                  </div>

                  {isAI && message.condensedQuestion && (
                    <div className="text-[11px] text-muted-foreground pl-1 italic flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-muted-foreground/80" />
                      <span>Câu hỏi tối ưu: {message.condensedQuestion}</span>
                    </div>
                  )}

                  {isAI && message.promptSent && (
                    <div className="flex pl-1">
                      <div className="relative group">
                        <button
                          type="button"
                          className="text-[11px] text-muted-foreground hover:text-foreground font-semibold cursor-help flex items-center gap-1 transition-colors"
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center text-[9px] font-bold">
                            i
                          </span>
                          Xem Prompt gửi Gemini
                        </button>

                        {/* Custom Hover Card */}
                        <div className="absolute left-0 bottom-6 hidden group-hover:flex flex-col w-[350px] sm:w-[480px] p-4 bg-card text-foreground rounded-xl shadow-xl border border-border text-left z-50">
                          <div className="text-xs font-bold mb-2 border-b border-border pb-1.5 text-foreground flex items-center justify-between">
                            <span>Nội dung thực tế gửi tới Gemini:</span>
                            <span className="text-[9px] text-muted-foreground font-mono">1.5 Flash</span>
                          </div>
                          <div className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted pr-1 select-text">
                            {renderPromptContent(message.promptSent)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Citations */}
                  {isAI && message.citations && message.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 pl-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 py-1">
                        <MapPin className="w-3.5 h-3.5" /> Nguồn trích dẫn:
                      </span>
                      {message.citations.map((citation, idx) => {
                        const docId = (citation as any).documentId;
                        return (
                          <Button
                            key={idx}
                            onClick={() => onCitationClick(citation.pageNumber, docId)}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer"
                            title={`"${citation.quote}"`}
                          >
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {citation.documentName
                              ? `${citation.documentName} - `
                              : docId
                                ? `Tài liệu #${docId} - `
                                : ''}
                            Trang {citation.pageNumber}
                          </Button>
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-card border-border text-foreground shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-2xl text-sm text-muted-foreground shadow-xs animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-foreground" />
              <span>AI đang phân tích tài liệu...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-card border-t border-border backdrop-blur-md flex gap-2"
      >
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Hỏi bất cứ điều gì về tài liệu này..."
          disabled={isLoading}
          className="flex-1 h-10"
        />
        <Button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          size="icon"
          className="h-10 w-10 shrink-0 cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <Dialog open={selectedPrompt !== null} onOpenChange={(open) => !open && setSelectedPrompt(null)}>
        <DialogContent className="sm:max-w-[700px] w-[90vw] bg-card text-foreground border-border max-h-[85vh] flex flex-col p-6 rounded-2xl shadow-2xl z-50">
          <DialogHeader className="border-b border-border pb-3 flex flex-col">
            <DialogTitle className="text-sm font-bold text-foreground">
              Chi tiết Prompt gửi tới Gemini (1.5 Flash)
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[11px] mt-1">
              Nội dung đầy đủ của System Prompt và User Message chứa ngữ cảnh tài liệu
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-1 select-text">
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed bg-muted p-4 rounded-xl border border-border max-h-[50vh] overflow-y-auto">
              {renderPromptContent(selectedPrompt || '')}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
