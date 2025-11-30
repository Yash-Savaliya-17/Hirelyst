import { useState } from 'react';
import { Link } from 'react-router-dom';
// import { toast } from 'sonner';
import { Button } from '@/components/Common/shadcnui/button.tsx';
import { Loader2, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import InputField from '@/components/Common/InputField/InputField.tsx';
import { sentResetPassLink } from '@/services/operations/authOperations.ts';
import { toast } from 'sonner';

interface StatusConfig {
    icon: JSX.Element;
    title: string;
    message: string;
    bgColor: string;
    borderColor: string;
}


interface ForgotPassForm {
    email: string;
}

const ForgotPassword = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const {
        register: registerForgotPass,
        handleSubmit: handleSubmitForgotPass,
        formState: { errors: errorsForgotPass }
    } = useForm<ForgotPassForm>();

    const handlesendResetLink = async (data: ForgotPassForm) => {
        setStatus('loading');
        try {
            await sentResetPassLink(data);
            setStatus('success');
            toast.success('Reset link sent to your email!');
        } catch (error) {
            setStatus('error');
            toast.error('Failed to send reset link');
        }
    };

    const handleTryAgain = () => {
        setStatus('idle');
    };

    const statusConfig: Record<string, StatusConfig> = {
        idle: {
            icon: <Mail className="w-16 h-16 text-blue-500" />,
            title: "Forgot your password?",
            message: "Enter your email to get a reset link",
            bgColor: "bg-transparent dark:bg-blue-900/20",
            borderColor: "border-blue-200 dark:border-blue-700",
        },
        loading: {
            icon: <Loader2 className="w-16 h-16 animate-spin text-blue-500" />,
            title: "Sending Reset Link",
            message: "Please wait while we send the reset link to your email...",
            bgColor: "bg-transparent dark:bg-blue-900/20",
            borderColor: "border-blue-200 dark:border-blue-700",
        },
        success: {
            icon: <Mail className="w-16 h-16 text-green-500" />,
            title: "Reset Link Sent",
            message: "Check your email for the password reset link",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-200 dark:border-green-700",
        },
        error: {
            icon: <Mail className="w-16 h-16 text-red-500" />,
            title: "Error",
            message: "Failed to send reset link. Please try again.",
            bgColor: "bg-red-50 dark:bg-red-900/20",
            borderColor: "border-red-200 dark:border-red-700",
        },
    };

    const { icon, title, message, borderColor } = statusConfig[status];

    return (
        <div className="flex items-center justify-center  p-4 h-screen">
            <div
                className={`w-full max-w-md p-8  rounded-xl shadow-lg border ${borderColor} transition-all duration-300 ease-in-out`}>
                <div className="flex flex-col items-center space-y-4">
                    {icon}
                    <h2 className="text-2xl font-bold font-primary-font text-center">
                        {title}
                    </h2>
                    <p className="text-center font-primary-font text-gray-600 dark:text-gray-400">
                        {message}
                    </p>
                    {(status === 'idle' || status === 'error') && (
                        <form onSubmit={handleSubmitForgotPass(handlesendResetLink)} className="w-full mt-4">
                            <div className="mb-4">
                                <InputField
                                    svg={<svg xmlns="http://www.w3.org/2000/svg" width="1em"
                                        className="h-5 w-5 "
                                        height="1em" viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                            d="M5 5h13a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3m0 1c-.5 0-.94.17-1.28.47l7.78 5.03l7.78-5.03C18.94 6.17 18.5 6 18 6zm6.5 6.71L3.13 7.28C3.05 7.5 3 7.75 3 8v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8c0-.25-.05-.5-.13-.72z" />
                                    </svg>}
                                    className="font-primary-font"
                                    type="email"
                                    placeholder="Enter email address"
                                    {...registerForgotPass("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
                                            message: 'Email must be in lowercase',
                                        },
                                    })}
                                />
                                {errorsForgotPass.email && (
                                    <p className="text-red-500 font-primary-font text-[12px]">
                                        {errorsForgotPass.email.message}
                                    </p>
                                )}
                            </div>
                            <Button type="submit" className="w-full border  rounded-xl font-primary-font">
                                {status === 'error' ? (
                                    <>
                                        <button onClick={handleTryAgain}
                                            className='font-primary-font flex items-center'>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Try Again
                                        </button>
                                    </>
                                ) : (
                                    "Reset password"
                                )}
                            </Button>
                        </form>
                    )}
                    <div className="flex items-center justify-center w-full mt-4">
                        {status !== 'loading' && (
                            <Link
                                to="/login"
                                className="flex items-center font-primary-font text-sm text-gray-600  dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword
