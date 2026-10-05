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
  Users,
  Crown,
  Edit3,
  Eye,
  CheckSquare,
  Square,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  selectedDocIdsForAi = [],
  onToggleDocForAi,
  onToggleAllDocsForAi,
  onOpenMemberModal,
  currentUserId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const isOwner = space?.currentUserRole === 'OWNER';
  const isViewer = space?.currentUserRole === 'VIEWER';
  const isAllDocsSelected =
    space?.documents &&
    space.documents.length > 0 &&
    selectedDocIdsForAi.length === space.documents.length;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !space) return;

    if (isViewer) {
      toast.error('Người xem không có quyền tải lên tài liệu');
      return;
    }

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
          onError: () => {
            toast.error('Xóa tài liệu thất bại');
          },
        }
      );
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[10px] font-semibold">
            <Crown className="w-2.5 h-2.5" /> Chủ nhóm
          </Badge>
        );
      case 'EDITOR':
        return (
          <Badge className="bg-primary/15 text-primary border-primary/30 gap-1 text-[10px] font-semibold">
            <Edit3 className="w-2.5 h-2.5" /> Cộng tác
          </Badge>
        );
      case 'VIEWER':
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px] font-medium">
            <Eye className="w-2.5 h-2.5" /> Người xem
          </Badge>
        );
      default:
        return null;
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMemberModal}
            className="cursor-pointer text-muted-foreground hover:text-primary"
            title="Quản lý thành viên"
          >
            <Users className="w-4 h-4" />
          </Button>
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
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link to="/">
            <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-foreground truncate text-sm">
                {isSpaceLoading ? 'Đang tải Space...' : space?.name}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {getRoleBadge(space?.currentUserRole)}
              <span className="text-[10px] text-muted-foreground truncate">
                {space?.memberCount || 1} thành viên
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(true)}
          className="cursor-pointer h-8 w-8"
          title="Thu nhỏ thanh bên"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Main navigation & Documents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0">
        {/* Collaborative Space Banner & Member Modal Button */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              Cộng Tác Nhóm
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMemberModal}
              className="h-7 text-[11px] gap-1 cursor-pointer bg-card border-primary/30 hover:bg-primary/10 font-semibold"
            >
              <Users className="w-3.5 h-3.5 text-primary" />
              Thành viên ({space?.memberCount || 1})
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Dùng <span className="font-semibold text-foreground">@Mora</span> trong khung chat để hỏi đáp tài liệu chung hoặc nhắn tin trao đổi trực tiếp với nhóm.
          </p>
        </div>

        {/* Upload & Document Scope area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Kho Tài Liệu ({space?.documents?.length || 0})
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
            />
            {!isViewer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="h-7 gap-1 cursor-pointer text-xs"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                Tải lên PDF
              </Button>
            )}
          </div>

          {/* Selective RAG Scope Toggle */}
          {space?.documents && space.documents.length > 1 && onToggleAllDocsForAi && (
            <div
              onClick={onToggleAllDocsForAi}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 text-[11px] text-muted-foreground cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5 font-medium">
                {isAllDocsSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {isAllDocsSelected
                  ? 'Hỏi trên toàn bộ tài liệu'
                  : `Đang chọn ${selectedDocIdsForAi.length}/${space.documents.length} tài liệu`}
              </span>
              <span className="text-[10px] font-semibold text-primary">
                {isAllDocsSelected ? 'Bỏ chọn hết' : 'Chọn tất cả'}
              </span>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
            {space?.documents && space.documents.length > 0 ? (
              space.documents.map((doc) => {
                const isSelectedForView = selectedDocumentId === doc.id;
                const isCheckedForAi = selectedDocIdsForAi.includes(doc.id);
                const isReady = doc.status === 'READY';
                const isFailed = doc.status === 'FAILED';
                const isProcessing = !isReady && !isFailed;

                let statusLabel = '';
                if (doc.status === 'UPLOADING') statusLabel = 'Đang tải lên...';
                else if (doc.status === 'PARSING') statusLabel = 'Đang đọc nội dung...';
                else if (doc.status === 'INDEXING') statusLabel = 'Đang lập chỉ mục...';

                const canDelete =
                  isOwner || (doc.uploadedById && doc.uploadedById === currentUserId);

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      if (isReady) {
                        onSelectDocument(isSelectedForView ? null : doc);
                      } else if (isFailed) {
                        toast.error('Tài liệu bị lỗi, không thể hiển thị');
                      } else {
                        toast.info('Tài liệu đang xử lý, vui lòng đợi trong giây lát');
                      }
                    }}
                    className={`flex flex-col p-2.5 rounded-xl border text-xs transition-all duration-150 ${
                      isSelectedForView
                        ? 'bg-primary/5 border-primary text-primary font-semibold shadow-2xs'
                        : isProcessing
                          ? 'bg-muted/20 border-border/50 opacity-70 cursor-wait'
                          : isFailed
                            ? 'bg-destructive/5 border-destructive/20 text-destructive/80'
                            : 'bg-card border-border hover:bg-muted/50 text-foreground cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between min-w-0 w-full gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Scope Checkbox */}
                        {isReady && onToggleDocForAi && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleDocForAi(doc.id);
                            }}
                            className="p-0.5 hover:text-primary transition-colors cursor-pointer shrink-0"
                            title={isCheckedForAi ? 'Bỏ chọn khỏi phạm vi AI' : 'Chọn vào phạm vi AI'}
                          >
                            {isCheckedForAi ? (
                              <CheckSquare className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                        )}

                        <FileText
                          className={`w-4 h-4 shrink-0 ${
                            isSelectedForView
                              ? 'text-primary'
                              : isFailed
                                ? 'text-destructive/60'
                                : 'text-muted-foreground'
                          }`}
                        />
                        <span className="truncate font-medium">{doc.name}</span>
                      </div>

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDocumentDelete(e, doc.id)}
                          disabled={deleteMutation.isPending}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer rounded-lg hover:bg-muted-foreground/10"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Uploader info and status */}
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground pl-5">
                      {doc.uploadedByName ? (
                        <span className="flex items-center gap-1 truncate text-[10px]">
                          <User className="w-2.5 h-2.5" /> {doc.uploadedByName}
                        </span>
                      ) : (
                        <span />
                      )}

                      {!isReady && (
                        <div className="flex items-center gap-1">
                          {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
                          <span className={isFailed ? 'text-destructive font-semibold' : 'text-muted-foreground animate-pulse'}>
                            {isFailed ? 'Lỗi xử lý' : statusLabel}
                          </span>
                        </div>
                      )}
                    </div>
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
