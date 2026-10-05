import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  Trash2,
  Sparkles,
  FileText,
  Users,
} from 'lucide-react';
import {
  useSpaceDetail,
} from '@/features/chat/hooks/useSpace';
import {
  useSendSpaceChatMessage,
  useSendGroupMessage,
  useSpaceChatHistory,
  useClearSpaceChatHistory,
} from '@/features/chat/hooks/useChat';
import { useSpaceSocket } from '@/features/chat/hooks/useSpaceSocket';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
import { SpaceMemberModal } from '@/features/chat/components/SpaceMemberModal';
import type { Message, TypingNotification } from '@/features/chat/types';
import type { DocumentResponse } from '@/features/chat/services/document-api';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// Import subcomponents
import { SpaceSidebar } from './components/SpaceSidebar';

export const SpaceDetailPage: React.FC = () => {
  const { spaceId: spaceIdParam } = useParams<{ spaceId: string }>();
  const spaceId = Number(spaceIdParam);

  const { user: currentUser } = useAuth();

  const [spaceMessages, setSpaceMessages] = useState<Message[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showClearHistoryAlert, setShowClearHistoryAlert] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Selective RAG Document Scope state
  const [selectedDocIdsForAi, setSelectedDocIdsForAi] = useState<number[]>([]);
  
  // PDF Viewer states
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [citationPage, setCitationPage] = useState<number>(1);

  // Queries & Mutations
  const { data: space, isLoading: isSpaceLoading, error: spaceError } = useSpaceDetail(spaceId, {
    refetchInterval: (query: any) => {
      const docs = query.state.data?.documents;
      const hasProcessing = docs?.some(
        (d: any) => d.status === 'UPLOADING' || d.status === 'PARSING' || d.status === 'INDEXING'
      );
      return hasProcessing ? 3000 : false;
    }
  });

  const sendSpaceMessageMutation = useSendSpaceChatMessage();
  const sendGroupMessageMutation = useSendGroupMessage();
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Chat History hooks (Initial load without 3s polling)
  const { data: spaceHistoryData } = useSpaceChatHistory(spaceId);

  // Clear History mutation
  const clearSpaceHistoryMutation = useClearSpaceChatHistory();

  // Typing users state
  const [typingMap, setTypingMap] = useState<Record<number, { name: string; expiry: number }>>({});

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

    if (newMsg.messageType === 'AI_RESPONSE') {
      setIsAiProcessing(false);
    } else if (newMsg.messageType === 'AI_QUERY') {
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
    [currentUser?.id]
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
      const readyDocIds = space.documents.filter((d: any) => d.status === 'READY').map((d: any) => d.id);
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
      setSpaceMessages(
        spaceHistoryData.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          messageType: msg.messageType || (msg.sender === 'assistant' ? 'AI_RESPONSE' : 'USER_MESSAGE'),
          text: msg.text,
          userId: msg.userId,
          userName: msg.userName,
          userAvatar: msg.userAvatar,
          timestamp: new Date(msg.timestamp),
          condensedQuestion: msg.condensedQuestion,
          promptSent: msg.promptSent,
          citations: msg.citations,
          selectedDocumentIds: msg.selectedDocumentIds,
        }))
      );
    }
  }, [spaceHistoryData]);

  // Handler toggle 1 tài liệu trong phạm vi AI
  const handleToggleDocForAi = (docId: number) => {
    setSelectedDocIdsForAi((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  // Handler toggle tất cả tài liệu trong phạm vi AI
  const handleToggleAllDocsForAi = () => {
    if (!space?.documents) return;
    const readyDocIds = space.documents.filter((d: any) => d.status === 'READY').map((d: any) => d.id);
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
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Không thể gửi tin nhắn nhóm');
        },
      }
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
        documentIds: selectedDocIdsForAi.length > 0 ? selectedDocIdsForAi : undefined,
      },
      {
        onSuccess: () => {
          setIsAiProcessing(false);
          toast.success('AI đã phản hồi xong!');
        },
        onError: (err: any) => {
          console.error(err);
          setIsAiProcessing(false);
          const errorData = err.response?.data;
          const isApiKeyMissing = errorData?.code === 1020 || errorData?.message?.includes('Gemini API Key');

          const errorText = isApiKeyMissing
            ? '⚠️ Bạn chưa cấu hình Gemini API Key. Vui lòng vào [Cài đặt AI & Hạn mức](/profile?tab=ai-settings) để nhập API Key từ Google AI Studio trước khi bắt đầu học tập.'
            : (errorData?.message || 'Không thể gửi tin nhắn. Vui lòng kiểm tra lại dịch vụ backend hoặc hạn mức API Key.');

          const errorMessage: Message = {
            id: Date.now() + 2,
            sender: 'assistant',
            messageType: 'AI_RESPONSE',
            text: errorText,
            timestamp: new Date(),
          };
          setSpaceMessages((prev) => [...prev, errorMessage]);
          if (isApiKeyMissing) {
            toast.error('Vui lòng cấu hình Gemini API Key trong trang Cá nhân để sử dụng AI!', {
              action: {
                label: 'Cài đặt ngay',
                onClick: () => {
                  window.location.href = '/profile?tab=ai-settings';
                },
              },
            });
          }
        },
      }
    );
  };

  // Xác nhận xóa lịch sử cuộc trò chuyện
  const handleClearHistoryConfirm = () => {
    clearSpaceHistoryMutation.mutate(spaceId, {
      onSuccess: () => {
        setSpaceMessages([]);
        setShowClearHistoryAlert(false);
        toast.success('Đã xóa sạch lịch sử cuộc trò chuyện!');
      },
      onError: (err: any) => {
        toast.error('Xóa lịch sử thất bại: ' + (err.response?.data?.message || err.message));
      },
    });
  };

  // Xử lý khi click vào nhãn nguồn trích dẫn
  const handleCitationClick = (pageNumber: number, documentId?: number) => {
    if (documentId && space?.documents) {
      const doc = space.documents.find((d: any) => d.id === documentId);
      if (doc) {
        setSelectedDocument(doc);
      }
    }
    setCitationPage(pageNumber);
  };

  // Error handling
  if (isNaN(spaceId) || spaceId <= 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <div className="max-w-md text-center space-y-4 bg-card p-8 rounded-2xl shadow-md border border-border">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Mã Không gian học tập không hợp lệ</h2>
          <Link to="/">
            <Button className="cursor-pointer">Quay lại Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (spaceError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <div className="max-w-md text-center space-y-4 bg-card p-8 rounded-2xl shadow-md border border-border">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Lỗi tải dữ liệu Space</h2>
          <p className="text-muted-foreground text-sm">
            {(spaceError as any)?.response?.data?.message || 'Không thể tải thông tin Không gian học tập từ máy chủ.'}
          </p>
          <Link to="/">
            <Button className="cursor-pointer">Quay lại Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = space?.currentUserRole === 'OWNER';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* 1. Left Sidebar */}
      <SpaceSidebar
        space={space}
        isSpaceLoading={isSpaceLoading}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        selectedDocumentId={selectedDocument?.id || null}
        onSelectDocument={setSelectedDocument}
        selectedDocIdsForAi={selectedDocIdsForAi}
        onToggleDocForAi={handleToggleDocForAi}
        onToggleAllDocsForAi={handleToggleAllDocsForAi}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
        currentUserId={currentUser?.id}
      />

      {/* 2. Main Work Area (Split-screen or Single-pane based on document selection) */}
      <div className="flex-1 flex h-full min-w-0 overflow-hidden">
        {/* Left pane: Hộp thoại Chatbot */}
        <section className="flex-1 shrink-0 border-r border-border bg-card flex flex-col h-full min-h-0 relative overflow-hidden shadow-2xs">
          {/* Chat header */}
          <div className="flex items-center justify-between px-6 h-14 bg-card border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground tracking-wider flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                TRỢ LÝ & THẢO LUẬN NHÓM
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMemberModalOpen(true)}
                className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-primary cursor-pointer"
              >
                <Users className="w-3 h-3" />
                {space?.memberCount || 1} thành viên
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowClearHistoryAlert(true)}
                  disabled={spaceMessages.length === 0}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-30"
                  title="Xóa lịch sử cuộc trò chuyện (Chỉ Owner)"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <ChatContainer
            messages={spaceMessages}
            onSendMessage={handleSendMessageToAi}
            onSendGroupMessage={handleSendGroupMessage}
            isLoading={isAiProcessing}
            onCitationClick={handleCitationClick}
            isDebugMode={true}
            selectedDocCount={selectedDocIdsForAi.length}
            totalDocCount={space?.documents?.filter((d: any) => d.status === 'READY').length || 0}
            currentUserId={currentUser?.id}
            typingUsers={typingUserNames}
            onTyping={sendTyping}
          />
        </section>

        {/* Right pane: PDF Viewer */}
        {selectedDocument ? (
          <section className="flex-1 shrink-0 h-full min-h-0 relative overflow-hidden">
            <PdfViewer
              url={selectedDocument.storageUrl}
              currentPage={citationPage}
              onPageChange={setCitationPage}
            />
          </section>
        ) : (
          <section className="hidden lg:flex flex-1 shrink-0 h-full bg-muted/5 flex-col items-center justify-center text-center p-8 select-none border-l border-border">
            <div className="max-w-xs space-y-4">
              <div className="p-4 bg-card rounded-2xl border border-border inline-block text-muted-foreground animate-bounce shadow-xs">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Trình Xem Tài Liệu PDF</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Chọn bất kỳ tài liệu PDF nào ở thanh bên để hiển thị trình xem song song và click vào các nhãn nguồn để cuộn trang đối chiếu.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Clear Chat History AlertDialog */}
      <AlertDialog open={showClearHistoryAlert} onOpenChange={setShowClearHistoryAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc muốn xóa lịch sử trò chuyện này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa sạch toàn bộ nội dung tin nhắn và câu hỏi đáp của cuộc trò chuyện hiện tại. Không thể hoàn tác hành động này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy bỏ</AlertDialogCancel>
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
