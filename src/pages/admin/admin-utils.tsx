/* eslint-disable react-refresh/only-export-components */
import type { DocumentStatus } from '@/features/admin/services/admin-api';

export const dateTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const bytes = (value?: number) => value == null ? '—' : value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
const labels: Record<DocumentStatus, string> = { UPLOADING: 'Đang tải lên', PARSING: 'Đang đọc', INDEXING: 'Đang lập chỉ mục', READY: 'Sẵn sàng', FAILED: 'Thất bại' };
const statusStyles: Record<DocumentStatus, string> = { UPLOADING: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400', PARSING: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400', INDEXING: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400', READY: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', FAILED: 'border-destructive/20 bg-destructive/10 text-destructive' };
const dotStyles: Record<DocumentStatus, string> = { UPLOADING: 'bg-blue-500', PARSING: 'bg-blue-500', INDEXING: 'bg-blue-500', READY: 'bg-emerald-500', FAILED: 'bg-destructive' };
export const StatusBadge = ({ status }: { status: DocumentStatus }) => <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}><span className={`size-1.5 rounded-full ${dotStyles[status]}`} />{labels[status]}</span>;
