import { Link, useLocation } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  groups,
}: {
  groups: { label: string; items: { title: string; url: string; icon?: React.ReactNode }[] }[]
}) {
  const location = useLocation()

  return (
    <>
      {groups.map((group) => <SidebarGroup key={group.label} className="py-1">
        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1.5">
          {group.items.map((item) => {
            const isActive = item.url === '/' || item.url === '/admin'
              ? location.pathname === item.url
              : location.pathname.startsWith(item.url) || (item.url === '/admin/user' && location.pathname === '/admin/users')

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  render={<Link to={item.url} />}
                  isActive={isActive}
                  className={cn(
                    "transition-colors",
                    isActive && "bg-black! text-white! hover:bg-black/90! dark:bg-white! dark:text-black! dark:hover:bg-white/90!"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>)}
    </>
  )
}


