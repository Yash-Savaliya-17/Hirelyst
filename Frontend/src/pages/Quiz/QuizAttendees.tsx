import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/Common/shadcnui/card';
import {Button} from '@/components/Common/shadcnui/button';
import {Input} from '@/components/Common/shadcnui/input';
import {Label} from '@/components/Common/shadcnui/label';
import {Clock, GraduationCap, Plus, Timer, Trophy, User, Users, X} from 'lucide-react';
import {useParams} from "react-router-dom";
import {getAttendees, getQuiz, sendQuizInvite} from "@/services/operations/QuizOperations.ts";
import {toast} from "sonner";

const QuizDashboard = () => {
    const [attendees, setAttendees] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [addEmails, setAddEmails] = useState<string[]>([]);
    const [quizData, setQuizData] = useState<any>();
    const [isSendingInvite, setIsSendingInvite] = useState(false);

    const addEmailsToArray = (emails: string[]) => {
        const validEmails = emails
            .map(e => e.trim())
            .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !addEmails.includes(e));

        if (validEmails.length > 0) {
            setAddEmails(prevEmails => [...prevEmails, ...validEmails]);
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

    const handleRemoveEmail = (index: number) => {
        setAddEmails(addEmails.filter((_, i) => i !== index));
    };

    const handleSendInvites = async () => {
        if (addEmails.length === 0) {
            toast.error("Please add at least one email address.");
            return;
        }

        setIsSendingInvite(true);
        try {
            if (quizData?.sys_id) {
                await sendQuizInvite(quizData.sys_id, addEmails);
            }
            toast.success("Quiz invitation sent successfully!");
            setAddEmails([]);
        } catch (error) {
            console.error('Error sending quiz invite:', error);
            toast.error("Failed to send quiz invitation. Please try again.");
        } finally {
            setIsSendingInvite(false);
        }
    };

    const {id} = useParams<{ id: string }>();
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [attendeesRes, quizRes] = await Promise.all([
                    getAttendees(id),
                    getQuiz(id),
                ]);
                setAttendees(attendeesRes.data);
                setQuizData(quizRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const QuizDataSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"/>
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20"/>
                        <div className="h-4 bg-gray-200 rounded w-24"/>
                    </div>
                </div>
            ))}
        </div>
    );

    const AttendeeSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"/>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"/>
                            <div className="h-3 bg-gray-200 rounded w-48"/>
                        </div>
                    </div>
                    <div className="w-24 h-6 bg-gray-200 rounded-full"/>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6 max-w-6xl pt-24 font-manrope mx-auto space-y-6">
            {/* Quiz Information */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Trophy className="text-yellow-500"/>
                        Quiz Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <QuizDataSkeleton/>
                    ) : (
                        quizData &&
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg">
                                <GraduationCap className="text-blue-600"/>
                                <div>
                                    <p className="text-sm text-gray-600">Quiz Title</p>
                                    <p className="font-semibold">{quizData.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
                                <Timer className="text-green-600"/>
                                <div>
                                    <p className="text-sm text-gray-600">Duration</p>
                                    <p className="font-semibold">{quizData.duration / 60000} minutes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-lg">
                                <Clock className="text-purple-600"/>
                                <div>
                                    <p className="text-sm text-gray-600">Questions</p>
                                    <p className="font-semibold">{quizData._count.questions}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-lg">
                                <Trophy className="text-orange-600"/>
                                <div>
                                    <p className="text-sm text-gray-600">Passing Score</p>
                                    <p className="font-semibold">{quizData.passingScore}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add New Attendee */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Plus className="text-green-500"/>
                        Add Attendees
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Addresses</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onPaste={handlePaste}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter or paste email addresses"
                                className="w-full"
                            />
                            <p className="text-sm text-gray-500">Press Enter or paste multiple emails</p>
                        </div>

                        {addEmails.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {addEmails.map((email, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full"
                                        >
                                            <span className="text-sm text-blue-700">{email}</span>
                                            <button
                                                onClick={() => handleRemoveEmail(index)}
                                                className="text-blue-700 hover:text-blue-900"
                                            >
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            className="mt-4 bg-green-500 hover:bg-green-600"
                            onClick={handleSendInvites}
                            disabled={isSendingInvite || addEmails.length === 0}
                        >
                            {isSendingInvite ? 'Sending...' : 'Send Invites'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Attendees List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-blue-500"/>
                        Current Attendees
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <AttendeeSkeleton/>
                    ) : (
                        <div className="space-y-4">
                            {attendees && attendees.map((attendee: any, index: any) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <User className="text-blue-600"/>
                                        </div>
                                        <div>
                                            {attendee.user &&
                                                <p className="font-semibold">{attendee.user?.name}</p>
                                            }
                                            <p className="text-sm text-gray-600">{attendee.email}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium
                                    ${attendee.attended ? 'bg-green-100 text-green-800' :
                                        attendee.registered === 'Registered' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'}`}>
                                        {attendee.attended ?
                                            'Attempted' :
                                            attendee.registered === 'Registered' ?
                                                'Registered' :
                                                'Not Registered'
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default QuizDashboard;
