import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';
import { useDocumentDetails, useSendChatMessage, useDocumentChatHistory, useClearDocumentChatHistory } from '@/features/chat/hooks/useChat';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
import type { Message } from '@/features/chat/types';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentId = Number(id);

  const [activePage, setActivePage] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);

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
      }));
      setMessages(formattedHistory);
    } else {
      setMessages([]);
    }
  }, [historyData]);

  const handleClearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử cuộc trò chuyện này không?')) {
      clearHistoryMutation.mutate(documentId);
    }
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Mã tài liệu không hợp lệ</h2>
          <p className="text-slate-400 text-sm">Vui lòng kiểm tra lại đường dẫn liên kết của tài liệu.</p>
          <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition text-sm">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (docError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Lỗi tải tài liệu</h2>
          <p className="text-slate-400 text-sm">Không thể tải được thông tin tài liệu từ máy chủ.</p>
          <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition text-sm">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Navbar */}
      <div className="flex items-center gap-4 px-6 h-14 bg-slate-900 border-b border-slate-800 shrink-0">
        <Link 
          to="/dashboard" 
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="h-4 w-[1px] bg-slate-800" />
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-slate-100 truncate text-sm sm:text-base">
            {isDocLoading ? 'Đang tải tên tài liệu...' : document?.fileName}
          </h1>
        </div>
        <button
          onClick={handleClearHistory}
          disabled={messages.length === 0}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-450 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1.5 text-xs font-semibold"
          title="Xóa lịch sử cuộc trò chuyện"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Xóa lịch sử</span>
        </button>
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
          />
        </div>

        {/* Right pane: Document PDF Viewer */}
        <div className="hidden md:block flex-1 h-full">
          <PdfViewer
            fileUrl={document?.storageUrl}
            activePage={activePage}
            onPageChange={setActivePage}
          />
        </div>
      </div>
    </div>
  );
};
