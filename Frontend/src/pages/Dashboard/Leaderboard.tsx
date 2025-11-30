import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import {
    Activity,
    ArrowUpDown,
    Trophy,
    Users2Icon,
    Search,
    Download,
    RefreshCw,
    Clock
} from "lucide-react";
import { Button } from "@/components/Common/shadcnui/button";
import { Checkbox } from "@/components/Common/shadcnui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Common/shadcnui/card";
import { Input } from "@/components/Common/shadcnui/input";
import { DataTable } from "./StudentTable/data-table";
import NumberTicker from "@/components/Common/shadcnui/number-ticker";
import { getLeaderBoard } from "@/services/operations/QuizOperations";
import { Badge } from "@/components/Common/shadcnui/badge";
import { Skeleton } from "@/components/Common/shadcnui/skeleton";

export interface QuizLeaderBoardUser {
    id: string;
    name: string;
    date: string;
    score: number;
    completedAt: string;
    email: string;
    rank?: number;
}

const downloadCSV = (data: QuizLeaderBoardUser[]): void => {
    const headers = [
        'Rank',
        'Name',
        'Email',
        'Date',
        'Completed At',
        'Score'
    ];

    const csvRows = [
        headers.join(','),
        ...data.map((row, index) => [
            index + 1,
            `"${row.name}"`,
            `"${row.email}"`,
            row.date,
            row.completedAt,
            row.score
        ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `quiz-leaderboard-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    isLoading: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, isLoading }) => (
    <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="h-10 w-20" />
            ) : (
                <NumberTicker
                    value={value}
                    className="text-4xl font-bold text-primary"
                />
            )}
        </CardContent>
    </Card>
);

const createColumns = (questionsCount: number): ColumnDef<QuizLeaderBoardUser>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "rank",
        header: "Rank",
        cell: ({ row }) => (
            <div className="font-medium">{row.index + 1}</div>
        ),
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4"/>
            </Button>
        ),
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("name")}</div>
        ),
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
            <div className="text-muted-foreground">{row.getValue("email")}</div>
        ),
    },
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground"/>
                {row.getValue("date")}
            </div>
        ),
    },
    {
        accessorKey: "completedAt",
        header: "Completed At",
    },
    {
        accessorKey: "score",
        header: ({ column }) => (
            <div className="text-center w-full">
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
            <span className="flex items-center justify-center gap-1">
                Score (Max: {questionsCount})
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
                </Button>
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex justify-center">
                <Badge variant={Number(row.getValue("score")) >= 0 ? "secondary" : "destructive"}>
                    {row.getValue("score")}
                </Badge>
            </div>
        ),
    }];

const Leaderboard: React.FC = () => {
    const [data, setData] = useState<QuizLeaderBoardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [questionsCount, setQuestionsCount] = useState(0);
    const { id } = useParams<{ id: string }>();

    const fetchData = async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            const response = await getLeaderBoard(parseInt(id));
            const ld = response as any; // Type this properly based on your API response
            const mappedData = ld.data.quizAttendees.map((st: any) => ({
                id: st.sys_id,
                name: st.user.name,
                date: new Date(st.attendedAt).toLocaleDateString(),
                completedAt: new Date(st.completedAt).toLocaleTimeString('en-IN', {
                    hourCycle: "h12"
                }),
                score: st.score,
                email: st.user.email,
            }));
            setQuestionsCount(ld.data.quiz.questions);
            setData(mappedData);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const passedStudents = data.filter(student => student.score >= 70).length;

    return (
        <div className="min-h-screen pt-24 bg-background font-manrope p-6">
            <div className="sticky top-6 z-10 bg-background rounded-lg border shadow-sm">
                <div className="flex h-16 items-center px-8">
                    <h1 className="text-2xl font-bold font-dm-sans">Quiz Leaderboard</h1>
                    <div className="ml-auto flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}/>
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCSV(filteredData)}
                            disabled={isLoading || data.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2"/>
                            Export CSV
                        </Button>
                    </div>
                </div>
            </div>

            <main className="flex flex-1 flex-col gap-6 mt-6">
                <div className="grid gap-6 md:grid-cols-3 font-dm-sans">
                    <StatsCard
                        title="Total Students"
                        value={data.length}
                        icon={Users2Icon}
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Participated"
                        value={data.length}
                        icon={Activity}
                        isLoading={isLoading}
                    />
                </div>

                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="p-6 border-b">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    placeholder="Search by name or email..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : (
                            <DataTable
                                columns={createColumns(questionsCount)}
                                data={filteredData}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Leaderboard;
