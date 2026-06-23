import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { BenchmarkRun } from "@/features/admin/services/benchmark-api";

export const benchmarkRunColumns = (
  handleSelectA: (id: number, name: string) => void,
  handleSelectB: (id: number, name: string) => void,
  handleDelete: (id: number) => void,
  selectedAId?: string,
  selectedBId?: string
): ColumnDef<BenchmarkRun>[] => [
  {
    accessorKey: "runAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Thời gian" />,
    cell: ({ row }) => {
      const date = new Date(row.original.runAt);
      return <span className="text-xs text-muted-foreground">{date.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: "approachName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hướng tiếp cận" />,
    cell: ({ row }) => (
      <span className="font-semibold text-foreground">{row.original.approachName}</span>
    ),
  },
  {
    accessorKey: "ragasFaithfulness",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Faithfulness" />,
    cell: ({ row }) => (
      <span className="font-medium">{Math.round(row.original.ragasFaithfulness * 100)}%</span>
    ),
  },
  {
    accessorKey: "ragasAnswerRelevance",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Answer Relevance" />,
    cell: ({ row }) => (
      <span className="font-medium">{Math.round(row.original.ragasAnswerRelevance * 100)}%</span>
    ),
  },
  {
    accessorKey: "avgLatencyMs",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Latency TB" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{(row.original.avgLatencyMs / 1000).toFixed(2)}s</span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-4">Hành động</div>,
    cell: ({ row }) => {
      const run = row.original;
      const isA = selectedAId === run.id.toString();
      const isB = selectedBId === run.id.toString();

      return (
        <div className="flex items-center justify-end gap-2 pr-4">
          <Button
            variant={isA ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-xs cursor-pointer transition-all border border-border/80"
            onClick={() => handleSelectA(run.id, run.approachName)}
          >
            {isA ? "Đang chọn A" : "Chọn A"}
          </Button>
          <Button
            variant={isB ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-xs cursor-pointer transition-all border border-border/80"
            onClick={() => handleSelectB(run.id, run.approachName)}
          >
            {isB ? "Đang chọn B" : "Chọn B"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0 cursor-pointer"
            onClick={() => handleDelete(run.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },
  },
];
