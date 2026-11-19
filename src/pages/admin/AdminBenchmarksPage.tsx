import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { BenchmarkRunFilters, BenchmarkRunList, RunStatusBadge, canDeleteRun, defaultRunFilters, formatRunTime, matchesRunFilters } from '@/features/admin/components/BenchmarkRunSelect';
import { BenchmarkBulkDelete } from '@/features/admin/components/BenchmarkBulkDelete';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BenchmarkMetricDetails } from '@/features/admin/components/BenchmarkMetricDetails';
import type { BenchmarkMetrics, BenchmarkTrace } from '@/features/admin/types/benchmark-details';
import type { BenchmarkDocument } from '@/features/admin/services/benchmark-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Upload, Download, Play, CheckCircle2, Loader2, Trash2, List, Ellipsis } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CustomTable from '@/components/table/custom-table';
import { MarkdownResponse } from '@/components/shared/MarkdownResponse';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getErrorMessage } from '@/lib/api-error';
import { benchmarkApi as api, type BenchmarkDataset, type BenchmarkQuestion, type BenchmarkRun, type GroupSummary, type MetricSummary, type RunDetail, type BenchmarkSample } from '@/features/admin/services/benchmark-api';

const fieldClass = 'w-full rounded-md border bg-background px-3 py-2 text-sm';
const types = { DIRECT: 'Trực tiếp', SYNTHESIS: 'Tổng hợp', VISUAL: 'Visual' };
const metrics = [['contextPrecision', 'Context Precision'], ['faithfulness', 'Faithfulness'], ['answerRelevance', 'Answer Relevance'], ['citationAccuracy', 'Citation Accuracy'], ['latency', 'Latency (ms)']] as const;
const number = (value: number | null | undefined, digits = 3) => value == null ? '—' : value.toFixed(digits);

