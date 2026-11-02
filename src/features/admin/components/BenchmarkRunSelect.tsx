import { History } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BenchmarkRun } from '../services/benchmark-api';

const statuses: Record<string, { label: string; style: string }> = {
  COMPLETED: { label: 'Hoàn tất', style: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  COMPLETED_WITH_ERRORS: { label: 'Hoàn tất có lỗi', style: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  RUNNING: { label: 'Đang chạy', style: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  PREPARING: { label: 'Đang chuẩn bị', style: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  INTERRUPTED: { label: 'Bị gián đoạn', style: 'bg-muted text-muted-foreground' },
};

function RunLabel({ run }: { run: BenchmarkRun }) {
  const status = statuses[run.status] ?? { label: run.status, style: 'bg-muted text-muted-foreground' };
  return <span className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-sm font-medium">#{run.id} <span className="font-normal text-muted-foreground">· Dataset {run.datasetId}</span></span>
      <span className="truncate text-xs text-muted-foreground">{run.smoke ? 'Smoke test' : 'Benchmark chính thức'} · {new Date(run.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
    </span>
    <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ${status.style}`}>{status.label}</span>
  </span>;
}

export function BenchmarkRunSelect({ runs, value, onChange, loading }: {
  runs: BenchmarkRun[]; value?: number; onChange: (value: number | undefined) => void; loading: boolean;
}) {
  const selected = runs.find(run => run.id === value);
  return <div className="max-w-xl space-y-2">
    <label htmlFor="benchmark-run-select" className="text-sm font-medium">Chọn lượt chạy</label>
    <Select value={value == null ? null : String(value)} onValueChange={next => onChange(next == null ? undefined : Number(next))} disabled={loading || !runs.length}>
      <SelectTrigger id="benchmark-run-select" className="min-h-14 w-full cursor-pointer gap-3 bg-background px-3 py-2.5 shadow-xs hover:bg-muted/30 data-[size=default]:h-14">
        <History className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue className="min-w-0 flex-1 line-clamp-none! overflow-visible!" placeholder={loading ? 'Đang tải lượt chạy…' : runs.length ? 'Chọn một lượt chạy' : 'Chưa có lượt chạy'}>
          {selected ? <RunLabel run={selected} /> : loading ? 'Đang tải lượt chạy…' : runs.length ? 'Chọn một lượt chạy' : 'Chưa có lượt chạy'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false} sideOffset={6} className="max-h-[min(360px,var(--available-height))] p-1.5">
        {runs.map(run => <SelectItem key={run.id} value={String(run.id)} label={`Lượt ${run.id} Dataset ${run.datasetId}`} className="cursor-pointer px-2.5 py-2.5 data-highlighted:bg-accent data-selected:bg-accent/50 [&>span:first-child]:min-w-0 [&>span:first-child]:shrink">
          <RunLabel run={run} />
        </SelectItem>)}
      </SelectContent>
    </Select>
  </div>;
}
