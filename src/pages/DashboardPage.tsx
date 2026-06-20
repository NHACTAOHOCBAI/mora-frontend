import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Trash2, Loader2, BookOpen } from 'lucide-react';
import { useSpaces, useCreateSpace, useDeleteSpace } from '@/features/chat/hooks/useSpace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: spaces, isLoading, isError } = useSpaces();
  const createSpaceMutation = useCreateSpace();
  const deleteSpaceMutation = useDeleteSpace();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [spaceIdToDelete, setSpaceIdToDelete] = useState<number | null>(null);

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createSpaceMutation.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          toast.success('Tạo Không gian học tập thành công!');
          setName('');
          setDescription('');
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          toast.error('Tạo Không gian thất bại: ' + (err.message || 'Lỗi kết nối'));
        }
      }
    );
  };

  const handleDeleteSpaceConfirm = () => {
    if (spaceIdToDelete === null) return;
    deleteSpaceMutation.mutate(spaceIdToDelete, {
      onSuccess: () => {
        toast.success('Đã xóa Không gian học tập!');
        setSpaceIdToDelete(null);
      },
      onError: (err: any) => {
        toast.error('Xóa Không gian thất bại: ' + (err.message || 'Lỗi kết nối'));
        setSpaceIdToDelete(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-10 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-muted rounded-lg border border-border flex items-center justify-center w-9 h-9 overflow-hidden">
            <img src="/frog-logo.png" alt="Mora Logo" className="w-7 h-7 object-contain dark:invert" />
          </div>
          <span className="font-bold text-lg tracking-wider text-foreground">Mora</span>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Không Gian Học Tập
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Chọn hoặc tạo mới một không gian học tập riêng biệt để tải lên PDF và hỏi đáp AI.
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo Space Mới
          </Button>
        </div>

        {/* Space List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải danh sách Space...</p>
          </div>
        ) : isError ? (
          <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-2xl text-center">
            <p className="text-destructive font-medium">Lỗi tải danh sách Space. Vui lòng kiểm tra lại dịch vụ backend.</p>
          </div>
        ) : spaces && spaces.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-12 rounded-3xl text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="p-4 bg-muted w-fit mx-auto rounded-full text-foreground border border-border">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Chưa có Space nào</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tạo Không gian học tập đầu tiên của bạn để tải lên các tài liệu ôn tập và bắt đầu chat với AI.
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="rounded-xl cursor-pointer"
            >
              Tạo Space ngay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces?.map((space) => (
              <Card
                key={space.id}
                onClick={() => navigate(`/space/${space.id}`)}
                className="group relative bg-card hover:bg-muted/50 border border-border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-muted text-foreground rounded-xl border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                    <Folder className="w-6 h-6" />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpaceIdToDelete(space.id);
                    }}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 border border-transparent"
                    title="Xóa Space"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base line-clamp-1">
                    {space.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2 min-h-[2.5rem]">
                    {space.description || 'Không có mô tả nào.'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                  <span>Khởi tạo: {new Date(space.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className="text-foreground group-hover:underline font-semibold text-xs transition-colors">
                    Vào học tập &rarr;
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Space Dialog/Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/55 flex justify-between items-center">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Tạo Space Mới
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreateSpace} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tên Space
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Giải tích 1, Dự án Nghiên cứu..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mô tả (Không bắt buộc)
                </label>
                <Textarea
                  placeholder="Mô tả tóm tắt nội dung học tập của space này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer font-medium text-muted-foreground"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || createSpaceMutation.isPending}
                  className="cursor-pointer font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createSpaceMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo ngay'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={spaceIdToDelete !== null} onOpenChange={(open) => !open && setSpaceIdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn Không gian học tập này cùng tất cả tài liệu và lịch sử chat đi kèm. Không thể hoàn tác hành động này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpaceConfirm}
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