export function AdminBenchmarksPage() {
  const cache = useQueryClient();
  const [datasetId, setDatasetId] = useState<number>();
  const [runId, setRunId] = useState<number>();
  const [runFilters, setRunFilters] = useState(defaultRunFilters);
  const [bulkMode, setBulkMode] = useState(false);
  const bulkButton = useRef<HTMLButtonElement>(null);
  const mobileRunButton = useRef<HTMLButtonElement>(null);
  const [runSheetOpen, setRunSheetOpen] = useState(false);
  const [tab, setTab] = useState<'datasets' | 'runs'>('datasets');
  const [pending, setPending] = useState(false);
  const datasets = useQuery({ queryKey: ['benchmarks', 'datasets'], queryFn: api.datasets });
  const dataset = useQuery({ queryKey: ['benchmarks', 'dataset', datasetId], queryFn: () => api.dataset(datasetId!), enabled: !!datasetId, refetchInterval: 4000 });
  const runs = useQuery({ queryKey: ['benchmarks', 'runs'], queryFn: api.runs, refetchInterval: 4000 });
  const run = useQuery({
    queryKey: ['benchmarks', 'run', runId], queryFn: () => api.run(runId!), enabled: !!runId,
    refetchInterval: q => isRunInProgress(q.state.data?.run.status) ? 2500 : false,
  });
  async function act(action: () => Promise<unknown>, message: string) {
    setPending(true);
    try { await action(); await cache.invalidateQueries({ queryKey: ['benchmarks'] }); toast.success(message); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setPending(false); }
  }
  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    await act(async () => { const d = await api.importDataset(JSON.parse(await file.text())); setDatasetId(d.id); setTab('datasets'); }, 'Đã nhập dataset nháp');
    e.target.value = '';
  }
  async function start(smoke: boolean) {
    if (!datasetId) return;
    await act(async () => { const r = await api.start(datasetId, smoke); setBulkMode(false); setRunFilters(defaultRunFilters); setRunId(r.id); setTab('runs'); }, 'Đã bắt đầu benchmark');
  }
  async function removeDeletedRuns(ids: number[]) {
    const deleted = new Set(ids);
    await Promise.all([
      cache.cancelQueries({ queryKey: ['benchmarks', 'runs'] }),
      ...ids.map(id => cache.cancelQueries({ queryKey: ['benchmarks', 'run', id] })),
    ]);
    setRunId(selected => selected != null && deleted.has(selected) ? undefined : selected);
    ids.forEach(id => cache.removeQueries({ queryKey: ['benchmarks', 'run', id] }));
    cache.setQueryData<BenchmarkRun[]>(['benchmarks', 'runs'], current => current?.filter(item => !deleted.has(item.id)));
    void cache.invalidateQueries({ queryKey: ['benchmarks', 'runs'] });
  }
  async function deleteRun(id: number) {
    await api.deleteRun(id);
    await removeDeletedRuns([id]);
    toast.success(`Đã xóa lượt #${id}`);
  }
  async function deleteRuns(ids: number[]) {
    await api.deleteRuns(ids);
    await removeDeletedRuns(ids);
    toast.success(`Đã xóa ${ids.length} lượt`);
  }
  async function refreshBulkRuns() {
    const refreshed = await runs.refetch();
    if (refreshed.isSuccess) return refreshed.data.filter(item => matchesRunFilters(item, runFilters));
  }
  function exitBulkMode() {
    if (runId != null && !visibleRuns.some(item => item.id === runId)) setRunId(undefined);
    setBulkMode(false);
    window.requestAnimationFrame(() => {
      if (bulkButton.current?.getClientRects().length) bulkButton.current.focus();
      else mobileRunButton.current?.focus();
    });
  }
  function startBulkMode() {
    setRunSheetOpen(false);
    setBulkMode(true);
  }
  function changeRunFilters(filters: typeof defaultRunFilters) {
    setRunFilters(filters);
    const selected = runs.data?.find(item => item.id === runId) ?? run.data?.run;
    if (!bulkMode && selected && !matchesRunFilters(selected, filters)) setRunId(undefined);
  }
  const visibleRuns = useMemo(() => runs.data?.filter(item => matchesRunFilters(item, runFilters)) ?? [], [runs.data, runFilters]);
  const active = runs.data?.some(r => isRunInProgress(r.status));
  const selectedRun = run.data && matchesRunFilters(run.data.run, runFilters) ? run.data : undefined;
  const noMatchingRuns = !!runs.data?.length && !visibleRuns.length;
  const error = datasets.error || dataset.error || runs.error || (!bulkMode && run.error);
  const runListProps = {
    runs: runs.data ?? [], visibleRuns, value: runId, loading: runs.isLoading,
    filters: runFilters, onFilterChange: changeRunFilters, onStartBulk: startBulkMode,
  };
  return <div className="w-full space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="type-page-title">Benchmark RAG</h1>
        <p className="mt-1 text-sm text-muted-foreground">Đánh giá pipeline hiện tại trên bộ câu hỏi có nguồn chuẩn.</p></div>
      {tab === 'datasets' && <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"><Upload className="size-4" />Nhập dataset JSON
        <input aria-label="Nhập dataset JSON" type="file" accept=".json,application/json" className="sr-only" disabled={pending} onChange={importFile} /></label>}
    </header>
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border bg-card p-0.5">
        <Button size="sm" variant={tab === 'datasets' ? 'secondary' : 'ghost'} onClick={() => { setBulkMode(false); setTab('datasets'); }}>Dataset</Button>
        <Button size="sm" variant={tab === 'runs' ? 'secondary' : 'ghost'} onClick={() => setTab('runs')}>Lượt chạy ({runs.data?.length ?? 0})</Button>
      </div>
      {pending && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Đang cập nhật</span>}
    </div>
    {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{getErrorMessage(error)}</p>}
    {tab === 'datasets' ? <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div><h2 className="type-card-title">Dataset</h2><p className="type-meta mt-1 text-muted-foreground">Chọn bộ câu hỏi để chuẩn bị và đánh giá.</p></div>
        {datasets.isPending && <Card className="p-4 text-sm text-muted-foreground">Đang tải dataset…</Card>}
        {datasets.data?.length === 0 && <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nhập file operating-systems-v1.json trong mora-ai/benchmarks/datasets để bắt đầu.</div>}
        <div className="space-y-2">{datasets.data?.map(d => <button key={d.id} onClick={() => setDatasetId(d.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${datasetId === d.id ? 'border-primary/30 bg-muted font-medium' : 'bg-card hover:bg-muted/60'}`}>{d.name}<span className="mt-1 block type-meta text-muted-foreground">Dataset #{d.id} · Space #{d.spaceId}</span></button>)}</div>
      </aside>
      <main className="min-w-0 space-y-4">
        {!datasetId && <div className="rounded-xl border border-dashed px-6 py-12 text-center"><h2 className="font-medium">Chưa chọn dataset</h2><p className="mt-1 text-sm text-muted-foreground">Chọn một dataset để tải tài liệu và duyệt ground truth.</p></div>}
        {dataset.data && <>
          <DatasetHeader data={dataset.data} pending={pending || !!active} start={start} download={() => act(() => api.download(`/datasets/${datasetId}/export`, `dataset-${datasetId}.json`), 'Đã xuất dataset')} />
          <Card className="space-y-3 p-4"><div><h2 className="type-card-title">Tài liệu nguồn</h2><p className="type-meta mt-1 text-muted-foreground">Tải đúng PDF gốc. Hệ thống kiểm tra SHA-256 và số trang trước khi parse/index.</p></div>
            {dataset.data.documents.map(d => <div key={d.code} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm"><div><b>{d.code}</b> · {d.fileName}<p className="type-meta mt-1 text-muted-foreground">{d.pageCount} trang · {d.status}</p></div>
              {d.documentId == null ? <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent">Tải PDF<input type="file" aria-label={`Tải PDF ${d.code}`} accept="application/pdf,.pdf" className="sr-only" disabled={pending} onChange={e => { const f = e.target.files?.[0]; if (f) void act(() => api.upload(datasetId!, d.code, f), 'Đang xử lý PDF'); }} /></label> : d.storageUrl && <a href={d.storageUrl} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">Mở PDF</a>}
            </div>)}
          </Card>
          <div><h2 className="type-section-title">Câu hỏi & ground truth</h2><p className="mt-1 text-sm text-muted-foreground">Đối chiếu đáp án với PDF gốc trước khi duyệt. Sửa nội dung sẽ hủy duyệt câu hỏi đó.</p></div>
          {dataset.data.questions.map(q => <QuestionEditor key={q.id} question={q} dataset={dataset.data!} pending={pending} save={edited => act(() => api.saveQuestion(datasetId!, edited), 'Đã lưu, cần duyệt lại')} approve={() => act(() => api.approve(datasetId!, q), q.approved ? 'Đã bỏ duyệt' : 'Đã duyệt câu hỏi')} />)}
        </>}
      </main>
    </div> : bulkMode ? (
      <div className="space-y-4">
        <Card className="gap-0 p-4"><BenchmarkRunFilters runs={runListProps.runs} filters={runFilters} onChange={changeRunFilters} horizontal /></Card>
        <BenchmarkBulkDelete runs={visibleRuns} onExit={exitBulkMode} onDelete={deleteRuns} onRefresh={refreshBulkRuns} />
      </div>
    ) : (
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-4 lg:block" aria-label="Danh sách lượt chạy">
          <BenchmarkRunList {...runListProps} onChange={setRunId} bulkButtonRef={bulkButton} />
        </aside>
        <div className="lg:hidden">
          <Sheet open={runSheetOpen} onOpenChange={setRunSheetOpen}>
            <SheetTrigger render={<Button ref={mobileRunButton} variant="outline" className="w-full justify-start" />}>
              <List className="size-4" />Chọn lượt chạy
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-md gap-0 sm:max-w-md">
              <SheetHeader className="pr-12"><SheetTitle>Chọn lượt chạy</SheetTitle></SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-0">
                <BenchmarkRunList {...runListProps} onChange={id => { setRunId(id); setRunSheetOpen(false); }} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <section aria-label="Kết quả lượt chạy" className="min-w-0 space-y-4">
          {selectedRun && <RunResults key={selectedRun.run.id} detail={selectedRun} pending={pending || !!active} action={act} onDelete={deleteRun} />}
          {!selectedRun && (run.isFetching || runs.isLoading) && <Card className="p-5 text-sm text-muted-foreground"><p role="status">Đang tải kết quả…</p></Card>}
          {!selectedRun && !run.isFetching && !runs.isLoading && (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center">
              {noMatchingRuns ? (
                <h2 className="font-medium">Không có lượt chạy khớp bộ lọc</h2>
              ) : runs.data?.length === 0 ? (
                <><h2 className="font-medium">Chưa có lượt chạy</h2><p className="mt-1 text-sm text-muted-foreground">Chạy benchmark từ một dataset đã sẵn sàng để xem kết quả tại đây.</p></>
              ) : (
                <><h2 className="font-medium">Kết quả sẽ hiển thị tại đây</h2><p className="mt-1 text-sm text-muted-foreground">Chọn một lượt chạy để xem kết quả và trace từng mẫu.</p></>
              )}
            </div>
          )}
        </section>
      </div>
    )}
  </div>;
}

function DatasetHeader({ data, pending, start, download }: { data: BenchmarkDataset; pending: boolean; start: (smoke: boolean) => void; download: () => void }) {
  const approved = data.questions.filter(q => q.approved).length;
  const ready = data.documents.every(d => d.status === 'READY');
  const reviewed = approved === data.questions.length;
  return <Card className="space-y-4 p-4"><div><h2 className="type-section-title">{data.name}</h2><p className="mt-1 text-sm text-muted-foreground">{data.description}</p></div>
    <div className="flex flex-wrap gap-2 text-sm"><span className="rounded-full border px-2.5 py-1">{data.documents.length} PDF</span><span className="rounded-full border px-2.5 py-1">{data.questions.length} câu hỏi</span><span className="rounded-full border px-2.5 py-1">{approved} đã duyệt</span><span className="rounded-full border px-2.5 py-1">{ready ? 'Corpus sẵn sàng' : 'Chờ tài liệu READY'}</span></div>
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={pending} onClick={download}><Download className="size-4" />Xuất JSON</Button>
      <Button variant="outline" disabled={pending || !ready || !reviewed} onClick={() => start(true)}><Play className="size-4" />Smoke test · 1 mẫu</Button>
      <Button disabled={pending || !ready || !reviewed} onClick={() => start(false)}><Play className="size-4" />Chạy chính thức · {data.questions.length * 3} mẫu</Button></div>
    <p className="text-xs text-muted-foreground">Duyệt toàn bộ câu hỏi và chờ PDF index xong để chạy. API key và model được cấu hình tại server.</p>
  </Card>;
}

function QuestionEditor({ question: q, dataset, pending, save, approve }: { question: BenchmarkQuestion; dataset: BenchmarkDataset; pending: boolean; save: (q: BenchmarkQuestion) => void; approve: () => void }) {
  const [draft, setDraft] = useState<BenchmarkQuestion | null>(null);
  const [sources, setSources] = useState('');
  const [error, setError] = useState('');
  function submit() {
    try {
      const parsed = JSON.parse(sources);
      if (!Array.isArray(parsed)) throw new Error('Nguồn phải là mảng JSON');
      save({ ...draft!, sources: parsed }); setDraft(null); setError('');
    } catch { setError('Nguồn không đúng JSON. Ví dụ: [{"documentCode":"OS01","pageNumber":7}]'); }
  }
  return <Card className="space-y-4 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><b>{q.code}</b><span className="rounded-full border bg-muted px-2.5 py-1 text-xs">{types[q.type]}</span><span className={`text-xs font-medium ${q.approved ? 'text-emerald-600' : 'text-muted-foreground'}`}>{q.approved ? 'Đã duyệt' : 'Bản nháp'}</span></div>
      <div className="flex gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => { setDraft({ ...q }); setSources(JSON.stringify(q.sources, null, 2)); }}>Sửa</Button><Button size="sm" variant={q.approved ? 'outline' : 'default'} disabled={pending || !!draft} onClick={approve}><CheckCircle2 className="size-4" />{q.approved ? 'Bỏ duyệt' : 'Duyệt'}</Button></div></div>
    {draft ? <div className="space-y-3">
      <div className="space-y-2"><label htmlFor={`question-type-${q.id}`} className="text-sm">Loại câu hỏi</label><Select value={draft.type} items={types} onValueChange={value => { if (value) setDraft({ ...draft, type: value as BenchmarkQuestion['type'] }); }}><SelectTrigger id={`question-type-${q.id}`} className="h-10 w-full cursor-pointer bg-background"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{Object.entries(types).map(([value, label]) => <SelectItem key={value} value={value} className="cursor-pointer">{label}</SelectItem>)}</SelectContent></Select></div>
      {(['question', 'referenceAnswer', 'explanation'] as const).map((key, index) => <label key={key} className="block text-sm">{['Câu hỏi', 'Đáp án chuẩn', 'Giải thích'][index]}<textarea className={`${fieldClass} mt-1 min-h-24`} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
      <label className="block text-sm">Nguồn chuẩn (JSON)<textarea className={`${fieldClass} mt-1 font-mono`} rows={4} value={sources} onChange={e => setSources(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><Button disabled={pending} onClick={submit}>Lưu bản nháp</Button><Button variant="outline" onClick={() => setDraft(null)}>Hủy</Button></div>
    </div> : <><p className="font-medium">{q.question}</p><div className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed whitespace-pre-wrap">{q.referenceAnswer}</div><p className="text-sm text-muted-foreground">{q.explanation}</p>
      <div className="flex flex-wrap gap-2">{q.sources.map((s, i) => { const doc = dataset.documents.find(d => d.code === s.documentCode); return doc?.storageUrl ? <a key={i} className="rounded-full border px-2.5 py-1 text-xs font-medium hover:bg-muted hover:no-underline" href={`${doc.storageUrl}#page=${s.pageNumber}`} target="_blank" rel="noreferrer">{s.documentCode} · trang PDF {s.pageNumber}</a> : <span key={i} className="rounded-full border px-2.5 py-1 text-xs">{s.documentCode} · trang PDF {s.pageNumber}</span>; })}</div></>}
  </Card>;
}

function isRunInProgress(status?: string) {
  return status === 'RUNNING' || status === 'PREPARING';
}

const samplesPerPage = 20;
const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });
const rate = (value: number | null) => value == null ? '—' : percent.format(value);

function RunResults({ detail, pending, action, onDelete }: {
  detail: RunDetail; pending: boolean; action: (f: () => Promise<unknown>, message: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [group, setGroup] = useState('ALL');
  const [samplePage, setSamplePage] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const actionsButton = useRef<HTMLButtonElement>(null);
  const r = detail.run;
  const summary = detail.summary[group];
  const snapshot = JSON.parse(r.snapshotJson) as BenchmarkDataset;
  const questions = new Map(snapshot.questions.map(question => [question.code, question]));
  const finished = detail.samples.filter(sample => ['COMPLETED', 'JUDGE_ERROR', 'GENERATION_ERROR'].includes(sample.status)).length;
  const total = detail.samples.length;
  const visibleSamples = detail.samples.filter(sample => group === 'ALL' || sample.questionType === group);
  const pageCount = Math.ceil(visibleSamples.length / samplesPerPage);
  const page = Math.min(samplePage, Math.max(0, pageCount - 1));
  const first = page * samplesPerPage;
  const last = Math.min(first + samplesPerPage, visibleSamples.length);
  const groupOptions = { ALL: 'Tất cả', ...types };
  const retryable = detail.samples.some(sample => sample.status === 'JUDGE_ERROR');

  return (
    <>
      <Card className="gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="type-section-title">Lượt #{r.id}</h2>
              <RunStatusBadge status={r.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Dataset {r.datasetId} · {r.smoke ? 'Chạy thử' : 'Chính thức'} · <time dateTime={r.createdAt || undefined}>{formatRunTime(r.createdAt)}</time>
            </p>
            <p className="text-sm font-medium tabular-nums">{finished}/{total} mẫu đã xử lý</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {r.status === 'INTERRUPTED' && (
              <Button size="sm" disabled={pending} onClick={() => action(() => api.resume(r.id), 'Đã tiếp tục')}>Tiếp tục</Button>
            )}
            {retryable && (
              <Button size="sm" variant={r.status === 'INTERRUPTED' ? 'outline' : 'default'} disabled={pending}
                onClick={() => action(() => api.retryJudge(r.id), 'Đang chấm lại trace đã lưu')}>Thử lại judge</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button ref={actionsButton} size="sm" variant="outline" />}><Ellipsis className="size-4" />Thao tác</DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(['csv', 'json'] as const).map(format => (
                  <DropdownMenuItem key={format} onClick={() => void action(
                    () => api.download(`/runs/${r.id}/export?format=${format}`, `benchmark-${r.id}.${format}`), 'Đã xuất kết quả',
                  )}>
                    <Download className="size-4" />Xuất {format.toUpperCase()}
                  </DropdownMenuItem>
                ))}
                {canDeleteRun(r) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="size-4" />Xóa lượt
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {isRunInProgress(r.status) && (
          <div role="progressbar" aria-label="Tiến độ benchmark" aria-valuemin={0} aria-valuemax={total || 1}
            aria-valuenow={finished} aria-valuetext={`${finished}/${total} mẫu`} className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 motion-safe:transition-[width]"
              style={{ width: `${total ? (finished / total) * 100 : 0}%` }} />
          </div>
        )}
      </Card>

      <Tabs defaultValue="overview" className="min-w-0 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList variant="line" aria-label="Kết quả Benchmark">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="samples">Mẫu đánh giá</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="benchmark-question-group" className="text-sm font-medium">Nhóm câu hỏi</label>
            <Select value={group} items={groupOptions} onValueChange={value => {
              if (value) { setGroup(value); setSamplePage(0); }
            }}>
              <SelectTrigger id="benchmark-question-group" size="sm" className="min-w-32 cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {Object.entries(groupOptions).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="overview" className="min-w-0 space-y-4">
          {summary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <RunStat label="Mẫu lỗi" value={`${summary.errors}/${summary.total}`} />
                <RunStat label="Tỷ lệ fallback" value={rate(summary.fallbackRate)} />
                <RunStat label="Rerank thực tế" value={rate(summary.rerankRate)} detail={`${summary.traced} mẫu có trace`} />
              </div>
              <section aria-labelledby="benchmark-metrics" className="min-w-0 space-y-2">
                <h3 id="benchmark-metrics" className="type-card-title">Chỉ số đánh giá</h3>
                <SummaryTable summary={summary} />
                <p className="text-xs text-muted-foreground">Điểm chỉ tổng hợp mẫu hợp lệ. Citation Accuracy đo đúng tài liệu–trang. Latency không bao gồm thời gian chấm.</p>
              </section>
            </>
          ) : <p className="text-sm text-muted-foreground">Chưa có số liệu cho nhóm câu hỏi này.</p>}
          <DisclosureCard label="Cấu hình đã đóng băng">
            <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(JSON.parse(r.configJson), null, 2)}</pre>
          </DisclosureCard>
        </TabsContent>

        <TabsContent value="samples" className="min-w-0 space-y-3">
          {visibleSamples.length ? (
            <>
              <p role="status" className="text-sm text-muted-foreground">Mẫu {first + 1}–{last} trong {visibleSamples.length}</p>
              <div className="min-w-0 space-y-2">
                {visibleSamples.slice(first, last).map(sample => (
                  <SampleResult key={sample.id} sample={sample} question={questions.get(sample.questionCode)} documents={snapshot.documents} />
                ))}
              </div>
              {pageCount > 1 && (
                <nav aria-label="Phân trang mẫu đánh giá" className="flex flex-wrap items-center justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setSamplePage(page - 1)}>Trước</Button>
                  <span className="px-1 text-sm tabular-nums text-muted-foreground">{page + 1}/{pageCount}</span>
                  <Button size="sm" variant="outline" disabled={page + 1 >= pageCount} onClick={() => setSamplePage(page + 1)}>Sau</Button>
                </nav>
              )}
            </>
          ) : <Card className="p-5 text-sm text-muted-foreground">Không có mẫu trong nhóm câu hỏi này.</Card>}
        </TabsContent>
      </Tabs>
      <DeleteRunDialog runId={r.id} onDelete={onDelete} open={deleteOpen} setOpen={setDeleteOpen} returnFocus={actionsButton} />
    </>
  );
}

function RunStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card className="gap-0 p-5">
      <p className="type-meta text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="type-meta mt-1 text-muted-foreground">{detail}</p>}
    </Card>
  );
}

function DeleteRunDialog({ runId, onDelete, open, setOpen, returnFocus }: {
  runId: number; onDelete: (id: number) => Promise<void>;
  open: boolean; setOpen: (open: boolean) => void; returnFocus: React.RefObject<HTMLButtonElement | null>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  async function confirmDelete() {
    setDeleting(true);
    setError(undefined);
    try {
      await onDelete(runId);
      setOpen(false);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={next => {
      if (deleting) return;
      setError(undefined);
      setOpen(next);
    }}>
      <AlertDialogContent finalFocus={returnFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa lượt #{runId}?</AlertDialogTitle>
          <AlertDialogDescription>Lần xóa này sẽ xóa vĩnh viễn kết quả và các mẫu của lượt chạy. Dataset vẫn có thể dùng để chạy lại.</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
            {deleting ? 'Đang xóa…' : 'Xóa lượt'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
type MetricRow = MetricSummary & { label: string };

const metricColumns: ColumnDef<MetricRow>[] = [
  { accessorKey: 'label', header: 'Metric', cell: ({ row }) => <span className="font-medium">{row.original.label}</span> },
  ...([
    ['mean', 'Trung bình'], ['median', 'Median'], ['p95', 'p95'],
    ['valid', 'Hợp lệ'], ['errors', 'Lỗi'], ['missing', 'Thiếu'], ['notApplicable', 'Không áp dụng'],
  ] as const).map(([key, header]): ColumnDef<MetricRow> => ({
    accessorKey: key,
    header,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {key === 'mean' || key === 'median' || key === 'p95' ? number(row.original[key]) : row.original[key]}
      </span>
    ),
  })),
];

function SummaryTable({ summary }: { summary: GroupSummary }) {
  const data = useMemo(() => metrics.map(([key, label]) => ({ ...summary[key], label })), [summary]);
  const table = useReactTable({ data, columns: metricColumns, getCoreRowModel: getCoreRowModel() });
  return (
    <div role="region" aria-label="Bảng chỉ số đánh giá" className="min-w-0 overflow-hidden rounded-md border">
      <CustomTable columns={metricColumns} table={table} />
    </div>
  );
}
function SampleResult({ sample: s, question: q, documents }: { sample: BenchmarkSample; question?: BenchmarkQuestion; documents: BenchmarkDocument[] }) {
  const trace: BenchmarkTrace | null = s.traceJson ? JSON.parse(s.traceJson) : null;
  const calculatedMetrics: BenchmarkMetrics | null = s.metricsJson ? JSON.parse(s.metricsJson) : null;
  const label = (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span><b>{s.questionCode}</b> · {types[s.questionType as keyof typeof types]} · lần {s.repetition} · {s.status}</span>
      {q && <span className="text-muted-foreground">{q.question}</span>}
    </span>
  );
  return <DisclosureCard label={label}>
    <div className="space-y-4 text-sm">{s.error && <p role="alert" className="text-destructive">{s.error}</p>}<div><b>Đáp án chuẩn</b><p className="mt-1 whitespace-pre-wrap">{q?.referenceAnswer}</p><p className="text-xs text-muted-foreground">{q?.sources.map(x => `${x.documentCode}: trang ${x.pageNumber}`).join(' · ')}</p></div>
      <div>
        <b>Câu trả lời</b>
        <div className="mt-1 min-w-0 break-words">
          <MarkdownResponse text={trace?.response?.answer || 'Chưa có câu trả lời'} />
        </div>
      </div>
      <BenchmarkMetricDetails metrics={calculatedMetrics} question={q?.question} documents={documents} />
      <details><summary className="cursor-pointer">Dữ liệu kỹ thuật của phép tính</summary><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{calculatedMetrics ? JSON.stringify(calculatedMetrics, null, 2) : "Chưa chấm"}</pre></details>
      <details><summary className="cursor-pointer">Context, citation và trace</summary><pre className="mt-2 max-h-[600px] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">{trace ? JSON.stringify(trace, null, 2) : 'Chưa có trace'}</pre></details>
    </div></DisclosureCard>;
}
