import { cn } from '@/lib/utils';

export function UsageMeter({ label, used, limit, suffix = '', className }: { label?: string; used: number; limit: number; suffix?: string; className?: string }) {
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = percent >= 100 ? 'bg-destructive' : percent >= 80 ? 'bg-amber-500' : 'bg-primary';
  return <div className={cn('space-y-2', className)}>
    {label && <div className="flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{label}</span><span className="tabular-nums text-muted-foreground">{used.toLocaleString('vi-VN')} / {limit.toLocaleString('vi-VN')}{suffix}</span></div>}
    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full transition-[width]', tone)} style={{ width: `${percent}%` }} /></div>
    <p className={cn('type-meta', percent >= 100 ? 'text-destructive' : percent >= 80 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>{percent >= 100 ? 'Đã dùng hết quota' : `Còn ${(limit - used).toLocaleString('vi-VN')}${suffix} (${100 - percent}%)`}</p>
  </div>;
}
