import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';

// Import react-pdf CSS styles to align the text layer over the canvas
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';


// Setup worker for react-pdf using unpkg CDN matching the library's pdfjs version
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string | undefined;
  activePage: number;
  onPageChange: (pageNumber: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  fileUrl,
  activePage,
  onPageChange,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  // Synchronize internal state or validate boundaries when activePage changes from parent
  useEffect(() => {
    if (numPages && (activePage < 1 || activePage > numPages)) {
      onPageChange(1);
    }
  }, [activePage, numPages, onPageChange]);

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

  if (!fileUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <span>Đang tải thông tin tài liệu...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={activePage <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            Trang {activePage} / {numPages || '...'}
          </span>
          <button
            onClick={handleNextPage}
            disabled={numPages ? activePage >= numPages : true}
            className="p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.0}
            className="p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF View Container */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
              <span className="text-sm">Đang tải file PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center p-12 text-rose-400 gap-2 text-center max-w-sm">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm font-medium">Không thể hiển thị tài liệu này</span>
              <p className="text-xs text-slate-500">
                Hãy chắc chắn rằng link file hợp lệ và Supabase bucket đã được cấu hình CORS chính xác.
              </p>
            </div>
          }
        >
          <div className="shadow-2xl border border-slate-800 rounded-lg overflow-hidden bg-white">
            <Page
              pageNumber={activePage}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={true}
              loading={
                <div className="flex items-center justify-center p-6 bg-slate-900 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
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
