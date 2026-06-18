import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, Upload, Loader2, Bot, AlertCircle, BookOpen, Sparkles, ChevronLeft, ChevronRight, MessageSquare, BookOpenCheck, Layers, RotateCw, Edit2, Check, X, Bug } from 'lucide-react';
import { useSpaceDetail, useUploadDocument, useDeleteDocument, useRenameDocument } from '@/features/chat/hooks/useSpace';
import { 
  useDocumentDetails, 
  useSendChatMessage, 
  useSendSpaceChatMessage, 
  useGenerateStudyNotes,
  useDocumentChatHistory,
  useSpaceChatHistory,
  useClearDocumentChatHistory,
  useClearSpaceChatHistory
} from '@/features/chat/hooks/useChat';
import { ChatContainer } from '@/features/chat/components/ChatContainer';
import { PdfViewer } from '@/features/chat/components/PdfViewer';
import type { Message } from '@/features/chat/types';
import { apiClient } from '@/services/api-client';
import { debugDocumentImages } from '@/features/chat/services/chat-api';
import type { DocumentImageDebugResponse } from '@/features/chat/types';

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
    apiClient.get(`/documents/${docId}/pages/${pageNumber}/images/${imgName}`, { responseType: 'blob' })
      .then(res => {
        if (active) {
          const url = URL.createObjectURL(res.data);
          setSrc(url);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [docId, pageNumber, imgName]);

  if (loading) {
    return (
      <div className="w-12 h-12 bg-slate-100 animate-pulse rounded-lg border border-slate-200/50 flex items-center justify-center text-[9px] text-slate-400 shrink-0">
        Tải...
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-lg border border-rose-100 flex items-center justify-center text-[9px] font-medium shrink-0">
        Lỗi
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={imgName} 
      className="w-12 h-12 object-cover rounded-lg border border-slate-200/80 shadow-sm cursor-zoom-in hover:scale-105 active:scale-95 transition-all duration-150 shrink-0 bg-slate-50" 
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
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugImagesData, setDebugImagesData] = useState<DocumentImageDebugResponse[]>([]);
  const [isDebugImagesLoading, setIsDebugImagesLoading] = useState(false);
  const [debugDocName, setDebugDocName] = useState('');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Queries & Mutations
  const { data: space, isLoading: isSpaceLoading, error: spaceError } = useSpaceDetail(spaceId);
  const { data: document, isLoading: isDocLoading } = useDocumentDetails(selectedDocId || 0);
  const generateNotesMutation = useGenerateStudyNotes();
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const renameDocMutation = useRenameDocument();
  const sendMessageMutation = useSendChatMessage();
  const sendSpaceMessageMutation = useSendSpaceChatMessage();

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

  const handleClearHistory = () => {
    if (chatMode === 'space') {
      if (confirm('Bạn có chắc chắn muốn xóa lịch sử cuộc trò chuyện của Không gian học tập này?')) {
        clearSpaceHistoryMutation.mutate(spaceId);
      }
    } else {
      if (selectedDocId && confirm('Bạn có chắc chắn muốn xóa lịch sử cuộc trò chuyện của tài liệu này?')) {
        clearDocHistoryMutation.mutate(selectedDocId);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNaN(spaceId)) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || 
                    file.name.toLowerCase().endsWith('.png') || 
                    file.name.toLowerCase().endsWith('.jpg') || 
                    file.name.toLowerCase().endsWith('.jpeg');

    if (!isPdf && !isImage) {
      alert('Vui lòng chỉ tải lên tài liệu PDF hoặc hình ảnh (PNG, JPG, JPEG).');
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
            setChatMode('document');
            setActivePage(1);
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
              setChatMode('space');
            }
          },
          onError: (err: any) => {
            alert('Xóa tài liệu thất bại: ' + (err.message || 'Lỗi kết nối'));
          },
        }
      );
    }
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
          setEditingDocId(null);
        },
        onError: (err: any) => {
          alert('Đổi tên tài liệu thất bại: ' + (err.message || 'Lỗi kết nối'));
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
    setDebugDocName(fileName);
    setIsDebugImagesLoading(true);
    setShowDebugModal(true);
    try {
      const data = await debugDocumentImages(docId);
      setDebugImagesData(data);
    } catch (err) {
      console.error(err);
      alert('Không thể tải dữ liệu debug hình ảnh');
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
              text: data.answerFound 
                ? data.answer 
                : 'Tôi không tìm thấy câu trả lời phù hợp trong các tài liệu của không gian học tập.',
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
              text: data.answerFound 
                ? data.answer 
                : 'Tôi không tìm thấy câu trả lời phù hợp trong tài liệu này.',
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

  // Helper render Markdown thủ công
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2">{trimmed.replace('### ', '')}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-indigo-600 mt-5 mb-2 border-b border-slate-100 pb-1">{trimmed.replace('## ', '')}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-3">{trimmed.replace('# ', '')}</h2>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return <li key={idx} className="text-xs text-slate-600 ml-4 list-disc mb-1.5">{trimmed.substring(2)}</li>;
      }
      if (trimmed === '') return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2">{trimmed}</p>;
    });
  };

  // Error handling (Light Mode)
  if (isNaN(spaceId) || spaceId <= 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-6">
        <div className="max-w-md text-center space-y-4 bg-white p-8 rounded-2xl shadow-md border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Mã Không gian học tập không hợp lệ</h2>
          <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (spaceError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-6">
        <div className="max-w-md text-center space-y-4 bg-white p-8 rounded-2xl shadow-md border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Lỗi tải dữ liệu Space</h2>
          <p className="text-slate-500 text-sm">Không thể tải thông tin Không gian học tập từ máy chủ.</p>
          <Link to="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium">
            Quay lại Dashboard
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      
      {/* 1. Left Sidebar: Collapsible */}
      {isSidebarCollapsed ? (
        <aside className="w-16 border-r border-slate-200 bg-slate-50 flex flex-col items-center py-4 shrink-0 justify-between">
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Mở rộng thanh bên"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link 
              to="/dashboard" 
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-px bg-slate-200 my-1" />
            <button
              onClick={() => {
                setChatMode('space');
                setIsChatCollapsed(false);
              }}
              className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                chatMode === 'space' && !isChatCollapsed
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Trợ lý Không gian"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-indigo-50 border border-indigo-150 text-indigo-600 rounded-xl hover:bg-indigo-100 transition cursor-pointer"
              title="Tải tài liệu (PDF/Ảnh)"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </aside>
      ) : (
        <aside className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
          {/* Header section */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link 
                to="/dashboard" 
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                title="Quay lại Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-slate-800 truncate text-sm">
                  {isSpaceLoading ? 'Đang tải...' : space?.name}
                </h2>
                <p className="text-[10px] text-slate-500 truncate">
                  {isSpaceLoading ? 'Vui lòng đợi' : space?.description || 'Không gian học tập riêng biệt'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="Thu nhỏ thanh bên"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Upload widget */}
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-xl text-indigo-600 font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
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
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
          </div>

          {/* Documents list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <h3 className="px-2 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tác vụ & Tài liệu</h3>
            
            {/* Debug Mode Toggle */}
            <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-xl bg-slate-100 border border-slate-200/60 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chế độ Debug</span>
              <button
                onClick={() => setIsDebugMode(!isDebugMode)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDebugMode ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
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
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-semibold shadow-sm'
                  : 'hover:bg-slate-200/60 border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Sparkles className={`w-4 h-4 shrink-0 ${chatMode === 'space' && !isChatCollapsed ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-xs">Trợ lý Không gian</span>
            </div>

            <h3 className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Danh sách tài liệu</h3>

            {isSpaceLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : space?.documents && space.documents.length === 0 ? (
              <div className="py-10 text-center px-4 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">Chưa có tài liệu nào. Hãy tải tài liệu PDF hoặc hình ảnh để bắt đầu học tập.</p>
              </div>
            ) : (
              space?.documents.map((doc) => {
                const isSelected = selectedDocId === doc.id && chatMode === 'document';
                return (
                  <div key={doc.id} className="space-y-1 bg-white/40 rounded-xl p-0.5 border border-slate-200/30">
                    <div
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setChatMode('document');
                        setActivePage(1);
                        setIsChatCollapsed(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                        isSelected && !isChatCollapsed
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-semibold shadow-sm'
                          : 'hover:bg-slate-200/60 border-transparent text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {editingDocId === doc.id ? (
                        <form
                          onSubmit={(e) => handleRenameConfirm(e, doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 min-w-0 flex-1 mr-2"
                        >
                          <FileText className="w-4 h-4 shrink-0 text-indigo-600" />
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                               setEditingDocId(null);
                              }
                            }}
                            className="flex-1 bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="submit"
                            disabled={renameDocMutation.isPending}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                            title="Xác nhận"
                          >
                            {renameDocMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleRenameCancel}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <FileText className={`w-4 h-4 shrink-0 ${isSelected && !isChatCollapsed ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="text-xs truncate" title={doc.fileName}>{doc.fileName}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={(e) => handleOpenDebugModal(e, doc.id, doc.fileName)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
                              title="Debug hình ảnh"
                            >
                              <Bug className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleRenameClick(e, doc.id, doc.fileName)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
                              title="Đổi tên"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteDoc(e, doc.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                              title="Xóa tài liệu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {isDebugMode && doc.pagesWithImages && doc.pagesWithImages.length > 0 && (
                      <div className="pl-9 pr-2.5 pb-2 text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5 bg-slate-50/70 rounded-lg p-2 border border-slate-200/40">
                        <span className="font-bold flex items-center gap-0.5 text-[10px] text-indigo-600 uppercase tracking-wider shrink-0">
                          🖼️ Trang:
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
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-600 hover:text-indigo-600'
                              }`}
                            >
                              Trang {pNum}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {isDebugMode && (!doc.pagesWithImages || doc.pagesWithImages.length === 0) && (
                      <div className="pl-9 pb-1.5 text-[9px] text-slate-400 italic">
                        Không phát hiện ảnh trên trang nào
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* 2. Middle Panel: AI Chat Panel or Study Notes Tab */}
      {!isChatCollapsed && (
        <section className="w-[420px] lg:w-[480px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full min-h-0 relative overflow-hidden shadow-sm">
          {/* Tabs header (Chỉ hiển thị khi đã chọn 1 tài liệu cụ thể) */}
          {chatMode === 'document' && selectedDocId ? (
            <div className="flex items-center justify-between px-6 pt-3 bg-white border-b border-slate-100">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'chat'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Hỏi đáp AI
                </button>
                <button
                  onClick={() => setActiveTab('study')}
                  className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'study'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  Tóm tắt & Ôn tập
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={handleClearHistory}
                  disabled={activeTab !== 'chat' || (selectedDocId ? (docMessages[selectedDocId] || []) : []).length === 0}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Xóa lịch sử cuộc trò chuyện"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsChatCollapsed(true)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Thu gọn khung này"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100">
              <span className="text-xs font-bold text-indigo-600 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                TRỢ LÝ KHÔNG GIAN
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearHistory}
                  disabled={spaceMessages.length === 0}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Xóa lịch sử cuộc trò chuyện"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsChatCollapsed(true)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Thu gọn khung chat"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
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
              />
            ) : selectedDocId ? (
              <ChatContainer
                messages={docMessages[selectedDocId] || []}
                onSendMessage={handleSendMessage}
                isLoading={sendMessageMutation.isPending || isDocLoading}
                onCitationClick={handleCitationClick}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="p-4 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 shadow-sm">
                  <Bot className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Bắt đầu Trò chuyện</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Vui lòng chọn một tài liệu PDF từ thanh bên trái hoặc tải file mới lên để khởi chạy Trợ lý AI.
                  </p>
                </div>
              </div>
            )
          ) : (
            // Tab Study Helper: Tóm tắt & Flashcards
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/20">
              {/* Nếu đang gọi API sinh dữ liệu */}
              {generateNotesMutation.isPending ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800">AI đang phân tích tài liệu...</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Quá trình này bóc tách toàn bộ tài liệu để viết tóm tắt học thuật & sinh flashcards ôn tập. Vui lòng đợi trong giây lát.
                    </p>
                  </div>
                </div>
              ) : isDocLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : document && (document.summary || document.flashcards) ? (
                // Đã có dữ liệu
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Sub-tabs: Tóm tắt vs Flashcards */}
                  <div className="flex px-4 py-2 border-b border-slate-100 bg-white gap-2">
                    <button
                      onClick={() => setStudySubTab('summary')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                        studySubTab === 'summary'
                          ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      Bản tóm tắt
                    </button>
                    <button
                      onClick={() => {
                        setStudySubTab('flashcards');
                        setCurrentFlashIndex(0);
                        setIsFlipped(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                        studySubTab === 'flashcards'
                          ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      Flashcards ({flashcardsList.length})
                    </button>
                  </div>

                  {/* Nội dung Sub-tab */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {studySubTab === 'summary' ? (
                      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm prose prose-sm max-w-none">
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
                              className={`w-full min-h-[200px] bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-center items-center text-center relative overflow-hidden select-none hover:border-indigo-200`}
                            >
                              <div className="absolute top-3 right-3 text-[10px] text-slate-400 font-semibold uppercase bg-slate-100 px-2 py-0.5 rounded border">
                                {isFlipped ? 'Đáp án' : 'Câu hỏi'}
                              </div>

                              {!isFlipped ? (
                                <div className="space-y-3">
                                  <div className="w-fit mx-auto px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 uppercase tracking-wide">
                                    Question
                                  </div>
                                  <p className="text-sm font-bold text-slate-800 leading-relaxed px-2">
                                    {flashcardsList[currentFlashIndex]?.question}
                                  </p>
                                  <span className="text-[10px] text-indigo-500 flex items-center justify-center gap-1 pt-4 font-medium">
                                    <RotateCw className="w-3.5 h-3.5" />
                                    Click để xem đáp án
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="w-fit mx-auto px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-wide">
                                    Answer
                                  </div>
                                  <p className="text-xs font-semibold text-slate-700 leading-relaxed px-2">
                                    {flashcardsList[currentFlashIndex]?.answer}
                                  </p>
                                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 pt-4 font-medium">
                                    <RotateCw className="w-3.5 h-3.5" />
                                    Click để xem câu hỏi
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Deck controls */}
                            <div className="flex items-center justify-between px-4">
                              <button
                                onClick={() => {
                                  if (currentFlashIndex > 0) {
                                    setCurrentFlashIndex(prev => prev - 1);
                                    setIsFlipped(false);
                                  }
                                }}
                                disabled={currentFlashIndex === 0}
                                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-sm"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              
                              <span className="text-xs font-bold text-slate-500">
                                {currentFlashIndex + 1} / {flashcardsList.length}
                              </span>

                              <button
                                onClick={() => {
                                  if (currentFlashIndex < flashcardsList.length - 1) {
                                    setCurrentFlashIndex(prev => prev + 1);
                                    setIsFlipped(false);
                                  }
                                }}
                                disabled={currentFlashIndex === flashcardsList.length - 1}
                                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-sm"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-slate-400 text-xs">
                            Không có Flashcards nào được tạo.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Chưa sinh dữ liệu -> Show card mời bấm
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 shadow-sm animate-pulse">
                    <BookOpenCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800">Tạo Tóm tắt & Flashcards</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Đúc kết các điểm mấu chốt trong tài liệu và tạo bộ câu hỏi ôn luyện thông minh tự động bằng mô hình AI Gemini.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerGenerateNotes}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 transition-all duration-200 cursor-pointer text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Bắt đầu tạo bằng AI
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 3. Right Panel: PDF Viewer Panel */}
      <section className="flex-1 h-full bg-slate-100 overflow-hidden flex flex-col relative">
        {/* Nút Floating để mở lại panel chat nếu đã collapse */}
        {isChatCollapsed && (
          <button
            onClick={() => setIsChatCollapsed(false)}
            className="absolute left-4 top-4 bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-lg z-20 text-indigo-600 flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center bg-slate-50/50">
            <FileText className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">Trình xem tài liệu PDF/Hình ảnh sẽ hiển thị tại đây.</p>
          </div>
        )}
      </section>

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Debug Chi tiết Ảnh: <span className="text-indigo-600 font-semibold">{debugDocName}</span>
                </h3>
              </div>
              <button 
                onClick={() => setShowDebugModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 scrollbar-thin">
              {isDebugImagesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="text-xs text-slate-500 font-medium">Đang bóc tách và phân tích các trang PDF...</span>
                </div>
              ) : debugImagesData.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Không tìm thấy dữ liệu debug.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    💡 <strong>Nguyên lý lọc 2 tầng:</strong> Hệ thống bóc tách các hình ảnh từ file PDF. <strong>Tầng 1 (Kích thước & Tỉ lệ):</strong> Lọc bỏ ảnh nhỏ hơn hoặc bằng 200x200 px hoặc có tỉ lệ dị (dẹt/dọc &gt; 3.0). <strong>Tầng 2 (MD5 trùng):</strong> Lọc bỏ các ảnh xuất hiện từ 2 lần trở lên ở các trang khác nhau (như logo, header, footer lặp lại).
                  </p>
                  
                  <div className="divide-y divide-slate-100">
                    {debugImagesData.map((page) => (
                      <div key={page.pageNumber} className="py-3 flex flex-col sm:flex-row sm:items-start gap-2 justify-between">
                        <div className="font-bold text-xs text-slate-700 min-w-[80px]">
                          Trang {page.pageNumber}
                        </div>
                        <div className="flex-1">
                          {page.images.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Không phát hiện ảnh hay đối tượng đồ họa nào</span>
                          ) : (
                            <div className="grid grid-cols-1 gap-1.5">
                              {page.images.map((img, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-4 text-[11px] bg-slate-50 hover:bg-slate-100/80 p-2 rounded-lg border border-slate-100 transition-colors">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {img.type === 'PDImageXObject' && selectedDocId && (
                                      <DebugImage 
                                        docId={selectedDocId} 
                                        pageNumber={page.pageNumber} 
                                        imgName={img.name} 
                                        onZoom={setZoomImageUrl} 
                                      />
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                                      <span className="font-mono bg-slate-200/60 px-1 py-0.5 rounded text-[10px] text-slate-600 font-semibold truncate max-w-[80px]" title={img.name}>{img.name}</span>
                                      <span className="text-slate-500 shrink-0">Kiểu: <strong className="text-slate-600">{img.type}</strong></span>
                                      {img.width > 0 && img.height > 0 && (
                                        <span className="text-slate-500 shrink-0">Kích thước: <strong className="text-slate-600">{img.width}x{img.height} px</strong></span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 uppercase tracking-wider ${
                                    img.accepted 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-slate-200/80 text-slate-500 border border-slate-300/30'
                                  }`}>
                                    {img.accepted ? 'Hợp lệ' : `Bị lọc: ${img.filterReason || 'Kích thước/Tỉ lệ dị'}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setShowDebugModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Lightbox */}
      {zoomImageUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl animate-in zoom-in-95 duration-200">
            <img src={zoomImageUrl} alt="Zoomed Debug View" className="max-h-[80vh] max-w-full object-contain rounded-xl" />
            <button 
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-950 text-white p-2 rounded-full shadow-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
