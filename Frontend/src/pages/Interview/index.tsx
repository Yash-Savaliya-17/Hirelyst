import {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '@/components/Common/shadcnui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/Common/shadcnui/select";
import {v4 as uuidv4} from 'uuid';
import {getDomains, startAnalysisApi, startInterview as startInterviewApi, submitResponse} from '@/services/operations/InterviewOperations';
import {Alert, AlertDescription, AlertTitle} from '@/components/Common/shadcnui/alert';
import {useNavigate} from "react-router-dom";
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function WebcamRecorder() {
    const navigate = useNavigate();

    const [domain, setDomain] = useState<string>('');
    const [codomain, setCodomain] = useState<string>('');
    const [level, setLevel] = useState<string>('');
    const [count, setCount] = useState<number>(2);
    const [domainsData, setDomainsData] = useState<any>();
    const [availableCodomains, setAvailableCodomains] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [interviewStatus, setInterviewStatus] = useState<'idle' | 'ongoing' | 'completed' | 'uploading'>('idle');
    const [currentQuestion, setCurrentQuestion] = useState<{
        question: string,
        answer: string,
        sys_id: string
    } | null>(null);
    const [interviewId, setInterviewId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<[]>([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        getDomains().then((response) => {
            setDomainsData(response.data.domains);
        });
    }, []);

    useEffect(() => {
        if (domain && domainsData) {
            setAvailableCodomains(domainsData[domain] || []);
        }
    }, [domain, domainsData]);

    const handleDomainChange = (value: string) => {
        setDomain(value);
        setCodomain(''); // Reset codomain when domain changes
    };

    const uploadToS3 = useCallback(async (videoBlob: Blob) => {
        const fileName = `video-${uuidv4()}.mp4`;

        try {
            console.log('🔄 Starting upload:', fileName);
            
            setUploadProgress(prev => {
                console.log(`📊 Upload progress: ${prev.current}/${prev.total}`);
                return prev;
            });

            // Upload video through Backend (bypasses Azure SAS signature issues)
            const formData = new FormData();
            formData.append('file', videoBlob, fileName);
            formData.append('fileName', fileName);

            const uploadResponse = await axios.post(
                `${API_BASE_URL}/api/s3/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true
                }
            );
            
            setUploadProgress(prev => {
                const updated = {
                    ...prev,
                    current: prev.current + 1
                };
                console.log(`✅ Upload complete: ${updated.current}/${updated.total}`);
                return updated;
            });
            
            console.log('✅ Uploaded successfully:', fileName, '→', uploadResponse.data.url);
            
            // Return the storage URL from Backend
            return uploadResponse.data.url;
        } catch (error) {
            console.error('Error uploading to storage:', error);
            setError('Failed to upload video to storage');
            return null;
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingStartTimeRef.current = Date.now();
            setError(null);
        } catch (error) {
            console.error('Error accessing webcam:', error);
            setError('Failed to access webcam');
        }
    }, []);

    const stopRecording = useCallback(async () => {
        return new Promise<string | null>((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.onstop = async () => {
                    const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const s3Url = await uploadToS3(videoBlob);
                    resolve(s3Url);
                };
            } else {
                resolve(null);
            }
            if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            setIsRecording(false);
            recordingStartTimeRef.current = null;
        });
    }, [uploadToS3]);

    const startInterview = async () => {
        if (!domain || !codomain || !level || !count) {
            setError('Please enter domain, codomain, level and count');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            console.log(`🚀 Starting interview: ${domain} / ${codomain} / ${level} / ${count} questions`);
            const response = await startInterviewApi({ domain, codomain, level, count });
            
            if (!response.data || !response.data.questions || response.data.questions.length === 0) {
                throw new Error('No questions were generated. Please try again or select different options.');
            }
            
            setInterviewId(response.data.interview.sys_id);
            setInterviewStatus('ongoing');
            const allQuestions = [...response.data.questions]; // Create a copy
            setQuestions(allQuestions);
            setUploadProgress({ current: 0, total: count });
            const firstQuestion = allQuestions[0];
            setCurrentQuestion(firstQuestion);
            console.log(`🎯 Starting interview with ${allQuestions.length} questions`);
            await startRecording();
        } catch (error: any) {
            console.error('❌ Error starting interview:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start interview. Please check if the question generation service is running.';
            setError(errorMessage);
            setCurrentQuestion({ question: `Error generating questions: ${errorMessage}`, answer: '', sys_id: '' });
        } finally {
            setIsLoading(false);
        }
    };

    const getNextQuestion = async (interviewId: number) => {
        setIsLoading(true);
        setError(null);
        if (interviewId) {
            try {
                // Find the index of current question and get next one
                const currentIndex = questions.findIndex(q => q.sys_id === currentQuestion?.sys_id);
                const nextIndex = currentIndex + 1;
                
                console.log(`📍 Current question index: ${currentIndex}, Next index: ${nextIndex}, Total: ${questions.length}`);
                
                if (nextIndex < questions.length) {
                    const nextQuestion = questions[nextIndex];
                    setCurrentQuestion(nextQuestion);
                    console.log(`➡️ Moving to question ${nextIndex + 1}/${questions.length}`);
                    await startRecording();
                } else {
                    console.log(`✅ All questions answered (${uploadProgress.current}/${uploadProgress.total} uploaded)`);
                    if (uploadProgress.current === uploadProgress.total) {
                        if (interviewId) {
                            await startAnalysisApi({ interviewId });
                            console.log('🔍 Analysis started');
                        }
                        setInterviewStatus('completed');
                    } else {
                        setInterviewStatus('uploading');
                    }
                }
            } catch (error) {
                console.error('Error getting next question:', error);
                setError('Failed to get next question');
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (interviewStatus === 'uploading' && uploadProgress.current === uploadProgress.total && interviewId) {
            startAnalysisApi({ interviewId }).then(() => {
                setInterviewStatus('completed');
                console.log('Analysis started after all uploads completed');
            });
        }
    }, [uploadProgress.current, uploadProgress.total, interviewStatus, interviewId]);

    const handleNextQuestion = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const s3Url = await stopRecording();
            if (s3Url && interviewId && currentQuestion) {
                await submitResponse({ interviewId, questionId: currentQuestion.sys_id, s3Url });
                await getNextQuestion(interviewId);
            } else {
                throw new Error('Missing required data for submission');
            }
        } catch (error) {
            console.error('Error handling next question:', error);
            setError('Failed to process and submit response');
        } finally {
            setIsLoading(false);
        }
    };

    const stopInterview = async () => {
        if (isRecording) {
            const s3Url = await stopRecording();
            if (s3Url && interviewId && currentQuestion) {
                await submitResponse({ interviewId, questionId: currentQuestion.sys_id, s3Url });
            }
        }
        setInterviewStatus('uploading');
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        if (isRecording) {
            interval = setInterval(() => {
                if (recordingStartTimeRef.current) {
                    const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                    setRecordingDuration(duration);
                }
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRecording]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusMessage = () => {
        if (interviewStatus === 'uploading') {
            return `Please wait, uploading videos (${uploadProgress.current}/${uploadProgress.total})...`;
        }
        return 'You have successfully completed the interview. The results will be analyzed soon.';
    };

    useEffect(() => {
        if (interviewStatus === 'completed') {
            const timer = setTimeout(() => {
                // navigate(`/interview/${interviewId}/report`);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [interviewStatus, navigate, interviewId]);

    return (
        <div className="flex w-full p-4 flex-col">
            <div className="mb-4">
                <div className="container mx-auto ">
                    <h1 className="text-3xl text-blue-900 flex justify-center items-center font-dm-sans font-extrabold">
                        Interview Practice
                    </h1>
                </div>
            </div>
            <div className="w-full  rounded-md shadow-md gap-x-3 flex ">
                <div className="w-[50%] p-5 rounded-lg">
                    {interviewStatus === 'idle' && (
                        <div className="space-y-4">
                            <h2 className="text-md font-manrope text-[#1c2035] font-extrabold">
                                Personalize your interview
                            </h2>
                            <div className='flex w-full font-manrope gap-x-2 items-center justify-center'>
                                <div className='space-y-1 w-[50%]'>
                                    <label className="block text-sm font-manrope font-bold">Domain</label>
                                    <Select value={domain} onValueChange={handleDomainChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select domain" />
                                        </SelectTrigger>
                                        <SelectContent className='font-manrope'>
                                            {domainsData && Object.keys(domainsData).map((d) => (
                                                <SelectItem key={d} value={d}>
                                                    {d}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-1 w-[50%]'>
                                    <label className="block text-sm font-manrope font-bold">Codomain</label>
                                    <Select value={codomain} onValueChange={setCodomain}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select codomain" />
                                        </SelectTrigger>
                                        <SelectContent className='font-manrope'>
                                            {availableCodomains.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className='flex w-full gap-x-2'>
                                <div className='space-y-1 font-manrope w-[50%]'>
                                    <label className="block text-sm font-manrope font-bold">Level</label>
                                    <Select value={level} onValueChange={setLevel}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent className='font-manrope'>
                                            {LEVELS.map((l) => (
                                                <SelectItem key={l} value={l}>
                                                    {l}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-1 w-[50%]'>
                                    <label htmlFor="count" className="block text-sm font-manrope font-bold">
                                        Count
                                    </label>
                                    <input
                                        type="number"
                                        id="count"
                                        value={count}
                                        onChange={(e) => setCount(parseInt(e.target.value))}
                                        placeholder="Enter question count"
                                        className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-5 py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={startInterview}
                                disabled={isLoading || !domain || !codomain || !level}
                                className="border-[0.5px] font-bold font-manrope p-6 w-56 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                            >
                                {isLoading ? 'Starting Interview...' : <div>Start Interview</div>}
                            </Button>
                            <div className=''>
                                <h1 className='text-md flex justify-between items-center font-manrope text-[#1c2035] font-extrabold'>
                                    Interview Practice Question
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 cursor-pointer">
                                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                                    </svg>
                                </h1>
                                <div className='w-full mt-4 h-14 border border-[#c3deff] rounded-md bg-white gap-x-2 items-center justify-center'>
                                    <p className='text-sm flex pt-4 pb-4 pl-7 pr-10 font-semibold font-manrope text-[#1c2035]'>
                                        Tell me about yourself.
                                    </p>
                                </div>
                                <p className='text-sm mt-5 flex justify-center font-bold font-manrope text-[#1c2035]'>
                                    1 additional question will be generated
                                </p>
                            </div>
                        </div>
                    )}
                    {interviewStatus === 'ongoing' && (
                        <div className="space-y-4">
                            {currentQuestion && (
                                <div className="bg-gray-200 p-4 rounded-md">
                                    <p className="text-lg font-semibold mb-2 text-gray-800">
                                        Question: {currentQuestion.question}
                                    </p>
                                </div>
                            )}
                            <Button
                                onClick={handleNextQuestion}
                                disabled={isLoading || !isRecording}
                                className="border-[0.5px] font-bold font-manrope p-6 w-56 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                            >
                                {isLoading ? 'Processing...' : 'Next Question'}
                            </Button>
                            <Button
                                onClick={stopInterview}
                                className="border-[0.5px] font-bold font-manrope p-6 w-56 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                            >
                                Stop Interview
                            </Button>
                            {isRecording && (
                                <p className="text-sm">
                                    Recording Duration: {formatDuration(recordingDuration)}
                                </p>
                            )}
                        </div>
                    )}
                    {(interviewStatus === 'completed' || interviewStatus === 'uploading') && (
                        <Alert>
                            <AlertTitle className="text-lg font-semibold">
                                {interviewStatus === 'uploading' ? 'Uploading Videos' : 'Interview Completed!'}
                            </AlertTitle>
                            <AlertDescription>
                                {getStatusMessage()}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                <div className='w-[50%] p-5 flex flex-col rounded-lg '>
                    <video
                        ref={videoRef}
                        className="w-full bg-black mb-4 rounded-md"
                        autoPlay
                        muted
                    />
                    {error && (
                        <Alert className='font-manrope mt-5'>
                            <AlertTitle className="text-lg font-semibold">Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
}

