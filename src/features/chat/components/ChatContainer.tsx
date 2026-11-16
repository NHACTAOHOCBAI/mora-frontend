import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import {
  ArrowUp,
  FileText,
  ChevronDown,
  Bot,
  User,
  MapPin,
  Loader2,
  Search,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message, Citation } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentResponse } from "../services/document-api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { canGroupMessages, getMessageKind } from "../utils/message-grouping";

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
      <div
        key={`img-${match.index}`}
        className="my-3 p-2 bg-muted rounded-lg border border-border block max-w-full"
      >
        <img
          src={imgSrc}
          alt="Prompt Attachment"
          className="max-h-[200px] max-w-full object-contain rounded-md"
        />
      </div>,
    );

    lastIndex = imgRegex.lastIndex;
  }

  const textAfter = promptText.substring(lastIndex);
  if (textAfter) {
    elements.push(<span key={`text-${lastIndex}`}>{textAfter}</span>);
  }

  return elements;
};

interface MemoizedMessageItemProps {
  message: Message;
  isAI: boolean;
  isAiQuery: boolean;
  isSelf: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  isDebugMode?: boolean;
  copiedId: number | null;
  onCitationClick: (pageNumber: number, documentId?: number) => void;
  handleCopyText: (id: number, text: string) => void;
  setSelectedPrompt: (prompt: string | null) => void;
}

