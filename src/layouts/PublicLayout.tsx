import { Link, Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SiteFooter } from "@/components/shared/SiteFooter";

export const PublicLayout = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isLanding = pathname === "/";
  const actions = isLanding && !user ? <><Button size="sm" variant="ghost" render={<Link to="/login?redirect=%2Fapp" />}>Đăng nhập</Button><Button size="sm" render={<Link to="/register?redirect=%2Fapp" />}>Đăng ký miễn phí</Button></> : undefined;
  const navigation = isLanding ? <nav aria-label="Điều hướng giới thiệu" className="flex h-full items-center gap-4 overflow-x-auto text-sm text-muted-foreground sm:gap-6"><a href="#features" className="whitespace-nowrap hover:text-foreground">Tính năng</a><a href="#use-cases" className="whitespace-nowrap hover:text-foreground">Tình huống học</a><a href="#how-it-works" className="whitespace-nowrap hover:text-foreground">Cách hoạt động</a><a href="#faq" className="whitespace-nowrap hover:text-foreground">Câu hỏi</a></nav> : undefined;
  return (
  <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
    <AppHeader navigation={navigation} actions={actions} />
    <main className="relative flex flex-1 flex-col"><Outlet /></main>
    <SiteFooter />
  </div>
  );
};
