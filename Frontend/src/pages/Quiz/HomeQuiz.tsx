import React, {useEffect, useState} from 'react';
import {Button} from "@/components/Common/shadcnui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/Common/shadcnui/card";
import {AlertCircle, Brain, Calendar, Clock, Trophy} from 'lucide-react';
import {useNavigate, useParams} from 'react-router-dom';
import {checkRegistration, getQuiz, RegisterQuiz} from '@/services/operations/QuizOperations';
import {formatDuration} from '@/components/Common/DurationFunction';
import {Alert, AlertDescription} from '@/components/Common/shadcnui/alert';
import {Dialog, DialogTrigger} from "@/components/Common/shadcnui/dialog";
import {toast} from 'sonner';
import {ConfettiButton} from "@/components/Common/magicui/confetti";
import {useSelector} from "react-redux";

interface QuizRegistrationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    quizDetails: {
        title: string;
        startsAt: Date;
        duration: number;
    }
}


export interface Quiz {
    sys_id: number;
    title: string;
    createdById: number;
    startsAt: Date;
    endsAt: Date;
    duration: number;
    rules: string[];
    createdAt: Date;
    updatedAt: Date;
    _count: {
        questions: number;
    };
}

interface RegistrationStatus {
    isRegistered: boolean;
    registrationDeadline: Date | null;
}

