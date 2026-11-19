import { useState, type ChangeEvent } from 'react';
import { BenchmarkRunSelect } from '@/features/admin/components/BenchmarkRunSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BenchmarkMetricDetails } from '@/features/admin/components/BenchmarkMetricDetails';
import type { BenchmarkMetrics, BenchmarkTrace } from '@/features/admin/types/benchmark-details';
import type { BenchmarkDocument } from '@/features/admin/services/benchmark-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Download, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api-error';
import { benchmarkApi as api, type BenchmarkDataset, type BenchmarkQuestion, type GroupSummary, type RunDetail, type BenchmarkSample } from '@/features/admin/services/benchmark-api';

const fieldClass = 'w-full rounded-md border bg-background px-3 py-2 text-sm';
const types = { DIRECT: 'Trực tiếp', SYNTHESIS: 'Tổng hợp', VISUAL: 'Visual' };
const metrics = [['contextPrecision', 'Context Precision'], ['faithfulness', 'Faithfulness'], ['answerRelevance', 'Answer Relevance'], ['citationAccuracy', 'Citation Accuracy'], ['latency', 'Latency (ms)']] as const;
const number = (value: number | null | undefined, digits = 3) => value == null ? '—' : value.toFixed(digits);

export function AdminBenchmarksPage() {
  const cache = useQueryClient();
  const [datasetId, setDatasetId] = useState<number>();
  const [runId, setRunId] = useState<number>();
  const [tab, setTab] = useState<'datasets' | 'runs'>('datasets');
  const [pending, setPending] = useState(false);
  const datasets = useQuery({ queryKey: ['benchmarks', 'datasets'], queryFn: api.datasets });
  const dataset = useQuery({ queryKey: ['benchmarks', 'dataset', datasetId], queryFn: () => api.dataset(datasetId!), enabled: !!datasetId, refetchInterval: 4000 });
  const runs = useQuery({ queryKey: ['benchmarks', 'runs'], queryFn: api.runs, refetchInterval: 4000 });
  const run = useQuery({ queryKey: ['benchmarks', 'run', runId], queryFn: () => api.run(runId!), enabled: !!runId, refetchInterval: q => q.state.data?.run.status === 'RUNNING' ? 2500 : false });
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
    await act(async () => { const r = await api.start(datasetId, smoke); setRunId(r.id); setTab('runs'); }, 'Đã bắt đầu benchmark');
  }
  const active = runs.data?.some(r => r.status === 'RUNNING');
  const error = datasets.error || dataset.error || runs.error || run.error;
  return <div className="w-full space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="type-page-title">Benchmark RAG</h1>
        <p className="mt-1 text-sm text-muted-foreground">Đánh giá pipeline hiện tại trên bộ câu hỏi có nguồn chuẩn.</p></div>
      <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"><Upload className="size-4" />Nhập dataset JSON
        <input aria-label="Nhập dataset JSON" type="file" accept=".json,application/json" className="sr-only" disabled={pending} onChange={importFile} /></label>
    </header>
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border bg-card p-0.5">
        <Button size="sm" variant={tab === 'datasets' ? 'secondary' : 'ghost'} onClick={() => setTab('datasets')}>Dataset</Button>
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
    </div> : <div className="space-y-4">
      <BenchmarkRunSelect runs={runs.data ?? []} value={runId} onChange={setRunId} loading={runs.isLoading} />
      {run.data && <RunResults detail={run.data} pending={pending || !!active} action={act} />}
      {!runId && <div className="rounded-xl border border-dashed px-6 py-12 text-center">{(runs.data?.length ?? 0) === 0 ? <><h2 className="font-medium">Chưa có lượt chạy</h2><p className="mt-1 text-sm text-muted-foreground">Chạy benchmark từ một dataset đã sẵn sàng để xem kết quả tại đây.</p></> : <><h2 className="font-medium">Kết quả sẽ hiển thị tại đây</h2><p className="mt-1 text-sm text-muted-foreground">Chọn một lượt chạy từ danh sách phía trên để xem kết quả và trace từng mẫu.</p></>}</div>}
    </div>}
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

