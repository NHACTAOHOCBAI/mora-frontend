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
import { LayoutDashboardIcon, UsersIcon, FolderIcon, FileTextIcon } from "lucide-react"

const data = {
  user: {
    name: "Mora Admin",
    email: "admin@mora.com",
    avatar: "/frog-logo.png",
  },
  navMain: [
    { title: "Tổng quan", url: "/admin", icon: <LayoutDashboardIcon /> },
    {
      title: "Quản lý thành viên",
      url: "/admin/users",
      icon: <UsersIcon />,
    },
    { title: "Không gian", url: "/admin/spaces", icon: <FolderIcon /> },
    { title: "Tài liệu & xử lý", url: "/admin/documents", icon: <FileTextIcon /> },
    {
      title: "Quay lại Dashboard",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
