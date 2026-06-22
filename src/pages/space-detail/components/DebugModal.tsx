import React, { useState, useEffect } from 'react';
import { Bug, X, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api-client';
import type { DebugImageProps, DebugModalProps } from '../types';

export const DebugImage: React.FC<DebugImageProps> = ({ docId, pageNumber, imgName, onZoom }) => {
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

export const DebugModal: React.FC<DebugModalProps> = ({
  showDebugModal,
  setShowDebugModal,
  debugDocName,
  isDebugImagesLoading,
  debugImagesData,
  selectedDocId,
  setZoomImageUrl,
  zoomImageUrl,
}) => {
  if (!showDebugModal) return null;

  return (
    <>
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
    </>
  );
};