const HomeQuiz = () => {
    const { id } = useParams();
    const [quizData, setQuizData] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [quizStatus, setQuizStatus] = useState<'not_started' | 'live' | 'ended'>('not_started');
    const [registration, setRegistration] = useState<RegistrationStatus>({
        isRegistered: false,
        registrationDeadline: null
    });
    const user = useSelector((state: any) => state.auth.user);

    useEffect(() => {
        async function fetchQuiz() {
            try {
                setLoading(true);
                setError(null);
                const response = await getQuiz(id);
                setQuizData(response.data);

                if (response.data.startsAt && response.data.registrationDeadline) {
                    const registrationDeadline = new Date(response.data.startsAt);
                    registrationDeadline.setHours(registrationDeadline.getHours() - 1);
                    setRegistration(prev => ({
                        ...prev,
                        registrationDeadline
                    }));
                } else {
                    setRegistration(prev => ({
                        ...prev,
                        registrationDeadline: null
                    }));
                }

                if (response.data.startsAt && response.data.endsAt) {
                    updateQuizStatus(response.data);
                } else {
                    setQuizStatus('not_started');
                }

                if (!user) {
                    setRegistration(prev => ({
                        ...prev,
                        isRegistered: false
                    }))
                    return
                }
                const registrationStatus = await checkRegistration(parseInt(id as string));
                setRegistration(prev => ({
                    ...prev,
                    isRegistered: registrationStatus.data.isRegistered
                }));

            } catch (error) {
                console.error('Error fetching quiz:', error);
                setError('Failed to load quiz details. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        fetchQuiz();
    }, [id, user]);

    useEffect(() => {
        if (quizData) {
            const timer = setInterval(() => {
                updateQuizStatus(quizData);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [quizData]);

    const updateQuizStatus = (quiz: Quiz) => {
        const now = new Date().getTime();
        const startTime = new Date(quiz.startsAt).getTime();
        const endTime = new Date(quiz.endsAt).getTime();

        if (now < startTime) {
            setQuizStatus('not_started');
            updateTimeLeft(startTime - now);
        } else if (now >= startTime && now < endTime) {
            setQuizStatus('live');
            updateTimeLeft(endTime - now);
        } else {
            setQuizStatus('ended');
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
    };

    const updateTimeLeft = (difference: number) => {
        setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        });
    };

    const handleRegister = async () => {
        toast.promise(
            RegisterQuiz(id),
            {
                loading: 'Registering...',
                success: () => {
                    setRegistration(prev => ({
                        ...prev,
                        isRegistered: true
                    }))
                    setIsDialogOpen(true);
                    return "Successfully registered for the quiz!";
                },
                error: (error) => {
                    console.log(error);
                    return error.response.data.message || "Something went wrong while registering to quiz"
                }

            }
        )
    };

    const canRegister = () => {
        if (!registration.registrationDeadline) {
            return quizStatus !== 'ended';
        }
        return new Date() < registration.registrationDeadline;
    };

    const renderRegistrationStatus = () => {
        if (registration.registrationDeadline) {
            return `Registration Deadline: ${registration.registrationDeadline.toLocaleString()}`;
        }
        if (quizStatus === 'ended') {
            return 'Registration Closed';
        }
        return 'Registration is open';
    };

    const renderQuizStatus = () => {
        const StatusAlert = ({ type, message, submessage }: { type: string; message: string; submessage?: string }) => (
            <Alert
                className={`mb-4 ${type === 'success' ? 'bg-green-50' : type === 'warning' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <AlertDescription className="flex flex-col">
                    <div className="flex items-center space-x-2">
                        <Clock
                            className={`w-5 h-5 ${type === 'success' ? 'text-green-500' : type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
                        <span>{message}</span>
                    </div>
                    {submessage && (
                        <span className="ml-7 text-sm text-gray-600">{submessage}</span>
                    )}
                </AlertDescription>
            </Alert>
        );

        switch (quizStatus) {
            case 'not_started':
                return (
                    <div className="space-y-4">
                        <StatusAlert
                            type="warning"
                            message={quizData?.startsAt
                                ? `Quiz starts in ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
                                : "Quiz start time not set"}
                            submessage={renderRegistrationStatus()}
                        />
                        {canRegister() && quizData?.startsAt && (
                            <Button variant="outline" className="flex items-center text-black">
                                <Calendar className="w-4 h-4 mr-2" />
                                Add to Calendar
                            </Button>
                        )}
                    </div>
                );
            case 'live':
                return (
                    <StatusAlert
                        type="success"
                        message={`Quiz is Live! Ends in ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
                        submessage={registration.isRegistered ? 'You are registered for this quiz' : 'Registration is closed'}
                    />
                );
            case 'ended':
                return (
                    <StatusAlert
                        type="error"
                        message="Quiz has ended"
                    />
                );
        }
    };

    const navigate = useNavigate();

    const handleStartQuiz = async () => {
        navigate(`/mcq/${id}`)
    }

    const renderActionButton = () => {
        if (!id) return null;

        if (!registration.isRegistered && quizStatus !== 'ended' && canRegister()) {
            return (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <div className="relative">
                            <ConfettiButton
                                className="bg-green-500 hover:bg-green-600 w-44 text-lg text-white"
                                onClick={handleRegister}
                            >
                                Register Now
                            </ConfettiButton>
                        </div>
                    </DialogTrigger>
                </Dialog>
            );
        }

        switch (quizStatus) {
            case 'not_started':
                if (!quizData?.startsAt) {
                    return (
                        <Button className="bg-gray-500 text-white text-lg px-8 py-3" disabled>
                            Start Time Not Set
                        </Button>
                    );
                }
                return registration.isRegistered ? (
                    <Button className="bg-gray-500 text-white text-lg px-8 py-3" disabled>
                        Registered - Wait for Quiz to Start
                    </Button>
                ) : (
                    <Button className="bg-gray-500 text-white text-lg px-8 py-3" disabled>
                        Registration Closed
                    </Button>
                );
            case 'live':
                return registration.isRegistered ? (
                    <Button onClick={handleStartQuiz}
                        className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-3">
                        Start Quiz
                    </Button>
                ) : (
                    <Button className="bg-gray-500 text-white text-lg px-8 py-3" disabled>
                        Registration Required
                    </Button>
                );
            case 'ended':
                return (
                    <Button className="bg-gray-500 text-white text-lg px-8 py-3" disabled>
                        Quiz Ended
                    </Button>
                );
        }
    };

    if (loading) {
        return (
            <div className="w-full h-[87vh] flex items-center justify-center">
                <l-quantum size="45" speed="1.75" color="white"></l-quantum>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-[87vh] flex items-center justify-center">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="w-full h-[87vh] font-dm-sans  overflow-y-scroll px-4 py-8">
            <Card className="w-3/4 border border-solid mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">{quizData?.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border-t border-b border-solid p-3">
                        {renderQuizStatus()}
                    </div>

                    {registration.isRegistered && quizStatus === 'not_started' && (
                        <Alert className="bg-blue-50">
                            <AlertDescription>
                                You're registered! The quiz will automatically become available when it starts.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Quiz details section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center font-primary-font">
                            <Brain className="w-5 h-5 text-purple-500 mr-2" />
                            Quiz Details
                        </h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Date: {quizData?.createdAt ? new Date(quizData.createdAt).toLocaleDateString() : 'TBA'}</li>
                            <li>Start
                                Time: {quizData?.startsAt ? new Date(quizData.startsAt).toLocaleTimeString() : 'Not set'}</li>
                            <li>End
                                Time: {quizData?.endsAt ? new Date(quizData.endsAt).toLocaleTimeString() : 'Not set'}</li>
                            <li>Duration: {quizData?.duration ? formatDuration(quizData.duration) : 'Not set'}</li>
                            <li>Total Questions: {quizData?._count?.questions || 'Not set'}</li>
                            <li>{renderRegistrationStatus()}</li>
                        </ul>
                    </div>

                    {/* Rules section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center font-primary-font">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            Important Rules
                        </h3>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Registration closes 1 hour before the quiz starts.</li>
                            <li>Participants must be registered to join the quiz.</li>
                            <li>Use of external resources or assistance is strictly prohibited.</li>
                            <li>Each question has a time limit of 60 seconds.</li>
                            <li>Incorrect answers will result in a 5-second penalty.</li>
                        </ol>
                    </div>

                    {/* Prizes section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center font-primary-font">
                            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                            Prizes
                        </h3>
                        <ul className="space-y-2">
                            <li><strong>1st Place:</strong> $500 Amazon Gift Card + Trophy</li>
                            <li><strong>2nd Place:</strong> $250 Amazon Gift Card</li>
                            <li><strong>3rd Place:</strong> $100 Amazon Gift Card</li>
                        </ul>
                    </div>

                    <div className="flex justify-center">
                        {renderActionButton()}
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        <p>For any questions, please contact us at support@quizplatform.com</p>
                        <a href="#" className="text-blue-500 hover:underline">Frequently Asked Questions</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HomeQuiz;
