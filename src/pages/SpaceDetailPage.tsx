import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, Upload, Loader2, Bot, AlertCircle, BookOpen } from 'lucide-react';
import { useSpaceDetail, useUploadDocument, useDeleteDocument } from '@/features/chat/hooks/useSpace';
import { useDocumentDetails, useSendChatMessage } from '@/features/chat/hooks/useChat';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
import type { Message } from '@/features/chat/types';

export const SpaceDetailPage: React.FC = () => {
  const { spaceId: spaceIdParam } = useParams<{ spaceId: string }>();
  const spaceId = Number(spaceIdParam);

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries & Mutations
  const { data: space, isLoading: isSpaceLoading, error: spaceError } = useSpaceDetail(spaceId);
  const { data: document, isLoading: isDocLoading } = useDocumentDetails(selectedDocId || 0);
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const sendMessageMutation = useSendChatMessage();

  // Reset chat when document selection changes
  useEffect(() => {
    setMessages([]);
    setActivePage(1);
  }, [selectedDocId]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNaN(spaceId)) return;

    if (file.type !== 'application/pdf') {
      alert('Vui lòng chỉ tải lên file PDF.');
      return;
    }

    setIsUploading(true);
    uploadDocMutation.mutate(
      { file, spaceId },
      {
        onSuccess: (data) => {
          setIsUploading(false);
          if (data && data.id) {
            setSelectedDocId(data.id);
          }
        },
        onError: (err: any) => {
          setIsUploading(false);
          alert('Tải tài liệu lên thất bại: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
        },
      }
    );
  };

  // Handle document deletion
  const handleDeleteDoc = (e: React.MouseEvent, docId: number) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) {
      deleteDocMutation.mutate(
        { id: docId, spaceId },
        {
          onSuccess: () => {
            if (selectedDocId === docId) {
              setSelectedDocId(null);
            }
          },
          onError: (err: any) => {
            alert('Xóa tài liệu thất bại: ' + (err.message || 'Lỗi kết nối'));
          },
        }
      );
    }
  };

  // Handle chat messaging
  const handleSendMessage = (text: string) => {
    if (!selectedDocId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    sendMessageMutation.mutate(
      {
        documentId: selectedDocId,
        question: text,
      },
      {
        onSuccess: (data) => {
          const assistantMessage: Message = {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: data.answerFound 
              ? data.answer 
              : 'Tôi không tìm thấy câu trả lời phù hợp trong tài liệu này.',
            citations: data.citations || [],
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: () => {
          const errorMessage: Message = {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: 'Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra lại dịch vụ backend.',
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

  // Error handling
  if (isNaN(spaceId) || spaceId <= 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Mã Không gian học tập không hợp lệ</h2>
          <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition text-sm">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (spaceError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Lỗi tải dữ liệu Space</h2>
          <p className="text-slate-400 text-sm">Không thể tải thông tin Không gian học tập từ máy chủ.</p>
          <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition text-sm">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Left Sidebar: Space details, Upload, Documents List */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
        {/* Header section */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Link 
            to="/dashboard" 
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
            title="Quay lại Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-200 truncate text-sm">
              {isSpaceLoading ? 'Đang tải...' : space?.name}
            </h2>
            <p className="text-[10px] text-slate-500 truncate">
              {isSpaceLoading ? 'Vui lòng đợi' : space?.description || 'Không gian học tập riêng biệt'}
            </p>
          </div>
        </div>

        {/* Upload widget */}
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2.5 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl text-indigo-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý PDF...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Tải lên tài liệu PDF
              </>
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
        </div>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <h3 className="px-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tài liệu trong Space</h3>
          
          {isSpaceLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
            </div>
          ) : space?.documents && space.documents.length === 0 ? (
            <div className="py-10 text-center px-4 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500">Chưa có tài liệu nào. Hãy tải lên file PDF để bắt đầu học tập.</p>
            </div>
          ) : (
            space?.documents.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300'
                      : 'hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-medium truncate">{doc.fileName}</span>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteDoc(e, doc.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Middle Panel: AI Chat Panel */}
      <section className="w-[420px] lg:w-[480px] shrink-0 border-r border-slate-800 flex flex-col h-full bg-slate-900">
        {selectedDocId ? (
          <ChatContainer
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={sendMessageMutation.isPending || isDocLoading}
            onCitationClick={handleCitationClick}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-slate-800/40 rounded-full border border-slate-700/50 text-indigo-400">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200">Bắt đầu Trò chuyện</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Vui lòng chọn một tài liệu PDF từ thanh bên trái hoặc tải file mới lên để khởi chạy Trợ lý AI.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Right Panel: PDF Viewer Panel */}
      <section className="flex-1 h-full bg-slate-950 overflow-hidden flex flex-col">
        {selectedDocId && document ? (
          <PdfViewer
            fileUrl={document.storageUrl}
            activePage={activePage}
            onPageChange={setActivePage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-600 text-center">
            <FileText className="w-12 h-12 text-slate-800 mb-2" />
            <p className="text-xs text-slate-500">Trình xem tài liệu PDF sẽ hiển thị tại đây.</p>
          </div>
        )}
      </section>
    </div>
  );
};