const MemoizedMessageItem = React.memo(
  ({
    message,
    isAI,
    isAiQuery,
    isSelf,
    isGroupStart,
    isGroupEnd,
    isDebugMode,
    copiedId,
    onCitationClick,
    handleCopyText,
    setSelectedPrompt,
  }: MemoizedMessageItemProps) => {
    const [showTimestamp, setShowTimestamp] = useState(false);
    const timestampId = useId();
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const timestamp = new Date(message.timestamp);
    const hasTimestamp = Number.isFinite(timestamp.getTime());
    const timeLabel = hasTimestamp
      ? timestamp.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const fullTimeLabel = hasTimestamp ? timestamp.toLocaleString("vi-VN") : "";
    return (
      <div
        key={message.id}
        data-message-id={message.id}
        data-group-start={isGroupStart}
        data-group-end={isGroupEnd}
        className={cn(
          "flex items-end gap-2 max-w-[88%]",
          isSelf && !isAI ? "ml-auto justify-end" : "mr-auto",
        )}
      >
        {(!isSelf || isAI) && (
          <div
            className="w-8 shrink-0"
            data-message-avatar={isGroupEnd || isAI ? "visible" : "placeholder"}
          >
            {(isGroupEnd || isAI) && (
              <Avatar className="w-8 h-8 border border-border shadow-xs">
                {isAI ? (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage
                      src={message.userAvatar}
                      alt={message.userName || "Thành viên"}
                    />
                    <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
                      {message.userName ? (
                        message.userName.substring(0, 2).toUpperCase()
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
            )}
          </div>
        )}

        {/* Bubble Container */}
        <div
          className={`gap-1 min-w-0 max-w-full flex flex-col ${isSelf && !isAI ? "items-end" : "items-start"}`}
        >
          {isGroupStart && (!isSelf || isAI || isAiQuery) && (
            <div className="flex flex-wrap items-center gap-2 px-1 text-[11px] text-muted-foreground">
              {(!isSelf || isAI) && (
                <span>
                  {isAI ? "Trợ lý AI Mora" : message.userName || "Thành viên"}
                </span>
              )}
              {isAiQuery && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0 h-4 font-semibold gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Hỏi Mora
                </Badge>
              )}
            </div>
          )}

          {/* Keep the bubble selectable and its nested links/buttons interactive. */}
          <Tooltip disabled={!hasTimestamp || showTimestamp}>
            <TooltipTrigger
              render={<div />}
              tabIndex={0}
              aria-describedby={
                hasTimestamp
                  ? `${timestampId}${showTimestamp ? "-touch" : ""}`
                  : undefined
              }
              onPointerDown={(event) => {
                touchStart.current =
                  event.pointerType === "touch"
                    ? { x: event.clientX, y: event.clientY }
                    : null;
              }}
              onPointerUp={(event) => {
                const start = touchStart.current;
                touchStart.current = null;
                if (event.pointerType !== "touch" || !start || !hasTimestamp)
                  return;
                if (
                  Math.hypot(event.clientX - start.x, event.clientY - start.y) >
                  8
                )
                  return;
                if (
                  (event.target as HTMLElement).closest("a,button,input") ||
                  window.getSelection()?.toString()
                )
                  return;
                setShowTimestamp((value) => !value);
              }}
              onPointerCancel={() => {
                touchStart.current = null;
              }}
              onDoubleClick={() => {
                if (isDebugMode && isAI && message.promptSent) {
                  setSelectedPrompt(message.promptSent);
                }
              }}
              title={
                isDebugMode && isAI && message.promptSent
                  ? "Double click để xem chi tiết prompt đã gửi"
                  : undefined
              }
              className={`px-3 py-2 rounded-2xl text-xs leading-5 border select-text relative group max-w-full break-words focus-visible:outline-2 focus-visible:outline-ring ${
                isAI
                  ? "bg-card border-border text-foreground shadow-xs hover:border-primary/30 transition-colors"
                  : isAiQuery
                    ? "bg-primary/5 border-primary/20 text-foreground font-medium"
                    : isSelf
                      ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                      : "bg-card border-border text-foreground"
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-5">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-sm font-bold mt-3 mb-1.5 text-foreground">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xs font-bold mt-2.5 mb-1.5 text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xs font-semibold mt-2 mb-1 text-foreground">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;
                    return isInline ? (
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-primary"
                        {...props}
                      >
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
                  thead: ({ children }) => (
                    <thead className="bg-muted/80 border-b border-border font-semibold">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 font-bold text-foreground border-r border-border last:border-r-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-1.5 border-b border-border/50 border-r border-border/50 last:border-r-0 last:border-b-0 align-top">
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-muted/30 transition-colors last:border-b-0">
                      {children}
                    </tr>
                  ),
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
                  {copiedId === message.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </TooltipTrigger>
            <TooltipContent id={timestampId} role="tooltip">
              {fullTimeLabel}
            </TooltipContent>
          </Tooltip>
          {showTimestamp && hasTimestamp && (
            <time
              id={`${timestampId}-touch`}
              dateTime={timestamp.toISOString()}
              className="text-[10px] text-muted-foreground px-1"
            >
              {timeLabel}
            </time>
          )}

          {isDebugMode && isAI && message.condensedQuestion && (
            <div className="text-[10px] text-muted-foreground pl-1 italic flex items-center gap-1">
              <Search className="w-3 h-3 text-muted-foreground/80" />
              <span>Truy vấn tối ưu: {message.condensedQuestion}</span>
            </div>
          )}

          {/* Citations */}
          {isAI &&
            message.citations &&
            message.citations.length > 0 &&
            (() => {
              const uniqueCitationsMap = new Map<
                string,
                {
                  pageNumber: number;
                  documentId?: number;
                  documentName?: string;
                  quotes: string[];
                }
              >();

              message.citations.forEach((citation: Citation) => {
                const docId = citation.documentId;
                const docName = citation.documentName;
                const pageNum = citation.pageNumber;
                const key = `${docId || docName || "doc"}_${pageNum}`;

                const existing = uniqueCitationsMap.get(key);
                if (!existing) {
                  uniqueCitationsMap.set(key, {
                    pageNumber: pageNum,
                    documentId: docId,
                    documentName: docName,
                    quotes: citation.quote ? [citation.quote] : [],
                  });
                } else {
                  if (
                    citation.quote &&
                    !existing.quotes.includes(citation.quote)
                  ) {
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
                    const quotesText = citation.quotes.join("\n---\n");

                    return (
                      <Button
                        key={idx}
                        onClick={() =>
                          onCitationClick(citation.pageNumber, docId)
                        }
                        variant="outline"
                        size="sm"
                        className="h-6 max-w-[260px] text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer bg-card hover:border-primary hover:text-primary"
                        title={`Tài liệu: ${citation.documentName || (docId ? `Tài liệu #${docId}` : "Chưa rõ")} - Trang ${citation.pageNumber}${quotesText ? `\nTrích dẫn:\n"${quotesText}"` : ""}`}
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
  },
  (prevProps, nextProps) =>
    prevProps.message === nextProps.message &&
    prevProps.copiedId === nextProps.copiedId &&
    prevProps.isDebugMode === nextProps.isDebugMode &&
    prevProps.isAI === nextProps.isAI &&
    prevProps.isAiQuery === nextProps.isAiQuery &&
    prevProps.isSelf === nextProps.isSelf &&
    prevProps.isGroupStart === nextProps.isGroupStart &&
    prevProps.isGroupEnd === nextProps.isGroupEnd &&
    prevProps.onCitationClick === nextProps.onCitationClick &&
    prevProps.handleCopyText === nextProps.handleCopyText &&
    prevProps.setSelectedPrompt === nextProps.setSelectedPrompt,
);

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
  membersCount?: number;
  documents?: DocumentResponse[];
  selectedDocumentIds?: number[];
  onToggleDocument?: (id: number) => void;
  onToggleAllDocuments?: () => void;
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
  membersCount = 1,
  documents = [],
  selectedDocumentIds = [],
  onToggleDocument,
  onToggleAllDocuments,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<"ai" | "group">("ai");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if ("mora".startsWith(query) || "ai".startsWith(query)) {
        setShowAiSuggestion(true);
        return;
      }
    }
    setShowAiSuggestion(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    checkMentionTrigger(value, e.target.selectionStart);
    handleTypingEvent();
  };

  const handleInputClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    checkMentionTrigger(
      inputValue,
      (e.target as HTMLTextAreaElement).selectionStart,
    );
  };

  // Tự động hoàn thành @Mora khi người dùng chọn
  const handleSelectAiMention = () => {
    const input = inputRef.current;
    if (!input) {
      setInputValue("@Mora ");
      setShowAiSuggestion(false);
      return;
    }
    const cursorPos = input.selectionStart ?? inputValue.length;
    const textBeforeCursor = inputValue.slice(0, cursorPos);
    const textAfterCursor = inputValue.slice(cursorPos);

    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@\w*$/);
    if (mentionMatch) {
      const matchIndex =
        mentionMatch.index! + (mentionMatch[0].startsWith(" ") ? 1 : 0);
      const newTextBefore = textBeforeCursor.slice(0, matchIndex) + "@Mora ";
      const newInputValue = newTextBefore + textAfterCursor;
      setInputValue(newInputValue);
      setShowAiSuggestion(false);

      setTimeout(() => {
        input.focus();
        const newCursorPos = newTextBefore.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setInputValue("@Mora " + inputValue);
      setShowAiSuggestion(false);
      input.focus();
    }
  };

  // Helper kiểm tra tin nhắn có trigger hỏi AI không (@Mora hoặc @AI)
  const isAiTriggerMessage = (text: string) => {
    if (membersCount === 1) return true; // Luôn gọi AI nếu chỉ có 1 mình
    const lower = text.trim().toLowerCase();
    return lower.startsWith("@mora") || lower.startsWith("@ai");
  };

  // Gửi tin nhắn kích hoạt AI
  const handleSendToAi = () => {
    if (!inputValue.trim() || isLoading) return;
    handleStopTyping();
    setShowAiSuggestion(false);
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  // Gửi tin nhắn trao đổi nhóm (người-người)
  const handleSendToGroup = () => {
    if (!inputValue.trim() || isLoading) return;
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
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.shiftKey) return;
    // Xử lý khi popup gợi ý @Mora đang hiển thị
    if (showAiSuggestion) {
      if (e.key === "Tab") {
        e.preventDefault();
        handleSelectAiMention();
        return;
      }
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
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
      if (e.key === "Escape") {
        e.preventDefault();
        setShowAiSuggestion(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl + Enter -> Hỏi AI
        e.preventDefault();
        handleSendToAi();
      } else {
        // Enter thuần -> Gửi tin nhắn nhóm hoặc hỏi AI nếu có @Mora / @AI
        e.preventDefault();
        if (mode === "ai" || isAiTriggerMessage(inputValue)) {
          handleSendToAi();
        } else if (onSendGroupMessage) {
          handleSendToGroup();
        } else {
          handleSendToAi();
        }
      }
    }
  };

  const handleCopyText = useCallback((id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã sao chép nội dung vào clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const readyDocuments = documents.filter((doc) => doc.status === "READY");
  const scopeLabel =
    selectedDocCount === totalDocCount || selectedDocCount === 0
      ? "Tất cả tài liệu"
      : `${selectedDocCount} tài liệu`;
  const send = () =>
    mode === "ai" || membersCount === 1
      ? handleSendToAi()
      : handleSendToGroup();

  return (
    <div className="flex flex-col flex-1 min-h-0 text-foreground">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8 md:py-10 flex flex-col w-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-card rounded-2xl border border-border text-muted-foreground shadow-sm">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">
                Bắt đầu hội thoại trong Không gian
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Nhắn tin trao đổi tự do giữa các thành viên, hoặc gõ{" "}
                <span className="font-semibold text-primary font-mono">
                  @Mora
                </span>{" "}
                (hoặc bấm nút{" "}
                <span className="font-semibold text-primary">✨ Hỏi AI</span>)
                để AI tra cứu tài liệu và trả lời trích dẫn minh bạch cho cả
                nhóm.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isAI = message.sender === "assistant";
            const isAiQuery =
              getMessageKind(message, membersCount) === "AI_QUERY";
            const isGroupStart = !canGroupMessages(
              messages[index - 1],
              message,
              membersCount,
            );
            const isGroupEnd = !canGroupMessages(
              message,
              messages[index + 1],
              membersCount,
            );
            const isSelf = !!(
              currentUserId && message.userId === currentUserId
            );

            return (
              <div
                key={message.id}
                className={cn(
                  "w-full shrink-0",
                  index > 0 && (isGroupStart ? "mt-4" : "mt-1"),
                )}
              >
                <MemoizedMessageItem
                  message={message}
                  isAI={isAI}
                  isAiQuery={isAiQuery}
                  isSelf={isSelf}
                  isGroupStart={isGroupStart}
                  isGroupEnd={isGroupEnd}
                  isDebugMode={isDebugMode}
                  copiedId={copiedId}
                  onCitationClick={onCitationClick}
                  handleCopyText={handleCopyText}
                  setSelectedPrompt={setSelectedPrompt}
                />
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3.5 max-w-[85%] mr-auto mt-4">
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

      <div className="shrink-0 px-3 pb-3 pt-2 md:px-8 md:pb-5 w-full">
        {typingUsers.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2" role="status">
            {typingUsers.join(", ")} đang soạn tin nhắn...
          </p>
        )}
        <div className="relative rounded-xl border border-border bg-card p-2.5 shadow-sm focus-within:ring-2 focus-within:ring-ring/30">
          {showAiSuggestion && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSelectAiMention}
              className="absolute bottom-full left-0 mb-2 rounded-xl border border-border bg-popover shadow-lg p-3 text-sm text-primary"
            >
              @Mora · Trợ lý tài liệu{" "}
              <span className="text-xs text-muted-foreground ml-2">Tab ↵</span>
            </button>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1" aria-label="Chế độ gửi">
              <button
                type="button"
                aria-pressed={mode === "ai"}
                onClick={() => setMode("ai")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${mode === "ai" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                Hỏi Mora
              </button>
              {membersCount > 1 && (
                <button
                  type="button"
                  aria-pressed={mode === "group"}
                  onClick={() => setMode("group")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${mode === "group" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Trao đổi nhóm
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1 text-xs text-muted-foreground p-1 rounded hover:bg-muted"
                aria-label="Chọn nguồn tài liệu"
              >
                <FileText className="size-3.5" />
                <span>Nguồn: {scopeLabel}</span>
                <ChevronDown className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 max-w-[85vw] p-3 space-y-2"
              >
                <p className="text-xs text-muted-foreground">
                  Chọn tài liệu để hỏi Mora. Không chọn riêng sẽ dùng tất cả.
                </p>
                {!!readyDocuments.length && (
                  <button
                    type="button"
                    className="text-xs font-medium hover:underline"
                    onClick={onToggleAllDocuments}
                  >
                    {selectedDocumentIds.length === readyDocuments.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </button>
                )}
                {!readyDocuments.length && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có tài liệu sẵn sàng.
                  </p>
                )}
                {readyDocuments.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-start gap-2 text-sm py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-current"
                      checked={selectedDocumentIds.includes(doc.id)}
                      onChange={() => onToggleDocument?.(doc.id)}
                    />
                    <span className="break-words min-w-0">{doc.name}</span>
                  </label>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
              aria-label={mode === "ai" ? "Câu hỏi cho Mora" : "Tin nhắn nhóm"}
              placeholder={
                mode === "ai"
                  ? "Bạn muốn hiểu điều gì từ tài liệu?"
                  : "Nhắn tin trao đổi với nhóm..."
              }
              disabled={isLoading}
              rows={2}
              className="min-h-12 max-h-40 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <Button
              type="button"
              size="icon"
              aria-label={
                mode === "ai" ? "Gửi câu hỏi cho Mora" : "Gửi tin nhắn nhóm"
              }
              disabled={!inputValue.trim() || isLoading}
              onClick={send}
              className="size-8 shrink-0 rounded-lg"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Debug Dialog for prompt */}
      <Dialog
        open={selectedPrompt !== null}
        onOpenChange={(open) => !open && setSelectedPrompt(null)}
      >
        <DialogContent className="sm:max-w-[700px] w-[90vw] bg-card text-foreground border-border max-h-[85vh] flex flex-col p-6 rounded-2xl shadow-2xl z-50">
          <DialogHeader className="border-b border-border pb-3 flex flex-col">
            <DialogTitle className="text-sm font-bold text-foreground">
              Chi tiết Prompt gửi tới OpenAI
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[11px] mt-1">
              Nội dung System Prompt và ngữ cảnh trích xuất từ tài liệu
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-1 select-text">
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed bg-muted p-4 rounded-xl border border-border max-h-[50vh] overflow-y-auto">
              {renderPromptContent(selectedPrompt || "")}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
