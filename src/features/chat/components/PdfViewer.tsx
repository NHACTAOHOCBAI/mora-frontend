import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  currentPage: number;
  onPageChange?: (page: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, currentPage, onPageChange }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (currentPage && currentPage > 0) {
      setPageNumber(currentPage);
    }
  }, [currentPage]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(currentPage || 1);
  };

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (numPages && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  const handleZoom = (factor: number) => {
    setScale((prev) => Math.max(0.5, Math.min(2.5, prev + factor)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="flex flex-col h-full bg-muted/10 border-l border-border select-none">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border text-foreground shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="cursor-pointer h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold">
            Trang {pageNumber} / {numPages || '?'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(1)}
            disabled={numPages ? pageNumber >= numPages : true}
            className="cursor-pointer h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleZoom(-0.1)} className="cursor-pointer h-8 w-8" title="Thu nhỏ">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-[11px] font-mono min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={() => handleZoom(0.1)} className="cursor-pointer h-8 w-8" title="Phóng to">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={handleRotate} className="cursor-pointer h-8 w-8" title="Xoay">
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Pages Container */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-2 mt-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Đang tải tài liệu PDF...</span>
            </div>
          }
          error={
            <div className="text-sm text-destructive mt-20 text-center font-medium">
              Không thể hiển thị tài liệu này. Vui lòng kiểm tra lại URL.
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            loading={
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            }
            className="shadow-lg border border-border bg-card rounded-xl overflow-hidden"
          />
        </Document>
      </div>
    </div>
  );
};
