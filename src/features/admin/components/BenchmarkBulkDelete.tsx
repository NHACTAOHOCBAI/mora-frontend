import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getErrorMessage } from '@/lib/api-error';
import { canDeleteRun, runDisplayName, RunStatusBadge } from './BenchmarkRunSelect';
import type { BenchmarkRun } from '../services/benchmark-api';

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

interface Props {
  runs: BenchmarkRun[];
  onExit: () => void;
  onDelete: (ids: number[]) => Promise<void>;
  onRefresh: () => Promise<BenchmarkRun[] | undefined>;
}

export function BenchmarkBulkDelete({ runs, onExit, onDelete, onRefresh }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirmation, setConfirmation] = useState<number[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const eligible = useMemo(() => new Set(runs.filter(canDeleteRun).map(run => run.id)), [runs]);
  const selectedIds = selected.filter(id => eligible.has(id));
  const selectedSet = new Set(selectedIds);
  const allSelected = eligible.size > 0 && selectedIds.length === eligible.size;

  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    setSelected(previous => previous.every(id => eligible.has(id)) ? previous : previous.filter(id => eligible.has(id)));
  }, [eligible]);

  async function confirmDelete() {
    if (!confirmation?.length || deleting) return;
    setDeleting(true);
    setError(undefined);
    try {
      await onDelete(confirmation);
      setSelected([]);
      setConfirmation(null);
    } catch (failure) {
      setError(getErrorMessage(failure));
      const refreshed = await onRefresh();
      if (refreshed) {
        const remaining = new Set(refreshed.filter(canDeleteRun).map(run => run.id));
        const retained = confirmation.filter(id => remaining.has(id));
        setSelected(retained);
        setConfirmation(retained);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3 sm:px-4">
        <div>
          <h2 ref={heading} tabIndex={-1} className="type-card-title">Chọn lượt để xóa</h2>
          <p role="status" className="mt-1 text-sm text-muted-foreground">Đã chọn {selectedIds.length} lượt</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" disabled={!selectedIds.length} onClick={() => setSelected([])}>Bỏ chọn</Button>
          <Button size="sm" variant="outline" onClick={onExit}>Thoát chọn nhiều</Button>
          <AlertDialog open={confirmation !== null} onOpenChange={open => {
            if (deleting) return;
            setError(undefined);
            setConfirmation(open ? selectedIds : null);
          }}>
            <AlertDialogTrigger render={<Button size="sm" variant="destructive" disabled={!selectedIds.length} />}>
              <Trash2 className="size-4" />{selectedIds.length ? `Xóa ${selectedIds.length} lượt` : 'Xóa lượt đã chọn'}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmation?.length ? `Xóa ${confirmation.length} lượt chạy?` : 'Không còn lượt đủ điều kiện xóa'}</AlertDialogTitle>
                <AlertDialogDescription>
                  Kết quả và các mẫu của những lượt đã chọn sẽ bị xóa vĩnh viễn. Dataset vẫn dùng được để chạy lại.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && <p role="alert" className="max-h-32 overflow-auto break-words text-sm text-destructive">{error}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>{confirmation?.length ? 'Hủy' : 'Đóng'}</AlertDialogCancel>
                {!!confirmation?.length && (
                  <AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
                    {deleting ? 'Đang xóa…' : `Xóa ${confirmation.length} lượt`}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {!runs.length ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">Không có lượt chạy khớp bộ lọc.</p> : (
        <>
          {!eligible.size && <p className="border-b px-4 py-3 text-sm text-muted-foreground">Không có lượt đủ điều kiện xóa.</p>}
          <Table aria-label="Lượt chạy Benchmark để chọn xóa">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead scope="col" className="w-12 pl-4">
                  <Checkbox aria-label="Chọn tất cả lượt đủ điều kiện trong bộ lọc" checked={allSelected}
                    indeterminate={selectedIds.length > 0 && !allSelected} disabled={!eligible.size}
                    onCheckedChange={() => setSelected(allSelected ? [] : [...eligible])} />
                </TableHead>
                <TableHead scope="col">Lượt chạy</TableHead>
                <TableHead scope="col" className="hidden md:table-cell">Dataset</TableHead>
                <TableHead scope="col" className="hidden md:table-cell">Loại</TableHead>
                <TableHead scope="col">Trạng thái</TableHead>
                <TableHead scope="col" className="hidden md:table-cell">Thời điểm chạy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => {
                const checked = selectedSet.has(run.id);
                const allowed = eligible.has(run.id);
                const kind = run.smoke ? 'Chạy thử' : 'Chính thức';
                const started = run.createdAt ? dateFormat.format(new Date(run.createdAt)) : '—';
                return (
                  <TableRow key={run.id} data-state={checked ? 'selected' : undefined}>
                    <TableCell className="pl-4">
                      <Checkbox aria-label={allowed ? `Chọn lượt #${run.id}` : `Lượt #${run.id} chưa thể xóa`}
                        checked={checked} disabled={!allowed}
                        onCheckedChange={next => setSelected(previous => next ? [...previous, run.id] : previous.filter(id => id !== run.id))} />
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <span className="break-words font-medium">{runDisplayName(run)}</span>
                      {run.name && <span className="block text-xs text-muted-foreground">Lượt #{run.id}</span>}
                      <span className="block text-xs text-muted-foreground md:hidden">Dataset {run.datasetId} · {kind}</span>
                      <time dateTime={run.createdAt ?? undefined} className="block text-xs text-muted-foreground md:hidden">{started}</time>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">Dataset {run.datasetId}</TableCell>
                    <TableCell className="hidden md:table-cell">{kind}</TableCell>
                    <TableCell className="whitespace-normal"><RunStatusBadge status={run.status} /></TableCell>
                    <TableCell className="hidden md:table-cell"><time dateTime={run.createdAt ?? undefined}>{started}</time></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}
