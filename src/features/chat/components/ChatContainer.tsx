import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  MapPin,
  Loader2,
  Search,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

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
  onSendGroupMessage?: (text: string) => void;
  isLoading: boolean;
  onCitationClick: (pageNumber: number, documentId?: number) => void;
  isDebugMode?: boolean;
  selectedDocCount?: number;
  totalDocCount?: number;
  currentUserId?: number;
  typingUsers?: string[];
  onTyping?: (typing: boolean) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  onSendGroupMessage,
  isLoading,
  onCitationClick,
  isDebugMode = false,
  selectedDocCount = 0,
  totalDocCount = 0,
  currentUserId,
  typingUsers = [],
  onTyping,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Xử lý gửi sự kiện typing khi người dùng gõ
  const handleTypingEvent = () => {
    if (!onTyping) return;
    onTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2500);
  };

  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.(false);
  };

  // Kiểm tra điều kiện kích hoạt gợi ý @Mora
  const checkMentionTrigger = (value: string, selectionEnd: number | null) => {
    const cursorPos = selectionEnd !== null ? selectionEnd : value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z]*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      if ('mora'.startsWith(query) || 'ai'.startsWith(query)) {
        setShowAiSuggestion(true);
        setSuggestionIndex(0);
        return;
      }
    }
    setShowAiSuggestion(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    checkMentionTrigger(value, e.target.selectionStart);
    handleTypingEvent();
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    checkMentionTrigger(inputValue, (e.target as HTMLInputElement).selectionStart);
  };

  // Tự động hoàn thành @Mora khi người dùng chọn
  const handleSelectAiMention = () => {
    const input = inputRef.current;
    if (!input) {
      setInputValue('@Mora ');
      setShowAiSuggestion(false);
      return;
    }
    const cursorPos = input.selectionStart ?? inputValue.length;
    const textBeforeCursor = inputValue.slice(0, cursorPos);
    const textAfterCursor = inputValue.slice(cursorPos);

    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@\w*$/);
    if (mentionMatch) {
      const matchIndex = mentionMatch.index! + (mentionMatch[0].startsWith(' ') ? 1 : 0);
      const newTextBefore = textBeforeCursor.slice(0, matchIndex) + '@Mora ';
      const newInputValue = newTextBefore + textAfterCursor;
      setInputValue(newInputValue);
      setShowAiSuggestion(false);

      setTimeout(() => {
        input.focus();
        const newCursorPos = newTextBefore.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setInputValue('@Mora ' + inputValue);
      setShowAiSuggestion(false);
      input.focus();
    }
  };

  // Helper kiểm tra tin nhắn có trigger hỏi AI không (@Mora hoặc @AI)
  const isAiTriggerMessage = (text: string) => {
    const lower = text.trim().toLowerCase();
    return lower.startsWith('@mora') || lower.startsWith('@ai');
  };

  // Gửi tin nhắn kích hoạt AI
  const handleSendToAi = () => {
    if (!inputValue.trim() || isLoading) return;
    handleStopTyping();
    setShowAiSuggestion(false);
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  // Gửi tin nhắn trao đổi nhóm (người-người)
  const handleSendToGroup = () => {
    if (!inputValue.trim()) return;
    handleStopTyping();
    setShowAiSuggestion(false);

    // Nếu người dùng gõ @Mora hoặc @AI ở đầu câu, tự động chuyển sang chế độ hỏi AI
    if (isAiTriggerMessage(inputValue)) {
      handleSendToAi();
      return;
    }

    if (onSendGroupMessage) {
      onSendGroupMessage(inputValue.trim());
    } else {
      onSendMessage(inputValue.trim());
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Xử lý khi popup gợi ý @Mora đang hiển thị
    if (showAiSuggestion) {
      if (e.key === 'Tab') {
        e.preventDefault();
        handleSelectAiMention();
        return;
      }
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        const cursorPos = inputRef.current?.selectionStart ?? inputValue.length;
        const textBeforeCursor = inputValue.slice(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z]*)$/);
        // Nếu vừa gõ @ hoặc @m, @mo (chưa hoàn thiện câu hỏi dài), nhấn Enter sẽ tự động chọn @Mora
        if (mentionMatch && mentionMatch[1].length < 4) {
          e.preventDefault();
          handleSelectAiMention();
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAiSuggestion(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl + Enter -> Hỏi AI
        e.preventDefault();
        handleSendToAi();
      } else {
        // Enter thuần -> Gửi tin nhắn nhóm hoặc hỏi AI nếu có @Mora / @AI
        e.preventDefault();
        if (isAiTriggerMessage(inputValue)) {
          handleSendToAi();
        } else if (onSendGroupMessage) {
          handleSendToGroup();
        } else {
          handleSendToAi();
        }
      }
    }
  };

  const handleInsertAtMora = () => {
    if (!inputValue.startsWith('@Mora ') && !inputValue.startsWith('@AI ')) {
      setInputValue('@Mora ' + inputValue);
    }
    setShowAiSuggestion(false);
    inputRef.current?.focus();
  };

  const handleCopyText = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép nội dung vào clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const scopeLabel =
    selectedDocCount > 0 && selectedDocCount < totalDocCount
      ? `Đang chọn ${selectedDocCount}/${totalDocCount} tài liệu`
      : 'Toàn bộ tài liệu Space';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-muted/10 border-r border-border text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-card border-b border-border/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground text-sm">Hội Thoại Không Gian</h2>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary font-medium">
                {scopeLabel}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Chat nhóm đa người dùng & Trợ lý RAG minh bạch
            </p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-card rounded-2xl border border-border text-muted-foreground shadow-sm animate-bounce">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Bắt đầu hội thoại trong Không gian</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Nhắn tin trao đổi tự do giữa các thành viên, hoặc gõ{' '}
                <span className="font-semibold text-primary font-mono">@Mora</span> (hoặc bấm nút{' '}
                <span className="font-semibold text-primary">✨ Hỏi AI</span>) để AI tra cứu tài liệu và trả lời trích dẫn minh bạch cho cả nhóm.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isAI = message.sender === 'assistant';
            const isAiQuery = message.messageType === 'AI_QUERY' || isAiTriggerMessage(message.text);
            const isUserMsg = !isAI && !isAiQuery;
            const isSelf = currentUserId && message.userId === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex gap-3.5 max-w-[88%] ${
                  isAI
                    ? 'mr-auto'
                    : isSelf
                      ? 'ml-auto flex-row-reverse'
                      : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <Avatar className="w-8 h-8 border border-border shrink-0 mt-0.5 shadow-xs">
                  {isAI ? (
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={message.userAvatar} />
                      <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
                        {message.userName ? message.userName.substring(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                {/* Bubble Container */}
                <div className={`space-y-1.5 max-w-full flex flex-col ${isSelf && !isAI ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name & Type Header */}
                  <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {isAI ? 'Trợ Lý AI Mora' : message.userName || 'Thành viên'}
                    </span>
                    {isAiQuery && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0 h-4 font-semibold gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Hỏi @Mora
                      </Badge>
                    )}
                    {isUserMsg && (
                      <span className="text-[10px] text-muted-foreground">trao đổi nhóm</span>
                    )}
                    <span className="text-[10px] text-muted-foreground/70">
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {/* Main Bubble */}
                  <div
                    onDoubleClick={() => {
                      if (isDebugMode && isAI && message.promptSent) {
                        setSelectedPrompt(message.promptSent);
                      }
                    }}
                    title={isDebugMode && isAI && message.promptSent ? 'Double click để xem chi tiết prompt đã gửi' : undefined}
                    className={`p-4 rounded-2xl text-xs leading-relaxed border select-text relative group ${
                      isAI
                        ? 'bg-card border-border text-foreground shadow-xs hover:border-primary/30 transition-colors'
                        : isAiQuery
                          ? 'bg-primary/5 border-primary/20 text-foreground font-medium'
                          : isSelf
                            ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
                            : 'bg-card border-border text-foreground'
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        h1: ({ children }) => <h1 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xs font-bold mt-2.5 mb-1.5 text-foreground">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match;
                          return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-primary" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-muted p-3 rounded-lg font-mono text-[11px] overflow-x-auto my-2 border border-border">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3 border border-border rounded-xl shadow-xs">
                            <table className="w-full border-collapse text-left text-[11px]">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-muted/80 border-b border-border font-semibold">{children}</thead>,
                        th: ({ children }) => <th className="px-3 py-2 font-bold text-foreground border-r border-border last:border-r-0">{children}</th>,
                        td: ({ children }) => <td className="px-3 py-1.5 border-b border-border/50 border-r border-border/50 last:border-r-0 last:border-b-0 align-top">{children}</td>,
                        tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors last:border-b-0">{children}</tr>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>

                    {/* Copy text action */}
                    {isAI && (
                      <button
                        onClick={() => handleCopyText(message.id, message.text)}
                        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all text-muted-foreground cursor-pointer"
                        title="Sao chép nội dung câu trả lời"
                      >
                        {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {isDebugMode && isAI && message.condensedQuestion && (
                    <div className="text-[10px] text-muted-foreground pl-1 italic flex items-center gap-1">
                      <Search className="w-3 h-3 text-muted-foreground/80" />
                      <span>Truy vấn tối ưu: {message.condensedQuestion}</span>
                    </div>
                  )}

                  {/* Citations */}
                  {isAI && message.citations && message.citations.length > 0 && (() => {
                    const uniqueCitationsMap = new Map<string, {
                      pageNumber: number;
                      documentId?: number;
                      documentName?: string;
                      quotes: string[];
                    }>();

                    message.citations.forEach((citation) => {
                      const docId = (citation as any).documentId;
                      const docName = citation.documentName;
                      const pageNum = citation.pageNumber;
                      const key = `${docId || docName || 'doc'}_${pageNum}`;

                      const existing = uniqueCitationsMap.get(key);
                      if (!existing) {
                        uniqueCitationsMap.set(key, {
                          pageNumber: pageNum,
                          documentId: docId,
                          documentName: docName,
                          quotes: citation.quote ? [citation.quote] : [],
                        });
                      } else {
                        if (citation.quote && !existing.quotes.includes(citation.quote)) {
                          existing.quotes.push(citation.quote);
                        }
                      }
                    });

                    const uniqueCitations = Array.from(uniqueCitationsMap.values());
                    if (uniqueCitations.length === 0) return null;

                    return (
                      <div className="flex flex-wrap gap-1.5 pt-0.5 pl-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 py-1 font-medium">
                          <MapPin className="w-3 h-3 shrink-0" /> Nguồn trích dẫn:
                        </span>
                        {uniqueCitations.map((citation, idx) => {
                          const docId = citation.documentId;
                          const docDisplayName = citation.documentName
                            ? `${citation.documentName} - Trang ${citation.pageNumber}`
                            : docId
                              ? `Tài liệu #${docId} - Trang ${citation.pageNumber}`
                              : `Trang ${citation.pageNumber}`;
                          const quotesText = citation.quotes.join('\n---\n');

                          return (
                            <Button
                              key={idx}
                              onClick={() => onCitationClick(citation.pageNumber, docId)}
                              variant="outline"
                              size="sm"
                              className="h-6 max-w-[260px] text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer bg-card hover:border-primary hover:text-primary"
                              title={`Tài liệu: ${citation.documentName || (docId ? `Tài liệu #${docId}` : 'Chưa rõ')} - Trang ${citation.pageNumber}${quotesText ? `\nTrích dẫn:\n"${quotesText}"` : ''}`}
                            >
                              <MapPin className="w-2.5 h-2.5 text-primary shrink-0" />
                              <span className="truncate">{docDisplayName}</span>
                            </Button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3.5 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-card border-border text-foreground shadow-xs shrink-0">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-2xl text-xs text-muted-foreground shadow-xs animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>AI đang truy xuất tài liệu và tổng hợp câu trả lời...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Dual Input Form (Group Chat & @AI Trigger) */}
      <div className="p-4 bg-card border-t border-border backdrop-blur-md flex flex-col gap-2 shrink-0 relative">
        {/* Autocomplete Mention Popup for @Mora */}
        {showAiSuggestion && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute bottom-[calc(100%+8px)] left-4 z-40 w-80 bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/50 pb-1 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Gợi ý nhắc tên
              </span>
              <span className="text-[9px] lowercase font-normal">
                Nhấn <kbd className="px-1 py-0.5 bg-muted rounded border text-[8px] font-mono">Tab</kbd> hoặc <kbd className="px-1 py-0.5 bg-muted rounded border text-[8px] font-mono">Enter</kbd>
              </span>
            </div>

            <div
              onClick={handleSelectAiMention}
              onMouseEnter={() => setSuggestionIndex(0)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                suggestionIndex === 0
                  ? 'bg-primary/15 border border-primary/30 text-foreground'
                  : 'hover:bg-muted/60 text-muted-foreground'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30 shadow-xs">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-primary">@Mora</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0 h-4 font-semibold">
                    Trợ lý Mora RAG
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  Hỏi đáp & tra cứu tài liệu chung của Không gian
                </p>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono bg-muted/80 px-1.5 py-0.5 rounded border border-border shrink-0">
                Tab ↵
              </div>
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-1 text-[11px] text-primary animate-in fade-in slide-in-from-bottom-1 duration-150">
            <span className="flex gap-1 items-center py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
            </span>
            <span className="italic font-medium text-[11px]">
              {typingUsers.join(', ')} đang soạn tin nhắn...
            </span>
          </div>
        )}

        {/* Quick Helper Chips */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInsertAtMora}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              Gõ @Mora để hỏi tài liệu
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            <kbd className="px-1 py-0.5 bg-muted rounded border text-[9px] font-mono">Enter</kbd> Gửi nhóm •{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded border text-[9px] font-mono">Ctrl+Enter</kbd> Hỏi AI
          </span>
        </div>

        {/* Input & Action Buttons */}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin cho nhóm... hoặc gõ @ để chọn @Mora hỏi tài liệu"
            disabled={isLoading}
            className="flex-1 h-10 text-xs bg-muted/20 border-border"
          />

          {/* Button 1: Gửi tin nhắn nhóm */}
          <Button
            type="button"
            onClick={handleSendToGroup}
            disabled={!inputValue.trim() || isLoading}
            variant="outline"
            className="h-10 px-3.5 gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
            title="Gửi tin nhắn trao đổi cho nhóm (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gửi nhóm</span>
          </Button>

          {/* Button 2: ✨ Hỏi AI (RAG Trigger) */}
          <Button
            type="button"
            onClick={handleSendToAi}
            disabled={!inputValue.trim() || isLoading}
            className="h-10 px-3.5 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0 shadow-sm"
            title="Kích hoạt Trợ lý AI tra cứu tài liệu nhóm (Ctrl + Enter)"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Hỏi AI</span>
          </Button>
        </div>
      </div>

      {/* Debug Dialog for prompt */}
      <Dialog open={selectedPrompt !== null} onOpenChange={(open) => !open && setSelectedPrompt(null)}>
        <DialogContent className="sm:max-w-[700px] w-[90vw] bg-card text-foreground border-border max-h-[85vh] flex flex-col p-6 rounded-2xl shadow-2xl z-50">
          <DialogHeader className="border-b border-border pb-3 flex flex-col">
            <DialogTitle className="text-sm font-bold text-foreground">
              Chi tiết Prompt gửi tới Gemini AI
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[11px] mt-1">
              Nội dung System Prompt và ngữ cảnh trích xuất từ tài liệu
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
