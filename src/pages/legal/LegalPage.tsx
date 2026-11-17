import { Link } from "react-router-dom";
import { LEGAL } from "@/lib/legal";

type LegalKind = "privacy" | "terms";
type LegalSection = { id: string; title: string; body: React.ReactNode };

const privacySections: LegalSection[] = [
  { id: "information", title: "Thông tin chúng tôi thu thập", body: <>Mora thu thập thông tin tài khoản như họ tên, email và mật khẩu đã mã hóa; nội dung bạn tạo trong không gian học tập, bao gồm tài liệu PDF, tin nhắn và bộ câu hỏi học tập; cùng dữ liệu kỹ thuật cần thiết để duy trì phiên đăng nhập và bảo vệ dịch vụ.</> },
  { id: "use", title: "Cách chúng tôi sử dụng thông tin", body: <>Chúng tôi dùng thông tin để tạo và quản lý tài khoản, cung cấp không gian học tập, xử lý tài liệu, trả lời câu hỏi bằng AI, bảo mật dịch vụ, hỗ trợ người dùng và tuân thủ nghĩa vụ pháp lý.</> },
  { id: "storage", title: "Lưu trữ và chia sẻ dữ liệu", body: <>Tài liệu và dữ liệu ứng dụng được lưu trên hạ tầng của Mora và các nhà cung cấp hạ tầng được ủy quyền. Nội dung cần xử lý AI có thể được gửi tới OpenAI; tệp có thể được lưu qua Cloudflare R2 và chỉ mục tìm kiếm có thể được xử lý bởi Qdrant. Chúng tôi không bán dữ liệu cá nhân của bạn.</> },
  { id: "security", title: "Bảo mật và thời hạn lưu giữ", body: <>Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để bảo vệ dữ liệu. Dữ liệu được lưu trong thời gian tài khoản và dịch vụ còn hoạt động, hoặc lâu hơn khi pháp luật yêu cầu hay để giải quyết tranh chấp, phòng chống gian lận và thực thi thỏa thuận.</> },
  { id: "rights", title: "Quyền và lựa chọn của bạn", body: <>Bạn có thể yêu cầu truy cập, cập nhật hoặc xóa dữ liệu cá nhân theo quy định áp dụng. Bạn chịu trách nhiệm bảo đảm mình có quyền tải lên và chia sẻ tài liệu trong Mora.</> },
  { id: "contact", title: "Cookie và liên hệ", body: <>Mora sử dụng dữ liệu phiên cần thiết để duy trì trạng thái đăng nhập. Với câu hỏi hoặc yêu cầu về quyền riêng tư, hãy liên hệ <a className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.</> },
];

const termsSections: LegalSection[] = [
  { id: "acceptance", title: "Chấp nhận điều khoản", body: <>Bằng việc tạo tài khoản, sử dụng Mora hoặc tiếp tục sử dụng sau khi điều khoản được cập nhật, bạn đồng ý bị ràng buộc bởi Điều khoản sử dụng và Chính sách quyền riêng tư này.</> },
  { id: "account", title: "Tài khoản và nội dung", body: <>Bạn phải cung cấp thông tin chính xác, giữ an toàn thông tin đăng nhập và chịu trách nhiệm cho hoạt động từ tài khoản của mình. Bạn chỉ được tải lên nội dung mà mình có quyền sử dụng và chia sẻ.</> },
  { id: "rules", title: "Quy tắc sử dụng", body: <>Không được sử dụng Mora để vi phạm pháp luật, xâm phạm quyền sở hữu trí tuệ hoặc quyền riêng tư, phát tán mã độc, gây gián đoạn dịch vụ, hay tải lên nội dung bất hợp pháp, lạm dụng hoặc có hại.</> },
  { id: "ai", title: "Tính năng AI", body: <>Phản hồi do AI tạo ra có thể không chính xác, không đầy đủ hoặc không phù hợp với mọi mục đích. Bạn cần tự đánh giá kết quả trước khi dựa vào chúng trong học tập, công việc hoặc quyết định quan trọng.</> },
  { id: "ownership", title: "Quyền sở hữu và chấm dứt", body: <>Bạn giữ quyền đối với nội dung của mình; bạn cấp cho Mora quyền cần thiết để lưu trữ và xử lý nội dung nhằm vận hành dịch vụ. Mora có thể hạn chế hoặc đình chỉ tài khoản khi có dấu hiệu vi phạm điều khoản, pháp luật hoặc an toàn dịch vụ.</> },
  { id: "changes", title: "Thay đổi, luật áp dụng và liên hệ", body: <>Chúng tôi có thể cập nhật các văn bản pháp lý và sẽ công bố phiên bản mới tại đây. Điều khoản được điều chỉnh bởi pháp luật Việt Nam. Mọi câu hỏi hoặc khiếu nại xin gửi về <a className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.</> },
];

export const LegalPage = ({ kind }: { kind: LegalKind }) => {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Chính sách quyền riêng tư" : "Điều khoản sử dụng";
  const version = isPrivacy ? LEGAL.privacyVersion : LEGAL.termsVersion;
  const sections = isPrivacy ? privacySections : termsSections;
  const alternate = isPrivacy ? { href: "/terms", label: "Điều khoản sử dụng" } : { href: "/privacy", label: "Chính sách quyền riêng tư" };

  return <div className="bg-background px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
    <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[11rem_minmax(0,46rem)] lg:gap-16">
      <aside className="hidden lg:block">
        <nav aria-label="Mục lục" className="sticky top-24 border-l border-border pl-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nội dung</p>
          <ol className="space-y-3">
            {sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="block text-sm leading-5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{index + 1}. {section.title}</a></li>)}
          </ol>
        </nav>
      </aside>

      <article className="min-w-0">
        <header className="border-b border-border pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mora · Phiên bản {version}</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">Có hiệu lực từ {LEGAL.effectiveDate}</p>
        </header>

        <div className="divide-y divide-border">
          {sections.map((section, index) => <section id={section.id} key={section.id} className="scroll-mt-28 py-10 sm:py-12">
            <p className="mb-3 text-sm font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">{section.title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">{section.body}</p>
          </section>)}
        </div>

        <footer className="border-t border-border pt-8 text-sm leading-6 text-muted-foreground">Xem thêm <Link className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground" to={alternate.href}>{alternate.label}</Link>.</footer>
      </article>
    </div>
  </div>;
};
