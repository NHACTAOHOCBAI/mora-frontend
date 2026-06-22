import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Shield, UserCheck, UserX } from "lucide-react";

import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { UserResponse, Role } from "@/features/auth/types";

export const userColumns = (
    handleToggleStatus: (id: number, currentActive: boolean, currentRole: Role) => void,
    handleChangeRole: (id: number, currentActive: boolean, newRole: Role) => void
): ColumnDef<UserResponse>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Chọn tất cả"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Chọn dòng"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.original.id}</span>,
    },
    {
        accessorKey: "username",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tên đăng nhập" />,
        cell: ({ row }) => <span className="font-semibold">{row.original.username}</span>,
    },
    {
        accessorKey: "fullName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Họ và tên" />,
    },
    {
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
        accessorKey: "role",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vai trò" />,
        cell: ({ row }) => {
            const role = row.original.role;
            return (
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        role === 'ROLE_ADMIN'
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-muted text-foreground border-border'
                    }`}
                >
                    {role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                </span>
            );
        },
    },
    {
        accessorKey: "active",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => {
            const active = row.original.active;
            return (
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-destructive'}`} />
                    {active ? 'Hoạt động' : 'Bị khóa'}
                </span>
            );
        },
    },
    {
        id: "actions",
        header: () => <div className="text-right pr-4">Thao tác</div>,
        cell: ({ row }) => {
            const user = row.original;

            return (
                <div className="text-right pr-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 cursor-pointer hover:bg-muted inline-flex items-center justify-center rounded-lg border border-transparent transition-colors">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Tác vụ thành viên</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-border" />
                            
                            {/* Toggle Active/Inactive */}
                            <DropdownMenuItem
                                onClick={() => handleToggleStatus(user.id, user.active, user.role)}
                                className="cursor-pointer"
                            >
                                {user.active ? (
                                    <>
                                        <UserX className="w-4 h-4 mr-2" />
                                        <span>Khóa tài khoản</span>
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        <span>Mở khóa tài khoản</span>
                                    </>
                                )}
                            </DropdownMenuItem>

                            {/* Toggle Role */}
                            {user.role === 'ROLE_USER' ? (
                                <DropdownMenuItem
                                    onClick={() => handleChangeRole(user.id, user.active, 'ROLE_ADMIN')}
                                    className="cursor-pointer font-medium"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    <span>Gán quyền Admin</span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => handleChangeRole(user.id, user.active, 'ROLE_USER')}
                                    className="cursor-pointer"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    <span>Gỡ quyền Admin</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
