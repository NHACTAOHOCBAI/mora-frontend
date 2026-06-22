import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Trash2,
  Upload,
  Loader2,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  Bug,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/shared/UserMenu';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import type { SpaceSidebarProps } from '../types';

export const SpaceSidebar: React.FC<SpaceSidebarProps> = ({
  space,
  isSpaceLoading,
  selectedDocId,
  setSelectedDocId,
  chatMode,
  setChatMode,
  activePage,
  setActivePage,
  isChatCollapsed,
  setIsChatCollapsed,
  isUploading,
  fileInputRef,
  handleFileUpload,
  isDebugMode,
  setIsDebugMode,
  vectorPathThreshold,
  setVectorPathThreshold,
  handleThresholdChangeFinished,
  updateThresholdPending,
  editingDocId,
  setEditingDocId,
  renameValue,
  setRenameValue,
  handleRenameClick,
  handleRenameConfirm,
  handleRenameCancel,
  renamePending,
  setDocToDelete,
  handleOpenDebugModal,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) => {
  if (isSidebarCollapsed) {
    return (
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
    );
  }

  return (
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
                {updateThresholdPending && <Loader2 className="w-3 h-3 animate-spin text-foreground" />}
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
              disabled={updateThresholdPending}
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
                        disabled={renamePending}
                        className="h-6 w-6 text-emerald-600 cursor-pointer"
                        title="Xác nhận"
                      >
                        {renamePending ? (
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
  );
};
