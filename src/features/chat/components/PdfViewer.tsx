import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Import react-pdf CSS styles to align the text layer over the canvas
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Setup worker for react-pdf using unpkg CDN matching the library's pdfjs version
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string | undefined;
  fileType?: string;
  activePage: number;
  onPageChange: (pageNumber: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  fileUrl,
  fileType = 'pdf',
  activePage,
  onPageChange,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [jumpPage, setJumpPage] = useState<string>(activePage.toString());

  const isImage = fileType !== 'pdf' && fileType !== 'PDF';

  // Đồng bộ ô nhập trang khi trang active thay đổi từ bên ngoài
  useEffect(() => {
    setJumpPage(activePage.toString());
  }, [activePage]);

  // Synchronize internal state or validate boundaries when activePage changes from parent
  useEffect(() => {
    if (numPages && (activePage < 1 || activePage > numPages)) {
      onPageChange(1);
    }
  }, [activePage, numPages, onPageChange]);

  // Lắng nghe sự kiện bàn phím (Phím mũi tên Trái/Phải để chuyển trang)
  useEffect(() => {
    if (isImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' && activePage > 1) {
        onPageChange(activePage - 1);
      } else if (e.key === 'ArrowRight' && numPages && activePage < numPages) {
        onPageChange(activePage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePage, numPages, onPageChange, isImage]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePrevPage = () => {
    if (activePage > 1) {
      onPageChange(activePage - 1);
    }
  };

  const handleNextPage = () => {
    if (numPages && activePage < numPages) {
      onPageChange(activePage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleJumpPageSubmit = () => {
    const pageNum = parseInt(jumpPage);
    if (!isNaN(pageNum) && pageNum >= 1 && numPages && pageNum <= numPages) {
      onPageChange(pageNum);
    } else {
      setJumpPage(activePage.toString());
    }
  };

  if (!fileUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground p-6">
        <Loader2 className="w-8 h-8 animate-spin text-foreground mb-2" />
        <span className="text-sm font-medium">Đang tải thông tin tài liệu...</span>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex flex-col h-full bg-muted/10 text-foreground transition-colors duration-200">
        {/* Toolbar for Image (only zoom controls) */}
        <div className="flex items-center justify-end px-6 h-14 bg-card border-b border-border shadow-xs z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-semibold w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              onClick={handleZoomIn}
              disabled={scale >= 2.0}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image view container */}
        <div className="flex-1 overflow-auto p-6 flex justify-center items-start scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
          <div
            className="shadow-xl border border-border rounded-xl overflow-hidden bg-card max-w-full"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.1s ease-out' }}
          >
            <img src={fileUrl} alt="Document Image" className="max-h-[80vh] w-auto object-contain" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10 text-foreground transition-colors duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 h-14 bg-card border-b border-border shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={activePage <= 1}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium mr-0.5">Trang</span>
            <Input
              type="number"
              min={1}
              max={numPages || 1}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onBlur={handleJumpPageSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJumpPageSubmit();
                }
              }}
              className="w-12 h-7 text-center text-xs px-1"
            />
            <span className="text-xs text-muted-foreground/80 font-medium">/ {numPages || '...'}</span>
          </div>

          <Button
            onClick={handleNextPage}
            disabled={numPages ? activePage >= numPages : true}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-semibold w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            onClick={handleZoomIn}
            disabled={scale >= 2.0}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF View Container */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải file PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center p-12 text-destructive gap-2 text-center max-w-sm">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm font-semibold">Không thể hiển thị tài liệu này</span>
              <p className="text-xs text-muted-foreground">
                Hãy chắc chắn rằng link file hợp lệ và Supabase bucket đã được cấu hình CORS chính xác.
              </p>
            </div>
          }
        >
          <div className="shadow-xl border border-border rounded-xl overflow-hidden bg-white dark:bg-zinc-800 p-0.5">
            <Page
              pageNumber={activePage}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={true}
              loading={
                <div className="flex items-center justify-center p-6 bg-card text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2 text-foreground" />
                  Đang vẽ trang...
                </div>
              }
            />
          </div>
        </Document>
      </div>
    </div>
  );
};
