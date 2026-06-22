import type { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const columnLabelMap: Record<string, string> = {
    id: "ID",
    username: "Tên đăng nhập",
    fullName: "Họ và tên",
    email: "Email",
    role: "Vai trò",
    active: "Trạng thái",
};

const toReadableLabel = (value: string) =>
    value
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .trim();

export function DataTableViewOptions<TData>({
    table,
}: {
    table: Table<TData>;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="border border-border bg-background hover:bg-muted hover:text-foreground inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-all outline-none select-none ml-2 h-8 gap-1.5 px-2.5 cursor-pointer">
                <Settings2 className="size-4" />
                Hiển thị
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Bật/tắt cột</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== "undefined" && column.getCanHide()
                    )
                    .map((column) => {
                        const metaLabel = (column.columnDef.meta as { label?: string } | undefined)?.label;
                        const displayLabel = metaLabel || columnLabelMap[column.id] || toReadableLabel(column.id);

                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                            >
                                {displayLabel}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
