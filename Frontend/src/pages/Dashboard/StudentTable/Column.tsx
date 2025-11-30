import {ColumnDef} from "@tanstack/react-table"
import {ArrowUpDown} from "lucide-react"
import {Button} from "@/components/Common/shadcnui/button"
import {Checkbox} from "@/components/Common/shadcnui/checkbox"

export type QuizLeaderBoardUser = {
  id: string
  name: string
  date: string
  marks: number
  completedAt: string
  // status: "passed" | "failed" | "not attempted"
  email: string
}

export const columns: ColumnDef<QuizLeaderBoardUser>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "completedAt",
    header: "Completed At",
  },
  {
    accessorKey:"marks",
    header: "Marks",
  },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  // },
]
