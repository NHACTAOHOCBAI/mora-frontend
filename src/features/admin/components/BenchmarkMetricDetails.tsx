import type { ReactNode } from 'react';
import type { BenchmarkDocument } from '../services/benchmark-api';
import type { BenchmarkMetrics, CalculationDetails, BenchmarkMetric, SourceContext } from '../types/benchmark-details';

const n = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('vi-VN', { maximumFractionDigits: 9 });
const cell = 'border-b p-2 text-left align-top';
function Formula({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs leading-6" aria-label="Công thức tính">{children}</div>;
}
function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>{headers.map(h => <th key={h} scope="col" className={`${cell} whitespace-nowrap`}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function MetricCard<T extends CalculationDetails>({ title, metric, formula, children }: {
  title: string; metric?: BenchmarkMetric<T>; formula: ReactNode; children?: ReactNode;
}) {
  const status = metric?.status === 'error' ? 'Lỗi' : metric?.status === 'not_applicable' ? 'Không áp dụng' : metric ? 'Đã chấm' : 'Chưa chấm';
  return <section aria-label={title} className="space-y-3 rounded-lg border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{title}</h4><span>{n(metric?.value)} <span className="text-xs text-muted-foreground">· {status}</span></span></div>
    <Formula>{formula}</Formula>
    {metric?.reason && <p className="text-xs text-destructive">{metric.reason}</p>}
    {!metric?.details ? <p className="text-xs text-muted-foreground">{metric ? 'Lượt chạy này chưa lưu dữ liệu giải thích. Điểm gốc được giữ nguyên; lượt chạy mới sẽ có chi tiết.' : 'Đang chờ dữ liệu chấm điểm.'}</p> : <>
      {!metric.details.complete && <p className="text-xs text-amber-700 dark:text-amber-400">Phép tính chưa hoàn tất. Bên dưới chỉ là dữ liệu đã thu được; không dùng để suy ra điểm cuối.</p>}
      {children}
      {metric.details.durationMs != null && <p className="text-xs text-muted-foreground">Thời gian chấm chỉ số này: {n(metric.details.durationMs)} ms (không tính vào Latency).</p>}
    </>}
  </section>;
}
function ContextSource({ context, documents }: { context: SourceContext; documents: BenchmarkDocument[] }) {
  const doc = documents.find(d => d.documentId === context.documentId);
  const label = `${doc?.code ?? context.documentName ?? `Tài liệu ${context.documentId ?? '?'}`} · trang ${context.pageNumber}`;
  return <details className="min-w-52 max-w-xl"><summary className="cursor-pointer">{label}</summary>
    {doc?.storageUrl && <a className="my-1 inline-block underline" target="_blank" rel="noreferrer" href={`${doc.storageUrl}#page=${context.pageNumber}`}>Mở trang PDF</a>}
    <p className="max-h-64 overflow-auto whitespace-pre-wrap break-words py-2">{context.text}</p></details>;
}

export function BenchmarkMetricDetails({ metrics, question, documents }: {
  metrics: BenchmarkMetrics | null; question?: string; documents: BenchmarkDocument[];
}) {
  const cp = metrics?.contextPrecision, faith = metrics?.faithfulness, relevance = metrics?.answerRelevance;
  const citation = metrics?.citationAccuracy, latency = metrics?.latency;
  const p = cp?.details, f = faith?.details, r = relevance?.details, c = citation?.details, t = latency?.details;
  return <div className="space-y-4">
    <h3 className="font-semibold">Chi tiết công thức và phép tính</h3>
    <MetricCard title="Context Precision" metric={cp} formula={<>
      <div>vₖ = 1 nếu chunk k hữu ích, 0 nếu không hữu ích.</div>
      <div>P@k = (v₁ + … + vₖ) / k</div>
      <div>AP = Σ(P@k × vₖ) / (Σvₖ + ε), ε = 10⁻¹⁰</div>
    </>}>
      <p className="text-xs text-muted-foreground">Judge đối chiếu từng chunk với câu hỏi và đáp án chuẩn. Thứ tự bên dưới là thứ tự context được đưa vào pipeline.</p>
      {p && <><p className="text-xs">Đã chấm {p.rows.length}/{p.expectedContexts} chunk.</p>
        <DataTable headers={['k', 'Context', 'vₖ', 'Lý do judge', 'Hữu ích tích lũy', 'P@k', 'P@k × vₖ']}>
          {p.rows.map(row => <tr key={row.rank}><td className={cell}>{row.rank}</td><td className={cell}><ContextSource context={row.context} documents={documents} /></td><td className={cell}>{row.verdict}</td><td className={`${cell} min-w-48`}>{row.reason}</td><td className={cell}>{row.cumulativeRelevant}</td><td className={cell}>{row.cumulativeRelevant}/{row.rank} = {n(row.precisionAtK)}</td><td className={cell}>{n(row.precisionAtK)} × {row.verdict} = {n(row.contribution)}</td></tr>)}
        </DataTable>
        {p.complete && <Formula>{p.rows.length ? <><div>Tử số = {p.rows.map(row => n(row.contribution)).join(' + ')} = {n(p.numerator)}</div><div>{n(p.numerator)} / ({p.relevantCount} + 10⁻¹⁰) = {n(cp?.value)}</div></> : `Không có context → ${n(cp?.value)}`}</Formula>}
      </>}
    </MetricCard>
    <MetricCard title="Faithfulness" metric={faith} formula="Faithfulness = số phát biểu được context hỗ trợ / tổng số phát biểu được judge kiểm tra">
      <p className="text-xs text-muted-foreground">Judge tách câu trả lời thành các phát biểu, sau đó kiểm tra trên toàn bộ context. Lý do bên dưới là nhận định thực tế của judge.</p>
      {f && <>
        <DataTable headers={['#', 'Phát biểu', 'Được hỗ trợ (1/0)', 'Lý do judge']}>
          {f.statements.map((row, i) => <tr key={i}><td className={cell}>{i + 1}</td><td className={`${cell} min-w-48`}>{row.statement}</td><td className={cell}>{row.verdict}</td><td className={`${cell} min-w-48`}>{row.reason}</td></tr>)}
        </DataTable>
        <details className="text-xs"><summary className="cursor-pointer">Các phát biểu đã được tách ({f.generatedStatements.length})</summary><ol className="list-decimal space-y-1 pl-5 pt-2">{f.generatedStatements.map((s, i) => <li key={i}>{s}</li>)}</ol></details>
        {f.complete && f.statementCount > 0 && <Formula>{f.supportedCount} / {f.statementCount} = {n(faith?.value)}</Formula>}
        {f.statementCount === 0 && <p className="text-xs text-muted-foreground">Chưa có phát biểu được kiểm tra; không thực hiện phép chia cho 0.</p>}
      </>}
    </MetricCard>
    <MetricCard title="Answer Relevance" metric={relevance} formula={<>
      <div>cos(q, qᵢ) = (q · qᵢ) / (‖q‖ × ‖qᵢ‖)</div>
      <div>Điểm = trung bình cosine của các câu hỏi được dùng × hệ số có câu trả lời rõ ràng</div>
      <div>Hệ số = 0 nếu tất cả câu được dùng có noncommittal = 1; ngược lại = 1. Không tạo được câu hỏi → điểm 0.</div>
    </>}>
      <p className="whitespace-pre-wrap text-xs"><b>Câu hỏi gốc:</b> {question ?? 'Chưa có câu hỏi'}</p>
      {r && <>
        <p className="text-xs">q và qᵢ là vector embedding. ‖q‖ = {n(r.originalNorm)}. Giữ nguyên cosine thực tế, không cắt về khoảng 0–1.</p>
        <DataTable headers={['Lượt', 'Câu hỏi được tạo ngược', 'Mơ hồ (1/0)', 'Được dùng', 'q · qᵢ', '‖qᵢ‖', 'Cosine']}>
          {r.rows.map((row, i) => <tr key={i}><td className={cell}>{i + 1}</td><td className={`${cell} min-w-48`}>{row.question || '(Rỗng)'}</td><td className={cell}>{row.noncommittal}</td><td className={cell}>{row.used ? 'Có' : 'Không'}</td><td className={cell}>{n(row.dotProduct)}</td><td className={cell}>{n(row.generatedNorm)}</td><td className={`${cell} min-w-56`}>{row.cosine == null ? 'Chưa có embedding hợp lệ' : `${n(row.dotProduct)} / (${n(r.originalNorm)} × ${n(row.generatedNorm)}) = ${n(row.cosine)}`}</td></tr>)}
        </DataTable>
        {r.complete && <Formula>{r.usedCount ? <><div>Trung bình cosine = ({r.rows.filter(row => row.used).map(row => n(row.cosine)).join(' + ')}) / {r.usedCount} = {n(r.meanCosine)}</div><div>Điểm = {n(r.meanCosine)} × {r.substantiveFactor} = {n(relevance?.value)}</div></> : `Không có câu hỏi được dùng → ${n(relevance?.value)}`}</Formula>}
      </>}
    </MetricCard>
    <MetricCard title="Citation Accuracy" metric={citation} formula="Citation Accuracy = số cặp tài liệu–trang trích dẫn đúng / tổng số cặp tài liệu–trang AI đã trích dẫn (sau loại trùng)">
      {c && <>
        <p className="text-xs"><b>Nguồn chuẩn:</b> {c.expectedSources.map(s => `${s.documentCode} · trang ${s.pageNumber}`).join('; ') || '(Không có)'}</p>
        <DataTable headers={['Tài liệu AI trích dẫn', 'Trang', 'Khớp nguồn chuẩn']}>
          {c.rows.map((row, i) => <tr key={i}><td className={cell}>{row.documentCode}{row.documentCode.startsWith('unknown-') ? ' (không xác định trong corpus)' : ''}</td><td className={cell}>{row.pageNumber}</td><td className={cell}>{row.correct ? 'Đúng' : 'Sai'}</td></tr>)}
        </DataTable>
        <Formula>{c.predictedCount ? `${c.matchedCount} / ${c.predictedCount} = ${n(citation?.value)}` : 'Không có citation → 0'}</Formula>
        <p className="text-xs text-muted-foreground">Chỉ đối chiếu tài liệu–trang; chưa đánh giá nội dung quote hoặc các nguồn còn thiếu.</p>
      </>}
    </MetricCard>
    <MetricCard title="Latency (ms)" metric={latency} formula="Tổng thời gian = Router + Retrieval + Synthesis + Evaluator + thời gian xử lý còn lại">
      {t && <>
        <DataTable headers={['Thành phần', 'Thời gian (ms)']}>
          {([['Router', t.routerMs], ['Retrieval', t.retrievalMs], ['Synthesis (tất cả lần thử)', t.synthesisMs], ['Evaluator (tất cả lần thử)', t.evaluatorMs], ['Xử lý còn lại', t.overheadMs], ['Tổng đo được', t.totalMs]] as const).map(([label, value]) => <tr key={label}><td className={cell}>{label}</td><td className={cell}>{n(value)}</td></tr>)}
        </DataTable>
        {t.complete && <Formula><div>Xử lý còn lại = {n(t.totalMs)} − {n(t.componentSumMs)} = {n(t.overheadMs)} ms</div><div>{[t.routerMs, t.retrievalMs, t.synthesisMs, t.evaluatorMs, t.overheadMs].map(n).join(' + ')} = {n(t.totalMs)} ms</div></Formula>}
      </>}
      <p className="text-xs text-muted-foreground">Thời gian đo bằng đồng hồ đơn điệu. Không gồm upload, parse/index PDF, hàng đợi, HTTP backend hoặc thời gian chấm Ragas.</p>
    </MetricCard>
    <p className="text-xs text-muted-foreground">Phép tính dùng dữ liệu đầy đủ đã lưu; các số hiển thị được làm tròn nên có thể có chênh lệch nhỏ khi cộng bằng tay. Lý do judge được giữ nguyên ngôn ngữ trả về.</p>
  </div>;
}
