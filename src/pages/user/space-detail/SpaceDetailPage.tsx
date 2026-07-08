import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  Trash2,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  useSpaceDetail,
} from '@/features/chat/hooks/useSpace';
import {
  useSendSpaceChatMessage,
  useSpaceChatHistory,
  useClearSpaceChatHistory,
} from '@/features/chat/hooks/useChat';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
import type { Message } from '@/features/chat/types';
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

  const [spaceMessages, setSpaceMessages] = useState<Message[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showClearHistoryAlert, setShowClearHistoryAlert] = useState(false);
  
  // PDF Viewer states
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [citationPage, setCitationPage] = useState<number>(1);

  // Queries & Mutations
  const { data: space, isLoading: isSpaceLoading, error: spaceError } = useSpaceDetail(spaceId);
  const sendSpaceMessageMutation = useSendSpaceChatMessage();

  // Chat History hooks
  const { data: spaceHistoryData } = useSpaceChatHistory(spaceId);

  // Clear History mutation
  const clearSpaceHistoryMutation = useClearSpaceChatHistory();

  // Load space chat history from DB
  useEffect(() => {
    if (spaceHistoryData) {
      setSpaceMessages(
        spaceHistoryData.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          timestamp: new Date(msg.timestamp),
          condensedQuestion: msg.condensedQuestion,
          promptSent: msg.promptSent,
          citations: msg.citations,
        }))
      );
    }
  }, [spaceHistoryData]);

  // Gửi tin nhắn mới
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Tạo tin nhắn người dùng tạm thời
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };

    setSpaceMessages((prev) => [...prev, userMessage]);

    // 2. Chuẩn bị lịch sử
    const historyDto = spaceMessages.map((msg) => ({
      sender: msg.sender,
      text: msg.text,
    }));

    // 3. Gửi lên server
    sendSpaceMessageMutation.mutate(
      {
        spaceId,
        question: text,
        history: historyDto,
      },
      {
        onSuccess: () => {
          toast.success('Gửi tin nhắn thành công');
        },
        onError: (err: any) => {
          console.error(err);
          const errorMessage: Message = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: 'Không thể gửi tin nhắn. Vui lòng kiểm tra lại dịch vụ backend.',
            timestamp: new Date(),
          };
          setSpaceMessages((prev) => [...prev, errorMessage]);
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
          <p className="text-muted-foreground text-sm">Không thể tải thông tin Không gian học tập từ máy chủ.</p>
          <Link to="/">
            <Button className="cursor-pointer">Quay lại Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

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
      />

      {/* 2. Main Work Area (Split-screen or Single-pane based on document selection) */}
      <div className="flex-1 flex h-full min-w-0 overflow-hidden">
        {/* Left pane: Hộp thoại Chatbot */}
        <section className="flex-1 shrink-0 border-r border-border bg-card flex flex-col h-full min-h-0 relative overflow-hidden shadow-2xs">
          {/* Chat header */}
          <div className="flex items-center justify-between px-6 h-16 bg-card border-b border-border/60 shrink-0">
            <span className="text-xs font-bold text-foreground tracking-wider flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              TRỢ LÝ KHÔNG GIAN
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowClearHistoryAlert(true)}
                disabled={spaceMessages.length === 0}
                className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-30"
                title="Xóa lịch sử cuộc trò chuyện"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat Container */}
          <ChatContainer
            messages={spaceMessages}
            onSendMessage={handleSendMessage}
            isLoading={sendSpaceMessageMutation.isPending}
            onCitationClick={handleCitationClick}
            isDebugMode={true}
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
              <div className="p-4 bg-card rounded-2xl border border-border inline-block text-muted-foreground animate-bounce">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Trình Xem Tài Liệu PDF</h3>
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
    </div>
  );
};
