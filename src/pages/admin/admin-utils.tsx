/* eslint-disable react-refresh/only-export-components */
import { Badge } from '@/components/ui/badge';
import type { DocumentStatus } from '@/features/admin/services/admin-api';

export const dateTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const bytes = (value?: number) => value == null ? '—' : value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
const labels: Record<DocumentStatus, string> = { UPLOADING: 'Đang tải lên', PARSING: 'Đang đọc', INDEXING: 'Đang lập chỉ mục', READY: 'Sẵn sàng', FAILED: 'Thất bại' };
export const StatusBadge = ({ status }: { status: DocumentStatus }) => <Badge variant={status === 'FAILED' ? 'destructive' : status === 'READY' ? 'secondary' : 'outline'}>{labels[status]}</Badge>;
