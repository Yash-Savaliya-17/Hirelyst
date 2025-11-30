import { useEffect, useState, } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuizQuestions, sendQuizInvite } from '@/services/operations/QuizOperations.ts';
import { Skeleton } from '@/components/Common/shadcnui/skeleton.tsx';
import { AlertCircle, BookOpen, Calendar, ClipboardSignatureIcon, Clock, HelpCircle, Send, Users, X } from "lucide-react";
import { toast } from 'sonner';
import '@/components/Common/profile.css';
import { Alert, AlertDescription } from "@/components/Common/shadcnui/alert.tsx";
import { Badge } from "@/components/Common/shadcnui/badge.tsx";
import { formatDuration } from '@/components/Common/DurationFunction.tsx';
import Question from "@/pages/Quiz/QuizQuestions/Question.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/Common/shadcnui/dialog.tsx";
import { Button } from "@/components/Common/shadcnui/button.tsx";
import { Input } from "@/components/Common/shadcnui/input.tsx";

// Define interfaces for type safety
interface QuizQuestion {
    sys_id: number;
    question: string;
    questionId: number;
}

interface QuizData {
    title: string;
    questions: QuizQuestion[];
    id: number;
    startsAt: string;
    endsAt: string;
    duration: number;
}

const QuizQuestions = () => {
    const { id } = useParams();

    // State for quiz data
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    // Email invite states
    const [email, setEmail] = useState<string>('');
    const [addEmails, setAddEmails] = useState<string[]>([]);
    const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    // Fetch quiz questions
    useEffect(() => {
        const fetchQuiz = async () => {
            if (!id) {
                toast.error("No quiz ID provided");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const response = await getQuizQuestions(id);
                console.log(response.data);

                // Validate response structure
                if (!response || !response.data) {
                    throw new Error("Invalid response from server");
                }

                const fetchedQuizData: QuizData = {
                    title: response.data.title || "Untitled Quiz",
                    questions: (response.data.questions || []).map((item: any) => ({
                        sys_id: item.sys_id,
                        question: item.question,
                        questionId: item.questionId,
                    })),
                    id: response.data.sys_id,
                    startsAt: response.data.startsAt,
                    endsAt: response.data.endsAt,
                    duration: response.data.duration
                };

                setQuizData(fetchedQuizData);
            } catch (error) {
                console.error('Error fetching quiz:', error);
                toast.error("Failed to load quiz questions");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuiz();
    }, [id]);

    const addEmailsToArray = (emails: string[]) => {
        const validEmails = emails
            .map(e => e.trim())
            .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !addEmails.includes(e));

        if (validEmails.length > 0) {
            setAddEmails(prevEmails => [
                ...prevEmails,
                ...validEmails
            ]);
        } else {
            toast.error("Please enter valid email addresses.");
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const pasteText = event.clipboardData.getData('Text');
        const emails = pasteText.split(/\r?\n/);
        addEmailsToArray(emails);
        setEmail('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && email) {
            addEmailsToArray([email]);
            setEmail('');
            event.preventDefault();
        }
    };

    const handleAddEmails = () => {
        if (email && !addEmails.includes(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setAddEmails([
                ...addEmails,
                email
            ]);
            setEmail('');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address.");
        }
    };

    const handleRemoveSelection = (index: number) => {
        setAddEmails(addEmails.filter((_, i) => i !== index));
    };

    const handleSendQuiz = async () => {
        if (addEmails.length === 0) {
            toast.error("Please add at least one email address.");
            return;
        }

        setIsSendingInvite(true);
        try {
            if (quizData?.id) {
                await sendQuizInvite(quizData.id, addEmails);
            }
            toast.success("Quiz invitation sent successfully!");
            setAddEmails([]);
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error sending quiz invite:', error);
            toast.error("Failed to send quiz invitation. Please try again.");
        } finally {
            setIsSendingInvite(false);
        }
    };

    // Render loading skeleton
    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto w-full min-h-screen pb-8">
                <div className="py-6 border-b border-gray-200">
                    <Skeleton className="h-20 w-full" />
                </div>
                <div className="py-4 px-6">
                    {[1, 2, 3].map((_, index) => (
                        <div key={index} className="mb-8">
                            <Skeleton className="h-8 w-full mb-4" />
                            <div className="space-y-3 pl-6">
                                {[1, 2, 3, 4].map((skelNum) => (
                                    <div key={skelNum} className="flex items-center gap-3">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-6 w-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl font-manrope mx-auto w-full min-h-screen pb-8 ">
            <header className="py-6 border-b border-gray-200 bg-white shadow-sm">
                <div className="px-6">
                    {/* Quiz Title Section */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                {quizData?.title || "Quiz Title"}
                            </h1>
                        </div>
                        <Badge variant="outline" className="px-3 py-1 border-blue-200 bg-blue-50 text-blue-600">
                            Active Quiz
                        </Badge>
                    </div>

                    {/* Quiz Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date</p>
                                <p className="font-semibold"><div>
                                    {quizData?.startsAt
                                        ? new Date(quizData.startsAt).toLocaleDateString("en-GB")
                                        : "N/A"}
                                </div>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Duration</p>
                                <p className="font-semibold">{formatDuration(quizData?.duration || 0)} </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <HelpCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Questions</p>
                                <p className="font-semibold">{quizData?.questions?.length || 0} Questions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-6 py-8">
                <Alert className="mb-6 bg-blue-50 text-blue-600 border-blue-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Students must complete all questions within the specified duration. Make sure to review all
                        questions before sending.
                    </AlertDescription>
                </Alert>

                <div className="space-y-8">
                    {quizData && quizData.questions.length > 0 ? (
                        quizData.questions.map((item, index) => (
                            <div key={item.sys_id}
                                className="border border-gray-200 rounded-lg p-6 shadow-sm hover:border-blue-200 transition-all duration-200 bg-white group">
                                <div className="flex items-start gap-4">
                                    <Question data={item} index={index} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            No questions found
                        </div>
                    )}

                    {quizData && quizData.questions.length > 0 && (
                        <div className="flex flex-col md:flex-row justify-end gap-2 mt-8">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="w-full md:w-[20%] font-primary-font font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                        <Send className="h-4 w-4" />
                                        Send Quiz
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[90%] md:max-w-[500px] font-dm-sans">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-gray-700">
                                            <Users className="h-5 w-5 text-blue-600" />
                                            Send Quiz to Students
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-500">
                                            Add email addresses of students who should receive this quiz
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4">
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="email"
                                                placeholder="Enter Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onPaste={handlePaste}
                                                onKeyDown={handleKeyDown}
                                                className="h-9 w-full md:w-[25vw] border-gray-200 text-sm rounded-md p-3 focus:border-blue-400 focus:ring-blue-400"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleAddEmails}
                                                className="h-9 w-9 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                            >
                                                <Users className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {addEmails.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-2">
                                            {addEmails.map((email, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-blue-50 flex items-center gap-2 text-blue-600 font-primary-font font-semibold text-xs px-3 py-1.5 rounded-full border border-blue-200"
                                                >
                                                    <Users className="h-3 w-3" />
                                                    {email}
                                                    <X
                                                        onClick={() => handleRemoveSelection(index)}
                                                        className="h-3 w-3 text-blue-500 hover:text-blue-700 cursor-pointer"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            onClick={handleSendQuiz}
                                            disabled={isSendingInvite}
                                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                        >
                                            {isSendingInvite ? (
                                                <>
                                                    <span className="animate-spin">◌</span>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Send Quiz
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default QuizQuestions;