function RunResults({ detail, pending, action }: { detail: RunDetail; pending: boolean; action: (f: () => Promise<unknown>, message: string) => Promise<void> }) {
  const [group, setGroup] = useState('ALL');
  const r = detail.run; const summary = detail.summary[group];
  const snapshot = JSON.parse(r.snapshotJson) as BenchmarkDataset;
  const finished = detail.samples.filter(s => ['COMPLETED', 'JUDGE_ERROR', 'GENERATION_ERROR'].includes(s.status)).length;
  return <>
    <Card className="space-y-4 p-4"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="type-section-title">Lượt #{r.id} · {r.smoke ? 'Smoke test' : 'Benchmark chính thức'}</h2><p className="mt-1 text-sm text-muted-foreground">{r.status} · {finished}/{detail.samples.length} mẫu · {new Date(r.createdAt).toLocaleString('vi-VN')}</p></div>
      <div className="flex flex-wrap gap-2">{(['csv', 'json'] as const).map(format => <Button key={format} variant="outline" size="sm" onClick={() => action(() => api.download(`/runs/${r.id}/export?format=${format}`, `benchmark-${r.id}.${format}`), 'Đã xuất kết quả')}>Xuất {format.toUpperCase()}</Button>)}
        {r.status === 'INTERRUPTED' && <Button disabled={pending} onClick={() => action(() => api.resume(r.id), 'Đã tiếp tục')}>Tiếp tục</Button>}
        {detail.samples.some(s => s.status === 'JUDGE_ERROR') && <Button disabled={pending} onClick={() => action(() => api.retryJudge(r.id), 'Đang chấm lại trace đã lưu')}>Thử lại judge</Button>}</div></div>
      <progress aria-label="Tiến độ benchmark" className="h-2 w-full" value={finished} max={detail.samples.length || 1} />
      <details className="text-sm"><summary className="cursor-pointer">Cấu hình đã đóng băng</summary><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(JSON.parse(r.configJson), null, 2)}</pre></details>
    </Card>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3"><div className="flex items-center gap-3"><label htmlFor="benchmark-question-group" className="shrink-0 text-sm font-medium">Nhóm câu hỏi</label><Select value={group} items={{ ALL: 'Tất cả', ...types }} onValueChange={value => { if (value) setGroup(value); }}><SelectTrigger id="benchmark-question-group" className="h-9 min-w-36 cursor-pointer bg-background shadow-xs"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false} className="p-1"><SelectItem value="ALL" className="cursor-pointer">Tất cả</SelectItem>{Object.entries(types).map(([value, label]) => <SelectItem key={value} value={value} className="cursor-pointer">{label}</SelectItem>)}</SelectContent></Select></div><span className="text-sm text-muted-foreground">Fallback: {summary.fallbackRate == null ? '—' : `${(summary.fallbackRate * 100).toFixed(1)}%`} · Rerank thực tế: {summary.rerankRate == null ? '—' : `${(summary.rerankRate * 100).toFixed(1)}%`} ({summary.traced} mẫu có trace) · {summary.errors}/{summary.total} mẫu lỗi</span></div>
    <SummaryTable summary={summary} />
    <p className="text-xs text-muted-foreground">Điểm chỉ tổng hợp mẫu hợp lệ; các cột lỗi, thiếu và không áp dụng được giữ riêng. Citation Accuracy đo đúng tài liệu–trang. Latency không bao gồm thời gian chấm.</p>
    <div className="space-y-3">{detail.samples.filter(s => group === 'ALL' || s.questionType === group).map(s => <SampleResult key={s.id} sample={s} question={snapshot.questions.find(q => q.code === s.questionCode)} documents={snapshot.documents} />)}</div>
  </>;
}
function SummaryTable({ summary }: { summary: GroupSummary }) {
  return <div className="overflow-auto rounded-xl border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted/60"><tr>{['Metric', 'Trung bình', 'Median', 'p95', 'Hợp lệ', 'Lỗi', 'Thiếu', 'Không áp dụng'].map(h => <th key={h} className="whitespace-nowrap p-3 font-medium">{h}</th>)}</tr></thead><tbody>{metrics.map(([key, label]) => { const m = summary[key]; return <tr key={key} className="border-t hover:bg-muted/40"><td className="p-3 font-medium">{label}</td><td className="p-3 tabular-nums">{number(m.mean)}</td><td className="p-3 tabular-nums">{number(m.median)}</td><td className="p-3 tabular-nums">{number(m.p95)}</td><td className="p-3 tabular-nums">{m.valid}</td><td className="p-3 tabular-nums">{m.errors}</td><td className="p-3 tabular-nums">{m.missing}</td><td className="p-3 tabular-nums">{m.notApplicable}</td></tr>; })}</tbody></table></div>;
}
function SampleResult({ sample: s, question: q, documents }: { sample: BenchmarkSample; question?: BenchmarkQuestion; documents: BenchmarkDocument[] }) {
  const trace: BenchmarkTrace | null = s.traceJson ? JSON.parse(s.traceJson) : null;
  const calculatedMetrics: BenchmarkMetrics | null = s.metricsJson ? JSON.parse(s.metricsJson) : null;
  return <details className="rounded-xl border bg-card p-4 transition-colors open:bg-muted/20"><summary className="cursor-pointer text-sm"><b>{s.questionCode}</b> · {types[s.questionType as keyof typeof types]} · lần {s.repetition} · {s.status}<span className="ml-3 text-muted-foreground">{q?.question}</span></summary>
    <div className="mt-4 space-y-4 text-sm">{s.error && <p role="alert" className="text-destructive">{s.error}</p>}<div><b>Đáp án chuẩn</b><p className="mt-1 whitespace-pre-wrap">{q?.referenceAnswer}</p><p className="text-xs text-muted-foreground">{q?.sources.map(x => `${x.documentCode}: trang ${x.pageNumber}`).join(' · ')}</p></div>
      <div><b>Câu trả lời</b><p className="mt-1 whitespace-pre-wrap">{trace?.response?.answer ?? 'Chưa có câu trả lời'}</p></div>
      <BenchmarkMetricDetails metrics={calculatedMetrics} question={q?.question} documents={documents} />
      <details><summary className="cursor-pointer">Dữ liệu kỹ thuật của phép tính</summary><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{calculatedMetrics ? JSON.stringify(calculatedMetrics, null, 2) : "Chưa chấm"}</pre></details>
      <details><summary className="cursor-pointer">Context, citation và trace</summary><pre className="mt-2 max-h-[600px] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">{trace ? JSON.stringify(trace, null, 2) : 'Chưa có trace'}</pre></details>
    </div></details>;
}
