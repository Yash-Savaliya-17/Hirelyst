import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Rewind, RotateCw, Volume2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getAnalysis } from '@/services/operations/InterviewOperations';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Card, CardContent } from '@/components/Common/shadcnui/card';
import { Button } from '@/components/Common/shadcnui/button';
import { Input } from '@/components/Common/shadcnui/input';
import ReportSidebar from './ReportSidebar';
import { LottieAnimation } from '@/components/Common/LottieAnimation';

// MinIO/S3 Configuration
const USE_MINIO = import.meta.env.VITE_USE_MINIO === 'true';
const S3_BUCKET_NAME = USE_MINIO 
    ? import.meta.env.VITE_MINIO_BUCKET_NAME || 'preparcbucket'
    : import.meta.env.VITE_PUBLIC_S3_BUCKET_NAME;
const S3_REGION = USE_MINIO 
    ? import.meta.env.VITE_MINIO_REGION || 'us-east-1'
    : import.meta.env.VITE_PUBLIC_S3_REGION;
const S3_ACCESS_KEY_ID = USE_MINIO 
    ? import.meta.env.VITE_MINIO_ACCESS_KEY || 'minioadmin'
    : import.meta.env.VITE_PUBLIC_S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = USE_MINIO 
    ? import.meta.env.VITE_MINIO_SECRET_KEY || 'minioadmin123'
    : import.meta.env.VITE_PUBLIC_S3_SECRET_ACCESS_KEY;
const S3_ENDPOINT = USE_MINIO 
    ? import.meta.env.VITE_MINIO_ENDPOINT || 'http://localhost:9000'
    : undefined;

