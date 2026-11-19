import { Link } from "react-router-dom";

export function SiteFooter() {
  return <footer className="shrink-0 border-t border-border bg-background px-5 pt-10 text-sm text-muted-foreground sm:px-8 sm:pt-12">
    <div className="mx-auto grid w-full max-w-7xl gap-9 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(10rem,1fr)_minmax(10rem,1fr)] lg:gap-12">
      <section className="max-w-xs"><p className="text-base font-semibold tracking-tight text-foreground">Mora</p><p className="mt-2 leading-6">Không gian học tập hỗ trợ bởi AI.</p></section>
      <nav aria-label="Liên kết pháp lý"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Pháp lý</p><div className="flex flex-col items-start gap-2.5 leading-5"><Link to="/privacy" className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Chính sách quyền riêng tư</Link><Link to="/terms" className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Điều khoản sử dụng</Link><Link to="/help" className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Trợ giúp</Link></div></nav>
      <section><p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Hỗ trợ</p><a href="mailto:support@mora.vn" className="leading-5 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">support@mora.vn</a></section>
    </div>
    <div className="mx-auto mt-10 w-full max-w-7xl border-t border-border py-5 text-xs leading-5 text-muted-foreground">© {new Date().getFullYear()} Mora. Tất cả các quyền được bảo lưu.</div>
  </footer>;
}
