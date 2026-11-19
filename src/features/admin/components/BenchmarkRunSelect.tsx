import { useId, type Ref } from 'react';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BenchmarkRun } from '../services/benchmark-api';

const statusLabels: Record<string, string> = {
  PREPARING: 'Đang chuẩn bị',
  RUNNING: 'Đang chạy',
  COMPLETED: 'Hoàn tất',
  COMPLETED_WITH_ERRORS: 'Hoàn tất có lỗi',
  INTERRUPTED: 'Gián đoạn',
};

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export function formatRunTime(value: string) {
  return value ? dateFormat.format(new Date(value)) : '—';
}

export const defaultRunFilters = { dataset: 'all', status: 'all', kind: 'all' };
type RunFilters = typeof defaultRunFilters;

export function matchesRunFilters(run: BenchmarkRun, filters: RunFilters) {
  return (filters.dataset === 'all' || filters.dataset === String(run.datasetId))
    && (filters.status === 'all' || filters.status === run.status)
    && (filters.kind === 'all' || filters.kind === (run.smoke ? 'smoke' : 'official'));
}

export function canDeleteRun(run: BenchmarkRun) {
  return ['COMPLETED', 'COMPLETED_WITH_ERRORS', 'INTERRUPTED'].includes(run.status);
}

export function RunStatusBadge({ status }: { status: string }) {
  const warning = status === 'COMPLETED_WITH_ERRORS' || status === 'INTERRUPTED';
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium [overflow-wrap:anywhere] ${warning ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function BenchmarkRunFilters({ runs, filters, onChange, horizontal = false }: {
  runs: BenchmarkRun[]; filters: RunFilters; onChange: (filters: RunFilters) => void; horizontal?: boolean;
}) {
  const datasetIds = new Set(runs.map(run => run.datasetId));
  if (filters.dataset !== 'all') datasetIds.add(Number(filters.dataset));
  const statuses = [...new Set([...Object.keys(statusLabels), ...runs.map(run => run.status)])];
  const hasFilters = Object.values(filters).some(value => value !== 'all');

  return (
    <div className={horizontal ? 'grid gap-3 sm:grid-cols-3 xl:flex xl:items-end' : 'grid gap-3 min-[360px]:grid-cols-2'}>
      <RunFilter title="Dataset" value={filters.dataset}
        items={[[ 'all', 'Tất cả dataset'], ...[...datasetIds].sort((a, b) => a - b).map(id => [String(id), `Dataset ${id}`] as const)]}
        onChange={dataset => onChange({ ...filters, dataset })} />
      <RunFilter title="Trạng thái" value={filters.status}
        items={[[ 'all', 'Tất cả trạng thái'], ...statuses.map(status => [status, statusLabels[status] ?? status] as const)]}
        onChange={status => onChange({ ...filters, status })} />
      <RunFilter title="Loại lượt chạy" value={filters.kind}
        items={[[ 'all', 'Tất cả loại'], ['smoke', 'Chạy thử'], ['official', 'Chính thức']]}
        onChange={kind => onChange({ ...filters, kind })} />
      {hasFilters && <Button variant="ghost" className="self-end justify-self-start" onClick={() => onChange(defaultRunFilters)}>Bỏ bộ lọc</Button>}
    </div>
  );
}

export function BenchmarkRunList({ runs, visibleRuns, value, onChange, loading, filters, onFilterChange, onStartBulk, bulkButtonRef }: {
  runs: BenchmarkRun[]; visibleRuns: BenchmarkRun[]; value?: number; onChange: (value: number) => void; loading: boolean;
  filters: RunFilters; onFilterChange: (filters: RunFilters) => void; onStartBulk: () => void; bulkButtonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <Card className="min-h-0 gap-0 overflow-hidden p-0">
      <div className="space-y-4 border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="type-card-title">Danh sách lượt</h2>
            {!loading && <p role="status" className="text-xs text-muted-foreground">{visibleRuns.length}/{runs.length} lượt chạy</p>}
          </div>
          <Button ref={bulkButtonRef} variant="outline" size="sm" disabled={loading || !runs.length} onClick={onStartBulk}>
            <ListChecks className="size-4" />Chọn nhiều
          </Button>
        </div>
        <BenchmarkRunFilters runs={runs} filters={filters} onChange={onFilterChange} />
      </div>
      {loading ? <p role="status" className="p-4 text-sm text-muted-foreground">Đang tải lượt chạy…</p> :
        !visibleRuns.length ? <p className="p-4 text-sm text-muted-foreground">{runs.length ? 'Không có lượt khớp bộ lọc.' : 'Chưa có lượt chạy.'}</p> : (
          <ul aria-label="Lượt chạy Benchmark" className="min-h-0 overflow-y-auto p-2 lg:max-h-[min(32rem,55dvh)]">
            {visibleRuns.map(run => (
              <li key={run.id}>
                <button type="button" aria-current={value === run.id ? 'true' : undefined}
                  className="w-full cursor-pointer rounded-md border border-transparent px-3 py-2.5 text-left hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-[current=true]:border-border aria-[current=true]:bg-muted"
                  onClick={() => onChange(run.id)}>
                  <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold">Lượt #{run.id}</span>
                    <RunStatusBadge status={run.status} />
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">Dataset {run.datasetId} · {run.smoke ? 'Chạy thử' : 'Chính thức'}</span>
                  <time dateTime={run.createdAt || undefined} className="block text-xs text-muted-foreground">{formatRunTime(run.createdAt)}</time>
                </button>
              </li>
            ))}
          </ul>
        )}
    </Card>
  );
}

function RunFilter({ title, value, items, onChange }: {
  title: string; value: string; items: ReadonlyArray<readonly [string, string]>; onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1 xl:min-w-32">
      <label htmlFor={id} className="block text-sm font-medium">{title}</label>
      <Select items={Object.fromEntries(items)} value={value} onValueChange={next => { if (next != null) onChange(next); }}>
        <SelectTrigger id={id} className="w-full min-w-0 cursor-pointer"><SelectValue /></SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {items.map(([option, label]) => <SelectItem key={option} value={option}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
