import { useState, type ChangeEvent } from 'react';
import { BenchmarkRunSelect } from '@/features/admin/components/BenchmarkRunSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BenchmarkMetricDetails } from '@/features/admin/components/BenchmarkMetricDetails';
import type { BenchmarkMetrics, BenchmarkTrace } from '@/features/admin/types/benchmark-details';
import type { BenchmarkDocument } from '@/features/admin/services/benchmark-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FlaskConical, Upload, Download, Play, CheckCircle2, Loader2 } from 'lucide-react';
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
  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><FlaskConical className="size-6" /><h1 className="text-2xl font-semibold tracking-tight">Benchmark RAG</h1></div>
        <p className="mt-2 text-sm text-muted-foreground">Đánh giá pipeline hiện tại trên bộ câu hỏi có nguồn chuẩn.</p></div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted"><Upload className="size-4" />Nhập dataset JSON
        <input aria-label="Nhập dataset JSON" type="file" accept=".json,application/json" className="sr-only" disabled={pending} onChange={importFile} /></label>
    </header>
    <div className="flex gap-2 border-b pb-3">
      <Button variant={tab === 'datasets' ? 'default' : 'outline'} onClick={() => setTab('datasets')}>Dataset</Button>
      <Button variant={tab === 'runs' ? 'default' : 'outline'} onClick={() => setTab('runs')}>Lượt chạy ({runs.data?.length ?? 0})</Button>
      {pending && <Loader2 className="m-2 size-5 animate-spin" />}
    </div>
    {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{getErrorMessage(error)}</p>}
    {tab === 'datasets' ? <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        {datasets.isPending && <p>Đang tải…</p>}
        {datasets.data?.length === 0 && <Card className="p-4 text-sm text-muted-foreground">Nhập file operating-systems-v1.json trong mora-ai/benchmarks/datasets để bắt đầu.</Card>}
        {datasets.data?.map(d => <button key={d.id} onClick={() => setDatasetId(d.id)} className={`w-full rounded-lg border p-3 text-left text-sm ${datasetId === d.id ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}>{d.name}<span className="mt-1 block text-xs text-muted-foreground">Dataset #{d.id} · Space #{d.spaceId}</span></button>)}
      </aside>
      <main className="min-w-0 space-y-5">
        {!datasetId && <Card className="p-10 text-center text-muted-foreground">Chọn dataset để tải tài liệu và duyệt ground truth.</Card>}
        {dataset.data && <>
          <DatasetHeader data={dataset.data} pending={pending || !!active} start={start} download={() => act(() => api.download(`/datasets/${datasetId}/export`, `dataset-${datasetId}.json`), 'Đã xuất dataset')} />
          <Card className="space-y-3 p-5"><h2 className="font-semibold">Tài liệu nguồn</h2><p className="text-xs text-muted-foreground">Tải đúng PDF gốc. Hệ thống kiểm tra SHA-256 và số trang trước khi parse/index.</p>
            {dataset.data.documents.map(d => <div key={d.code} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm"><div><b>{d.code}</b> · {d.fileName}<p className="text-xs text-muted-foreground">{d.pageCount} trang · {d.status}</p></div>
              {d.documentId == null ? <label className="cursor-pointer rounded border px-3 py-2">Tải PDF<input type="file" aria-label={`Tải PDF ${d.code}`} accept="application/pdf,.pdf" className="sr-only" disabled={pending} onChange={e => { const f = e.target.files?.[0]; if (f) void act(() => api.upload(datasetId!, d.code, f), 'Đang xử lý PDF'); }} /></label> : d.storageUrl && <a href={d.storageUrl} target="_blank" rel="noreferrer" className="underline">Mở PDF</a>}
            </div>)}
          </Card>
          <div><h2 className="font-semibold">Câu hỏi & ground truth</h2><p className="mt-1 text-sm text-muted-foreground">Đối chiếu đáp án với PDF gốc trước khi duyệt. Sửa nội dung sẽ hủy duyệt câu hỏi đó.</p></div>
          {dataset.data.questions.map(q => <QuestionEditor key={q.id} question={q} dataset={dataset.data!} pending={pending} save={edited => act(() => api.saveQuestion(datasetId!, edited), 'Đã lưu, cần duyệt lại')} approve={() => act(() => api.approve(datasetId!, q), q.approved ? 'Đã bỏ duyệt' : 'Đã duyệt câu hỏi')} />)}
        </>}
      </main>
    </div> : <div className="space-y-5">
      <BenchmarkRunSelect runs={runs.data ?? []} value={runId} onChange={setRunId} loading={runs.isLoading} />
      {run.data && <RunResults detail={run.data} pending={pending || !!active} action={act} />}
      {!runId && <Card className="p-10 text-center text-muted-foreground">Chọn lượt chạy để xem kết quả và trace từng mẫu.</Card>}
    </div>}
  </div>;
}

function DatasetHeader({ data, pending, start, download }: { data: BenchmarkDataset; pending: boolean; start: (smoke: boolean) => void; download: () => void }) {
  const approved = data.questions.filter(q => q.approved).length;
  const ready = data.documents.every(d => d.status === 'READY');
  const reviewed = approved === data.questions.length;
  return <Card className="space-y-4 p-5"><div><h2 className="text-lg font-semibold">{data.name}</h2><p className="mt-1 text-sm text-muted-foreground">{data.description}</p></div>
    <div className="flex flex-wrap gap-3 text-sm"><span>{data.documents.length} PDF</span><span>{data.questions.length} câu hỏi</span><span>{approved} đã duyệt</span><span>{ready ? 'Corpus sẵn sàng' : 'Chờ tài liệu READY'}</span></div>
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
  return <Card className="space-y-3 p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><b>{q.code}</b><span className="rounded bg-muted px-2 py-1 text-xs">{types[q.type]}</span><span className={`text-xs ${q.approved ? 'text-emerald-600' : 'text-muted-foreground'}`}>{q.approved ? 'Đã duyệt' : 'Bản nháp'}</span></div>
      <div className="flex gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => { setDraft({ ...q }); setSources(JSON.stringify(q.sources, null, 2)); }}>Sửa</Button><Button size="sm" variant={q.approved ? 'outline' : 'default'} disabled={pending || !!draft} onClick={approve}><CheckCircle2 className="size-4" />{q.approved ? 'Bỏ duyệt' : 'Duyệt'}</Button></div></div>
    {draft ? <div className="space-y-3">
      <div className="space-y-2"><label htmlFor={`question-type-${q.id}`} className="text-sm">Loại câu hỏi</label><Select value={draft.type} items={types} onValueChange={value => { if (value) setDraft({ ...draft, type: value as BenchmarkQuestion['type'] }); }}><SelectTrigger id={`question-type-${q.id}`} className="h-10 w-full cursor-pointer bg-background"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{Object.entries(types).map(([value, label]) => <SelectItem key={value} value={value} className="cursor-pointer">{label}</SelectItem>)}</SelectContent></Select></div>
      {(['question', 'referenceAnswer', 'explanation'] as const).map((key, index) => <label key={key} className="block text-sm">{['Câu hỏi', 'Đáp án chuẩn', 'Giải thích'][index]}<textarea className={`${fieldClass} mt-1 min-h-24`} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
      <label className="block text-sm">Nguồn chuẩn (JSON)<textarea className={`${fieldClass} mt-1 font-mono`} rows={4} value={sources} onChange={e => setSources(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><Button disabled={pending} onClick={submit}>Lưu bản nháp</Button><Button variant="outline" onClick={() => setDraft(null)}>Hủy</Button></div>
    </div> : <><p className="font-medium">{q.question}</p><div className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">{q.referenceAnswer}</div><p className="text-sm text-muted-foreground">{q.explanation}</p>
      <div className="flex flex-wrap gap-2">{q.sources.map((s, i) => { const doc = dataset.documents.find(d => d.code === s.documentCode); return doc?.storageUrl ? <a key={i} className="rounded border px-2 py-1 text-xs underline" href={`${doc.storageUrl}#page=${s.pageNumber}`} target="_blank" rel="noreferrer">{s.documentCode} · trang PDF {s.pageNumber}</a> : <span key={i} className="rounded border px-2 py-1 text-xs">{s.documentCode} · trang PDF {s.pageNumber}</span>; })}</div></>}
  </Card>;
}

function RunResults({ detail, pending, action }: { detail: RunDetail; pending: boolean; action: (f: () => Promise<unknown>, message: string) => Promise<void> }) {
  const [group, setGroup] = useState('ALL');
  const r = detail.run; const summary = detail.summary[group];
  const snapshot = JSON.parse(r.snapshotJson) as BenchmarkDataset;
  const finished = detail.samples.filter(s => ['COMPLETED', 'JUDGE_ERROR', 'GENERATION_ERROR'].includes(s.status)).length;
  return <>
    <Card className="space-y-4 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-semibold">Lượt #{r.id} · {r.smoke ? 'Smoke test' : 'Benchmark chính thức'}</h2><p className="text-sm text-muted-foreground">{r.status} · {finished}/{detail.samples.length} mẫu · {new Date(r.createdAt).toLocaleString('vi-VN')}</p></div>
      <div className="flex flex-wrap gap-2">{(['csv', 'json'] as const).map(format => <Button key={format} variant="outline" size="sm" onClick={() => action(() => api.download(`/runs/${r.id}/export?format=${format}`, `benchmark-${r.id}.${format}`), 'Đã xuất kết quả')}>Xuất {format.toUpperCase()}</Button>)}
        {r.status === 'INTERRUPTED' && <Button disabled={pending} onClick={() => action(() => api.resume(r.id), 'Đã tiếp tục')}>Tiếp tục</Button>}
        {detail.samples.some(s => s.status === 'JUDGE_ERROR') && <Button disabled={pending} onClick={() => action(() => api.retryJudge(r.id), 'Đang chấm lại trace đã lưu')}>Thử lại judge</Button>}</div></div>
      <progress aria-label="Tiến độ benchmark" className="h-2 w-full" value={finished} max={detail.samples.length || 1} />
      <details className="text-sm"><summary className="cursor-pointer">Cấu hình đã đóng băng</summary><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(JSON.parse(r.configJson), null, 2)}</pre></details>
    </Card>
    <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-3"><label htmlFor="benchmark-question-group" className="shrink-0 text-sm font-medium">Nhóm câu hỏi</label><Select value={group} items={{ ALL: 'Tất cả', ...types }} onValueChange={value => { if (value) setGroup(value); }}><SelectTrigger id="benchmark-question-group" className="h-9 min-w-36 cursor-pointer bg-background shadow-xs"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false} className="p-1"><SelectItem value="ALL" className="cursor-pointer">Tất cả</SelectItem>{Object.entries(types).map(([value, label]) => <SelectItem key={value} value={value} className="cursor-pointer">{label}</SelectItem>)}</SelectContent></Select></div><span className="text-sm text-muted-foreground">Fallback: {summary.fallbackRate == null ? '—' : `${(summary.fallbackRate * 100).toFixed(1)}%`} · Rerank thực tế: {summary.rerankRate == null ? '—' : `${(summary.rerankRate * 100).toFixed(1)}%`} ({summary.traced} mẫu có trace) · {summary.errors}/{summary.total} mẫu lỗi</span></div>
    <SummaryTable summary={summary} />
    <p className="text-xs text-muted-foreground">Điểm chỉ tổng hợp mẫu hợp lệ; các cột lỗi, thiếu và không áp dụng được giữ riêng. Citation Accuracy đo đúng tài liệu–trang. Latency không bao gồm thời gian chấm.</p>
    <div className="space-y-3">{detail.samples.filter(s => group === 'ALL' || s.questionType === group).map(s => <SampleResult key={s.id} sample={s} question={snapshot.questions.find(q => q.code === s.questionCode)} documents={snapshot.documents} />)}</div>
  </>;
}
function SummaryTable({ summary }: { summary: GroupSummary }) {
  return <div className="overflow-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{['Metric', 'Trung bình', 'Median', 'p95', 'Hợp lệ', 'Lỗi', 'Thiếu', 'Không áp dụng'].map(h => <th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead><tbody>{metrics.map(([key, label]) => { const m = summary[key]; return <tr key={key} className="border-t"><td className="p-3 font-medium">{label}</td><td className="p-3">{number(m.mean)}</td><td className="p-3">{number(m.median)}</td><td className="p-3">{number(m.p95)}</td><td className="p-3">{m.valid}</td><td className="p-3">{m.errors}</td><td className="p-3">{m.missing}</td><td className="p-3">{m.notApplicable}</td></tr>; })}</tbody></table></div>;
}
function SampleResult({ sample: s, question: q, documents }: { sample: BenchmarkSample; question?: BenchmarkQuestion; documents: BenchmarkDocument[] }) {
  const trace: BenchmarkTrace | null = s.traceJson ? JSON.parse(s.traceJson) : null;
  const calculatedMetrics: BenchmarkMetrics | null = s.metricsJson ? JSON.parse(s.metricsJson) : null;
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer text-sm"><b>{s.questionCode}</b> · {types[s.questionType as keyof typeof types]} · lần {s.repetition} · {s.status}<span className="ml-3 text-muted-foreground">{q?.question}</span></summary>
    <div className="mt-4 space-y-4 text-sm">{s.error && <p role="alert" className="text-destructive">{s.error}</p>}<div><b>Đáp án chuẩn</b><p className="mt-1 whitespace-pre-wrap">{q?.referenceAnswer}</p><p className="text-xs text-muted-foreground">{q?.sources.map(x => `${x.documentCode}: trang ${x.pageNumber}`).join(' · ')}</p></div>
      <div><b>Câu trả lời</b><p className="mt-1 whitespace-pre-wrap">{trace?.response?.answer ?? 'Chưa có câu trả lời'}</p></div>
      <BenchmarkMetricDetails metrics={calculatedMetrics} question={q?.question} documents={documents} />
      <details><summary className="cursor-pointer">Dữ liệu kỹ thuật của phép tính</summary><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{calculatedMetrics ? JSON.stringify(calculatedMetrics, null, 2) : "Chưa chấm"}</pre></details>
      <details><summary className="cursor-pointer">Context, citation và trace</summary><pre className="mt-2 max-h-[600px] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">{trace ? JSON.stringify(trace, null, 2) : 'Chưa có trace'}</pre></details>
    </div></details>;
}
