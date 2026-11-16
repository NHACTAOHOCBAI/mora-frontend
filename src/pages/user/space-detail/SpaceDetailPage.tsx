import type { Query } from "@tanstack/react-query";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertCircle,
  Trash2,
  PanelLeft,
  MessageSquare,
  BookOpen,
  MoreHorizontal,
  X,
  Users,
} from "lucide-react";
import { useSpaceDetail } from "@/features/chat/hooks/useSpace";
import {
  useSendSpaceChatMessage,
  useSendGroupMessage,
  useSpaceChatHistory,
  useClearSpaceChatHistory,
} from "@/features/chat/hooks/useChat";
import { useSpaceSocket } from "@/features/chat/hooks/useSpaceSocket";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChatContainer } from "@/features/chat/components/ChatContainer";
import { PdfViewer } from "@/features/chat/components/PdfViewer";
import { SpaceMemberModal } from "@/features/chat/components/SpaceMemberModal";
import { StudySetPanel } from "@/features/study/components/StudySetPanel";
import type {
  Message,
  TypingNotification,
  SpaceDetailResponse,
} from "@/features/chat/types";
import type { DocumentResponse } from "@/features/chat/services/document-api";
import { AppHeader } from "@/components/shared/AppHeader";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

// Import subcomponents
import { SpaceSidebar } from "./components/SpaceSidebar";

