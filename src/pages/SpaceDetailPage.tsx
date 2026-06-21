import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  FileText,
  Trash2,
  Upload,
  Loader2,
  Bot,
  AlertCircle,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BookOpenCheck,
  Layers,
  RotateCw,
  Edit2,
  Check,
  X,
  Bug,
  Image,
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
  useGenerateStudyNotes,
  useDocumentChatHistory,
  useSpaceChatHistory,
  useClearDocumentChatHistory,
  useClearSpaceChatHistory,
} from '@/features/chat/hooks/useChat';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
import type { Message } from '@/features/chat/types';
import { apiClient } from '@/services/api-client';
import { debugDocumentImages } from '@/features/chat/services/chat-api';
import type { DocumentImageDebugResponse } from '@/features/chat/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { UserMenu } from '@/components/shared/UserMenu';
import { toast } from 'sonner';

interface DebugImageProps {
  docId: number;
  pageNumber: number;
  imgName: string;
  onZoom: (url: string) => void;
}

const DebugImage: React.FC<DebugImageProps> = ({ docId, pageNumber, imgName, onZoom }) => {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let localUrl = '';
    apiClient
      .get(`/documents/${docId}/pages/${pageNumber}/images/${imgName}`, { responseType: 'blob' })
      .then((res) => {
        if (active) {
          localUrl = URL.createObjectURL(res.data);
          setSrc(localUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [docId, pageNumber, imgName]);

  if (loading) {
    return (
      <div className="w-12 h-12 bg-muted animate-pulse rounded-lg border border-border flex items-center justify-center text-[9px] text-muted-foreground shrink-0">
        Tải...
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center justify-center text-[9px] font-medium shrink-0">
        Lỗi
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={imgName}
      className="w-12 h-12 object-cover rounded-lg border border-border shadow-xs cursor-zoom-in hover:scale-105 active:scale-95 transition-all duration-150 shrink-0 bg-muted"
      onClick={() => onZoom(src)}
    />
  );
};

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
  const [studySubTab, setStudySubTab] = useState<'summary' | 'flashcards'>('summary');
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
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

  // Helper render Markdown sử dụng ReactMarkdown chuẩn hóa
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-xs text-muted-foreground leading-relaxed mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h2 className="text-lg font-black text-foreground mt-6 mb-3">{children}</h2>,
          h2: ({ children }) => <h3 className="text-base font-bold text-foreground mt-5 mb-2 border-b border-border pb-1">{children}</h3>,
          h3: ({ children }) => <h4 className="text-sm font-bold text-foreground mt-4 mb-2">{children}</h4>,
          h4: ({ children }) => <h5 className="text-xs font-bold text-foreground mt-3 mb-1.5">{children}</h5>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-xs text-muted-foreground mb-1.5">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-border rounded-xl shadow-xs">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/80 border-b border-border font-semibold">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-2.5 font-bold text-foreground border-r border-border last:border-r-0">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 border-b border-border/50 border-r border-border/50 last:border-r-0 last:border-b-0 align-top">{children}</td>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors last:border-b-0">{children}</tr>,
        }}
      >
        {text}
      </ReactMarkdown>
    );
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

  // Parse flashcards JSON safely
  let flashcardsList: { question: string; answer: string }[] = [];
  try {
    if (document?.flashcards) {
      flashcardsList = JSON.parse(document.flashcards);
    }
  } catch (e) {
    console.error('Lỗi parse flashcard: ', e);
  }

  const handleTriggerGenerateNotes = () => {
    if (!selectedDocId) return;
    generateNotesMutation.mutate(selectedDocId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* 1. Left Sidebar: Collapsible */}
      {isSidebarCollapsed ? (
        <aside className="w-16 border-r border-border bg-card flex flex-col items-center py-4 shrink-0 justify-between">
          <div className="flex flex-col items-center gap-4 w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(false)}
              className="cursor-pointer"
              title="Mở rộng thanh bên"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-8 h-px bg-border my-1" />
            <Button
              onClick={() => {
                setChatMode('space');
                setIsChatCollapsed(false);
              }}
              variant={chatMode === 'space' && !isChatCollapsed ? 'default' : 'outline'}
              size="icon"
              className="rounded-xl cursor-pointer"
              title="Trợ lý Không gian"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              className="rounded-xl cursor-pointer"
              title="Tải tài liệu (PDF/Ảnh)"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <UserMenu />
            <ThemeToggle />
          </div>
        </aside>
      ) : (
        <aside className="w-80 border-r border-border bg-card flex flex-col shrink-0">
          {/* Header section */}
          <div className="px-4 h-14 border-b border-border flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-foreground truncate text-sm">
                  {isSpaceLoading ? 'Đang tải...' : space?.name}
                </h2>
                <p className="text-[10px] text-muted-foreground truncate">
                  {isSpaceLoading ? 'Vui lòng đợi' : space?.description || 'Không gian học tập riêng biệt'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(true)}
              className="cursor-pointer"
              title="Thu nhỏ thanh bên"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload widget */}
          <div className="p-4 border-b border-border space-y-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý tài liệu...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Tải tài liệu (PDF/Ảnh)
                </>
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />

            {/* Vector Path Threshold Setting */}
            {isDebugMode && (
              <div className="bg-muted border border-border rounded-xl p-2.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Ngưỡng Vector Path
                  </label>
                  <span className="text-[10px] font-extrabold text-foreground bg-background border border-border px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    {updateThresholdMutation.isPending && <Loader2 className="w-3 h-3 animate-spin text-foreground" />}
                    {vectorPathThreshold}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={vectorPathThreshold}
                  onChange={(e) => setVectorPathThreshold(Number(e.target.value))}
                  onMouseUp={(e) => handleThresholdChangeFinished(Number((e.target as HTMLInputElement).value))}
                  onTouchEnd={(e) => handleThresholdChangeFinished(Number((e.target as HTMLInputElement).value))}
                  disabled={updateThresholdMutation.isPending}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground font-medium px-0.5">
                  <span>Nhỏ (Nhạy)</span>
                  <span>Lớn</span>
                </div>
                {chatMode === 'document' && selectedDocId && (
                  <div className="text-[9px] text-foreground font-medium text-center pt-0.5 animate-pulse">
                    Kéo thả để cập nhật lại tài liệu hiện tại
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Documents list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <h3 className="px-2 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Tác vụ & Tài liệu
            </h3>

            {/* Debug Mode Toggle */}
            <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-xl bg-muted border border-border shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chế độ Debug</span>
              <button
                onClick={() => {
                  const newValue = !isDebugMode;
                  setIsDebugMode(newValue);
                  localStorage.setItem('mora_dev_mode', String(newValue));
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDebugMode ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition duration-200 ease-in-out ${
                    isDebugMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Space Assistant entry */}
            <div
              onClick={() => {
                setChatMode('space');
                setIsChatCollapsed(false);
              }}
              className={`flex items-center gap-2.5 p-2.5 mb-2 rounded-xl cursor-pointer transition-all duration-200 border ${
                chatMode === 'space' && !isChatCollapsed
                  ? 'bg-muted border-border text-foreground font-semibold shadow-xs'
                  : 'hover:bg-muted/65 border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 shrink-0 ${
                  chatMode === 'space' && !isChatCollapsed ? 'text-foreground' : 'text-muted-foreground'
                }`}
              />
              <span className="text-xs">Trợ lý Không gian</span>
            </div>

            <h3 className="px-2 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Danh sách tài liệu
            </h3>

            {isSpaceLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : space?.documents && space.documents.length === 0 ? (
              <div className="py-10 text-center px-4 space-y-2">
                <BookOpen className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  Chưa có tài liệu nào. Hãy tải tài liệu PDF hoặc hình ảnh để bắt đầu học tập.
                </p>
              </div>
            ) : (
              space?.documents.map((doc) => {
                const isSelected = selectedDocId === doc.id && chatMode === 'document';
                return (
                  <div key={doc.id} className="space-y-1 bg-card rounded-xl p-0.5 border border-border/30">
                    <div
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setChatMode('document');
                        setActivePage(1);
                        setIsChatCollapsed(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                        isSelected && !isChatCollapsed
                          ? 'bg-muted border-border text-foreground font-semibold shadow-xs'
                          : 'hover:bg-muted/65 border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {editingDocId === doc.id ? (
                        <form
                          onSubmit={(e) => handleRenameConfirm(e, doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 min-w-0 flex-1 mr-2"
                        >
                          <FileText className="w-4 h-4 shrink-0 text-foreground" />
                          <Input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingDocId(null);
                              }
                            }}
                            className="flex-1 h-7 text-xs px-2"
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            disabled={renameDocMutation.isPending}
                            className="h-6 w-6 text-emerald-600 cursor-pointer"
                            title="Xác nhận"
                          >
                            {renameDocMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRenameCancel}
                            className="h-6 w-6 text-destructive cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <FileText
                              className={`w-4 h-4 shrink-0 ${
                                isSelected && !isChatCollapsed ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            />
                            <span className="text-xs truncate" title={doc.fileName}>
                              {doc.fileName}
                            </span>
                            <span
                              className="text-[9px] font-extrabold text-foreground bg-muted border border-border px-1 py-0.2 rounded shrink-0 ml-1"
                              title="Vector Path Threshold"
                            >
                              {doc.vectorPathThreshold ?? 30}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            {isDebugMode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleOpenDebugModal(e, doc.id, doc.fileName)}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Debug hình ảnh"
                              >
                                <Bug className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleRenameClick(e, doc.id, doc.fileName)}
                              className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Đổi tên"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocToDelete({ id: doc.id, name: doc.fileName });
                              }}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Xóa tài liệu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    {isDebugMode && doc.pagesWithImages && doc.pagesWithImages.length > 0 && (
                      <div className="pl-9 pr-2.5 pb-2 text-[10px] text-muted-foreground flex flex-wrap items-center gap-1.5 bg-muted rounded-lg p-2 border border-border">
                        <span className="font-bold flex items-center gap-1 text-[10px] text-foreground uppercase tracking-wider shrink-0">
                          <Image className="w-3.5 h-3.5" /> Trang:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {doc.pagesWithImages.map((pNum) => (
                            <button
                              key={pNum}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocId(doc.id);
                                setChatMode('document');
                                setActivePage(pNum);
                                setIsChatCollapsed(false);
                              }}
                              className={`px-1.5 py-0.5 rounded font-bold border transition cursor-pointer text-[9px] ${
                                isSelected && activePage === pNum
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                  : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Trang {pNum}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {isDebugMode && (!doc.pagesWithImages || doc.pagesWithImages.length === 0) && (
                      <div className="pl-9 pb-1.5 text-[9px] text-muted-foreground/60 italic">
                        Không phát hiện ảnh trên trang nào
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Tài khoản</span>
            <div className="flex items-center gap-2">
              <UserMenu />
              <ThemeToggle />
            </div>
          </div>
        </aside>
      )}

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
            // Tab Study Helper: Tóm tắt & Flashcards
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/5">
              {/* Nếu đang gọi API sinh dữ liệu */}
              {generateNotesMutation.isPending ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-card">
                  <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground">AI đang phân tích tài liệu...</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Quá trình này bóc tách toàn bộ tài liệu để viết tóm tắt học thuật & sinh flashcards ôn tập. Vui
                      lòng đợi trong giây lát.
                    </p>
                  </div>
                </div>
              ) : isDocLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : document && (document.summary || document.flashcards) ? (
                // Đã có dữ liệu
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Sub-tabs: Tóm tắt vs Flashcards */}
                  <div className="flex px-4 py-2 border-b border-border bg-card gap-2">
                    <Button
                      onClick={() => setStudySubTab('summary')}
                      variant={studySubTab === 'summary' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Bản tóm tắt
                    </Button>
                    <Button
                      onClick={() => {
                        setStudySubTab('flashcards');
                        setCurrentFlashIndex(0);
                        setIsFlipped(false);
                      }}
                      variant={studySubTab === 'flashcards' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      Flashcards ({flashcardsList.length})
                    </Button>
                  </div>

                  {/* Nội dung Sub-tab */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {studySubTab === 'summary' ? (
                      <div className="bg-card border border-border p-5 rounded-2xl shadow-xs prose prose-sm max-w-none dark:prose-invert">
                        {renderMarkdown(document.summary || '')}
                      </div>
                    ) : (
                      // Flashcards Deck
                      <div className="h-full flex flex-col justify-between py-4">
                        {flashcardsList.length > 0 ? (
                          <div className="space-y-6">
                            {/* The Interactive Card */}
                            <div
                              onClick={() => setIsFlipped(!isFlipped)}
                              className="w-full min-h-[200px] bg-card border border-border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-center items-center text-center relative overflow-hidden select-none hover:border-primary/40"
                            >
                              <div className="absolute top-3 right-3 text-[10px] text-muted-foreground font-semibold uppercase bg-muted px-2 py-0.5 rounded border border-border">
                                {isFlipped ? 'Đáp án' : 'Câu hỏi'}
                              </div>

                              {!isFlipped ? (
                                <div className="space-y-3">
                                  <div className="w-fit mx-auto px-2.5 py-1 bg-muted text-foreground text-[10px] font-bold rounded-full border border-border uppercase tracking-wide">
                                    Question
                                  </div>
                                  <p className="text-sm font-bold text-foreground leading-relaxed px-2">
                                    {flashcardsList[currentFlashIndex]?.question}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 pt-4 font-medium">
                                    <RotateCw className="w-3.5 h-3.5" />
                                    Click để xem đáp án
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="w-fit mx-auto px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-wide">
                                    Answer
                                  </div>
                                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed px-2">
                                    {flashcardsList[currentFlashIndex]?.answer}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 pt-4 font-medium">
                                    <RotateCw className="w-3.5 h-3.5" />
                                    Click để xem câu hỏi
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Deck controls */}
                            <div className="flex items-center justify-between px-4">
                              <Button
                                onClick={() => {
                                  if (currentFlashIndex > 0) {
                                    setCurrentFlashIndex((prev) => prev - 1);
                                    setIsFlipped(false);
                                  }
                                }}
                                disabled={currentFlashIndex === 0}
                                variant="outline"
                                size="icon"
                                className="cursor-pointer"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </Button>

                              <span className="text-xs font-bold text-muted-foreground">
                                {currentFlashIndex + 1} / {flashcardsList.length}
                              </span>

                              <Button
                                onClick={() => {
                                  if (currentFlashIndex < flashcardsList.length - 1) {
                                    setCurrentFlashIndex((prev) => prev + 1);
                                    setIsFlipped(false);
                                  }
                                }}
                                disabled={currentFlashIndex === flashcardsList.length - 1}
                                variant="outline"
                                size="icon"
                                className="cursor-pointer"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground text-xs">
                            Không có Flashcards nào được tạo.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Chưa sinh dữ liệu -> Show card mời bấm
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 bg-card">
                  <div className="p-4 bg-muted border border-border rounded-full text-foreground shadow-xs animate-pulse">
                    <BookOpenCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground">Tạo Tóm tắt & Flashcards</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Đúc kết các điểm mấu chốt trong tài liệu và tạo bộ câu hỏi ôn luyện thông minh tự động bằng mô
                      hình AI Gemini.
                    </p>
                  </div>
                  <Button
                    onClick={handleTriggerGenerateNotes}
                    className="flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl cursor-pointer text-sm shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Bắt đầu tạo bằng AI
                  </Button>
                </div>
              )}
            </div>
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
      {showDebugModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-foreground" />
                <h3 className="font-bold text-foreground text-sm">
                  Debug Chi tiết Trang: <span className="text-primary font-semibold">{debugDocName}</span>
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDebugModal(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 scrollbar-thin">
              {isDebugImagesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Đang bóc tách và phân tích các trang PDF...
                  </span>
                </div>
              ) : debugImagesData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs">Không tìm thấy dữ liệu debug.</div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground bg-muted p-2.5 rounded-lg border border-border leading-relaxed">
                    💡 <strong>Nguyên lý lọc 2 tầng:</strong> Hệ thống bóc tách các hình ảnh từ file PDF.{' '}
                    <strong>Tầng 1 (Kích thước & Tỉ lệ):</strong> Lọc bỏ ảnh nhỏ hơn hoặc bằng 200x200 px hoặc có tỉ
                    lệ dị (dẹt/dọc &gt; 3.0). <strong>Tầng 2 (MD5 trùng):</strong> Lọc bỏ các ảnh xuất hiện từ 2 lần
                    trở lên ở các trang khác nhau (như logo, header, footer lặp lại).
                  </p>

                  <div className="divide-y divide-border">
                    {debugImagesData.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="py-4 flex flex-col sm:flex-row sm:items-start gap-2 justify-between"
                      >
                        <div className="font-bold text-xs text-foreground min-w-[80px] flex flex-col gap-1">
                          <span>Trang {page.pageNumber}</span>
                          <span
                            className="text-[10px] text-foreground font-semibold bg-muted border border-border rounded px-1.5 py-0.5 w-max"
                            title="Tổng số Vector Path đếm được"
                          >
                            Vector: {page.vectorPathCount ?? 0}
                          </span>
                        </div>
                        <div className="flex-1 space-y-3">
                          {/* Văn bản trích xuất */}
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Văn bản trích xuất:
                            </span>
                            {page.pageContent ? (
                              <div className="bg-muted border border-border rounded-lg p-2.5 max-h-32 overflow-y-auto text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                {page.pageContent}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Không có văn bản trích xuất trên trang này
                              </span>
                            )}
                          </div>

                          {/* Hình ảnh phát hiện */}
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1 font-semibold">
                              Hình ảnh:
                            </span>
                            {page.images.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground italic block mt-0.5">
                                Không phát hiện ảnh hay đối tượng đồ họa nào
                              </span>
                            ) : (
                              <div className="grid grid-cols-1 gap-1.5 mt-1">
                                {page.images.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-4 text-[11px] bg-muted hover:bg-muted/80 p-2 rounded-lg border border-border/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      {img.type === 'PDImageXObject' && selectedDocId && (
                                        <DebugImage
                                          docId={selectedDocId}
                                          pageNumber={page.pageNumber}
                                          imgName={img.name}
                                          onZoom={setZoomImageUrl}
                                        />
                                      )}
                                      {img.type === 'VectorGraphics' && (
                                        <div className="w-12 h-12 bg-muted border border-border rounded-lg flex items-center justify-center text-foreground shrink-0">
                                          <Layers className="w-5 h-5" />
                                        </div>
                                      )}
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                                        <span
                                          className="font-mono bg-border/40 px-1 py-0.5 rounded text-[10px] text-foreground font-semibold truncate max-w-[80px]"
                                          title={img.name}
                                        >
                                          {img.name}
                                        </span>
                                        <span className="text-muted-foreground shrink-0">
                                          Kiểu:{' '}
                                          <strong className="text-foreground">
                                            {img.type === 'VectorGraphics' ? 'Sơ đồ Vector' : img.type}
                                          </strong>
                                        </span>
                                        {img.width > 0 && img.height > 0 && (
                                          <span className="text-muted-foreground shrink-0">
                                            Kích thước:{' '}
                                            <strong className="text-foreground">
                                              {img.width}x{img.height} px
                                            </strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 uppercase tracking-wider ${
                                        img.type === 'VectorGraphics'
                                          ? 'bg-muted text-foreground border border-border shadow-xs'
                                          : img.accepted
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                            : 'bg-border/60 text-muted-foreground border border-border/30'
                                      }`}
                                    >
                                      {img.type === 'VectorGraphics'
                                        ? 'Hợp lệ (Sơ đồ Vector)'
                                        : img.accepted
                                          ? 'Hợp lệ'
                                          : `Bị lọc: ${img.filterReason || 'Kích thước/Tỉ lệ dị'}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/40 flex justify-end">
              <Button onClick={() => setShowDebugModal(false)} className="cursor-pointer">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Lightbox */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-card rounded-2xl overflow-hidden p-2 shadow-2xl animate-in zoom-in-95 duration-200">
            <img src={zoomImageUrl} alt="Zoomed Debug View" className="max-h-[80vh] max-w-full object-contain rounded-xl" />
            <Button
              onClick={() => setZoomImageUrl(null)}
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-background/80 hover:bg-background text-foreground shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

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
