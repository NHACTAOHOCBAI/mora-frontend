import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  Maximize2,
  Shrink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [activePage, setActivePage] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>('1');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 1.0 = 100% (Fit width)
  const [rotation, setRotation] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);
  const lastReportedPageRef = useRef<number>(currentPage);

  // Theo dõi kích thước container để tự động Fit-to-Width hoàn hảo
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        setContainerWidth(newWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Cuộn mượt đến trang cụ thể (không có hiệu ứng sáng nhấp nháy)
  const scrollToPage = useCallback((targetPage: number) => {
    if (!numPages || targetPage < 1 || targetPage > numPages) return;

    const pageElement = pageRefs.current[targetPage];
    if (pageElement && containerRef.current) {
      isProgrammaticScrollRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      setActivePage(targetPage);
      setInputPage(targetPage.toString());

      // Đặt timeout để giải phóng cờ programmatic scroll sau khi cuộn xong
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 700);
    }
  }, [numPages]);

  // Lắng nghe khi props currentPage thay đổi từ bên ngoài (Citation click)
  useEffect(() => {
    if (currentPage && currentPage > 0) {
      if (currentPage !== lastReportedPageRef.current) {
        scrollToPage(currentPage);
      }
      lastReportedPageRef.current = currentPage;
    }
  }, [currentPage, scrollToPage]);

  // Cập nhật inputPage khi activePage thay đổi
  useEffect(() => {
    setInputPage(activePage.toString());
  }, [activePage]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    const initialPage = currentPage && currentPage > 0 ? currentPage : 1;
    setActivePage(initialPage);
    setInputPage(initialPage.toString());

    // Cuộn đến trang ban đầu sau khi tải xong
    setTimeout(() => {
      scrollToPage(initialPage);
    }, 150);
  };

  // Thiết lập IntersectionObserver để tự động phát hiện trang đang nằm trong tầm nhìn
  useEffect(() => {
    if (!numPages || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;

        // Tìm trang có tỷ lệ xuất hiện lớn nhất trong khung nhìn
        let maxRatio = 0;
        let mostVisiblePage = activePage;

        entries.forEach((entry) => {
          const pageIndex = Number(entry.target.getAttribute('data-page-number'));
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisiblePage = pageIndex;
          }
        });

        if (maxRatio > 0.15 && mostVisiblePage !== activePage) {
          lastReportedPageRef.current = mostVisiblePage;
          setActivePage(mostVisiblePage);
          onPageChange?.(mostVisiblePage);
        }
      },
      {
        root: containerRef.current,
        threshold: [0.15, 0.4, 0.7],
      }
    );

    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [numPages, activePage, onPageChange]);

  const handlePageChange = (newPage: number) => {
    if (numPages && newPage >= 1 && newPage <= numPages) {
      lastReportedPageRef.current = newPage;
      scrollToPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputPage, 10);
      if (!isNaN(page) && numPages && page >= 1 && page <= numPages) {
        lastReportedPageRef.current = page;
        scrollToPage(page);
        onPageChange?.(page);
      } else {
        setInputPage(activePage.toString());
      }
    }
  };

  const handleInputBlur = () => {
    const page = parseInt(inputPage, 10);
    if (!isNaN(page) && numPages && page >= 1 && page <= numPages) {
      lastReportedPageRef.current = page;
      scrollToPage(page);
      onPageChange?.(page);
    } else {
      setInputPage(activePage.toString());
    }
  };

  const handleZoom = (factor: number) => {
    setZoomLevel((prev) => Math.max(0.5, Math.min(2.5, +(prev + factor).toFixed(2))));
  };

  const handleFitWidth = () => {
    setZoomLevel(1.0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Chiều rộng cơ sở của khung hiển thị
  const basePageWidth = containerWidth > 0 ? containerWidth : undefined;

  return (
    <div className="flex flex-col h-full bg-card border-l border-border select-none relative overflow-hidden">
      {/* Control Bar - Clean Modern PDF Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border text-foreground shrink-0 shadow-2xs z-10">
        {/* Điều hướng trang */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(activePage - 1)}
            disabled={activePage <= 1}
            className="cursor-pointer h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 p-0"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Trang</span>
            <Input
              type="text"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              className="w-8 h-5 text-center text-[11px] font-medium px-0 py-0 bg-muted/40 border-border/60 text-foreground focus-visible:ring-1 focus-visible:ring-primary rounded-xs shadow-none"
              title="Nhập số trang và nhấn Enter"
            />
            <span className="text-muted-foreground/80">/ {numPages || '?'}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(activePage + 1)}
            disabled={numPages ? activePage >= numPages : true}
            className="cursor-pointer h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 p-0"
            title="Trang tiếp theo"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Thanh công cụ Zoom & Xoay */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(-0.15)}
            disabled={zoomLevel <= 0.5}
            className="cursor-pointer h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <button
            onClick={handleFitWidth}
            className="text-[11px] font-mono font-medium min-w-[40px] px-1.5 py-0.5 text-center hover:bg-muted rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            title="Nhấn để vừa chiều rộng (100%)"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(0.15)}
            disabled={zoomLevel >= 2.5}
            className="cursor-pointer h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitWidth}
            className="cursor-pointer h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Vừa chiều ngang màn hình (Fit to Width)"
          >
            {zoomLevel === 1.0 ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Shrink className="w-3.5 h-3.5 text-primary" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="cursor-pointer h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Xoay trang 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-0 flex flex-col items-center scroll-smooth bg-background divide-y divide-border/50 [&_.react-pdf__Page]:!max-w-none [&_.react-pdf__Page__canvas]:!max-w-none [&_.react-pdf__Page__canvas]:!mx-auto"
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 mt-28">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                Đang tải tài liệu PDF...
              </span>
            </div>
          }
          error={
            <div className="max-w-sm text-center mt-24 p-6 bg-card border border-destructive/30 rounded-xl shadow-sm">
              <p className="text-sm font-semibold text-destructive">Không thể hiển thị tài liệu PDF</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vui lòng kiểm tra lại đường dẫn tài liệu hoặc thử tải lại trang.
              </p>
            </div>
          }
        >
          {numPages &&
            Array.from({ length: numPages }, (_, index) => {
              const pageNum = index + 1;

              return (
                <div
                  key={`page-wrapper-${pageNum}`}
                  id={`pdf-page-${pageNum}`}
                  data-page-number={pageNum}
                  ref={(el) => {
                    pageRefs.current[pageNum] = el;
                  }}
                  className="w-full min-w-fit flex justify-center bg-white"
                >
                  <Page
                    pageNumber={pageNum}
                    width={basePageWidth}
                    scale={zoomLevel}
                    rotate={rotation}
                    loading={
                      <div
                        className="flex flex-col items-center justify-center bg-white text-muted-foreground"
                        style={{
                          width: basePageWidth ? `${Math.round(basePageWidth * zoomLevel)}px` : '100%',
                          height: basePageWidth
                            ? `${Math.round(basePageWidth * zoomLevel * 0.75)}px`
                            : '450px',
                        }}
                      >
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
                        <span className="text-xs font-mono text-muted-foreground">Đang tải trang {pageNum}...</span>
                      </div>
                    }
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="bg-white block mx-auto"
                  />
                </div>
              );
            })}
        </Document>
      </div>
    </div>
  );
};




