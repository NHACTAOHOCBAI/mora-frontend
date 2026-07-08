import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  Trash2,
  Sparkles,
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
import type { Message } from '@/features/chat/types';
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
          // Invalidate history to pull saved DB messages
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
      />

      {/* 2. Main Chat Panel (Takes full remaining width) */}
      <section className="flex-1 shrink-0 border-r border-border bg-card flex flex-col h-full min-h-0 relative overflow-hidden shadow-xs">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 h-16 bg-card border-b border-border/60 shrink-0">
          <span className="text-xs font-bold text-foreground tracking-wider flex items-center gap-1.5">
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
          onCitationClick={() => {}}
          isDebugMode={false}
        />
      </section>

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
