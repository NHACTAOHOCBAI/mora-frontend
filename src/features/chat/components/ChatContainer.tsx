import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MapPin, Loader2, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  isDebugMode?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onCitationClick,
  isDebugMode = false,
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
                      if (isDebugMode && isAI && message.promptSent) {
                        setSelectedPrompt(message.promptSent);
                      }
                    }}
                    title={isDebugMode && isAI && message.promptSent ? 'Double click để xem chi tiết prompt đã gửi' : undefined}
                    className={`p-4 rounded-2xl text-sm leading-relaxed border select-text ${
                      isAI
                        ? 'bg-card border-border text-foreground shadow-xs hover:border-primary/30 transition-colors cursor-default'
                        : 'bg-muted border-border/80 text-foreground font-medium'
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold mt-2.5 mb-1.5 text-foreground">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match;
                          return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-muted/80 p-3 rounded-lg font-mono text-xs overflow-x-auto my-2 border border-border">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">
                            {children}
                          </a>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3 border border-border rounded-xl shadow-xs">
                            <table className="w-full border-collapse text-left text-xs">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-muted/80 border-b border-border font-semibold">{children}</thead>,
                        th: ({ children }) => <th className="px-4 py-2.5 font-bold text-foreground border-r border-border last:border-r-0">{children}</th>,
                        td: ({ children }) => <td className="px-4 py-2 border-b border-border/50 border-r border-border/50 last:border-r-0 last:border-b-0 align-top">{children}</td>,
                        tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors last:border-b-0">{children}</tr>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>

                  {isDebugMode && isAI && message.condensedQuestion && (
                    <div className="text-[11px] text-muted-foreground pl-1 italic flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-muted-foreground/80" />
                      <span>Câu hỏi tối ưu: {message.condensedQuestion}</span>
                    </div>
                  )}

                  {/* Citations */}
                  {isAI && message.citations && message.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 pl-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 py-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> Nguồn trích dẫn:
                      </span>
                      {message.citations.map((citation, idx) => {
                        const docId = (citation as any).documentId;
                        const docDisplayName = citation.documentName
                          ? `${citation.documentName} - Trang ${citation.pageNumber}`
                          : docId
                            ? `Tài liệu #${docId} - Trang ${citation.pageNumber}`
                            : `Trang ${citation.pageNumber}`;
                        return (
                          <Button
                            key={idx}
                            onClick={() => onCitationClick(citation.pageNumber, docId)}
                            variant="outline"
                            size="sm"
                            className="h-7 max-w-[240px] sm:max-w-[340px] text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer"
                            title={`Tài liệu: ${citation.documentName || (docId ? `Tài liệu #${docId}` : 'Chưa rõ')} - Trang ${citation.pageNumber}\nTrích dẫn: "${citation.quote}"`}
                          >
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {docDisplayName}
                            </span>
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
