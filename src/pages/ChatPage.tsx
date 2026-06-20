import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';
import {
  useDocumentDetails,
  useSendChatMessage,
  useDocumentChatHistory,
  useClearDocumentChatHistory,
} from '@/features/chat/hooks/useChat';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
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
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { toast } from 'sonner';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentId = Number(id);

  const [activePage, setActivePage] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showClearAlert, setShowClearAlert] = useState(false);
  const isDebugMode = localStorage.getItem('mora_dev_mode') === 'true';

  // Fetch document details (includes storage URL)
  const { data: document, isLoading: isDocLoading, error: docError } = useDocumentDetails(documentId);

  // Fetch document chat history from DB
  const { data: historyData } = useDocumentChatHistory(documentId);

  // Send message mutation
  const sendMessageMutation = useSendChatMessage();

  // Clear history mutation
  const clearHistoryMutation = useClearDocumentChatHistory();

  // Reset messages when document changes
  useEffect(() => {
    setActivePage(1);
  }, [documentId]);

  // Load history data into messages state
  useEffect(() => {
    if (historyData) {
      const formattedHistory: Message[] = historyData.map((msg) => ({
        id: String(msg.id),
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        citations: msg.citations || [],
        condensedQuestion: msg.condensedQuestion,
        promptSent: msg.promptSent,
      }));
      setMessages(formattedHistory);
    } else {
      setMessages([]);
    }
  }, [historyData]);

  const handleClearHistoryConfirm = () => {
    clearHistoryMutation.mutate(documentId, {
      onSuccess: () => {
        toast.success('Đã xóa toàn bộ lịch sử trò chuyện của tài liệu này!');
        setShowClearAlert(false);
      },
      onError: (err: any) => {
        toast.error('Không thể xóa lịch sử: ' + (err.message || 'Lỗi kết nối'));
        setShowClearAlert(false);
      },
    });
  };

  const handleSendMessage = (text: string) => {
    // 1. Append user message locally
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 2. Call backend API (backend will load history directly from DB to condense)
    sendMessageMutation.mutate(
      {
        documentId,
        question: text,
      },
      {
        onSuccess: (data) => {
          // 3. Append assistant response
          const assistantMessage: Message = {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: data.answerFound
              ? data.answer
              : 'Tôi không thể tìm thấy câu trả lời cho câu hỏi này trong nội dung tài liệu.',
            citations: data.citations || [],
            timestamp: new Date(),
            condensedQuestion: data.condensedQuestion,
            promptSent: data.promptSent,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: () => {
          const errorMessage: Message = {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: 'Có lỗi kết nối xảy ra trong quá trình hỏi đáp. Vui lòng kiểm tra lại dịch vụ backend.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  const handleCitationClick = (pageNumber: number) => {
    setActivePage(pageNumber);
  };

  if (isNaN(documentId) || documentId <= 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <div className="max-w-md text-center space-y-4 bg-card border border-border p-8 rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Mã tài liệu không hợp lệ</h2>
          <p className="text-muted-foreground text-sm">Vui lòng kiểm tra lại đường dẫn liên kết của tài liệu.</p>
          <Link to="/dashboard">
            <Button className="cursor-pointer">Quay lại Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (docError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <div className="max-w-md text-center space-y-4 bg-card border border-border p-8 rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Lỗi tải tài liệu</h2>
          <p className="text-muted-foreground text-sm">Không thể tải được thông tin tài liệu từ máy chủ.</p>
          <Link to="/dashboard">
            <Button className="cursor-pointer">Quay lại Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Top Navbar */}
      <div className="flex items-center gap-4 px-6 h-14 bg-card border-b border-border shrink-0">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="h-4 w-[1px] bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate text-sm sm:text-base">
            {isDocLoading ? 'Đang tải tên tài liệu...' : document?.fileName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={() => setShowClearAlert(true)}
            disabled={messages.length === 0}
            className="text-muted-foreground hover:text-destructive flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-30"
            title="Xóa lịch sử cuộc trò chuyện"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Xóa lịch sử</span>
          </Button>
        </div>
      </div>

      {/* Split screen content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane: Chat */}
        <div className="w-full md:w-1/2 lg:w-[45%] shrink-0 h-full flex flex-col">
          <ChatContainer
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={sendMessageMutation.isPending}
            onCitationClick={handleCitationClick}
            isDebugMode={isDebugMode}
          />
        </div>

        {/* Right pane: Document PDF Viewer */}
        <div className="hidden md:block flex-1 h-full">
          <PdfViewer
            fileUrl={document?.storageUrl}
            fileType={document?.fileType}
            activePage={activePage}
            onPageChange={setActivePage}
          />
        </div>
      </div>

      {/* Clear Chat History AlertDialog */}
      <AlertDialog open={showClearAlert} onOpenChange={setShowClearAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc muốn xóa lịch sử cuộc trò chuyện này không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa sạch toàn bộ tin nhắn hỏi đáp của tài liệu hiện tại. Bạn sẽ không thể phục hồi lại nội dung này.
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
