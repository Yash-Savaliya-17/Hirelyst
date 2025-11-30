import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/Common/shadcnui/button.tsx';
import { Loader2, XCircle, Lock } from 'lucide-react';
import { resetPassword, verifyResetPassLink } from '@/services/operations/authOperations.ts';
import { useForm } from 'react-hook-form';
import InputField from '@/components/Common/InputField/InputField.tsx';

interface StatusConfig {
  icon: JSX.Element;
  title: string;
  message: string;
  bgColor: string;
  borderColor: string;
}

interface ResetPassForm {
  password: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [isResetting, setIsResetting] = useState(false);

  const {
    register: registerNewPassword,
    handleSubmit: handleSubmitNewPassword,
    formState: { errors: errorsNewPassword },
  } = useForm<ResetPassForm>();

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          await verifyResetPassLink(token);
          setStatus('valid');
        } catch (error) {
          toast.error('Invalid or expired reset link');
          setStatus('invalid');
        }
      } else {
        toast.error('Invalid or missing token');
        setStatus('invalid');
      }
    };

    verifyToken();
  }, [token]);


  const handleResetPassword = async (data: ResetPassForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsResetting(true);
    try {
      toast.promise(
        resetPassword(token!, {password: data.password}),
        {
          loading: 'Resetting password...',
          success: (response) => {
            navigate('/login');
            return `${response.data.message}`;
          },
          error: (error) => {
            return `${error.message || 'An error occurred'}`;
          }
        }
      )
    } catch (error) {
      console.error("Password reset failed:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const statusConfig: Record<string, StatusConfig> = {
    loading: {
      icon: <Loader2 className="w-16 h-16 animate-spin text-blue-500" />,
      title: "Verifying Reset Link",
      message: "Please wait while we validate your reset link...",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-700",
    },
    invalid: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: "Invalid Reset Link",
      message: "The password reset link is invalid or has expired.",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-700",
    },
    valid: {
      icon: <Lock className="w-16 h-16 text-green-500" />,
      title: "Reset Your Password",
      message: "Please enter your new password below.",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-700",
    },
  };

  const { icon, title, message, bgColor, borderColor } = statusConfig[status];

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 h-[93vh]">
      <div className={`w-full max-w-md p-8 ${bgColor} rounded-lg font-primary-font shadow-lg border ${borderColor} transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col items-center space-y-4">
          {icon}
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
            {title}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            {message}
          </p>
          {status === 'valid' && (
            <form onSubmit={handleSubmitNewPassword(handleResetPassword)} className="w-full mt-4">
              <div className="mb-4">
                <InputField
                  svg={
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 32 32"
                    >
                      <path
                        fill="currentColor"
                        d="M21 2a8.998 8.998 0 0 0-8.612 11.612L2 24v6h6l10.388-10.388A9 9 0 1 0 21 2m0 16a7 7 0 0 1-2.032-.302l-1.147-.348l-.847.847l-3.181 3.181L12.414 20L11 21.414l1.379 1.379l-1.586 1.586L9.414 23L8 24.414l1.379 1.379L7.172 28H4v-3.172l9.802-9.802l.848-.847l-.348-1.147A7 7 0 1 1 21 18"
                      />
                      <circle cx="22" cy="10" r="2" fill="currentColor" />
                    </svg>
                  }
                  className="font-primary-font"
                  type="password"
                  placeholder="Enter new password"
                  {...registerNewPassword("password", { required: "Password is required" })}
                />
                {errorsNewPassword.password && (
                  <p className="text-red-600 font-primary-font text-[12px]">
                    {errorsNewPassword.password.message}
                  </p>
                )}
              </div>
              <div className="mb-6">
                <InputField
                  svg={
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 32 32"
                    >
                      <path
                        fill="currentColor"
                        d="M21 2a8.998 8.998 0 0 0-8.612 11.612L2 24v6h6l10.388-10.388A9 9 0 1 0 21 2m0 16a7 7 0 0 1-2.032-.302l-1.147-.348l-.847.847l-3.181 3.181L12.414 20L11 21.414l1.379 1.379l-1.586 1.586L9.414 23L8 24.414l1.379 1.379L7.172 28H4v-3.172l9.802-9.802l.848-.847l-.348-1.147A7 7 0 1 1 21 18"
                      />
                      <circle cx="22" cy="10" r="2" fill="currentColor" />
                    </svg>
                  }
                  className="font-primary-font"
                  type="password"
                  placeholder="Enter confirm password"
                  {...registerNewPassword("confirmPassword", { required: "Confirm password is required" })}
                />
                {errorsNewPassword.confirmPassword && (
                  <p className="text-red-600 font-primary-font text-[12px]">
                    {errorsNewPassword.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isResetting}>
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
          {status === 'invalid' && (
            <Button onClick={() => navigate('/login')} className="mt-4">
              Return to Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
