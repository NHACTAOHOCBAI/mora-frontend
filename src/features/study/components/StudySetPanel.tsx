import { useState } from "react";
import {
  FileText,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateStudySet,
  useDeleteStudySet,
  useGradeQuiz,
  useStudySets,
} from "../hooks/useStudySets";
import type { Citation, QuizGrade, StudySet } from "../services/study-api";
import type { DocumentResponse } from "@/features/chat/services/document-api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

export function StudySetPanel({
  spaceId,
  documents,
  onCitation,
}: {
  spaceId: number;
  documents: DocumentResponse[];
  onCitation: (page: number, docId: number) => void;
}) {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState<StudySet | null>(null),
    [selected, setSelected] = useState<number[]>([]),
    [count, setCount] = useState(10);
  const {
    data: sets = [],
    isLoading,
    isError,
    refetch,
  } = useStudySets(spaceId);
  const create = useCreateStudySet(),
    remove = useDeleteStudySet();
  const ready = documents.filter((d) => d.status === "READY");
  const start = () => {
    const documentIds = selected.filter((id) =>
      ready.some((doc) => doc.id === id),
    );
    if (!documentIds.length) {
      toast.error("Chọn ít nhất một tài liệu đã sẵn sàng");
      return;
    }
    create.mutate(
      { spaceId, documentIds, cardCount: count },
      {
        onSuccess: (s) => {
          setOpen(false);
          setActive(s);
          toast.success("Đã tạo bộ ôn tập");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };
  if (active)
    return (
      <StudySession
        set={active}
        onBack={() => setActive(null)}
        onCitation={onCitation}
      />
    );
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-10 space-y-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Ôn tập tài liệu
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Flashcard và quiz dùng chung trong Space.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Tạo bộ mới
        </Button>
      </div>
      {isLoading ? (
        <Loader2 className="animate-spin mx-auto mt-12 text-primary" />
      ) : isError ? (
        <div
          role="alert"
          className="rounded-xl border border-border p-8 text-center space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Không tải được bộ ôn tập. Vui lòng thử lại.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center border border-dashed rounded-xl p-10 text-sm text-muted-foreground">
          Chưa có bộ ôn tập. Chọn PDF đã xử lý để bắt đầu.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sets.map((s) => (
            <div key={s.id} className="border bg-card rounded-xl p-4 space-y-3">
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.flashcards.length} thẻ · {s.quizQuestions.length} câu quiz
                  · {s.createdByName || "Thành viên"}
                </p>
              </div>
              <div className="flex justify-between">
                <Button size="sm" onClick={() => setActive(s)}>
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  Ôn tập
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Xóa bộ ôn tập này?"))
                      remove.mutate(s.id, {
                        onError: (e) => toast.error(getErrorMessage(e)),
                      });
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo bộ ôn tập bằng AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chọn tài liệu đã sẵn sàng. AI sẽ tạo flashcard có nguồn và 5 câu
              trắc nghiệm.
            </p>
            <div className="space-y-2 max-h-48 overflow-auto">
              {ready.map((d) => (
                <label key={d.id} className="flex gap-2 items-center text-sm">
                  <Checkbox
                    checked={selected.includes(d.id)}
                    onCheckedChange={() =>
                      setSelected((x) =>
                        x.includes(d.id)
                          ? x.filter((i) => i !== d.id)
                          : [...x, d.id],
                      )
                    }
                  />
                  {d.name}
                </label>
              ))}
              {!ready.length && (
                <p className="text-sm text-destructive">
                  Chưa có PDF nào ở trạng thái sẵn sàng.
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Số flashcard</p>
              <div className="flex gap-2">
                {[5, 10, 15].map((n) => (
                  <Button
                    key={n}
                    variant={count === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCount(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              disabled={create.isPending || !ready.length}
              onClick={start}
            >
              {create.isPending && (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              )}
              {create.isPending ? "Đang tạo..." : "Tạo bộ ôn tập"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Source({
  citation,
  onCitation,
}: {
  citation: Citation;
  onCitation: (p: number, d: number) => void;
}) {
  return (
    <button
      className="inline-flex items-start gap-2 text-sm text-primary text-left hover:underline break-words max-w-full"
      onClick={() => onCitation(citation.pageNumber, citation.documentId)}
    >
      <FileText className="size-4 shrink-0 mt-0.5" />
      <span>
        {citation.documentName} · tr. {citation.pageNumber}
      </span>
    </button>
  );
}
function StudySession({
  set,
  onBack,
  onCitation,
}: {
  set: StudySet;
  onBack: () => void;
  onCitation: (p: number, d: number) => void;
}) {
  const [tab, setTab] = useState<"cards" | "quiz">("cards"),
    [i, setI] = useState(0),
    [flipped, setFlipped] = useState(false),
    [answers, setAnswers] = useState<Record<number, number>>({}),
    [grade, setGrade] = useState<QuizGrade | null>(null);
  const grading = useGradeQuiz();
  const card = set.flashcards[i];
  const submit = () =>
    grading.mutate(
      {
        id: set.id,
        answers: Object.entries(answers).map(
          ([questionId, selectedOptionIndex]) => ({
            questionId: Number(questionId),
            selectedOptionIndex,
          }),
        ),
      },
      { onSuccess: setGrade, onError: (e) => toast.error(getErrorMessage(e)) },
    );
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 md:px-10 md:py-10">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <Button
          variant="ghost"
          className="text-muted-foreground -ml-3"
          onClick={onBack}
        >
          <ChevronLeft className="size-4" />
          Tất cả bộ học
        </Button>
        <h2 className="font-semibold text-2xl break-words">{set.title}</h2>
        <div className="flex gap-2" aria-label="Hình thức ôn tập">
          <Button
            variant={tab === "cards" ? "default" : "outline"}
            aria-pressed={tab === "cards"}
            onClick={() => setTab("cards")}
          >
            Flashcard
          </Button>
          <Button
            variant={tab === "quiz" ? "default" : "outline"}
            aria-pressed={tab === "quiz"}
            onClick={() => setTab("quiz")}
          >
            Quiz · {set.quizQuestions.length} câu
          </Button>
        </div>
        {tab === "cards" ? (
          card ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                  <span>{flipped ? "Đáp án" : "Câu hỏi"}</span>
                  <span>
                    {i + 1} / {set.flashcards.length}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Tiến độ flashcard"
                  aria-valuenow={i + 1}
                  aria-valuemin={0}
                  aria-valuemax={set.flashcards.length}
                  className="h-1 bg-muted overflow-hidden"
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${((i + 1) / set.flashcards.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                aria-label={flipped ? "Xem câu hỏi" : "Lật thẻ xem đáp án"}
                aria-pressed={flipped}
                className="w-full min-h-80 rounded-3xl border border-border bg-card p-6 md:p-10 text-center flex flex-col items-center justify-center gap-9 hover:bg-muted/10 focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => setFlipped(!flipped)}
              >
                <span className="text-xl md:text-2xl whitespace-pre-wrap break-words w-full">
                  {flipped ? card.back : card.front}
                </span>
                <span className="text-xs text-muted-foreground">
                  Nhấn để lật thẻ
                </span>
              </button>
              <div className="flex justify-between items-center gap-2 -mt-2">
                <Button
                  variant="outline"
                  disabled={i === 0}
                  onClick={() => {
                    setI(i - 1);
                    setFlipped(false);
                  }}
                >
                  <ChevronLeft className="size-4" />
                  Trước
                </Button>
                <Button variant="ghost" onClick={() => setFlipped(!flipped)}>
                  <RotateCcw className="size-4" />
                  Lật thẻ
                </Button>
                <Button
                  variant="outline"
                  disabled={i === set.flashcards.length - 1}
                  onClick={() => {
                    setI(i + 1);
                    setFlipped(false);
                  }}
                >
                  Sau
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Source citation={card.citation} onCitation={onCitation} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-10">
              Bộ học này chưa có flashcard.
            </p>
          )
        ) : (
          <div className="space-y-5">
            {!set.quizQuestions.length && (
              <p className="text-sm text-muted-foreground">
                Bộ học này chưa có câu quiz.
              </p>
            )}
            {set.quizQuestions.map((q, idx) => {
              const r = grade?.results.find((x) => x.questionId === q.id);
              return (
                <div
                  key={q.id}
                  className="border rounded-xl bg-card p-4 space-y-3"
                >
                  <p className="font-medium">
                    {idx + 1}. {q.question}
                  </p>
                  {q.options.map((o, n) => (
                    <button
                      key={n}
                      disabled={!!grade}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                      className={`block w-full text-left text-sm border rounded-lg p-3 ${answers[q.id] === n ? "border-primary bg-primary/5" : ""} ${r?.correctOptionIndex === n ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                    >
                      {String.fromCharCode(65 + n)}. {o}
                    </button>
                  ))}
                  {r && (
                    <div className="text-sm">
                      <p
                        className={
                          r.correct ? "text-green-600" : "text-destructive"
                        }
                      >
                        {r.correct ? (
                          <>
                            <CheckCircle2 className="inline w-4 h-4" /> Chính
                            xác
                          </>
                        ) : (
                          "Chưa đúng"
                        )}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {r.explanation}
                      </p>
                    </div>
                  )}
                  <Source citation={q.citation} onCitation={onCitation} />
                </div>
              );
            })}
            {grade ? (
              <div className="rounded-xl bg-primary/10 p-4 font-semibold">
                Kết quả: {grade.score}/{grade.total}
                <Button
                  className="ml-3"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setGrade(null);
                    setAnswers({});
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Làm lại
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={
                  grading.isPending ||
                  !set.quizQuestions.length ||
                  Object.keys(answers).length !== set.quizQuestions.length
                }
                onClick={submit}
              >
                {grading.isPending ? "Đang chấm..." : "Nộp bài"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
