import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Trash2, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { useSpaces, useCreateSpace, useDeleteSpace } from '@/features/chat/hooks/useSpace';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: spaces, isLoading, isError } = useSpaces();
  const createSpaceMutation = useCreateSpace();
  const deleteSpaceMutation = useDeleteSpace();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createSpaceMutation.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setIsModalOpen(false);
        },
      }
    );
  };

  const handleDeleteSpace = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent navigating
    if (confirm('Bạn có chắc chắn muốn xóa Không gian học tập này không?')) {
      deleteSpaceMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">MORA</span>
          <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full border border-slate-800 bg-slate-950">Source-Grounded AI</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Không Gian Học Tập</h1>
            <p className="text-slate-400 text-sm mt-1">Chọn hoặc tạo mới một không gian học tập riêng biệt để tải lên PDF và hỏi đáp AI.</p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo Space Mới
          </button>
        </div>

        {/* Space List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-400">Đang tải danh sách Space...</p>
          </div>
        ) : isError ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-center">
            <p className="text-rose-400 font-medium">Lỗi tải danh sách Space. Vui lòng kiểm tra lại dịch vụ backend.</p>
          </div>
        ) : spaces && spaces.length === 0 ? (
          <div className="border border-dashed border-slate-800 bg-slate-900/20 p-12 rounded-3xl text-center max-w-md mx-auto space-y-4">
            <div className="p-4 bg-slate-800/40 w-fit mx-auto rounded-full text-indigo-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Chưa có Space nào</h3>
              <p className="text-sm text-slate-400 mt-1">Tạo Không gian học tập đầu tiên của bạn để tải lên các tài liệu ôn tập và bắt đầu chat với AI.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl hover:bg-indigo-600/30 transition text-sm cursor-pointer"
            >
              Tạo Space ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces?.map((space) => (
              <div
                key={space.id}
                onClick={() => navigate(`/space/${space.id}`)}
                className="group relative bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <Folder className="w-6 h-6" />
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteSpace(e, space.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Xóa Space"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors text-base line-clamp-1">
                    {space.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2 min-h-[2rem]">
                    {space.description || 'Không có mô tả nào.'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Khởi tạo: {new Date(space.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className="text-indigo-400 group-hover:underline font-semibold text-xs">Vào học tập &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Space Dialog/Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-400" />
                Tạo Space Mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-200 transition text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tên Space</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giải tích 1, Dự án Nghiên cứu..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mô tả (Không bắt buộc)</label>
                <textarea
                  placeholder="Mô tả tóm tắt nội dung học tập của space này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || createSpaceMutation.isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/10 transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {createSpaceMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo ngay'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
