import type { ColumnDef } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { BenchmarkQuestion } from "@/features/admin/services/benchmark-api";

export const benchmarkQuestionColumns = (
  handleOpenEditDialog: (q: BenchmarkQuestion) => void,
  handleDeleteQuestion: (id: number) => void
): ColumnDef<BenchmarkQuestion>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <span className="font-medium text-muted-foreground">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "question",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Câu hỏi kiểm thử" />,
    cell: ({ row }) => (
      <div className="font-medium text-foreground max-w-md truncate whitespace-pre-wrap">
        {row.original.question}
      </div>
    ),
  },
  {
    accessorKey: "groundTruth",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Đáp án chuẩn (Ground Truth)" />,
    cell: ({ row }) => (
      <div className="text-muted-foreground max-w-md truncate whitespace-pre-wrap">
        {row.original.groundTruth}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-4">Hành động</div>,
    cell: ({ row }) => {
      const q = row.original;

      return (
        <div className="flex items-center justify-end gap-1 pr-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8 p-0 cursor-pointer"
            onClick={() => handleOpenEditDialog(q)}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0 cursor-pointer"
            onClick={() => handleDeleteQuestion(q.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },
  },
];
