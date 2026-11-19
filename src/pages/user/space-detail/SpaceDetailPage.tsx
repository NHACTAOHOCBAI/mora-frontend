import { ErrorView } from "@/components/shared/ErrorView";
import { workspaceError } from "./workspace-error";
import { LockKeyhole, FileQuestion, WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Query } from "@tanstack/react-query";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  Trash2,
  PanelLeft,
  MessageSquare,
  BookOpen,
  X,
  Settings,
  Pin,
} from "lucide-react";
import { useSpaceDetail } from "@/features/chat/hooks/useSpace";
import {
  useSendGroupMessage,
  useSpaceChatHistory,
  useClearSpaceChatHistory,
} from "@/features/chat/hooks/useChat";
import { streamSpaceChatMessage, cancelSpaceChatStream } from "@/features/chat/services/chat-api";
import { useSpaceSocket } from "@/features/chat/hooks/useSpaceSocket";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMessagePins } from "@/features/chat/hooks/useMessagePins";
import { PinnedMessagesPanel } from "@/features/chat/components/PinnedMessagesPanel";
import { ChatContainer } from "@/features/chat/components/ChatContainer";
import { PdfViewer } from "@/features/chat/components/PdfViewer";
import { StudySetPanel } from "@/features/study/components/StudySetPanel";
import type {
  Message,
  AiStreamEvent,
  TypingNotification,
  SpaceDetailResponse,
} from "@/features/chat/types";
import type { DocumentResponse } from "@/features/chat/services/document-api";
import { Button } from "@/components/ui/button";
import { Popconfirm } from "@/components/ui/popconfirm";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

// Import subcomponents
import { SpaceSidebar } from "./components/SpaceSidebar";

