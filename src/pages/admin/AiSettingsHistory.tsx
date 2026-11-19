import { Button } from '@/components/ui/button';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import type { AiSettingsChange, AiSettingsHistoryEntry, PageResponse } from '@/features/admin/services/admin-api';

const groups = { CHAT: 'Chat', BENCHMARK: 'Benchmark', PRICING: 'Giá' } as const;
const labels: Record<string, string> = {
  apiKey: 'OpenAI API key',
  chatModel: 'Model trả lời',
  parserModel: 'Model phân tích PDF',
  embeddingModel: 'Model embedding',
  benchmarkJudgeModel: 'Model chấm điểm',
  benchmarkJudgeEmbeddingModel: 'Model embedding',
  vndPerUsd: 'Tỷ giá VND / USD',
  pricingVersion: 'Phiên bản giá',
};
const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

interface HistoryProps {
  result?: PageResponse<AiSettingsHistoryEntry>;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function AiSettingsHistory({ result, loading, failed, onRetry, onPageChange }: HistoryProps) {
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Đang tải lịch sử...</p>;
  if (failed) return (
    <div className="space-y-2">
      <p role="alert" className="text-sm text-muted-foreground">Không thể tải lịch sử thay đổi.</p>
      <Button size="sm" variant="outline" onClick={onRetry}>Thử lại</Button>
    </div>
  );
  if (!result?.data.length) return <p className="text-sm text-muted-foreground">Chưa có thay đổi được ghi lại.</p>;

  const { page, total, limit } = result.meta.pagination;
  const pageCount = Math.ceil(total / limit);
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {result.data.map(entry => <HistoryEntry key={entry.id} entry={entry} />)}
      </ul>
      {pageCount > 1 && (
        <nav aria-label="Phân trang lịch sử" className="flex flex-wrap items-center justify-between gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onPageChange(page - 1)}>Trước</Button>
          <span className="text-xs text-muted-foreground">{page + 1} / {pageCount}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= pageCount} onClick={() => onPageChange(page + 1)}>Sau</Button>
        </nav>
      )}
    </div>
  );
}

function HistoryEntry({ entry }: { entry: AiSettingsHistoryEntry }) {
  return (
    <li>
      <DisclosureCard label={
        <span className="font-medium">
          {entry.actorName}
          <time dateTime={entry.savedAt} className="block text-xs font-normal text-muted-foreground">
            {dateFormat.format(new Date(entry.savedAt))}
          </time>
        </span>
      }>
      <div className="space-y-3">
        {Object.entries(groups).map(([group, title]) => {
          const changes = entry.changes.filter(change => change.group === group);
          if (!changes.length) return null;
          return (
            <section key={group}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <dl className="mt-1 space-y-2">
                {changes.map(change => <Change key={`${change.field}:${change.model ?? ''}`} change={change} />)}
              </dl>
            </section>
          );
        })}
      </div>
      </DisclosureCard>
    </li>
  );
}

function Change({ change }: { change: AiSettingsChange }) {
  return (
    <div className="break-words text-sm">
      <dt className="font-medium">{change.model ?? labels[change.field] ?? change.field}</dt>
      <dd className="text-muted-foreground">
        {change.field === 'apiKey' ? (change.after === 'configured' ? 'Đã thiết lập' : 'Đã thay đổi') : (
          <>
            {change.field === 'modelPrice' && <span className="block text-xs">Input / Cached input / Output</span>}
            <span>{change.before ?? '—'} → {change.after ?? '—'}</span>
          </>
        )}
      </dd>
    </div>
  );
}
