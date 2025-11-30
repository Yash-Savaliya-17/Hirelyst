import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { VerifyEmail as VerifyEmailAPI } from '@/services/operations/authOperations.ts';

interface StatusConfig {
    icon: JSX.Element;
    title: string;
    message: string;
    bgColor: string;
    borderColor: string;
}

const VerifyEmail = () => {
    const [status, setStatus] = useState('loading');
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        VerifyEmailAPI(token)
            .then(() => {
                setStatus('success');
                // navigate('/profile');
            })
            .catch(() => {
                setStatus('error');
            });
    }, [token, navigate]);

    const statusConfig: Record<string, StatusConfig> = {
        loading: {
            icon: <Loader2 className="w-16 h-16 animate-spin text-blue-500" />,
            title: "Verifying Your Email",
            message: "Please wait while we validate your email address...",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            borderColor: "border-blue-200 dark:border-blue-700",
        },
        success: {
            icon: <CheckCircle className="w-16 h-16 text-green-500" />,
            title: "Email Verified Successfully!",
            message: "Your email has been verified. Redirecting you to your profile...",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-200 dark:border-green-700",
        },
        error: {
            icon: <XCircle className="w-16 h-16 text-red-500" />,
            title: "Verification Failed",
            message: "We couldn't verify your email. Please try again or contact support.",
            bgColor: "bg-red-50 dark:bg-red-900/20",
            borderColor: "border-red-200 dark:border-red-700",
        },
    };

    const { icon, title, message, bgColor, borderColor } = statusConfig[status];

    return (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900" style={{ height: '93vh' }}>
            <div className={`m-3 w-full max-w-md p-8 ${bgColor} rounded-lg shadow-lg border ${borderColor} transition-all duration-300 ease-in-out`}>
                <div className="flex flex-col items-center space-y-4">
                    {icon}
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
                        {title}
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail
