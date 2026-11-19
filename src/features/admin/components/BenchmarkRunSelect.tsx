import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BenchmarkRun } from '../services/benchmark-api';

const runOptionLabel = (run: BenchmarkRun) => `Lượt #${run.id} · Dataset ${run.datasetId} · ${run.status}`;

export function BenchmarkRunSelect({ runs, value, onChange, loading }: {
  runs: BenchmarkRun[]; value?: number; onChange: (value: number | undefined) => void; loading: boolean;
}) {
  return <div>
    <Select value={value == null ? null : String(value)} onValueChange={next => onChange(next == null ? undefined : Number(next))} disabled={loading || !runs.length}>
      <SelectTrigger id="benchmark-run-select" size="sm" className="w-72 cursor-pointer">
        <SelectValue placeholder={loading ? 'Đang tải lượt chạy…' : runs.length ? 'Chọn lượt chạy' : 'Chưa có lượt chạy'} />
      </SelectTrigger>
      <SelectContent side="bottom" align="start" alignItemWithTrigger={false} className="max-h-[min(320px,var(--available-height))]">
        {runs.map(run => <SelectItem key={run.id} value={String(run.id)} label={runOptionLabel(run)} className="cursor-pointer">
          {runOptionLabel(run)}
        </SelectItem>)}
      </SelectContent>
    </Select>
  </div>;
}
