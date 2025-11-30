import {Button} from '@/components/Common/shadcnui/button';
import {useNavigate} from 'react-router-dom';
import {ArrowUpDown, Check, ChevronDown, Search, X} from "lucide-react";
import {Input} from "@/components/Common/shadcnui/input";
import {useEffect, useState} from "react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/Common/shadcnui/dropdown-menu";
import {CreateQuiz, getQuiz, getSubjects} from '@/services/operations/QuizOperations';
import {useForm} from 'react-hook-form';
import {toast} from 'sonner';
import {useDispatch} from 'react-redux';
import {addQuestions} from '@/slices/Mcq/Mcq.slice.ts';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/Common/shadcnui/alert-dialog";

const sortOptions = [
    { label: "Alphabetical: A-Z", value: "alpha-asc" },
    { label: "Alphabetical: Z-A", value: "alpha-desc" },
];

interface QuestionCategory {
    sys_id: number;
    name: string;
    subjectId: number;
    createdAt: string;
    updatedAt: string;
}

interface Subject {
    sys_id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    questionCategories: QuestionCategory[];
}

interface topics {
    topicId: number;
    count: number;
}

interface subjects {
    subjectId: number;
    topics: topics[];
}

interface Question {
    title: string;
    subjects: subjects[];
}

const Quiz = () => {
    const navigate = useNavigate();
    const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
    const [selectedSubject, setSelectedSubject] = useState<{ subject: string, subjectId: number } | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<{ topic: string, topicId: number } | null>(null);
    const [questionCount, setQuestionCount] = useState("");
    const [selections, setSelections] = useState<Array<{ subject: string; topic: string; count: string }>>([]);
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topicOptions, setTopicOptions] = useState<Record<string, QuestionCategory[]>>({});
    const { register, handleSubmit, formState: { errors } } = useForm<Question>();
    const dispatch = useDispatch();

    // Check registration status
    useEffect(() => {
        const checkRegistration = async () => {
            try {
                const response = await fetch('/api/check-registration'); // Replace with your actual API endpoint
                const data = await response.json();
                setIsRegistered(data.isRegistered);
            } catch (error) {
                console.error('Error checking registration:', error);
                setIsRegistered(false);
            }
        };
        checkRegistration();
    }, []);

    useEffect(() => {
        const GetSubjects = async () => {
            setIsLoading(true);
            try {
                const response = await getSubjects();
                setSubjects(response.data.subjects);
                const questionCategories = response.data.subjects.reduce((acc: any, subject: any) => {
                    acc[subject.name] = subject.questionCategories;
                    return acc;
                }, {});
                setTopicOptions(questionCategories);
            } catch (error) {
                toast.error('Failed to fetch subjects. Please try again.');
                console.error('Error fetching subjects:', error);
            } finally {
                setIsLoading(false);
            }
        };
        GetSubjects();
    }, []);

    const subjectData: subjects[] = selections.map((topic: any) => ({
        subjectId: topic.subjectId,
        topics: [{
            topicId: topic.topicId,
            count: Number(topic.count)
        }]
    }));

    const [quizId, setQuizId] = useState<number | undefined>(undefined);

    const handleCreateQuiz = async (formData: any) => {
        if (!isRegistered) {
            setShowRegisterDialog(true);
            return;
        }

        const data = {
            title: formData.title,
            subjects: subjectData,
        };

        setIsLoading(true);
        toast.promise(
            CreateQuiz(data),
            {
                loading: 'Creating quiz...',
                success: (response) => {
                    const str = response.data.message;
                    const parts = str.split(' ');
                    const id = parseInt(parts.find((part: string) => !isNaN(Number(part)) && Number.isInteger(Number(part))), 10);
                    setQuizId(id);
                    return 'Quiz created successfully! You can now start the quiz.';
                },
                error: (error) => {
                    console.error('Error creating quiz:', error);
                    return error.response?.data?.message || 'Failed to create quiz. Please try again.';
                }
            }
        )//.finally(() => setIsLoading(false));
    };

    const handleStartQuiz = async () => {
        if (!isRegistered) {
            setShowRegisterDialog(true);
            return;
        }

        setIsLoading(true);
        try {
            const response = await getQuiz(quizId);
            const title = response.data.title;
            const questions = response.data.questions?.map((item: any) => ({
                sys_id: item.sys_id,
                question: item.question,
                options: item.options?.map((opt: any) => ({
                    sys_id: opt.sys_id,
                    option: opt.option,
                })) || [],
                questionId: item.questionId,
            })) || [];
            dispatch(addQuestions({ title, questions, id: response.data.sys_id, startsAt: response.data.startsAt,endsAt: response.data.endsAt }));
            navigate('/mcq');
        } catch (error) {
            toast.error('Failed to start quiz. Please try again.');
            console.error('Error fetching quiz:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubjectChange = (subject: string, subjectId: number) => {
        setSelectedSubject({ subject, subjectId });
        setSelectedTopic(null);
        setIsSubjectDropdownOpen(false);
    };

    const handleTopicChange = (topic: string, topicId: number) => {
        setSelectedTopic({ topic, topicId });
        setIsTopicDropdownOpen(false);
    };

    const handleAddSelection = () => {
        if (selectedSubject && selectedTopic && questionCount) {
            const newSelection = {
                topicId: selectedTopic.topicId,
                subjectId: selectedSubject.subjectId,
                subject: selectedSubject.subject,
                topic: selectedTopic.topic,
                count: questionCount
            };

            setSelections(prev => [...prev, newSelection]);
            setSelectedSubject(null);
            setSelectedTopic(null);
            setQuestionCount("");
            toast.success('Selection added successfully!');
        }
    };

    const handleRemoveSelection = (index: number) => {
        setSelections(selections.filter((_, i) => i !== index));
        toast.success('Selection removed successfully!');
    };

    return (
        <div className="w-full pt-3 h-[87vh] p-7">
            <div className='flex w-full h-14'>
                <h1 className="text-2xl flex items-center w-[50%] font-geist text-white">Create Your Quiz</h1>
                <div className="mx-auto gap-x-2 flex flex-row w-[50%] items-center">
                    <div className="relative flex items-center w-[65%]">
                        <Input
                            type="search"
                            placeholder="Search quizzes..."
                            className="w-[365px] pl-10 pr-4 py-2 font-quiz-font text-sm text-white bg-black border-[0.5px] border-[#76757568] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 ease-in-out placeholder-gray-400"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white h-4 w-4" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="bg-black hover:bg-transparent font-quiz-font hover:text-white text-white border-[#76757568] w-full"
                            >
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                {selectedSort.label}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-black w-48 font-quiz-font text-white border-gray-700">
                            {sortOptions.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => setSelectedSort(option)}
                                    className="focus:bg-[#76757568] focus:text-white cursor-pointer"
                                >
                                    {option.label}
                                    {selectedSort.value === option.value && (
                                        <Check className="ml-2 h-4 w-4" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className='w-full p-4 border-[0.5px] border-[#767575ae] mb-3 rounded-md'>
                <h1 className="text-xl mb-4 text-center font-bold font-Zen-Kaku-Gothic-New text-white">Create New Quiz</h1>

                <form onSubmit={handleSubmit(handleCreateQuiz)} className='space-y-4'>
                    <div className='flex items-center gap-4'>
                        <Input
                            className="flex-1 h-10 bg-black text-white border-[0.5px] border-[#767575ae] placeholder:font-Zen-Kaku-Gothic-New"
                            placeholder="Enter quiz title"
                            {...register("title", {
                                required: "Quiz title is required",
                                minLength: { value: 3, message: "Title must be at least 3 characters" }
                            })}
                        />
                        <Button
                            type='submit'
                            disabled={isLoading || selections.length === 0}
                            className="w-32 bg-white font-Zen-Kaku-Gothic-New font-semibold hover:bg-gray-100 text-black disabled:bg-gray-800 disabled:text-white"
                        >
                            {isLoading ? "Creating..." : "Create Quiz"}
                        </Button>
                    </div>
                    {errors.title && (
                        <p className="text-red-500 text-sm">{errors.title.message}</p>
                    )}

                    <div className='grid grid-cols-4 gap-4'>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                className="w-full px-4 py-2 flex justify-between items-center bg-black text-white border-[0.5px] border-[#767575ae] rounded-md"
                            >
                                {selectedSubject?.subject || "Select subject"}
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            </button>
                            {isSubjectDropdownOpen && (
                                <ul className="absolute z-10 w-full mt-1 py-1 bg-black border-[0.5px] border-[#767575ae] rounded-md shadow-lg max-h-60 overflow-auto">
                                    {subjects.map((subject) => (
                                        <li
                                            key={subject.sys_id}
                                            onClick={() => handleSubjectChange(subject.name, subject.sys_id)}
                                            className="px-4 py-2 hover:bg-[#76757568] cursor-pointer"
                                        >
                                            {subject.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                                disabled={!selectedSubject}
                                className="w-full px-4 py-2 flex justify-between items-center bg-black text-white border-[0.5px] border-[#767575ae] rounded-md disabled:opacity-50"
                            >
                                {selectedTopic?.topic || "Select topic"}
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            </button>
                            {isTopicDropdownOpen && selectedSubject && (
                                <ul className="absolute z-10 w-full mt-1 py-1 bg-black border-[0.5px] border-[#767575ae] rounded-md shadow-lg max-h-60 overflow-auto">
                                    {topicOptions[selectedSubject.subject]?.map((topic) => (
                                        <li
                                            key={topic.sys_id}
                                            onClick={() => handleTopicChange(topic.name, topic.sys_id)}
                                            className="px-4 py-2 hover:bg-[#76757568] cursor-pointer"
                                        >
                                            {topic.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <Input
                            type="number"
                            placeholder="Number of questions"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(e.target.value)}
                            min="1"
                            max="50"
                            className="bg-black text-white border-[0.5px] border-[#767575ae]"
                        />

                        <Button
                            onClick={handleAddSelection}
                            disabled={!selectedSubject || !selectedTopic || !questionCount}
                            className="bg-white font-Zen-Kaku-Gothic-New font-semibold hover:bg-gray-100 text-black disabled:bg-gray-800 disabled:text-white"
                        >
                            Add Selection
                        </Button>
                    </div>
                </form>
                {/* Selections Display Grid */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                    {selections.map((selection, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between bg-black border-[0.5px] border-[#767575ae] p-3 rounded-md hover:border-white transition-colors duration-200"
                        >
                            <div className="flex flex-col">
                                <span className="text-gray-200 font-medium">{selection.subject}</span>
                                <span className="text-gray-400 text-sm">{selection.topic}</span>
                                <span className="text-gray-400 text-sm">{selection.count} questions</span>
                            </div>
                            <button
                                onClick={() => handleRemoveSelection(index)}
                                className="p-1 hover:bg-gray-800 rounded-full transition-colors duration-200"
                            >
                                <X className="h-5 w-5 text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quiz List */}
            <div className="space-y-3">
                {quizId && (
                    <div className='w-full border-[0.5px] border-[#767575ae] bg-black hover:border-white transition-colors duration-200 rounded-md p-4'>
                        <div className="grid grid-cols-7 gap-4 items-center text-white">
                            <div className="font-medium">01</div>
                            <div className="col-span-2 font-medium">Aptitude mock test-1</div>
                            <div className="text-gray-300">{selections.reduce((acc, curr) => acc + parseInt(curr.count), 0)} questions</div>
                            <div className="text-gray-300">{new Date().toLocaleTimeString()}</div>
                            <div className="text-gray-300">10 min</div>
                            <Button
                                onClick={handleStartQuiz}
                                disabled={isLoading}
                                className="bg-white hover:bg-gray-100 text-black font-medium transition-colors duration-200"
                            >
                                {isLoading ? "Loading..." : "Start Quiz"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Registration Alert Dialog */}
            <AlertDialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <AlertDialogContent className="bg-black border-[0.5px] border-[#767575ae] text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Registration Required</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                            You need to be registered to create and take quizzes. Would you like to register now?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => navigate('/register')}
                            className="bg-white hover:bg-gray-100 text-black font-medium"
                        >
                            Register Now
                        </AlertDialogAction>
                        <Button
                            onClick={() => setShowRegisterDialog(false)}
                            variant="outline"
                            className="border-[#767575ae] text-white hover:bg-transparent hover:text-gray-300"
                        >
                            Cancel
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
};

export default Quiz;
