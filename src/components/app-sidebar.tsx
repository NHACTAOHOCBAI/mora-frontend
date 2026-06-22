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
import { LayoutDashboardIcon, UsersIcon } from "lucide-react"

const data = {
  user: {
    name: "Mora Admin",
    email: "admin@mora.com",
    avatar: "/frog-logo.png",
  },
  navMain: [
    {
      title: "Quản lý thành viên",
      url: "/admin/user",
      icon: <UsersIcon />,
    },
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
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link to="/admin/user" />}
            >
              <div className="p-0.5 bg-muted rounded-md border border-border flex items-center justify-center w-7 h-7 overflow-hidden">
                <img src="/frog-logo.png" alt="Mora Logo" className="w-5 h-5 object-contain dark:invert" />
              </div>
              <span className="text-base font-semibold">Mora Admin</span>
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
