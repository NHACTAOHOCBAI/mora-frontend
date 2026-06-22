import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Bot,
  Sparkles,
  FileText,
  BookOpenCheck,
} from 'lucide-react';
import {
  useSpaceDetail,
  useUploadDocument,
  useDeleteDocument,
  useRenameDocument,
  useUpdateDocumentThreshold,
} from '@/features/chat/hooks/useSpace';
import {
  useDocumentDetails,
  useSendChatMessage,
  useSendSpaceChatMessage,
  useDocumentChatHistory,
  useSpaceChatHistory,
  useClearDocumentChatHistory,
  useClearSpaceChatHistory,
  useGenerateStudyNotes,
} from '@/features/chat/hooks/useChat';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
import type { Message } from '@/features/chat/types';
import { apiClient } from '@/services/api-client';
import { debugDocumentImages } from '@/features/chat/services/chat-api';
import type { DocumentImageDebugResponse } from '@/features/chat/types';
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
import { StudyNotesTab } from './components/StudyNotesTab';
import { DebugModal } from './components/DebugModal';

export const SpaceDetailPage: React.FC = () => {
  const { spaceId: spaceIdParam } = useParams<{ spaceId: string }>();
  const spaceId = Number(spaceIdParam);

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState<'document' | 'space'>('space');
  const [activePage, setActivePage] = useState<number>(1);
  const [docMessages, setDocMessages] = useState<Record<number, Message[]>>({});
  const [spaceMessages, setSpaceMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States cho bố cục co giãn và Note/Flashcard
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'study'>('chat');
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isDebugMode, setIsDebugMode] = useState<boolean>(() => {
    return localStorage.getItem('mora_dev_mode') === 'true';
  });
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugImagesData, setDebugImagesData] = useState<DocumentImageDebugResponse[]>([]);
  const [isDebugImagesLoading, setIsDebugImagesLoading] = useState(false);
  const [debugDocName, setDebugDocName] = useState('');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [vectorPathThreshold, setVectorPathThreshold] = useState<number>(30);

  // AlertDialog states
  const [showClearHistoryAlert, setShowClearHistoryAlert] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: number; name: string } | null>(null);

  // Queries & Mutations
  const { data: space, isLoading: isSpaceLoading, error: spaceError } = useSpaceDetail(spaceId);
  const { data: document, isLoading: isDocLoading } = useDocumentDetails(selectedDocId || 0);
  const generateNotesMutation = useGenerateStudyNotes();
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const renameDocMutation = useRenameDocument();
  const sendMessageMutation = useSendChatMessage();
  const sendSpaceMessageMutation = useSendSpaceChatMessage();
  const updateThresholdMutation = useUpdateDocumentThreshold();

  const currentDoc = space?.documents?.find((d) => d.id === selectedDocId);

  useEffect(() => {
    if (
      chatMode === 'document' &&
      currentDoc &&
      currentDoc.vectorPathThreshold !== undefined &&
      currentDoc.vectorPathThreshold !== null
    ) {
      setVectorPathThreshold(currentDoc.vectorPathThreshold);
    } else {
      setVectorPathThreshold(30);
    }
  }, [selectedDocId, chatMode, currentDoc]);

  const handleThresholdChangeFinished = (val: number) => {
    if (chatMode === 'document' && selectedDocId && currentDoc) {
      if (val !== currentDoc.vectorPathThreshold) {
        updateThresholdMutation.mutate(
          { id: selectedDocId, threshold: val, spaceId },
          {
            onSuccess: () => {
              toast.success('Đã cập nhật ngưỡng vector path!');
              // Reload debug details if debug modal is active
              if (showDebugModal) {
                setIsDebugImagesLoading(true);
                apiClient
                  .get(`/documents/${selectedDocId}/debug-images`)
                  .then((res) => setDebugImagesData(res.data))
                  .catch((err) => console.error(err))
                  .finally(() => setIsDebugImagesLoading(false));
              }
            },
            onError: (err: any) => {
              toast.error('Cập nhật ngưỡng thất bại: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
            },
          }
        );
      }
    }
  };

  // Chat History hooks
  const { data: spaceHistoryData } = useSpaceChatHistory(spaceId);
  const { data: docHistoryData } = useDocumentChatHistory(selectedDocId || 0);

  // Clear History mutations
  const clearSpaceHistoryMutation = useClearSpaceChatHistory();
  const clearDocHistoryMutation = useClearDocumentChatHistory();

  // Load space chat history from DB
  useEffect(() => {
    if (spaceHistoryData) {
      const formattedHistory: Message[] = spaceHistoryData.map((msg) => ({
        id: String(msg.id),
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        citations: msg.citations || [],
        condensedQuestion: msg.condensedQuestion,
        promptSent: msg.promptSent,
      }));
      setSpaceMessages(formattedHistory);
    } else {
      setSpaceMessages([]);
    }
  }, [spaceHistoryData]);

  // Load document chat history from DB
  useEffect(() => {
    if (selectedDocId && docHistoryData) {
      const formattedHistory: Message[] = docHistoryData.map((msg) => ({
        id: String(msg.id),
        sender: msg.sender,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        citations: msg.citations || [],
        condensedQuestion: msg.condensedQuestion,
        promptSent: msg.promptSent,
      }));
      setDocMessages((prev) => ({
        ...prev,
        [selectedDocId]: formattedHistory,
      }));
    } else if (selectedDocId) {
      setDocMessages((prev) => ({
        ...prev,
        [selectedDocId]: [],
      }));
    }
  }, [docHistoryData, selectedDocId]);

  const handleClearHistoryConfirm = () => {
    if (chatMode === 'space') {
      clearSpaceHistoryMutation.mutate(spaceId, {
        onSuccess: () => {
          toast.success('Đã xóa lịch sử chat của Không gian!');
          setShowClearHistoryAlert(false);
        },
        onError: (err: any) => {
          toast.error('Không thể xóa lịch sử chat: ' + (err.message || 'Lỗi kết nối'));
          setShowClearHistoryAlert(false);
        },
      });
    } else if (selectedDocId) {
      clearDocHistoryMutation.mutate(selectedDocId, {
        onSuccess: () => {
          toast.success('Đã xóa lịch sử chat của tài liệu!');
          setShowClearHistoryAlert(false);
        },
        onError: (err: any) => {
          toast.error('Không thể xóa lịch sử chat: ' + (err.message || 'Lỗi kết nối'));
          setShowClearHistoryAlert(false);
        },
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNaN(spaceId)) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg');

    if (!isPdf && !isImage) {
      toast.error('Vui lòng chỉ tải lên tài liệu PDF hoặc hình ảnh (PNG, JPG, JPEG).');
      return;
    }

    setIsUploading(true);
    uploadDocMutation.mutate(
      { file, spaceId, vectorPathThreshold },
      {
        onSuccess: (data) => {
          setIsUploading(false);
          toast.success('Đã tải tài liệu lên thành công!');
          if (data && data.id) {
            setSelectedDocId(data.id);
            setChatMode('document');
            setActivePage(1);
          }
        },
        onError: (err: any) => {
          setIsUploading(false);
          toast.error('Tải tài liệu lên thất bại: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
        },
      }
    );
  };

  // Handle document deletion
  const handleDeleteDocConfirm = () => {
    if (!docToDelete) return;
    deleteDocMutation.mutate(
      { id: docToDelete.id, spaceId },
      {
        onSuccess: () => {
          toast.success('Đã xóa tài liệu thành công!');
          if (selectedDocId === docToDelete.id) {
            setSelectedDocId(null);
            setChatMode('space');
          }
          setDocToDelete(null);
        },
        onError: (err: any) => {
          toast.error('Xóa tài liệu thất bại: ' + (err.message || 'Lỗi kết nối'));
          setDocToDelete(null);
        },
      }
    );
  };

  // Handle document renaming
  const handleRenameClick = (e: React.MouseEvent, docId: number, currentName: string) => {
    e.stopPropagation();
    setEditingDocId(docId);
    setRenameValue(currentName.toLowerCase().endsWith('.pdf') ? currentName.slice(0, -4) : currentName);
  };

  const handleRenameConfirm = (e: React.FormEvent | React.MouseEvent, docId: number) => {
    e.stopPropagation();
    if (e.type === 'submit') {
      e.preventDefault();
    }
    if (!renameValue.trim()) return;

    renameDocMutation.mutate(
      { id: docId, fileName: renameValue.trim() + '.pdf', spaceId },
      {
        onSuccess: () => {
          toast.success('Đổi tên tài liệu thành công!');
          setEditingDocId(null);
        },
        onError: (err: any) => {
          toast.error('Đổi tên tài liệu thất bại: ' + (err.message || 'Lỗi kết nối'));
        },
      }
    );
  };

  const handleRenameCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingDocId(null);
  };

  const handleOpenDebugModal = async (e: React.MouseEvent, docId: number, fileName: string) => {
    e.stopPropagation();
    setSelectedDocId(docId);
    setChatMode('document');
    setDebugDocName(fileName);
    setIsDebugImagesLoading(true);
    setShowDebugModal(true);
    try {
      const data = await debugDocumentImages(docId);
      setDebugImagesData(data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu debug hình ảnh');
    } finally {
      setIsDebugImagesLoading(false);
    }
  };

  // Handle chat messaging
  const handleSendMessage = (text: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    if (chatMode === 'space') {
      setSpaceMessages((prev) => [...prev, userMessage]);

      sendSpaceMessageMutation.mutate(
        {
          spaceId,
          question: text,
        },
        {
          onSuccess: (data) => {
            const assistantMessage: Message = {
              id: `ai-${Date.now()}`,
              sender: 'assistant',
              text: data.answer,
              citations: data.citations || [],
              timestamp: new Date(),
              condensedQuestion: data.condensedQuestion,
              promptSent: data.promptSent,
            };
            setSpaceMessages((prev) => [...prev, assistantMessage]);
          },
          onError: () => {
            const errorMessage: Message = {
              id: `err-${Date.now()}`,
              sender: 'assistant',
              text: 'Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra lại dịch vụ backend.',
              timestamp: new Date(),
            };
            setSpaceMessages((prev) => [...prev, errorMessage]);
          },
        }
      );
    } else {
      if (!selectedDocId) return;

      setDocMessages((prev) => ({
        ...prev,
        [selectedDocId]: [...(prev[selectedDocId] || []), userMessage],
      }));

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
              text: data.answer,
              citations: data.citations || [],
              timestamp: new Date(),
              condensedQuestion: data.condensedQuestion,
              promptSent: data.promptSent,
            };
            setDocMessages((prev) => ({
              ...prev,
              [selectedDocId]: [...(prev[selectedDocId] || []), assistantMessage],
            }));
          },
          onError: () => {
            const errorMessage: Message = {
              id: `err-${Date.now()}`,
              sender: 'assistant',
              text: 'Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra lại dịch vụ backend.',
              timestamp: new Date(),
            };
            setDocMessages((prev) => ({
              ...prev,
              [selectedDocId]: [...(prev[selectedDocId] || []), errorMessage],
            }));
          },
        }
      );
    }
  };

  const handleCitationClick = (pageNumber: number, docId?: number) => {
    if (docId) {
      setSelectedDocId(docId);
    }
    setActivePage(pageNumber);
  };

  // Error handling (Light Mode)
  if (isNaN(spaceId) || spaceId <= 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <div className="max-w-md text-center space-y-4 bg-card p-8 rounded-2xl shadow-md border border-border">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Mã Không gian học tập không hợp lệ</h2>
          <Link to="/dashboard">
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
          <Link to="/dashboard">
            <Button className="cursor-pointer">Quay lại Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* 1. Left Sidebar: Collapsible component */}
      <SpaceSidebar
        space={space}
        isSpaceLoading={isSpaceLoading}
        selectedDocId={selectedDocId}
        setSelectedDocId={setSelectedDocId}
        chatMode={chatMode}
        setChatMode={setChatMode}
        activePage={activePage}
        setActivePage={setActivePage}
        isChatCollapsed={isChatCollapsed}
        setIsChatCollapsed={setIsChatCollapsed}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        isDebugMode={isDebugMode}
        setIsDebugMode={setIsDebugMode}
        vectorPathThreshold={vectorPathThreshold}
        setVectorPathThreshold={setVectorPathThreshold}
        handleThresholdChangeFinished={handleThresholdChangeFinished}
        updateThresholdPending={updateThresholdMutation.isPending}
        editingDocId={editingDocId}
        setEditingDocId={setEditingDocId}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        handleRenameClick={handleRenameClick}
        handleRenameConfirm={handleRenameConfirm}
        handleRenameCancel={handleRenameCancel}
        renamePending={renameDocMutation.isPending}
        setDocToDelete={setDocToDelete}
        handleOpenDebugModal={handleOpenDebugModal}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      {/* 2. Middle Panel: AI Chat Panel or Study Notes Tab */}
      {!isChatCollapsed && (
        <section className="w-[420px] lg:w-[480px] shrink-0 border-r border-border bg-card flex flex-col h-full min-h-0 relative overflow-hidden shadow-xs">
          {/* Tabs header (Chỉ hiển thị khi đã chọn 1 tài liệu cụ thể) */}
          {chatMode === 'document' && selectedDocId ? (
            <div className="flex items-center justify-between px-6 h-16 bg-card border-b border-border/60 shrink-0">
              <div className="flex gap-4 h-full">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`h-full border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'chat'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Hỏi đáp AI
                </button>
                <button
                  onClick={() => setActiveTab('study')}
                  className={`h-full border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'study'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  Tóm tắt & Ôn tập
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowClearHistoryAlert(true)}
                  disabled={activeTab !== 'chat' || (selectedDocId ? docMessages[selectedDocId] || [] : []).length === 0}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-30"
                  title="Xóa lịch sử cuộc trò chuyện"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatCollapsed(true)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Thu gọn khung này"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-6 h-16 bg-card border-b border-border/60 shrink-0">
              <span className="text-xs font-bold text-foreground tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatCollapsed(true)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Thu gọn khung chat"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Nội dung theo Tab hoặc Mode */}
          {activeTab === 'chat' || chatMode === 'space' ? (
            chatMode === 'space' ? (
              <ChatContainer
                messages={spaceMessages}
                onSendMessage={handleSendMessage}
                isLoading={sendSpaceMessageMutation.isPending}
                onCitationClick={handleCitationClick}
                isDebugMode={isDebugMode}
              />
            ) : selectedDocId ? (
              <ChatContainer
                messages={docMessages[selectedDocId] || []}
                onSendMessage={handleSendMessage}
                isLoading={sendMessageMutation.isPending || isDocLoading}
                onCitationClick={handleCitationClick}
                isDebugMode={isDebugMode}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-muted/10">
                <div className="p-4 bg-muted rounded-full border border-border text-foreground shadow-xs">
                  <Bot className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Bắt đầu Trò chuyện</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Vui lòng chọn một tài liệu PDF từ thanh bên trái hoặc tải file mới lên để khởi chạy Trợ lý AI.
                  </p>
                </div>
              </div>
            )
          ) : (
            // Tab Study Helper component
            <StudyNotesTab
              document={document}
              isDocLoading={isDocLoading}
              generateNotesPending={generateNotesMutation.isPending}
              handleTriggerGenerateNotes={() => {
                if (selectedDocId) {
                  generateNotesMutation.mutate(selectedDocId);
                }
              }}
            />
          )}
        </section>
      )}

      {/* 3. Right Panel: PDF Viewer Panel */}
      <section className="flex-1 h-full bg-muted/40 overflow-hidden flex flex-col relative">
        {/* Nút Floating để mở lại panel chat nếu đã collapse */}
        {isChatCollapsed && (
          <button
            onClick={() => setIsChatCollapsed(false)}
            className="absolute left-4 top-4 bg-card hover:bg-muted border border-border p-2.5 rounded-xl shadow-lg z-20 text-foreground flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 animate-bounce" />
            Hiện Trợ lý & Tóm tắt
          </button>
        )}

        {selectedDocId && document ? (
          <PdfViewer
            fileUrl={document.storageUrl}
            fileType={document.fileType}
            activePage={activePage}
            onPageChange={setActivePage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground text-center bg-muted/10">
            <FileText className="w-12 h-12 text-muted-foreground/45 mb-2" />
            <p className="text-xs text-muted-foreground">Trình xem tài liệu PDF/Hình ảnh sẽ hiển thị tại đây.</p>
          </div>
        )}
      </section>

      {/* Debug Modal */}
      <DebugModal
        showDebugModal={showDebugModal}
        setShowDebugModal={setShowDebugModal}
        debugDocName={debugDocName}
        isDebugImagesLoading={isDebugImagesLoading}
        debugImagesData={debugImagesData}
        selectedDocId={selectedDocId}
        setZoomImageUrl={setZoomImageUrl}
        zoomImageUrl={zoomImageUrl}
      />

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

      {/* Delete Document AlertDialog */}
      <AlertDialog open={docToDelete !== null} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có muốn xóa tài liệu này?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài liệu &rdquo;{docToDelete?.name}&rdquo; sẽ bị xóa vĩnh viễn khỏi không gian học tập cùng tất cả dữ liệu hình ảnh, tóm tắt, flashcard và lịch sử chat liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocConfirm}
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