const SpeakingPractice = () => {
    const { id: interviewId } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [interviewData, setInterviewData] = useState<any>(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<any>(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const s3Client = useRef<S3Client | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (S3_REGION && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY) {
            const clientConfig: any = {
                region: S3_REGION,
                credentials: {
                    accessKeyId: S3_ACCESS_KEY_ID,
                    secretAccessKey: S3_SECRET_ACCESS_KEY,
                },
            };

            // Add MinIO specific configuration
            if (USE_MINIO && S3_ENDPOINT) {
                clientConfig.endpoint = S3_ENDPOINT;
                clientConfig.forcePathStyle = true;
            }

            s3Client.current = new S3Client(clientConfig);
        } else {
            setError(new Error('S3/MinIO configuration is incomplete. Please check your environment variables.'));
        }
    }, []);

    // Function to format time in MM:SS
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Function to get signed URL from S3
    const getVideoUrl = async (s3Url: string): Promise<string | null> => {
        if (!s3Url || !s3Client.current) return null;

        try {
            let key: string;
            
            if (USE_MINIO) {
                // For MinIO URLs like http://localhost:9000/bucket/path/to/file.mp4
                // Extract everything after the bucket name
                const url = new URL(s3Url);
                const pathParts = url.pathname.split('/').filter(part => part.length > 0);
                // Remove bucket name (first part) and join the rest
                key = pathParts.slice(1).join('/');
            } else {
                // For AWS S3 URLs
                key = s3Url.split('/').pop() || '';
            }

            if (!key) {
                console.error('Could not extract key from S3 URL:', s3Url);
                return null;
            }

            console.log('Extracted key:', key, 'from URL:', s3Url);

            const command = new GetObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key,
            });

            // Generate a pre-signed URL that expires in 1 hour
            const presignedUrl = await getSignedUrl(s3Client.current, command, {
                expiresIn: 3600
            });

            console.log('Generated presigned URL:', presignedUrl);
            return presignedUrl;
        } catch (error) {
            console.error('Error getting signed URL:', error);
            return null;
        }
    };


    // Update video source when selected question changes
    useEffect(() => {
        const loadVideo = async () => {
            if (QuestionData[selectedQuestion]?.s3Url) {
                console.log('Loading video for question:', selectedQuestion, 'S3 URL:', QuestionData[selectedQuestion].s3Url);
                const url = await getVideoUrl(QuestionData[selectedQuestion].s3Url);
                console.log('Got video URL:', url);
                
                if (videoRef.current && url) {
                    videoRef.current.src = url;
                    // Add event listeners for debugging
                    videoRef.current.onloadstart = () => console.log('Video load started');
                    videoRef.current.onloadeddata = () => console.log('Video data loaded');
                    videoRef.current.onerror = (e) => console.error('Video error:', e);
                    videoRef.current.oncanplay = () => console.log('Video can play');
                } else {
                    console.error('Failed to get video URL or video ref not available');
                }
            } else {
                console.log('No S3 URL available for question:', selectedQuestion);
            }
        };

        loadVideo();
    }, [selectedQuestion]);


    // Handle video controls
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };


    const handleRewind = () => {
        if (videoRef.current) {
            videoRef.current.currentTime -= 10;
        }
    };

    const handleRestart = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };


    const handleVideoProgress = (e: any) => {
        const progress = e.target.value;
        if (videoRef.current) {
            const time = (progress / 100) * duration;
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };


    const [toggleActive, setToggleActive] = useState('weakness');

    const toggleToWeaknessHandler = () => {
        setToggleActive('Weakness');
    };

    const toggleToImprovementHandler = () => {
        setToggleActive('Improvement');
    };


    useEffect(() => {
        const fetchInterviewReport = async () => {
            try {
                setLoading(true);
                const response = await getAnalysis(interviewId);
                console.log('Full analysis response:', response);
                console.log('Response data:', response.data);
                setInterviewData(response.data[0]);
                setSelectedAnalysis(response.data[0].questions[0].interviewAnswerAnalysis[0]);
                
                // Log all questions and their S3 URLs
                if (response.data[0]?.questions) {
                    console.log('Questions found:', response.data[0].questions.length);
                    response.data[0].questions.forEach((q: any, index: number) => {
                        console.log(`Question ${index + 1}:`, {
                            question: q.question,
                            s3Url: q.s3Url,
                            userAnswer: q.user_answer,
                            hasAnalysis: !!q.interviewAnswerAnalysis?.[0]
                        });
                    });
                }
            } catch (err) {
                console.error('Error fetching interview report:', err);
                setError(err instanceof Error ? err : new Error('An unknown error occurred'));
            } finally {
                setLoading(false);
            }
        };

        if (interviewId) {
            fetchInterviewReport()
        } else {
            setError(new Error('Interview ID not provided'));
        }
    }, [interviewId]);


    const QuestionData = interviewData?.questions?.map((q: any) => ({
        question: q.question,
        response: q.user_answer || "",
        correctAnswer: q.answer || "",
        interviewAnswerAnalysis: q.interviewAnswerAnalysis || [],
        s3Url: q.s3Url
    })) || [];

    const handleQuestionClick = (idx: number) => {
        setSelectedQuestion(idx);
        if (QuestionData[idx].interviewAnswerAnalysis && QuestionData[idx].interviewAnswerAnalysis.length > 0) {
            setSelectedAnalysis(QuestionData[idx].interviewAnswerAnalysis[0]);
        }
    };

    if (loading) return <div><LottieAnimation /></div>;
    if (error) return <div>Error: {error.message}</div>;


    return (
        <div className="flex gap-x-3 h-[87vh] font-manrope bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-4">
            {/* Left Content - Fixed 65% width */}
            <div className="w-[65%] h-full">
                <Card className="h-full">
                    <CardContent className="h-full p-0">
                        <div className="h-full overflow-y-scroll">
                            <div className="p-6 flex flex-col">
                                {/* Video Player - Fixed */}
                                <div className="w-full h-[50vh] mb-6 rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onError={(e) => {
                                            console.error('Video error event:', e);
                                            const video = e.target as HTMLVideoElement;
                                            console.error('Video error code:', video.error?.code);
                                            console.error('Video error message:', video.error?.message);
                                            console.error('Video src:', video.src);
                                        }}
                                        onLoadStart={() => console.log('Video load started')}
                                        onLoadedData={() => console.log('Video data loaded')}
                                        onCanPlay={() => console.log('Video can play')}
                                        onAbort={() => console.log('Video load aborted')}
                                        controls={false}
                                        preload="metadata"
                                        style={{ backgroundColor: '#1f2937' }}
                                        crossOrigin="anonymous"
                                    />
                                </div>

                                {/* Controls */}
                                <Card className="mb-6">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center space-x-4">
                                            <Button variant="ghost" size="icon" onClick={handleRewind}>
                                                <Rewind className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="icon"
                                                className="rounded-full"
                                                onClick={togglePlay}
                                            >
                                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={handleRestart}>
                                                <RotateCw className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon">
                                                <Volume2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="font-mono text-sm">{formatTime(currentTime)}</span>
                                            <span className="text-gray-400">/</span>
                                            <span className="font-mono text-sm">{formatTime(duration)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Feedback Input */}
                                {/* <div className="mb-6">
                                    <Input
                                        placeholder="Hit enter to leave feedback"
                                        className="w-full"
                                    />
                                </div> */}

                                {/* Questions List */}
                                <div className="space-y-4">
                                    {QuestionData.map((item: any, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 100,
                                                damping: 10,
                                                delay: idx * 0.1,
                                            }}
                                        >
                                            <Card
                                                className={`transition-all duration-300 hover:shadow-md cursor-pointer
                                                    ${selectedQuestion === idx ? 'border-blue-500 bg-blue-50/50' : ''}
                                                `}
                                                onClick={() => handleQuestionClick(idx)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col items-center space-x-4">
                                                        <div className='flex items-center gap-x-3'>
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                                            ${selectedQuestion === idx
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-blue-100 text-blue-600'}`}
                                                            >
                                                                Q{idx + 1}
                                                            </div>
                                                            <h3 className="font-semibold mb-2">{item.question}</h3>
                                                        </div>
                                                        <div className="flex-1">
                                                            {item.response && (
                                                                <div className="pl-4 border-l-2 border-gray-200">
                                                                    <h4 className="font-semibold mb-2">User Response:</h4>
                                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                                        {item.response}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            {item.correctAnswer && (
                                                                <div className="pl-4 border-l-2 border-gray-200">
                                                                    <h4 className="font-semibold mb-2">Correct Answer:</h4>
                                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                                        {item.correctAnswer}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Content - Fixed 35% width */}
            <div className="w-[35%] h-full">
                <ReportSidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    toggleActive={toggleActive}
                    toggleToWeaknessHandler={toggleToWeaknessHandler}
                    toggleToImprovementHandler={toggleToImprovementHandler}
                    selectedAnalysis={selectedAnalysis}
                />
            </div>
        </div>
    );
};

export default SpeakingPractice;