export const SpaceDetailPage: React.FC = () => {
  const { spaceId: spaceIdParam } = useParams<{ spaceId: string }>();
  const spaceId = Number(spaceIdParam);
  const validSpaceId = Number.isSafeInteger(spaceId) && spaceId > 0;
  const queryClient = useQueryClient();
  const [pinsOpen, setPinsOpen] = useState(false);
  const pinButtonRef = useRef<HTMLButtonElement>(null);
  const [jumpToMessage, setJumpToMessage] = useState<{ id: number; token: number } | null>(null);

  const { user: currentUser } = useAuth();

  const [spaceMessages, setSpaceMessages] = useState<Message[]>([]);
  const streamDraftsRef = useRef(new Map<string, { userTemporaryId?: number; assistantTemporaryId: number }>());
  const lastStreamSequenceRef = useRef(new Map<string, number>());
  const pendingStreamTextRef = useRef(new Map<string, string>());
  const streamFlushFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => window.innerWidth < 768,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const isStudyOpen = searchParams.get("view") === "study";
  const setIsStudyOpen = (open: boolean) => setSearchParams(open ? { view: "study" } : {});

  // Selective RAG Document Scope state
  const [selectedDocIdsForAi, setSelectedDocIdsForAi] = useState<number[]>([]);

  // PDF Viewer states
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentResponse | null>(null);
  const [retryError, setRetryError] = useState<unknown>(null);
  const [citationPage, setCitationPage] = useState<number>(1);

  // Queries & Mutations
  const {
    data: space,
    isLoading: isSpaceLoading,
    error: spaceError,
    refetch: retrySpace,
    isFetching: isSpaceFetching,
  } = useSpaceDetail(spaceId, {
    enabled: validSpaceId,
    retry: false,
    refetchInterval: (query: Query<SpaceDetailResponse>) => {
      const docs = query.state.data?.documents;
      const hasProcessing = docs?.some(
        (d: DocumentResponse) =>
          d.status === "UPLOADING" ||
          d.status === "PARSING" ||
          d.status === "INDEXING",
      );
      return hasProcessing ? 3000 : false;
    },
  });

  const pinsQuery = useMessagePins(spaceId, !!space);
  const pins = pinsQuery.data ?? [];
  const pinnedIds = new Set(pins.map(pin => pin.message.id));
  const handleStateChanged = useCallback((historyChanged: boolean) => {
    void queryClient.invalidateQueries({ queryKey: ["message-pins", spaceId] });
    if (historyChanged) void queryClient.invalidateQueries({ queryKey: ["chat-history", "space", spaceId] });
  }, [queryClient, spaceId]);
  const { togglePin } = pinsQuery;
  const handlePin = useCallback((messageId: number, pinned: boolean) => {
    void togglePin(messageId, pinned);
  }, [togglePin]);
  const handleJump = (messageId: number) => {
    setPinsOpen(false);
    setIsStudyOpen(false);
    setJumpToMessage({ id: messageId, token: Date.now() });
  };

  const sendGroupMessageMutation = useSendGroupMessage();
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const activeStreamRequestRef = useRef<string | null>(null);

  const flushStreamText = useCallback(() => {
    const pending = new Map(pendingStreamTextRef.current);
    pendingStreamTextRef.current.clear();
    streamFlushFrameRef.current = null;
    if (!pending.size) return;
    setSpaceMessages(prev => prev.map(message => {
      for (const [generationId, text] of pending) {
        const draft = streamDraftsRef.current.get(generationId);
        if (draft?.assistantTemporaryId === message.id) return { ...message, text: message.text + text, streamStatus: "Đang soạn câu trả lời…" };
      }
      return message;
    }));
  }, []);

  const queueStreamText = useCallback((generationId: string, text: string) => {
    pendingStreamTextRef.current.set(generationId, (pendingStreamTextRef.current.get(generationId) || "") + text);
    // Parsing Markdown on every network chunk is expensive.  Small batches retain
    // the typing effect while keeping layout and React work stable.
    if (streamFlushFrameRef.current === null) streamFlushFrameRef.current = setTimeout(flushStreamText, 80);
  }, [flushStreamText]);

  useEffect(() => () => {
    if (streamFlushFrameRef.current !== null) clearTimeout(streamFlushFrameRef.current);
  }, []);

  // Chat History hooks (Initial load without 3s polling)
  const { data: spaceHistoryData } = useSpaceChatHistory(spaceId, { enabled: validSpaceId });

  // Clear History mutation
  const clearSpaceHistoryMutation = useClearSpaceChatHistory();

  // Typing users state
  const [typingMap, setTypingMap] = useState<
    Record<number, { name: string; expiry: number }>
  >({});

  // Real-time WebSocket handlers
  const handleSocketMessageReceived = useCallback((newMsg: Message) => {
    setSpaceMessages((prev) => {
      // The sender already rendered this question optimistically.  Reconcile it
      // here so the assistant draft never jumps above the user message.
      if (newMsg.messageType === "AI_QUERY" && newMsg.userId === currentUser?.id) {
        const optimisticIndex = prev.findIndex((m) => m.id < 0 && m.messageType === "AI_QUERY" && m.userId === currentUser?.id && m.text === newMsg.text);
        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = newMsg;
          return updated;
        }
      }
      const existingIndex = prev.findIndex((m) => m.id === newMsg.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = newMsg;
        return updated;
      }
      return [...prev, newMsg];
    });

    if (newMsg.messageType === "AI_RESPONSE") {
      setIsAiProcessing(false);
    } else if (newMsg.messageType === "AI_QUERY") {
      setIsAiProcessing(true);
    }
  }, [currentUser?.id]);

  const handleAiStreamEvent = useCallback((event: AiStreamEvent) => {
    const previousSequence = lastStreamSequenceRef.current.get(event.generationId) ?? 0;
    if (event.sequence <= previousSequence) return;
    lastStreamSequenceRef.current.set(event.generationId, event.sequence);
    const draft = streamDraftsRef.current.get(event.generationId);
    const statusLabel: Record<string, string> = { retrieving: "Đang tìm trong tài liệu…", generating: "Đang soạn câu trả lời…", citing: "Đang kiểm tra nguồn…" };

    if (event.type === "accepted" && event.message) {
      const savedQuestion = { ...event.message, timestamp: new Date(event.message.timestamp) };
      const assistantTemporaryId = draft?.assistantTemporaryId ?? -(Date.now() + Math.floor(Math.random() * 100000));
      streamDraftsRef.current.set(event.generationId, { userTemporaryId: draft?.userTemporaryId, assistantTemporaryId });
      setSpaceMessages((prev) => {
        const persistedIndex = prev.findIndex(m => m.id === savedQuestion.id);
        const userIndex = persistedIndex >= 0 ? persistedIndex : (draft?.userTemporaryId == null ? -1 : prev.findIndex(m => m.id === draft.userTemporaryId));
        const next = [...prev];
        if (userIndex >= 0) next[userIndex] = savedQuestion;
        else next.push(savedQuestion);
        if (!next.some(m => m.id === assistantTemporaryId)) next.push({ id: assistantTemporaryId, sender: "assistant", messageType: "AI_RESPONSE", text: "", timestamp: new Date(), streamStatus: "Đang chuẩn bị câu trả lời…" });
        return next;
      });
      return;
    }
    if (!draft) return;
    if (event.type === "status") {
      setSpaceMessages(prev => prev.map(m => m.id === draft.assistantTemporaryId ? { ...m, streamStatus: statusLabel[event.stage || ""] || "Đang chuẩn bị câu trả lời…" } : m));
    } else if (event.type === "delta") {
      queueStreamText(event.generationId, event.text || "");
    } else if (event.type === "citations") {
      setSpaceMessages(prev => prev.map(m => m.id === draft.assistantTemporaryId ? { ...m, citations: event.citations || [] } : m));
    } else if (event.type === "done" && event.message) {
      const completed = { ...event.message, timestamp: new Date(event.message.timestamp) };
      setSpaceMessages(prev => prev.filter(m => m.id !== completed.id).map(m => m.id === draft.assistantTemporaryId ? completed : m));
      streamDraftsRef.current.delete(event.generationId);
      lastStreamSequenceRef.current.delete(event.generationId);
    } else if (event.type === "error") {
      setSpaceMessages(prev => prev.map(m => m.id === draft.assistantTemporaryId ? { ...m, text: event.text || "Không thể tạo câu trả lời.", streamStatus: undefined } : m));
    }
  }, [queueStreamText]);

  const handleSocketTypingReceived = useCallback(
    (info: TypingNotification) => {
      if (info.userId === currentUser?.id) return;

      if (info.typing) {
        setTypingMap((prev) => ({
          ...prev,
          [info.userId]: {
            name: info.fullName || "Thành viên",
            expiry: Date.now() + 3000,
          },
        }));
      } else {
        setTypingMap((prev) => {
          const copy = { ...prev };
          delete copy[info.userId];
          return copy;
        });
      }
    },
    [currentUser?.id],
  );

  const { sendTyping } = useSpaceSocket({
    spaceId: validSpaceId ? spaceId : undefined,
    onMessageReceived: handleSocketMessageReceived,
    onAiStreamEvent: handleAiStreamEvent,
    onTypingReceived: handleSocketTypingReceived,
    onStateChanged: handleStateChanged,
  });

  // Tự động dọn dẹp các thông báo typing quá hạn
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setTypingMap((prev) => {
        let changed = false;
        const next: Record<number, { name: string; expiry: number }> = {};
        for (const [idStr, val] of Object.entries(prev)) {
          if (val.expiry > now) {
            next[Number(idStr)] = val;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const typingUserNames = Object.values(typingMap).map((v) => v.name);

  // Initialize selected documents for AI scope when space loads
  useEffect(() => {
    if (space?.documents) {
      const readyDocIds = space.documents
        .filter((d: DocumentResponse) => d.status === "READY")
        .map((d: DocumentResponse) => d.id);
      // Keep source selection valid when asynchronous document processing completes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDocIdsForAi((prev) => {
        if (prev.length === 0) return readyDocIds;
        // Keep valid ids
        return prev.filter((id) => readyDocIds.includes(id));
      });
    }
  }, [space?.documents]);

  // Load space chat history from DB on initial mount
  useEffect(() => {
    if (spaceHistoryData) {
      // Merge the persisted history refreshed after sending or clearing messages.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpaceMessages(
        spaceHistoryData.map((msg: Message) => ({
          id: msg.id,
          sender: msg.sender,
          messageType:
            msg.messageType ||
            (msg.sender === "assistant" ? "AI_RESPONSE" : "USER_MESSAGE"),
          text: msg.text,
          userId: msg.userId,
          fullName: msg.fullName,
          userAvatar: msg.userAvatar,
          timestamp: new Date(msg.timestamp),
          citations: msg.citations,
          selectedDocumentIds: msg.selectedDocumentIds,
        })),
      );
    }
  }, [spaceHistoryData]);

  // Handler toggle 1 tài liệu trong phạm vi AI
  const handleToggleDocForAi = (docId: number) => {
    setSelectedDocIdsForAi((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId],
    );
  };

  // Handler toggle tất cả tài liệu trong phạm vi AI
  const handleToggleAllDocsForAi = () => {
    if (!space?.documents) return;
    const readyDocIds = space.documents
      .filter((d: DocumentResponse) => d.status === "READY")
      .map((d: DocumentResponse) => d.id);
    if (selectedDocIdsForAi.length === readyDocIds.length) {
      setSelectedDocIdsForAi([]);
    } else {
      setSelectedDocIdsForAi(readyDocIds);
    }
  };

  // Gửi tin nhắn trao đổi nhóm (người-người)
  const handleSendGroupMessage = async (text: string) => {
    if (!text.trim()) return;

    sendGroupMessageMutation.mutate(
      { spaceId, text },
      {
        onSuccess: (newMsg) => {
          setSpaceMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
        onError: (err: unknown) => {
          toast.error(getErrorMessage(err));
        },
      },
    );
  };

  // Gửi câu hỏi kích hoạt Trợ lý AI (@Mora Trigger)
  const handleSendMessageToAi = async (text: string) => {
    if (!text.trim()) return;

    // Chuẩn bị lịch sử
    const historyDto = spaceMessages.map((msg) => ({
      sender: msg.sender,
      text: msg.text,
    }));

    const requestId = crypto.randomUUID();
    const temporaryUserId = -Date.now();
    const temporaryId = -(Date.now() + 1);
    streamDraftsRef.current.set(requestId, { userTemporaryId: temporaryUserId, assistantTemporaryId: temporaryId });
    activeStreamRequestRef.current = requestId;
    setIsAiProcessing(true);
    setSpaceMessages((prev) => [...prev,
      { id: temporaryUserId, sender: "user", userId: currentUser?.id, messageType: "AI_QUERY", text, timestamp: new Date() },
      { id: temporaryId, sender: "assistant", messageType: "AI_RESPONSE", text: "", timestamp: new Date(), streamStatus: "Đang chuẩn bị câu trả lời…" },
    ]);
    try {
      await streamSpaceChatMessage({ spaceId, question: text, history: historyDto, documentIds: selectedDocIdsForAi.length ? selectedDocIdsForAi : undefined }, requestId, {
        onEvent: (name, payload) => handleAiStreamEvent({ ...payload, type: name } as AiStreamEvent),
      });
    } catch (err) {
      setSpaceMessages((prev) => prev.filter(m => m.id !== temporaryId && m.id !== temporaryUserId));
      streamDraftsRef.current.delete(requestId);
      toast.error(getErrorMessage(err));
    } finally {
      activeStreamRequestRef.current = null;
      setIsAiProcessing(false);
    }
  };

  const handleStopGenerating = () => {
    const requestId = activeStreamRequestRef.current;
    if (requestId) void cancelSpaceChatStream(spaceId, requestId);
  };

  // Xác nhận xóa lịch sử cuộc trò chuyện
  const handleClearHistoryConfirm = async () => {
    await clearSpaceHistoryMutation.mutateAsync(spaceId);
    setSpaceMessages([]);
    toast.success("Đã xóa sạch lịch sử cuộc trò chuyện!");
  };

  // Xử lý khi click vào nhãn nguồn trích dẫn
  const handleCitationClick = (pageNumber: number, documentId?: number) => {
    if (documentId && space?.documents) {
      const doc = space.documents.find(
        (d: DocumentResponse) => d.id === documentId,
      );
      if (doc) {
        setSelectedDocument(doc);
      }
    }
    setCitationPage(pageNumber);
  };

  const invalidSpaceId = !validSpaceId;
  if (invalidSpaceId || spaceError || retryError) {
    const state = workspaceError(spaceError || retryError, invalidSpaceId);
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background text-foreground">
        <ErrorView illustration={state.kind === "missing" ? "workspace-missing" : state.kind === "forbidden" ? "workspace-forbidden" : "workspace-connection"} icon={state.kind === "forbidden" ? <LockKeyhole /> : state.kind === "missing" ? <FileQuestion /> : <WifiOff />}
          title={state.title} description={state.description}
          code={state.kind === "forbidden" ? "403" : state.kind === "missing" ? "404" : undefined}>
          {state.retry && <Button className="h-10 w-full" disabled={isSpaceFetching || !!retryError} onClick={() => {
            setRetryError(spaceError);
            void retrySpace().finally(() => setRetryError(null));
          }}>{isSpaceFetching || retryError ? "Đang thử lại..." : "Thử lại"}</Button>}
          <Button className="h-10 w-full" variant={state.retry ? "ghost" : "default"} render={<Link to="/app" />}>Về danh sách không gian</Button>
        </ErrorView>
      </div>
    );
  }

  const isOwner = space?.currentUserRole === "OWNER";

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 border-b border-border bg-card px-3 md:flex-nowrap md:px-6">
        <div className="flex h-14 min-w-0 flex-1 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              id="space-documents-toggle"
              aria-label="Đóng/mở tài liệu"
              aria-expanded={!isSidebarCollapsed}
              aria-controls="space-documents-sidebar"
              onClick={() => setIsSidebarCollapsed((v) => !v)}
            >
              <PanelLeft className="size-4" />
            </Button>
            <div className="min-w-0 truncate text-sm">
              <Link to="/app" className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">Không gian học tập</Link>
              <span className="mx-2 text-muted-foreground" aria-hidden="true">/</span>
              <h1 className="inline font-semibold" title={space?.name || "Đang tải..."}>{space?.name || "Đang tải..."}</h1>
            </div>
        </div>
        <nav aria-label="Không gian học" className="order-3 flex h-11 w-full gap-1 md:order-none md:w-auto">
            <button
              type="button"
              onClick={() => setIsStudyOpen(false)}
              aria-pressed={!isStudyOpen}
              className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 text-sm lg:px-4 font-semibold text-muted-foreground transition-colors hover:text-foreground aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-sm"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              Hỏi đáp
              <span
                aria-hidden="true"
                className={`absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-primary transition-transform duration-200 motion-reduce:transition-none ${isStudyOpen ? "scale-x-0" : "scale-x-100"}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setIsStudyOpen(true)}
              aria-pressed={isStudyOpen}
              className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 text-sm lg:px-4 font-semibold text-muted-foreground transition-colors hover:text-foreground aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-sm"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Ôn tập
              <span
                aria-hidden="true"
                className={`absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-primary transition-transform duration-200 motion-reduce:transition-none ${isStudyOpen ? "scale-x-100" : "scale-x-0"}`}
              />
            </button>
            <Link
              to={`/space/${spaceId}/settings`}
              className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 lg:px-4"
            >
              <Settings className="size-4" aria-hidden="true" />
              Cài đặt
            </Link>
        </nav>
      </div>
      <div className="flex flex-1 min-h-0 relative">
        {/* 1. Left Sidebar */}
        <SpaceSidebar
          space={space}
          isSpaceLoading={isSpaceLoading}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          selectedDocumentId={selectedDocument?.id || null}
          onSelectDocument={setSelectedDocument}
          currentUserId={currentUser?.id}
        />

        <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden bg-muted/50 p-3 md:p-5 gap-5">
          <section
            className={`flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card max-w-[1200px] mx-auto ${selectedDocument ? "hidden lg:flex" : ""}`}
          >
            {isStudyOpen && space ? (
              <StudySetPanel
                spaceId={spaceId}
                documents={space.documents || []}
                onCitation={(page, documentId) =>
                  handleCitationClick(page, documentId)
                }
              />
            ) : (
              <>
                <div role="toolbar" aria-label="Công cụ hội thoại" className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3 md:px-5">
                  <div className="flex items-center gap-1">
                    <Button ref={pinButtonRef} variant="ghost" size="sm" aria-label="Tin đã ghim" onClick={() => setPinsOpen(true)}>
                      <Pin className="size-3.5" />
                      Đã ghim
                      {pinsQuery.isSuccess && <span className="text-xs text-muted-foreground">{pins.length}</span>}
                    </Button>
                    <Popconfirm
                      title="Xóa lịch sử hội thoại?"
                      description="Toàn bộ tin nhắn, câu hỏi đáp và tin đã ghim trong Space này sẽ bị xóa vĩnh viễn."
                      confirmLabel="Xóa lịch sử"
                      pending={clearSpaceHistoryMutation.isPending}
                      onConfirm={handleClearHistoryConfirm}
                      trigger={<Button variant="ghost" size="icon" aria-label="Xóa lịch sử hội thoại" disabled={(!isOwner && currentUser?.role !== "ROLE_ADMIN") || spaceMessages.length === 0}><Trash2 className="size-4" /></Button>}
                    />
                  </div>
                </div>
                <ChatContainer
                  messages={spaceMessages}
                  pinnedIds={pinnedIds}
                  pendingPinIds={pinsQuery.pendingIds}
                  onPin={handlePin}
                  pinsAvailable={pinsQuery.isSuccess}
                  jumpToMessage={jumpToMessage}
                  onSendMessage={handleSendMessageToAi}
                  onSendGroupMessage={handleSendGroupMessage}
                  isLoading={isAiProcessing}
                  onStopGenerating={handleStopGenerating}
                  onCitationClick={handleCitationClick}
                  selectedDocCount={selectedDocIdsForAi.length}
                  totalDocCount={
                    space?.documents?.filter(
                      (d: DocumentResponse) => d.status === "READY",
                    ).length || 0
                  }
                  currentUserId={currentUser?.id}
                  typingUsers={typingUserNames}
                  onTyping={sendTyping}
                  documents={space?.documents || []}
                  selectedDocumentIds={selectedDocIdsForAi}
                  onToggleDocument={handleToggleDocForAi}
                  onToggleAllDocuments={handleToggleAllDocsForAi}
                  membersCount={space?.memberCount || 1}
                />
              </>
            )}
          </section>

          {selectedDocument && (
            <section className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 p-3 border-b border-border">
                <span className="text-sm truncate">
                  {selectedDocument.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Đóng tài liệu"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <PdfViewer
                  url={selectedDocument.storageUrl}
                  currentPage={citationPage}
                  onPageChange={setCitationPage}
                />
              </div>
            </section>
          )}
        </div>
      </div>

      <PinnedMessagesPanel
        open={pinsOpen}
        onOpenChange={setPinsOpen}
        pins={pins}
        isLoading={pinsQuery.isLoading}
        isError={pinsQuery.isError}
        onRetry={() => { void pinsQuery.refetch(); }}
        pendingIds={pinsQuery.pendingIds}
        onUnpin={messageId => handlePin(messageId, false)}
        onJump={handleJump}
        returnFocus={pinButtonRef}
      />

    </div>
  );
};
