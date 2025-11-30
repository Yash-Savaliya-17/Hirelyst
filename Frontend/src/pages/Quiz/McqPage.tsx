import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { addQuestions, resetQuizState } from '@/slices/Mcq/Mcq.slice';
import { startQuiz } from '@/services/operations/QuizOperations';
import { toast } from 'sonner';
import MCQComponent from "@/components/QuizComponents/MCQComponent.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/Common/shadcnui/alert-dialog';

interface ErrorComponentProps {
    error: {
        message: string;
        code?: number;
    };
    onRetry: () => void;
    onExit: () => void;
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({ error, onRetry, onExit }) => {
    return (
        <AlertDialog defaultOpen>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">Quiz Error</AlertDialogTitle>
                    <AlertDialogDescription>
                        {error.message || 'An unexpected error occurred'}
                        {error.code && ` (Error Code: ${error.code})`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onExit}>Go back</AlertDialogCancel>
                    <AlertDialogAction onClick={onRetry}>Retry</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const SecurityWarningDialog: React.FC<{ isOpen: boolean; onConfirm: () => void }> = ({ isOpen, onConfirm }) => {
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent className='font-manrope'>
                <AlertDialogHeader>
                    <AlertDialogTitle className='text-red-600'>Warning: Full Screen Required</AlertDialogTitle>
                    <AlertDialogDescription>
                        This quiz requires full screen mode. Please return to full screen to continue.
                        Attempting to exit full screen multiple times may result in quiz termination.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onConfirm}>Return to Full Screen</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const McqPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [error, setError] = useState<ErrorState | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [showSecurityWarning, setShowSecurityWarning] = useState(false);
    const [fullScreenExitAttempts, setFullScreenExitAttempts] = useState(0);
    const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
    const [tabSwitchAttempts, setTabSwitchAttempts] = useState(0);
    const MAX_FULLSCREEN_EXIT_ATTEMPTS = 3;
    const MAX_TAB_SWITCH_ATTEMPTS = 0;
    const TAB_SWITCH_THRESHOLD = 500;

    const enterFullScreen = async () => {
        const elem = document.documentElement;
        try {
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if ((elem as any).webkitRequestFullscreen) {
                await (elem as any).webkitRequestFullscreen();
            } else if ((elem as any).msRequestFullscreen) {
                await (elem as any).msRequestFullscreen();
            }
        } catch (error) {
            console.error('Failed to enter full screen:', error);
            toast.error('Failed to enter full screen mode. Please try again.');
        }
    };

    const terminateQuiz = useCallback((reason: string) => {
        toast.error(reason);
        setError({ message: reason });
        navigate(-1);
    }, [navigate]);

    const handleFullScreenChange = useCallback(() => {
        if (!document.fullscreenElement) {
            setFullScreenExitAttempts(prev => {
                const newAttempts = prev + 1;
                if (newAttempts >= MAX_FULLSCREEN_EXIT_ATTEMPTS) {
                    terminateQuiz('Maximum full screen exit attempts reached. Quiz terminated.');
                    return newAttempts;
                }
                setShowSecurityWarning(true);
                return newAttempts;
            });
        }
    }, [terminateQuiz]);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            setTabSwitchAttempts(prev => {
                const newAttempts = prev + 1;
                if (newAttempts >= MAX_TAB_SWITCH_ATTEMPTS) {
                    terminateQuiz('Quiz terminated due to multiple tab switching attempts');
                    return newAttempts;
                }
                toast.warning(`Warning: Tab switching detected. Attempt ${newAttempts}/${MAX_TAB_SWITCH_ATTEMPTS}`);
                return newAttempts;
            });
        }
    }, [terminateQuiz]);

    const handleWindowBlur = useCallback(() => {
        setLastActiveTime(Date.now());
    }, []);

    const handleWindowFocus = useCallback(() => {
        const timeDiff = Date.now() - lastActiveTime;
        if (timeDiff > TAB_SWITCH_THRESHOLD) {
            setTabSwitchAttempts(prev => {
                const newAttempts = prev + 1;
                if (newAttempts >= MAX_TAB_SWITCH_ATTEMPTS) {
                    terminateQuiz('Quiz terminated due to multiple tab switching attempts');
                    return newAttempts;
                }
                toast.warning(`Warning: Window switching detected. Attempt ${newAttempts}/${MAX_TAB_SWITCH_ATTEMPTS}`);
                return newAttempts;
            });
        }
    }, [lastActiveTime, terminateQuiz]);

    const preventDefaultActions = useCallback((e: Event) => {
        e.preventDefault();
        return false;
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (
            e.key === 'Tab' ||
            (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'p')) ||
            (e.altKey && e.key === 'Tab') ||
            (e.altKey && e.key === 'F4') ||
            (e.ctrlKey && e.key === 'w') ||
            (e.ctrlKey && e.key === 'n') ||
            (e.ctrlKey && e.key === 't') ||
            (e.key === 'Backspace' && e.ctrlKey) ||  // Disable Ctrl+Backspace
            (e.key === 'ArrowLeft' && e.altKey) ||   // Disable Alt+Left Arrow (Back)
            (e.key === 'ArrowRight' && e.altKey)     // Disable Alt+Right Arrow (Forward)
        ) {
            e.preventDefault();
            toast.warning('This action is not allowed during the quiz');
        }
    }, []);

    const handlePopState = useCallback((e: PopStateEvent) => {
        e.preventDefault();
        toast.warning('Navigation is not allowed during the quiz');

        // Push back to the current state to prevent actual navigation
        window.history.pushState(null, '', window.location.href);
    }, []);

    const handleMouseLeave = useCallback((e: MouseEvent) => {
        if (e.clientY <= 0 || e.clientX <= 0 ||
            e.clientX >= window.innerWidth ||
            e.clientY >= window.innerHeight) {
            setTabSwitchAttempts(prev => {
                const newAttempts = prev + 1;
                if (newAttempts >= MAX_TAB_SWITCH_ATTEMPTS) {
                    terminateQuiz('Quiz terminated due to suspicious mouse movement');
                    return newAttempts;
                }
                toast.warning(`Warning: Mouse left window. Attempt ${newAttempts}/${MAX_TAB_SWITCH_ATTEMPTS}`);
                return newAttempts;
            });
        }
    }, [terminateQuiz]);

    const initializeQuiz = async () => {
        if (!id) {
            setError({ message: 'Invalid Quiz ID' });
            return;
        }

        try {
            const response = await startQuiz(parseInt(id));

            const title = response.data.title;
            const quizId = response.data.sys_id;
            const questions = response.data.questions?.map((item: any) => ({
                sys_id: item.sys_id,
                question: item.question,
                options: item.options?.map((opt: any) => ({
                    sys_id: opt.sys_id,
                    option: opt.option,
                })) || [],
                questionId: item.questionId,
            })) || [];

            dispatch(addQuestions({
                id: quizId,
                title,
                questions,
                startsAt: response.data.startsAt,
                endsAt: response.data.endsAt
            }));

            setIsInitializing(false);
            toast.success('Quiz Initialized Successfully');
            await enterFullScreen();
        } catch (err: any) {
            console.error('Quiz Initialization Error:', err);
            setError({
                message: err.response?.data?.message || 'Failed to start quiz',
                code: err.response?.status
            });
            toast.error('Failed to start quiz');
        }
    };

    const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
        setShowSecurityWarning(true);
        e.preventDefault();
        e.returnValue = '';
    }, []);

    useEffect(() => {
        if (performance.navigation.type === 1) {
            setShowSecurityWarning(true);
        }
        
        dispatch(resetQuizState());

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', preventDefaultActions);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', preventDefaultActions);
        document.addEventListener('paste', preventDefaultActions);
        document.addEventListener('cut', preventDefaultActions);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('mouseleave', handleMouseLeave);

        const originalTitle = document.title;

        const titleInterval = setInterval(() => {
            if (document.title !== originalTitle) {
                setTabSwitchAttempts(prev => {
                    const newAttempts = prev + 1;
                    if (newAttempts >= MAX_TAB_SWITCH_ATTEMPTS) {
                        terminateQuiz('Quiz terminated due to tab title modification');
                        return newAttempts;
                    }
                    toast.warning(`Warning: Tab modification detected. Attempt ${newAttempts}/${MAX_TAB_SWITCH_ATTEMPTS}`);
                    return newAttempts;
                });
            }
        }, 1000);

        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        initializeQuiz();

        return () => {
            // Cleanup
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', preventDefaultActions);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', preventDefaultActions);
            document.removeEventListener('paste', preventDefaultActions);
            document.removeEventListener('cut', preventDefaultActions);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearInterval(titleInterval);

            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';

            if (document.exitFullscreen) {
                document.exitFullscreen().catch(console.error);
            }
        };
    }, [
        id,
        dispatch,
        handleFullScreenChange,
        handleVisibilityChange,
        handleKeyDown,
        preventDefaultActions,
        handleWindowBlur,
        handleWindowFocus,
        handleMouseLeave,
        handlePopState,
        terminateQuiz,
        handleBeforeUnload
    ]);

    const handleRetry = () => {
        setError(null);
        setIsInitializing(true);
        setTabSwitchAttempts(0);
        setFullScreenExitAttempts(0);
        initializeQuiz();
    };

    const handleExit = () => {
        navigate(-1);
    };

    const handleSecurityWarningConfirm = () => {
        setShowSecurityWarning(false);
        enterFullScreen();
    };

    if (error) {
        return <ErrorComponent error={error} onRetry={handleRetry} onExit={handleExit} />;
    }

    return (
        <>
            {showSecurityWarning && (
                <SecurityWarningDialog
                    isOpen={showSecurityWarning}
                    onConfirm={handleSecurityWarningConfirm}
                />
            )}
            {isInitializing ? (
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <div className="text-center">
                        <div className="spinner animate-spin text-4xl">🔄</div>
                        <p className="mt-4 text-gray-600">Initializing Quiz...</p>
                    </div>
                </div>
            ) : (
                <MCQComponent />
            )}
        </>
    );
};

export default McqPage;

interface ErrorState {
    message: string;
    code?: number;
}