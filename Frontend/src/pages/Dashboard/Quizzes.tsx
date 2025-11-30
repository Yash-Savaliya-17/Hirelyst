import { useEffect, useState } from 'react';
import { Button } from "@/components/Common/shadcnui/button";
import { Tabs, TabsContent } from "@/components/Common/shadcnui/tabs";
import ExamQuizCard from "@/components/QuizComponents/Quiz-card-component";
import { MoveRightIcon, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getUserQuizzes } from '@/services/operations/UserOperations';
import { Skeleton } from "@/components/Common/shadcnui/skeleton";
import { useSelector } from "react-redux";
import { RootState } from "@/slices/store.ts";

interface Quiz {
    quizId: number;
    attendedAt?: string | null;
    createdAt?: string;
    score: number;
    attended: boolean;
    rank: number;
    quiz: {
        createdById: number;
        title: string;
        duration: number;
        createdAt: string;
        updatedAt: string;
        startsAt: string;
        endsAt: string;
        _count: {
            attendees: number;
            questions: number;
        };
    };
}

const QuizzesSkeleton = () => {
    return (
        <div className="h-full w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="w-full">
                        <div className="border rounded-lg overflow-hidden shadow-lg">
                            <Skeleton className="h-1 w-full" />
                            <div className="p-4">
                                <div className="flex justify-between mb-4">
                                    <div className='flex flex-col gap-y-2'>
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32 mb-1" />
                                        <div className="flex gap-1">
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-2">
                                    {[...Array(4)].map((_, tooltipIndex) => (
                                        <div key={tooltipIndex} className="flex items-center p-2 rounded-lg bg-primary/10 h-[70px]">
                                            <Skeleton className="h-6 w-6 mr-3" />
                                            <div className="flex-grow">
                                                <Skeleton className="h-4 w-16 mb-2" />
                                                <Skeleton className="h-3 w-12" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className='mb-2'>
                                    <Skeleton className="h-3 w-[70%]" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-10 w-[50%]" />
                                    <Skeleton className="h-10 w-[50%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Quizzes = ({ activeTab }: { activeTab: string }) => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    // const [activeTab, setActiveTab] = useState('attempted');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                setIsLoading(true);
                const response = await getUserQuizzes();
                setQuizzes(response.data || []);
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const getQuizStatus = (quiz: Quiz) => {
        const now = new Date();
        const endsAt = new Date(quiz.quiz.endsAt);
        const startsAt = new Date(quiz.quiz.startsAt);

        if (now > endsAt) return 'ended';
        if (now < startsAt) return 'upcoming';
        return 'active';
    };

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const user = useSelector((state: RootState) => state.auth.user);

    const attemptedQuizzes = filteredQuizzes.filter(quiz => quiz.attended);

    const renderQuizzes = (quizList: Quiz[]) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {quizList.map((quiz) => (
                <ExamQuizCard
                    createdById={quiz.quiz.createdById}
                    key={quiz.quizId}
                    title={quiz.quiz.title}
                    subject="Technical"
                    duration={quiz.quiz.duration / 60000}
                    userRank={quiz.rank}
                    totalParticipants={quiz.quiz._count.attendees}
                    score={quiz.score}
                    totalQuestions={quiz.quiz._count.questions}
                    attended={quiz.attended}
                    attendedAt={quiz.attendedAt}
                    createdAt={quiz.quiz.createdAt}
                    quizId={quiz.quizId}
                    startsAt={quiz.quiz.startsAt}
                    endsAt={quiz.quiz.endsAt}
                    quizStatus={getQuizStatus(quiz)}
                />
            ))}

            {quizList.length === 0 && !isLoading && (
                <div className="col-span-full font-manrope text-center py-8 text-gray-500">
                    No quizzes found
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full min-h-screen">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 p-6">
                    <div className="h-full w-full">
                        <div className="flex h-[60px] items-center justify-between border-b">
                            <h1 className="text-3xl font-manrope font-bold text-[#4a516d] px-6">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Quizzes</h1>
                            <div className="relative w-full flex gap-x-2 pr-2 max-w-sm">
                                <input
                                    type="search"
                                    placeholder="Search by title..."
                                    className="pl-10 pr-4 w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            </div>
                        </div>

                        <Tabs defaultValue="attempted" value={activeTab} className="w-full">
                            {isLoading ? (
                                <QuizzesSkeleton />
                            ) : (
                                <>
                                    <TabsContent value="attempted">
                                        {renderQuizzes(attemptedQuizzes)}
                                    </TabsContent>
                                </>
                            )}
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Quizzes;
