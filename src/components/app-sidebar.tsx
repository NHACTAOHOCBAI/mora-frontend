import { Link } from "react-router-dom"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, UsersIcon, FolderIcon, FileTextIcon, FlaskConical, House, Settings } from "lucide-react"

const data = {
  navGroups: [
    { label: "Hệ thống", items: [{ title: "Tổng quan", url: "/admin", icon: <LayoutDashboardIcon /> }] },
    { label: "Đánh giá AI", items: [{ title: "Benchmark RAG", url: "/admin/benchmarks", icon: <FlaskConical /> }] },
    { label: "Quản lý", items: [
      { title: "Quản lý thành viên", url: "/admin/users", icon: <UsersIcon /> },
      { title: "Không gian", url: "/admin/spaces", icon: <FolderIcon /> },
      { title: "Tài liệu & xử lý", url: "/admin/documents", icon: <FileTextIcon /> },
      { title: "Cài đặt AI", url: "/admin/settings", icon: <Settings /> },
    ] },
    { label: "Điều hướng", items: [{ title: "Không gian của tôi", url: "/app", icon: <House /> }] },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link to="/admin" />}
            >
              <div className="size-9 shrink-0 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                <img src="/frog-logo.png" alt="Mora Logo" className="size-7 object-contain dark:invert" />
              </div>
              <span className="type-card-title">Mora Admin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
