import React, { useEffect, useState } from 'react'
import Quizzes from './Quizzes'
import { getUserCreatedQuizzes } from '@/services/operations/UserOperations';
import ExamQuizCard from '@/components/QuizComponents/Quiz-card-component';
import { Skeleton } from '@/components/Common/shadcnui/skeleton';
import { MoveRightIcon, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Common/shadcnui/button';

interface Quiz {
    attendedAt: string | null | undefined;
    attended: boolean;
    score: number;
    rank: number;
    quizId: number;
    createdAt: string;
    createdById: number;
    duration: number;
    endsAt: string;
    ranksCalculated: boolean;
    rules: string[];
    startsAt: string;
    sys_id: number;
    title: string;
    updatedAt: string;
    _count: {
        attendees: number;
        questions: number;
    };
    questions: number;
}


const CreatedQuizzes = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [quizList, setQuizList] = useState<Quiz[]>([]);

    const getQuizStatus = (quiz: Quiz) => {
        const now = new Date();
        const endsAt = new Date(quiz.endsAt);
        const startsAt = new Date(quiz.startsAt);

        if (now > endsAt) return 'ended';
        if (now < startsAt) return 'upcoming';
        return 'active';
    };

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                setIsLoading(true);
                const response = await getUserCreatedQuizzes();
                console.log(response.data);
                setQuizList(response.data || []);
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, []);
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

    const filteredQuizzes = quizList.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <QuizzesSkeleton />
    }
    return (
        <div className="w-full min-h-screen">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 p-6">
                    <div className="h-full w-full">
                        <div className="flex h-[60px] items-center justify-between border-b">
                            <h1 className="text-3xl font-manrope font-bold text-[#4a516d] px-6">Created Quizzes</h1>
                            <div className="relative w-full flex gap-x-2 pr-2 max-w-sm">
                                <input
                                    type="search"
                                    placeholder="Search by title..."
                                    className="pl-10 pr-4 w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Link to="/quiz/create">
                                    <Button className="border-[0.5px] font-manrope font-semibold p-6 w-42 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]">
                                        Create Quiz
                                        <MoveRightIcon className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {filteredQuizzes.map((quiz: Quiz) => (
                                <ExamQuizCard
                                    createdById={quiz.createdById}
                                    key={quiz.quizId}
                                    title={quiz.title}
                                    subject="Technical"
                                    duration={quiz.duration / 60000}
                                    userRank={quiz.rank}
                                    totalParticipants={quiz._count.attendees}
                                    score={quiz.score}
                                    totalQuestions={quiz._count.questions}
                                    attended={quiz.attended}
                                    attendedAt={quiz.attendedAt}
                                    createdAt={quiz.createdAt}
                                    quizId={quiz.quizId}
                                    startsAt={quiz.startsAt}
                                    endsAt={quiz.endsAt}
                                    quizStatus={getQuizStatus(quiz)}
                                />
                            ))}

                            {quizList.length === 0 && !isLoading && (
                                <div className="col-span-full font-manrope text-center py-8 text-gray-500">
                                    No quizzes found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreatedQuizzes
