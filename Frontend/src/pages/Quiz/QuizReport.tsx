import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/Common/shadcnui/card"
import {Badge} from "@/components/Common/shadcnui/badge"
import {getQuizReport} from '@/services/operations/QuizOperations'
import {useParams} from "react-router-dom";

interface QuizQuestionData {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string;
    isCorrect?: boolean;
}

interface QuizReportData {
    duration: number;
    totalQuestions: number;
    totalMarks: number;
    totalParticipants: number;
    userScore: number;
    userRank: number;
    questions: QuizQuestionData[];
}

export default function QuizReport() {
    const [quizData, setQuizData] = useState<QuizReportData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const {id:quizId} = useParams<{id: string}>();

    useEffect(() => {
        const fetchQuizReport = async () => {
            try {
                setLoading(true);
                const response = await getQuizReport(quizId);
                response.data.duration = Math.round(response.data.duration / 60000);
                setQuizData(response.data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('An unknown error occurred'));
            } finally {
                setLoading(false);
            }
        };

        fetchQuizReport();
    }, [quizId]);

    if (loading) return <QuizReportSkeleton />;
    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="w-96">
                <CardContent className="text-center py-8">
                    <p className="text-red-500">Failed to load quiz report</p>
                    <p className="text-sm text-gray-500 mt-2">{error.message}</p>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 font-manrope bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {quizData ? (
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Quiz Results</h1>

                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Quiz Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Duration</p>
                                    <p className="font-medium">{quizData.duration} minutes</p>
                                </div>
                                <div>   
                                    <p className="text-sm text-gray-500">Total Questions</p>
                                    <p className="font-medium">{quizData.totalQuestions}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Marks</p>
                                    <p className="font-medium">{quizData.totalMarks}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Participants</p>
                                    <p className="font-medium">{quizData.totalParticipants}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-8 bg-blue-50">
                        <CardContent className="flex items-center justify-between py-6">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Your Rank</p>
                                <p className="text-4xl font-bold text-blue-700">{quizData.userRank}</p>
                            </div>
                            <div>
                                <Badge variant="secondary" className="text-xl px-4 py-2">
                                    Score: {quizData.userScore}/{quizData.totalQuestions}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Question Review</h2>
                    {quizData.questions.map((question, questionIndex) => {
                        const correctOptionIndex = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer);
                        const userOptionIndex = ['A', 'B', 'C', 'D'].indexOf(question.userAnswer);

                        return (
                            <Card key={question.id} className={`mb-4 ${question.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                <CardHeader>
                                    <CardTitle className="text-lg flex justify-between items-center">
                                        <span>{questionIndex + 1}. {question.question}</span>
                                        {question.isCorrect ? (
                                            <Badge className="bg-green-100 text-green-800">Correct</Badge>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-800">Incorrect</Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {question.options.map((option, optionIndex) => {
                                            let className = "p-2 rounded border";

                                            if (optionIndex === correctOptionIndex) {
                                                className += " bg-green-100 border-green-500 text-green-800";
                                            } else if (optionIndex === userOptionIndex && !question.isCorrect) {
                                                className += " bg-red-100 border-red-500 text-red-800";
                                            } else {
                                                className += " bg-gray-100 border-gray-300";
                                            }

                                            return (
                                                <div
                                                    key={optionIndex}
                                                    className={className}
                                                >
                                                    {String.fromCharCode(65 + optionIndex)}. {option}
                                                    {optionIndex === correctOptionIndex && (
                                                        <span className="ml-2 text-green-600 font-bold">(Correct Answer)</span>
                                                    )}
                                                    {optionIndex === userOptionIndex && !question.isCorrect && (
                                                        <span className="ml-2 text-red-600 font-bold">(Your Answer)</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center text-gray-500">No quiz data available</div>
            )}
        </div>
    );
}

// Skeleton Loading Component remains the same as in previous version
const QuizReportSkeleton = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
                {/* Title Skeleton */}
                <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>

                {/* Summary Card Skeleton */}
                <Card className="mb-8 p-6">
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-6 bg-gray-300 rounded"></div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Rank and Score Skeleton */}
                <Card className="mb-8 bg-blue-50 p-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="h-4 bg-blue-200 rounded w-1/2"></div>
                            <div className="h-8 bg-blue-300 rounded w-16"></div>
                        </div>
                        <div className="h-10 bg-blue-200 rounded w-24"></div>
                    </div>
                </Card>

                {/* Question Review Skeletons */}
                <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    {[1, 2].map((questionIndex) => (
                        <Card key={questionIndex} className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((option) => (
                                    <div
                                        key={option}
                                        className="h-12 bg-gray-100 rounded"
                                    ></div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
