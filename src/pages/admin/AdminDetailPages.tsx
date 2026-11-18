import { Link, useParams } from 'react-router-dom';
import type React from 'react';
import { ArrowLeft, CalendarDays, FileText, FolderOpen, HardDrive, History, UserRound, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminDocument, useAdminSpace, useAdminUser } from '@/features/admin/hooks/useAdminOperations';
import { StatusBadge, bytes, dateTime } from './admin-utils';

const Back = ({ to, label }: { to: string; label: string }) => <Button variant="ghost" size="sm" className="-ml-2" render={<Link to={to} />}><ArrowLeft className="size-4" />{label}</Button>;
const Loading = () => <div className="rounded-xl border p-8 text-sm text-muted-foreground">Đang tải dữ liệu...</div>;
const initials = (name: string) => name.split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'TV';

function EmptyPanel({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string }) {
  return <div className="rounded-xl border border-dashed px-6 py-12 text-center"><Icon className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-3 font-medium">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p></div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><p className="type-meta text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

export function AdminSpaceDetailPage() {
  const id = Number(useParams().id);
  const query = useAdminSpace(id);
  if (query.isLoading) return <Loading />;
  if (!query.data) return <p className="text-sm text-muted-foreground">Không tìm thấy Space.</p>;

  const { space, members, documents, description } = query.data;
  const emptyDescription = 'Space này chưa có mô tả. Bạn vẫn có thể xem thành viên và tài liệu bên dưới.';

  return <div className="mx-auto w-full max-w-6xl space-y-6">
    <Back to="/admin/spaces" label="Không gian" />
    <section className="rounded-2xl border bg-card px-5 py-7 sm:px-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background"><FolderOpen className="size-6" /></span><div className="min-w-0"><h1 className="truncate type-page-title">{space.name}</h1><p className="mt-2 text-sm text-muted-foreground">Owner: <span className="font-medium text-foreground">{space.ownerName}</span></p></div></div>
        <Badge variant="outline" className="w-fit">Space #{space.id}</Badge>
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">{description || emptyDescription}</p>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 type-meta text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Tạo {dateTime(space.createdAt)}</span><span className="inline-flex items-center gap-1.5"><History className="size-3.5" />Hoạt động {dateTime(space.lastActivityAt)}</span></div>
    </section>
    <Tabs defaultValue="overview">
      <TabsList variant="line" className="w-full justify-start gap-4 border-b px-0 pb-1"><TabsTrigger value="overview" className="flex-none px-2">Tổng quan</TabsTrigger><TabsTrigger value="members" className="flex-none px-2">Thành viên <span className="text-muted-foreground">({members.length})</span></TabsTrigger><TabsTrigger value="documents" className="flex-none px-2">Tài liệu <span className="text-muted-foreground">({documents.length})</span></TabsTrigger></TabsList>
      <TabsContent value="overview" className="pt-5"><Card><CardHeader><CardTitle>Tổng quan Space</CardTitle><CardDescription>Thông tin cơ bản và tình trạng hiện tại của không gian học tập.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Meta label="Owner" value={space.ownerName} /><Meta label="Thành viên" value={`${space.memberCount} người`} /><Meta label="Tài liệu" value={`${space.documentCount} tài liệu`} /><Meta label="Hoạt động gần nhất" value={dateTime(space.lastActivityAt)} /></CardContent></Card></TabsContent>
      <TabsContent value="members" className="pt-5">{members.length ? <Card><CardHeader><CardTitle>Thành viên trong Space</CardTitle><CardDescription>Danh sách tài khoản và vai trò hiện tại.</CardDescription></CardHeader><CardContent className="space-y-2">{members.map((member) => <Link key={member.userId} to={`/admin/users/${member.userId}`} className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/60"><Avatar><AvatarImage src={member.avatarUrl} alt={member.fullName} /><AvatarFallback>{initials(member.fullName)}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{member.fullName}</span><span className="block truncate type-meta text-muted-foreground">{member.email} · Tham gia {dateTime(member.joinedAt)}</span></span><Badge variant={member.role === 'OWNER' ? 'secondary' : 'outline'}>{member.role}</Badge></Link>)}</CardContent></Card> : <EmptyPanel icon={Users} title="Chưa có thành viên" description="Không có thành viên nào được ghi nhận trong Space này." />}</TabsContent>
      <TabsContent value="documents" className="pt-5">{documents.length ? <Card><CardHeader><CardTitle>Học liệu trong Space</CardTitle><CardDescription>Xem tên, trạng thái và người tải tài liệu.</CardDescription></CardHeader><CardContent className="space-y-2">{documents.map((doc) => <Link key={doc.id} to={`/admin/documents/${doc.id}`} className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/60"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{doc.name}</span><span className="block truncate type-meta text-muted-foreground">{bytes(doc.fileSize)} · {doc.uploadedByName} · {dateTime(doc.createdAt)}</span></span><StatusBadge status={doc.status} /></Link>)}</CardContent></Card> : <EmptyPanel icon={FileText} title="Chưa có tài liệu" description="Space này chưa có học liệu để theo dõi trạng thái xử lý." />}</TabsContent>
    </Tabs>
  </div>;
}

export function AdminDocumentDetailPage() {
  const id = Number(useParams().id); const query = useAdminDocument(id);
  if (query.isLoading) return <Loading />;
  const doc = query.data;
  if (!doc) return <p>Không tìm thấy tài liệu.</p>;
  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <Back to="/admin/documents" label="Tài liệu & xử lý" />
    <section className="rounded-2xl border bg-card px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background"><FileText className="size-6" /></span><div className="min-w-0"><h1 title={doc.name} className="truncate type-page-title">{doc.name}</h1><p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><HardDrive className="size-3.5" />{bytes(doc.fileSize)}{doc.contentType ? ` · ${doc.contentType}` : ''}</p></div></div>
        <StatusBadge status={doc.status} />
      </div>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 type-meta text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Tải lên {dateTime(doc.createdAt)}</span><span className="inline-flex items-center gap-1.5"><History className="size-3.5" />Cập nhật {dateTime(doc.updatedAt || doc.createdAt)}</span></div>
    </section>
    <Card><CardHeader><CardTitle>Thông tin tài liệu</CardTitle></CardHeader><CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"><Info label="Không gian"><Link className="font-medium underline" to={`/admin/spaces/${doc.spaceId}`}>{doc.spaceName}</Link></Info><Info label="Người tải"><span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5 text-muted-foreground" />{doc.uploadedById ? <Link className="underline" to={`/admin/users/${doc.uploadedById}`}>{doc.uploadedByName}</Link> : doc.uploadedByName}</span></Info><Info label="Trạng thái"><StatusBadge status={doc.status} /></Info><Info label="Định dạng">{doc.contentType || 'Chưa xác định'}</Info></CardContent></Card>
    {doc.status === 'FAILED' && <Card className="border-destructive/40"><CardHeader><CardTitle className="type-card-title text-destructive">Không thể xử lý tài liệu</CardTitle><CardDescription>Thông tin này giúp kiểm tra nguyên nhân thất bại của pipeline.</CardDescription></CardHeader><CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">Mã lỗi: </span><span className="font-medium">{doc.failureCode || 'PROCESSING_FAILED'}</span></p><p className="text-muted-foreground">{doc.failureMessage || 'Không thể xử lý tài liệu.'}</p><p className="type-meta text-muted-foreground">Thất bại lúc {dateTime(doc.failedAt)}</p></CardContent></Card>}
  </div>;
}

export function AdminUserDetailPage() {
  const id = Number(useParams().id); const query = useAdminUser(id);
  if (query.isLoading) return <Loading />;
  const user = query.data;
  if (!user) return <p>Không tìm thấy thành viên.</p>;
  const spaces = [...user.ownedSpaces, ...user.memberSpaces];
  return <div className="space-y-5"><Back to="/admin/users" label="Thành viên" /><header><h1 className="type-page-title">{user.fullName}</h1><p className="mt-1 text-sm text-muted-foreground">{user.email}</p></header><section className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle>Space</CardTitle></CardHeader><CardContent className="space-y-2">{spaces.length ? spaces.map(space => <Link key={space.id} to={`/admin/spaces/${space.id}`} className="block rounded-lg border p-3 hover:bg-muted/60"><span className="text-sm font-medium">{space.name}</span><span className="mt-1 block type-meta text-muted-foreground">{space.documentCount} tài liệu · {space.memberCount} thành viên</span></Link>) : <p className="text-sm text-muted-foreground">Chưa có Space.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Tài liệu đã tải</CardTitle></CardHeader><CardContent className="space-y-2">{user.uploadedDocuments.length ? user.uploadedDocuments.map(doc => <Link key={doc.id} to={`/admin/documents/${doc.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/60"><span className="text-sm font-medium">{doc.name}</span><StatusBadge status={doc.status} /></Link>) : <p className="text-sm text-muted-foreground">Chưa tải tài liệu.</p>}</CardContent></Card></section></div>;
}

function Info({ label, children }: { label: string; children: React.ReactNode }) { return <div><p className="type-meta text-muted-foreground">{label}</p><div className="mt-1 text-sm">{children}</div></div>; }
