import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Layers,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  BookOpenCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StudyNotesTabProps } from '../types';

export const StudyNotesTab: React.FC<StudyNotesTabProps> = ({
  document,
  isDocLoading,
  generateNotesPending,
  handleTriggerGenerateNotes,
}) => {
  const [studySubTab, setStudySubTab] = useState<'summary' | 'flashcards'>('summary');
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Helper render Markdown sử dụng ReactMarkdown chuẩn hóa
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-xs text-muted-foreground leading-relaxed mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h2 className="text-lg font-black text-foreground mt-6 mb-3">{children}</h2>,
          h2: ({ children }) => <h3 className="text-base font-bold text-foreground mt-5 mb-2 border-b border-border pb-1">{children}</h3>,
          h3: ({ children }) => <h4 className="text-sm font-bold text-foreground mt-4 mb-2">{children}</h4>,
          h4: ({ children }) => <h5 className="text-xs font-bold text-foreground mt-3 mb-1.5">{children}</h5>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-xs text-muted-foreground mb-1.5">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-border rounded-xl shadow-xs">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/80 border-b border-border font-semibold">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-2.5 font-bold text-foreground border-r border-border last:border-r-0">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 border-b border-border/50 border-r border-border/50 last:border-r-0 last:border-b-0 align-top">{children}</td>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors last:border-b-0">{children}</tr>,
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  // Parse flashcards JSON safely
  let flashcardsList: { question: string; answer: string }[] = [];
  try {
    if (document?.flashcards) {
      flashcardsList = JSON.parse(document.flashcards);
    }
  } catch (e) {
    console.error('Lỗi parse flashcard: ', e);
  }

  // Nếu đang gọi API sinh dữ liệu
  if (generateNotesPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-card">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="font-bold text-foreground">AI đang phân tích tài liệu...</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Quá trình này bóc tách toàn bộ tài liệu để viết tóm tắt học thuật & sinh flashcards ôn tập. Vui
            lòng đợi trong giây lát.
          </p>
        </div>
      </div>
    );
  }

  if (isDocLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (document && (document.summary || document.flashcards)) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Sub-tabs: Tóm tắt vs Flashcards */}
        <div className="flex px-4 py-2 border-b border-border bg-card gap-2">
          <Button
            onClick={() => setStudySubTab('summary')}
            variant={studySubTab === 'summary' ? 'secondary' : 'ghost'}
            size="sm"
            className="cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            Bản tóm tắt
          </Button>
          <Button
            onClick={() => {
              setStudySubTab('flashcards');
              setCurrentFlashIndex(0);
              setIsFlipped(false);
            }}
            variant={studySubTab === 'flashcards' ? 'secondary' : 'ghost'}
            size="sm"
            className="cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            Flashcards ({flashcardsList.length})
          </Button>
        </div>

        {/* Nội dung Sub-tab */}
        <div className="flex-1 overflow-y-auto p-5">
          {studySubTab === 'summary' ? (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-xs prose prose-sm max-w-none dark:prose-invert">
              {renderMarkdown(document.summary || '')}
            </div>
          ) : (
            // Flashcards Deck
            <div className="h-full flex flex-col justify-between py-4">
              {flashcardsList.length > 0 ? (
                <div className="space-y-6">
                  {/* The Interactive Card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full min-h-[200px] bg-card border border-border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-center items-center text-center relative overflow-hidden select-none hover:border-primary/40"
                  >
                    <div className="absolute top-3 right-3 text-[10px] text-muted-foreground font-semibold uppercase bg-muted px-2 py-0.5 rounded border border-border">
                      {isFlipped ? 'Đáp án' : 'Câu hỏi'}
                    </div>

                    {!isFlipped ? (
                      <div className="space-y-3">
                        <div className="w-fit mx-auto px-2.5 py-1 bg-muted text-foreground text-[10px] font-bold rounded-full border border-border uppercase tracking-wide">
                          Question
                        </div>
                        <p className="text-sm font-bold text-foreground leading-relaxed px-2">
                          {flashcardsList[currentFlashIndex]?.question}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 pt-4 font-medium">
                          <RotateCw className="w-3.5 h-3.5" />
                          Click để xem đáp án
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-fit mx-auto px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-wide">
                          Answer
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground leading-relaxed px-2">
                          {flashcardsList[currentFlashIndex]?.answer}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 pt-4 font-medium">
                          <RotateCw className="w-3.5 h-3.5" />
                          Click để xem câu hỏi
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Deck controls */}
                  <div className="flex items-center justify-between px-4">
                    <Button
                      onClick={() => {
                        if (currentFlashIndex > 0) {
                          setCurrentFlashIndex((prev) => prev - 1);
                          setIsFlipped(false);
                        }
                      }}
                      disabled={currentFlashIndex === 0}
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <span className="text-xs font-bold text-muted-foreground">
                      {currentFlashIndex + 1} / {flashcardsList.length}
                    </span>

                    <Button
                      onClick={() => {
                        if (currentFlashIndex < flashcardsList.length - 1) {
                          setCurrentFlashIndex((prev) => prev + 1);
                          setIsFlipped(false);
                        }
                      }}
                      disabled={currentFlashIndex === flashcardsList.length - 1}
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  Không có Flashcards nào được tạo.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chưa sinh dữ liệu -> Show card mời bấm
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 bg-card">
      <div className="p-4 bg-muted border border-border rounded-full text-foreground shadow-xs animate-pulse">
        <BookOpenCheck className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-foreground">Tạo Tóm tắt & Flashcards</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Đúc kết các điểm mấu chốt trong tài liệu và tạo bộ câu hỏi ôn luyện thông minh tự động bằng mô
          hình AI Gemini.
        </p>
      </div>
      <Button
        onClick={handleTriggerGenerateNotes}
        className="flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl cursor-pointer text-sm shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        Bắt đầu tạo bằng AI
      </Button>
    </div>
  );
};
