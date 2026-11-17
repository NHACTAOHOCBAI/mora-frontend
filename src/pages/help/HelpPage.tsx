import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { LEGAL } from "@/lib/legal";

const sections = [
  { id: "start", title: "Bắt đầu", intro: "Tạo một không gian cho môn học, chủ đề hoặc nhóm của bạn.", steps: ["Từ trang Không gian học tập, chọn Tạo không gian.", "Nhập tên không gian; mô tả là tùy chọn.", "Mở không gian vừa tạo để thêm tài liệu và bắt đầu trao đổi."] },
  { id: "documents", title: "Tài liệu", intro: "Thêm nguồn học liệu để Mora có thể hỗ trợ bạn trong không gian đó.", steps: ["Mở danh sách Tài liệu và chọn Tải PDF lên.", "Chọn tệp PDF có dung lượng không quá 15MB.", "Đợi tài liệu hiển thị trạng thái sẵn sàng trước khi dùng làm nguồn cho AI hoặc bộ học."] },
  { id: "ask", title: "Hỏi Mora", intro: "Mora có thể trả lời dựa trên tài liệu bạn đã tải lên.", steps: ["Mở khung trò chuyện trong không gian.", "Chọn nguồn tài liệu cần dùng; nếu không chọn riêng, Mora dùng tất cả tài liệu sẵn sàng.", "Đặt câu hỏi cụ thể và kiểm tra trích dẫn theo tài liệu, trang trong câu trả lời."] },
  { id: "study", title: "Bộ học", intro: "Ôn nhanh nội dung đã tải lên bằng flashcard và câu hỏi trắc nghiệm.", steps: ["Chọn tài liệu đã sẵn sàng trong không gian.", "Tạo bộ học từ các tài liệu đã chọn.", "Mở bộ học để xem flashcard và làm câu hỏi ôn tập."] },
  { id: "members", title: "Thành viên", intro: "Chia sẻ không gian với nhóm học của bạn và quản lý quyền truy cập.", steps: ["Mở phần Thành viên trong không gian để tạo lời mời.", "Chủ sở hữu và biên tập viên có thể tải tài liệu; người xem chỉ có thể đọc và trao đổi.", "Không chia sẻ liên kết mời cho người không cần quyền truy cập."] },
];

const issues = [
  ["Tài liệu đang xử lý hoặc báo lỗi", "Tài liệu cần được tải lên, phân tích và lập chỉ mục trước khi sẵn sàng. Kiểm tra tệp là PDF và không quá 15MB; nếu vẫn lỗi, thử tải lại tệp."],
  ["Không thể tải tài liệu lên", "Người xem không có quyền tải tài liệu. Hãy nhờ chủ sở hữu không gian cấp quyền biên tập hoặc tạo không gian riêng."],
  ["Câu trả lời không đúng tài liệu", "Chọn đúng nguồn tài liệu trước khi hỏi và diễn đạt câu hỏi cụ thể. Câu trả lời AI có thể không hoàn toàn chính xác, vì vậy hãy đối chiếu trích dẫn."],
  ["Lời mời không dùng được", "Lời mời có thể đã hết hạn, bị thu hồi hoặc bạn đã mất quyền truy cập. Hãy nhờ chủ sở hữu gửi một lời mời mới."],
  ["Quên mật khẩu", "Tại trang đăng nhập, chọn Quên mật khẩu và làm theo hướng dẫn gửi đến email của bạn."],
];

export const HelpPage = () => {
  const [openIssues, setOpenIssues] = useState<Set<string>>(new Set());

  const toggleIssue = (question: string) => setOpenIssues(current => {
    const next = new Set(current);
    if (next.has(question)) next.delete(question);
    else next.add(question);
    return next;
  });

  return <div className="bg-background px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
  <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[11rem_minmax(0,46rem)] lg:gap-16">
    <aside className="hidden lg:block"><nav aria-label="Nội dung trợ giúp" className="sticky top-24 border-l border-border pl-4"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hướng dẫn</p><ol className="space-y-3">{sections.map((section, index) => <li key={section.id}><a className="text-sm text-muted-foreground hover:text-foreground" href={`#${section.id}`}>{index + 1}. {section.title}</a></li>)}<li><a className="text-sm text-muted-foreground hover:text-foreground" href="#troubleshooting">Xử lý sự cố</a></li></ol></nav></aside>
    <article className="min-w-0"><header className="border-b border-border pb-10"><p className="type-meta font-medium text-muted-foreground">Trợ giúp</p><h1 className="mt-5 type-page-title">Hướng dẫn sử dụng Mora</h1><p className="mt-5 type-body-relaxed text-muted-foreground">Các thao tác cơ bản để làm việc với tài liệu, nhóm học và Mora.</p></header>
      <div>{sections.map((section, index) => <section id={section.id} key={section.id} className="scroll-mt-28 border-b border-border py-10 sm:py-12"><p className="type-body text-muted-foreground">{String(index + 1).padStart(2, "0")}</p><h2 className="mt-3 type-section-title">{section.title}</h2><p className="mt-4 max-w-2xl type-body-relaxed text-muted-foreground">{section.intro}</p><ol className="mt-5 max-w-2xl list-decimal space-y-2 pl-5 type-body-relaxed text-muted-foreground">{section.steps.map(step => <li key={step}>{step}</li>)}</ol></section>)}</div>
      <section id="troubleshooting" className="scroll-mt-28 py-10 sm:py-12"><p className="type-body text-muted-foreground">06</p><h2 className="mt-3 type-section-title">Xử lý sự cố</h2><div className="mt-5 divide-y divide-border border-t border-border">{issues.map(([question, answer]) => {
        const isOpen = openIssues.has(question);
        return <div key={question} className="py-1"><button type="button" className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-medium" onClick={() => toggleIssue(question)} aria-expanded={isOpen}>{question}<ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" /></button><div className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><p className="max-w-2xl pb-4 leading-8 text-muted-foreground">{answer}</p></div></div></div>;
      })}</div></section>
      <footer className="border-t border-border pt-8 text-sm leading-7 text-muted-foreground">Cần thêm hỗ trợ? Gửi email tới <a className="font-medium text-foreground underline underline-offset-4" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>. Xem thêm <Link className="font-medium text-foreground underline underline-offset-4" to="/privacy">Chính sách quyền riêng tư</Link>.</footer>
    </article>
  </div>
</div>;
};
