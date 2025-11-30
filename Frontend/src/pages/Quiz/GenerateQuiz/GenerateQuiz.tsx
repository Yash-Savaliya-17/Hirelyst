import {BookOpenCheck, Brain, CalendarRange, CheckCircle2, Clock, GraduationCap, ScrollText, Sparkles, Star, Trophy,} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent} from "@/components/Common/shadcnui/card";
import React, {useState} from "react";
import {useForm} from 'react-hook-form';
import {toast} from 'sonner';
import {Button} from "@/components/Common/shadcnui/button";
import '@/components/Common/profile.css';
import Title from './Title';
import SubjectSelection from './SubjectSelection';
import TimeSelection from './TimeSelection';
import {CreateQuiz, GenerateAiQuiz} from "@/services/operations/QuizOperations.ts";

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

const GenerateQuiz = () => {
    const navigate = useNavigate();
    const [selectedSubject, setSelectedSubject] = useState<{ subject: string, subjectId: number } | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<{ topic: string, topicId: number } | null>(null);
    const [questionCount, setQuestionCount] = useState("");
    const [selections, setSelections] = useState<Array<{
        topicId: number;
        subjectId: number;
        subject: string;
        topic: string;
        count: string
    }>>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [switchValue, setSwitchValue] = React.useState<boolean>(false);


    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topicOptions, setTopicOptions] = useState<Record<string, QuestionCategory[]>>({});
    const { register, handleSubmit } = useForm<Question>();
    const [title, setTitle] = useState<string>("");
    const [startHour, setStartHour] = useState<string>("");
    const [startMinute, setStartMinute] = useState<string>("");
    const [startAMPM, setStartAMPM] = useState<string>("AM");
    const [duration, setDuration] = useState<number>(0);
    const [totalMarks, setTotalMarks] = useState<string>("");

    const [currentStep, setCurrentStep] = useState(1);

    const subjectData: subjects[] = selections.map((topic: any) => ({
        subjectId: topic.subjectId,
        name: topic.subject,
        topics: [
            {
                name: topic.topic,
                topicId: topic.topicId,
                count: Number(topic.count)
            }
        ]
    }))

    const handleCreateQuiz = async () => {

        if (!date || !startHour || !startMinute || !duration) {
            toast.error("Please fill in all required fields");
            return;
        }

        let hourIn24Format = parseInt(startHour);
        if (startAMPM === "PM" && hourIn24Format !== 12) {
            hourIn24Format += 12;
        } else if (startAMPM === "AM" && hourIn24Format === 12) {
            hourIn24Format = 0;
        }

        const startsAt = new Date(date);
        startsAt.setHours(hourIn24Format, parseInt(startMinute));

        const endsAt = new Date(startsAt.getTime() + duration * 60000);

        const data = {
            title: title,
            subjects: subjectData,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            // totalMarks: parseInt(totalMarks),
        };

        if(switchValue) {
            data.subjects = data.subjects.map((sub, i) => {
                sub.subjectId = i;
                sub.topics.map((topic, i) => {
                    topic.topicId = i;
                    return topic;
                })
                return sub;
            })
        }

        toast.promise(
            switchValue ? GenerateAiQuiz(data) : CreateQuiz(data),
            {
                loading: 'Creating quiz...',
                success: (response) => {
                    const str = response.data.message;
                    const parts = str.split(' ');
                    const id = parseInt(parts.find((part: string) => !isNaN(Number(part)) && Number.isInteger(Number(part))), 10);
                    navigate(`${id}/questions`);
                    return 'Quiz created successfully';
                },
                error: (error) => {
                    console.error('Error creating quiz:', error);
                    toast.error(error.response.data.message);
                    return `${error.message || 'An error occurred'}`;
                }
            }
        );
    };

    const handleSubjectChange = (sys_id: string) => {
        const subject = subjects.find((subject: any) => subject.sys_id.toString() === sys_id);
        if (subject) {
            setSelectedSubject({ subject: subject.name, subjectId: subject.sys_id });
        }
        setSelectedTopic(null);
    };


    const handleTopicChange = (topicId: string) => {
        const topic = topicOptions[selectedSubject?.subject || ''].find((topic: any) => topic.sys_id.toString() === topicId);
        if (topic) {
            setSelectedTopic({ topic: topic.name, topicId: topic.sys_id });
        }

    };

    const handleAddSelection = () => {
        if (selectedSubject && selectedTopic && questionCount) {

            const isDuplicate = selections.some((selection) =>
                selection.subjectId === selectedSubject.subjectId &&
                selection.topicId === selectedTopic.topicId
            );
            console.log(isDuplicate);

            if (isDuplicate) {
                toast.error("This subject and topic combination has already been selected.");
                return;
            }

            setSelections((prevSelections) => [
                ...prevSelections,
                {
                    topicId: selectedTopic.topicId,
                    subjectId: selectedSubject.subjectId,
                    subject: selectedSubject.subject,
                    topic: selectedTopic.topic,
                    count: questionCount,
                },
            ]);
            setSelectedSubject(null);
            setSelectedTopic(null);
            setQuestionCount("");
        }
    };



    const handleRemoveSelection = (index: number) => {
        setSelections(selections.filter((_, i) => i !== index));
    };

    const steps = [
        {
            id: 1,
            title: "Quiz Details",
            mainIcon: Brain,
            decorativeIcons: [
                Sparkles,
                ScrollText
            ],
            description: "Create your perfect quiz"
        },
        {
            id: 2,
            title: "Subject Selection",
            mainIcon: GraduationCap,
            decorativeIcons: [
                BookOpenCheck,
                Trophy
            ],
            description: "Choose your subjects"
        },
        {
            id: 3,
            title: "Schedule",
            mainIcon: Clock,
            decorativeIcons: [
                CalendarRange,
                Star
            ],
            description: "Pick your time"
        }
    ];

    const handleKeyDown = (e: any) => {
        if (e.key === "Enter" && currentStep < steps.length) {
            e.preventDefault();
            handleNext();
        }
    };

    const handleSelectionKeyDown = (e: any) => {
        // console.log({ key: e.key, selectedSubject, selectedTopic, questionCount });
        if (e.key === "Enter" && currentStep < steps.length && selectedSubject && selectedTopic && questionCount.length > 0) {
            e.preventDefault();
            handleAddSelection();
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const validateStep = (nextStep: number) => {
        if (nextStep > currentStep && currentStep === 1) {
            if (title.length > 0) {
                return true;
            } else {
                toast.error('Please enter a title before proceeding');
                return false;
            }
        }

        if (nextStep > currentStep && currentStep === 2) {
            if (selections.length > 0) {
                return true;
            } else {
                toast.error('Please add at least one selection before proceeding');
                return false;
            }
        }
        return true;
    };

    const handleStepChange = (stepId: number) => {
        if (validateStep(stepId)) {
            setCurrentStep(stepId);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    const handleNext = () => {
        const nextStep = currentStep + 1;
        if (validateStep(nextStep)) {
            setCurrentStep(prev => Math.min(steps.length, prev + 1));
        }
    };


    return (
        <div className="flex w-full flex-col rounded-md pt-4">
            {/* Header */}
            <div className="">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl text-blue-900 flex justify-center items-center font-dm-sans font-extrabold">
                        <GraduationCap className="mr-3 h-8 w-8" />
                        Create Quiz
                    </h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-6">
                {/* Progress Steps */}
                <Card className="border-none font-dm-sans rounded-b-none">
                    <CardContent className="pt-6 pb-4">
                        <div className="relative">
                            {/* Progress Bar */}
                            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition-all duration-500 ease-in-out"
                                    style={{
                                        width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 2s infinite linear'
                                    }}
                                />
                            </div>

                            {/* Steps */}
                            <div className="relative flex justify-between max-w-3xl mx-auto">
                                {steps.map((step, index) => {
                                    const MainIcon = step.mainIcon;
                                    const [DecorIcon1, DecorIcon2] = step.decorativeIcons;
                                    const isComplete = currentStep > step.id;
                                    const isCurrent = currentStep === step.id;

                                    return (
                                        <div
                                            key={step.id}
                                            className="flex flex-col items-center relative group"
                                            onClick={() => handleStepChange(step.id)}
                                        >
                                            {/* Decorative icons */}
                                            <div className="absolute -top-3 -left-3 ">
                                                <DecorIcon1
                                                    className={`w-4 h-4 transform rotate-12 transition-opacity duration-300
                        ${isCurrent ? 'text-blue-400 opacity-100' : 'opacity-0'}
                        group-hover:opacity-100`}
                                                />
                                            </div>
                                            <div className="absolute -top-2 -right-3">
                                                <DecorIcon2
                                                    className={`w-3 h-3 transform -rotate-12 transition-opacity duration-300
                        ${isCurrent ? 'text-blue-300 opacity-100' : 'opacity-0'}
                        group-hover:opacity-100`}
                                                />
                                            </div>

                                            {/* Main step circle */}
                                            <div
                                                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 
                      transition-all duration-300 cursor-pointer shadow-lg
                      ${isComplete ? ' bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400' :
                                                        isCurrent ? 'border-blue-400 bg-white' : 'border-gray-300 bg-white'}
                      group-hover:scale-110 group-hover:border-blue-400`}
                                            >
                                                {isComplete ? (
                                                    <CheckCircle2 className="w-7 h-7 text-white animate-pulse" />
                                                ) : (
                                                    <MainIcon
                                                        className={`w-7 h-7 transition-transform duration-300
                          ${isCurrent ? 'text-blue-500 scale-110' : 'text-gray-400'}
                          group-hover:scale-110 group-hover:text-blue-500`}
                                                    />
                                                )}
                                            </div>

                                            {/* Step title and description */}
                                            <div className="mt-4 text-center">
                                                <h3 className={`font-semibold text-sm mb-1 transition-colors duration-300
                      ${isCurrent ? 'text-blue-600' :
                                                        isComplete ? 'text-gray-700' : 'text-gray-400'}`}>
                                                    {step.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 max-w-[120px] opacity-80">
                                                    {step.description}
                                                </p>
                                            </div>

                                            {/* Connection line pulse effect */}
                                            {index < steps.length - 1 && (
                                                <div
                                                    className="absolute top-7 left-[50%] w-[calc(100%-4rem)] h-0.5 bg-gray-200 -z-10">
                                                    {isCurrent && (
                                                        <div className="absolute top-0 left-0 w-full h-full">
                                                            <div
                                                                className="absolute top-0 left-0 w-1/2 h-full bg-blue-400 animate-pulse" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step Content */}
                <div className="h-[50vh font-manrope rounded-b-lg">
                    {currentStep === 1 && (
                        <Title value={title} onChange={handleTitleChange} handlekeyDown={handleKeyDown} switchValue={switchValue} setSwitchValue={setSwitchValue} />
                    )}

                    {currentStep === 2 && (
                        <SubjectSelection
                            handleAddSelection={handleAddSelection}
                            handleSubjectChange={handleSubjectChange}
                            handleTopicChange={handleTopicChange}
                            subjects={subjects}
                            setSubjects={setSubjects}
                            selectedSubject={selectedSubject}
                            selectedTopic={selectedTopic}
                            topicOptions={topicOptions}
                            setTopicOptions={setTopicOptions}
                            questionCount={questionCount}
                            setQuestionCount={setQuestionCount}
                            handleRemoveSelection={handleRemoveSelection}
                            selections={selections}
                            handlekeyDown={handleSelectionKeyDown}
                            switchValue={switchValue}
                        />
                    )}

                    {currentStep === 3 && (
                        <TimeSelection
                            duration={duration}
                            setDuration={setDuration}
                            setStartHour={setStartHour}
                            setStartMinute={setStartMinute}
                            startMinute={startMinute}
                            startHour={startHour}
                            date={date}
                            startAMPM={startAMPM}
                            setStartAMPM={setStartAMPM}
                            setDate={setDate}
                            setTotalMarks={setTotalMarks}
                            handleSubmit={handleSubmit}
                            handleCreateQuiz={handleCreateQuiz}
                            totalMarks={totalMarks}
                        />
                    )}
                    <div className="flex font-dm-sans justify-center pb-8 space-x-4">
                        <Button
                            onClick={handlePrevious}
                            variant="outline"
                            className="w-24"
                            disabled={currentStep === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="w-24 bg-blue-600 hover:bg-blue-700"
                            disabled={currentStep === steps.length}
                        >
                            Next
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GenerateQuiz;