export const SpaceDetailPage: React.FC = () => {
  const { spaceId: spaceIdParam } = useParams<{ spaceId: string }>();
  const spaceId = Number(spaceIdParam);

  const { user: currentUser } = useAuth();

  const [spaceMessages, setSpaceMessages] = useState<Message[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => window.innerWidth < 768,
  );
  const [showClearHistoryAlert, setShowClearHistoryAlert] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);

  // Selective RAG Document Scope state
  const [selectedDocIdsForAi, setSelectedDocIdsForAi] = useState<number[]>([]);

  // PDF Viewer states
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentResponse | null>(null);
  const [citationPage, setCitationPage] = useState<number>(1);

  // Queries & Mutations
  const {
    data: space,
    isLoading: isSpaceLoading,
    error: spaceError,
  } = useSpaceDetail(spaceId, {
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

  const sendSpaceMessageMutation = useSendSpaceChatMessage();
  const sendGroupMessageMutation = useSendGroupMessage();
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Chat History hooks (Initial load without 3s polling)
  const { data: spaceHistoryData } = useSpaceChatHistory(spaceId);

  // Clear History mutation
  const clearSpaceHistoryMutation = useClearSpaceChatHistory();

  // Typing users state
  const [typingMap, setTypingMap] = useState<
    Record<number, { name: string; expiry: number }>
  >({});

  // Real-time WebSocket handlers
  const handleSocketMessageReceived = useCallback((newMsg: Message) => {
    setSpaceMessages((prev) => {
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
  }, []);

  const handleSocketTypingReceived = useCallback(
    (info: TypingNotification) => {
      if (info.userId === currentUser?.id) return;

      if (info.typing) {
        setTypingMap((prev) => ({
          ...prev,
          [info.userId]: {
            name: info.fullName || info.username,
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
    spaceId,
    onMessageReceived: handleSocketMessageReceived,
    onTypingReceived: handleSocketTypingReceived,
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
          userName: msg.userName,
          userAvatar: msg.userAvatar,
          timestamp: new Date(msg.timestamp),
          condensedQuestion: msg.condensedQuestion,
          promptSent: msg.promptSent,
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

    setIsAiProcessing(true);

    // Gửi lên server đồng bộ với scope tài liệu chọn lọc
    sendSpaceMessageMutation.mutate(
      {
        spaceId,
        question: text,
        history: historyDto,
        documentIds:
          selectedDocIdsForAi.length > 0 ? selectedDocIdsForAi : undefined,
      },
      {
        onSuccess: () => {
          setIsAiProcessing(false);
          toast.success("AI đã phản hồi xong!");
        },
        onError: (err: unknown) => {
          console.error(err);
          setIsAiProcessing(false);
          const errorText = getErrorMessage(err);

          const errorMessage: Message = {
            id: Date.now() + 2,
            sender: "assistant",
            messageType: "AI_RESPONSE",
            text: errorText,
            timestamp: new Date(),
          };
          setSpaceMessages((prev) => [...prev, errorMessage]);
          toast.error(errorText);
        },
      },
    );
  };

  // Xác nhận xóa lịch sử cuộc trò chuyện
  const handleClearHistoryConfirm = () => {
    clearSpaceHistoryMutation.mutate(spaceId, {
      onSuccess: () => {
        setSpaceMessages([]);
        setShowClearHistoryAlert(false);
        toast.success("Đã xóa sạch lịch sử cuộc trò chuyện!");
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err));
      },
    });
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

  // Error handling
  if (isNaN(spaceId) || spaceId <= 0) {
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div className="max-w-md text-center space-y-4 bg-card p-8 rounded-2xl shadow-md border border-border">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Mã Không gian học tập không hợp lệ
            </h2>
            <Link to="/">
              <Button className="cursor-pointer">Về danh sách không gian</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (spaceError) {
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div className="max-w-md text-center space-y-4 bg-card p-8 rounded-2xl shadow-md border border-border">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Lỗi tải dữ liệu Space
            </h2>
            <p className="text-muted-foreground text-sm">
              {getErrorMessage(spaceError)}
            </p>
            <Link to="/">
              <Button className="cursor-pointer">Về danh sách không gian</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = space?.currentUserRole === "OWNER";

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background text-foreground transition-colors duration-200">
      <AppHeader
        context={
          <>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />
            <Tooltip>
              <TooltipTrigger render={<h1 />} tabIndex={0} className="min-w-0 truncate text-sm font-semibold lg:max-w-64">
                {space?.name || "Đang tải..."}
              </TooltipTrigger>
              <TooltipContent>{space?.name || "Đang tải..."}</TooltipContent>
            </Tooltip>
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
          </>
        }
        navigation={
          <nav
            aria-label="Không gian học"
            className="flex h-11 gap-1"
          >
            <button
              type="button"
              onClick={() => setIsStudyOpen(false)}
              aria-pressed={!isStudyOpen}
              className="relative inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-sm"
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
              className="relative inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-sm"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Ôn tập
              <span
                aria-hidden="true"
                className={`absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-primary transition-transform duration-200 motion-reduce:transition-none ${isStudyOpen ? "scale-x-100" : "scale-x-0"}`}
              />
            </button>
          </nav>
        }
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsMemberModalOpen(true)}
              aria-label="Thành viên"
            >
              <Users className="size-4" />
              <span className="hidden lg:inline">
                Thành viên {space?.memberCount ?? 1}
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Thao tác không gian"
                className="p-2 rounded-lg hover:bg-muted"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!isOwner || spaceMessages.length === 0}
                  onClick={() => setShowClearHistoryAlert(true)}
                >
                  <Trash2 className="size-4" />
                  Xóa lịch sử hội thoại
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
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
              <ChatContainer
                messages={spaceMessages}
                onSendMessage={handleSendMessageToAi}
                onSendGroupMessage={handleSendGroupMessage}
                isLoading={isAiProcessing}
                onCitationClick={handleCitationClick}
                isDebugMode={true}
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

      {/* Clear Chat History AlertDialog */}
      <AlertDialog
        open={showClearHistoryAlert}
        onOpenChange={setShowClearHistoryAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bạn có chắc muốn xóa lịch sử trò chuyện này?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa sạch toàn bộ nội dung tin nhắn và câu hỏi đáp
              của cuộc trò chuyện hiện tại. Không thể hoàn tác hành động này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistoryConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Space Member & Invitation Modal */}
      {space && (
        <SpaceMemberModal
          spaceId={space.id}
          spaceName={space.name}
          currentUserRole={space.currentUserRole}
          currentUserId={currentUser?.id}
          open={isMemberModalOpen}
          onOpenChange={setIsMemberModalOpen}
        />
      )}
    </div>
  );
};
