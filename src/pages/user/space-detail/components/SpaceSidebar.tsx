import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/shared/UserMenu';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import type { SpaceSidebarProps } from '../types';
import { useUploadDocument, useDeleteDocument } from '@/features/chat/hooks/useDocument';
import { toast } from 'sonner';

export const SpaceSidebar: React.FC<SpaceSidebarProps> = ({
  space,
  isSpaceLoading,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  selectedDocumentId,
  onSelectDocument,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !space) return;

    if (file.type !== 'application/pdf') {
      toast.error('Chỉ hỗ trợ tải lên tệp tin PDF');
      return;
    }

    uploadMutation.mutate(
      { spaceId: space.id, file },
      {
        onSuccess: () => {
          toast.success('Tải lên tài liệu thành công');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error: any) => {
          toast.error('Tải lên tài liệu thất bại: ' + (error.response?.data?.message || error.message));
        },
      }
    );
  };

  const handleDocumentDelete = (e: React.MouseEvent, docId: number) => {
    e.stopPropagation();
    if (!space) return;

    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      deleteMutation.mutate(
        { id: docId, spaceId: space.id },
        {
          onSuccess: () => {
            toast.success('Xóa tài liệu thành công');
            if (selectedDocumentId === docId) {
              onSelectDocument(null);
            }
          },
          onError: (error: any) => {
            toast.error('Xóa tài liệu thất bại');
          },
        }
      );
    }
  };

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
          <Link to="/">
            <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="w-8 h-px bg-border my-1" />
          <div className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
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
          <Link to="/">
            <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-foreground truncate text-sm">
              {isSpaceLoading ? 'Đang tải Space...' : space?.name}
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

      {/* Main navigation & Documents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted border border-border text-foreground font-semibold shadow-xs">
          <Sparkles className="w-4 h-4 shrink-0 text-primary animate-pulse" />
          <span className="text-xs">Trợ lý Không gian</span>
        </div>

        {/* Upload area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tài liệu</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="h-8 gap-1.5 cursor-pointer text-xs"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Tải lên PDF
            </Button>
          </div>

          {/* Document list */}
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
            {space?.documents && space.documents.length > 0 ? (
              space.documents.map((doc) => {
                const isSelected = selectedDocumentId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(isSelected ? null : doc)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary/10 border-primary/50 text-primary font-medium'
                        : 'bg-card border-border/80 hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDocumentDelete(e, doc.id)}
                      disabled={deleteMutation.isPending}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 border border-dashed border-border rounded-xl">
                Chưa có tài liệu. Hãy tải lên file PDF đầu tiên!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer section */}
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
