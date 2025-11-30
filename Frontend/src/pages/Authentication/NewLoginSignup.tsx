import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/Common/shadcnui/button"
import { Input } from "@/components/Common/shadcnui/input"
import { Label } from "@/components/Common/shadcnui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/Common/shadcnui/card"
import { Separator } from "@/components/Common/shadcnui/separator"
import { BrainCircuit, Eye, EyeOff, ArrowRight, Target, BookOpen, Brain } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoginUser, RegisterUser } from '@/services/operations/authOperations'
import { useDispatch } from 'react-redux'
import { addUser } from '@/slices/auth/auth.slice'

interface LoginFormValue {
    email: string;
    password: string;
}
interface RegisterFormValue {
    name: string;
    email: string;
    password: string;
}

export default function LoginSignupPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [name, setName] = useState('')
    const dispatch = useDispatch();

    const {
        register: registerLogin,
        handleSubmit: handleSubmitLogin,
        formState: { errors: errorsLogin }
    } = useForm<LoginFormValue>();

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValue>();

    const toggleForm = () => setIsLogin(!isLogin)
    const togglePasswordVisibility = () => setShowPassword(!showPassword)

    const searchParams = new URLSearchParams(window.location.search);
    const redirectUri = searchParams.get('redirect_uri');

    const onSubmit = async (data: RegisterFormValue) => {
        try {
            setIsLoading(true);
            const response = await RegisterUser(data);
            toast.success(response.data.message);
            navigate('/login' + (redirectUri && `?redirect_uri=${redirectUri}`));
            setIsLoading(false);
        } catch (error: any) {
            toast.error(error.response.data.message);
            setIsLoading(false);
            console.error("Registration failed:", error);
        }
    };

    const onSubmitLogin = async (data: LoginFormValue) => {
        try {
            setIsLoading(true);
            const response = await LoginUser(data);
            if (response && response.data) {
                toast.success(response.data.message || "Login successful");
                if (response.data.user) {
                    dispatch(addUser(response.data.user));
                }
                navigate(redirectUri ? redirectUri : "/");
            } else {
                toast.error("Login failed: No response from server");
            }
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
            toast.error(error.response?.data?.message || "Login failed. Please try again.");
            console.error("Login failed:", error);
        }
    }



    return (
        <div className="min-h-screen flex relative overflow-hidden">
            <div className="absolute inset-0 z-10 opacity-100 overflow-hidden pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        {/* Enhanced grid pattern with more precision */}
                        <pattern id="enhanced-grid" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                            <rect
                                x="0"
                                y="0"
                                width="10"
                                height="10"
                                fill="none"
                                stroke="rgba(0,0,0,0.03)"
                                strokeWidth="0.5"
                            />
                            <rect
                                x="10"
                                y="10"
                                width="10"
                                height="10"
                                fill="none"
                                stroke="rgba(0,0,0,0.03)"
                                strokeWidth="0.5"
                            />
                        </pattern>

                        {/* Refined dot pattern */}
                        <pattern id="dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                            <circle
                                cx="10"
                                cy="10"
                                r="0.4"
                                fill="rgba(0,0,0,0.04)"
                            />
                        </pattern>
                    </defs>

                    {/* Base grid rectangles with extended coverage */}
                    <rect
                        width="300%"
                        height="300%"
                        fill="url(#enhanced-grid)"
                        x="-100%"
                        y="-100%"
                    />
                    <rect
                        width="300%"
                        height="300%"
                        fill="url(#dot-pattern)"
                        x="-100%"
                        y="-100%"
                        opacity="0.4"
                    />

                    {/* Fade overlay */}
                    <rect
                        width="100%"
                        height="100%"
                        fill="url(#fade-gradient)"
                    />
                </svg>
            </div>

            {/* Left Column - Information Section */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center p-12 relative overflow-hidden">
                Background gradient that extends beyond the section
                <div className="absolute -inset-1/2 bg-gradient-to-br from-blue-600 to-purple-700 opacity-100 blur-3xl z-0"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-white z-10 space-y-6"
                >
                    <div className="flex items-center space-x-4 mb-6">
                        <BrainCircuit className="h-12 w-12 text-white" />
                        <h1 className="text-4xl font-bold">PrepArc</h1>
                    </div>
                    <h2 className="text-3xl font-semibold mb-4">
                        Elevate Your Interview Preparation
                    </h2>
                    <div className="space-y-4 text-lg">
                        <div className="flex items-center space-x-3">
                            <Target className="h-6 w-6 text-green-400" />
                            <span>AI-Powered Mock Interviews</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <BookOpen className="h-6 w-6 text-green-400" />
                            <span>Personalized Skill Assessment</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Brain className="h-6 w-6 text-green-400" />
                            <span>Real-world Interview Scenarios</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Column - Login/Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 pt-0 relative bg-gradient-to-r from-neutral-100 via-neutral-100 to-neutral-200">
                {/* Blurred background extension */}
                <div className="absolute -inset-1/2 bg-gradient-to-br from-blue-600/20 to-purple-700/20 opacity-100 blur-3xl z-0"></div>
                <Card className="w-full max-w-md z-10 bg-white shadow-xl">
                    <CardHeader className="space-y-1">
                        <motion.div
                            className="flex items-center justify-center mb-2 lg:hidden"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <BrainCircuit className="h-10 w-10 text-blue-600" />
                            <CardTitle className="text-2xl font-bold ml-2">PrepArc</CardTitle>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login-header" : "signup-header"}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.3 }}
                                className="text-center"
                            >
                                {isLogin ? (
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                                        <p className="text-sm text-gray-600">
                                            Continue your interview preparation journey
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-gray-800">Get Started</h2>
                                        <p className="text-sm text-gray-600">
                                            Create your PrepArc account and unlock AI-powered interview prep
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.form
                                key={isLogin ? "login" : "signup"}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={isLogin ? handleSubmitLogin(onSubmitLogin) : handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-2"
                                    >
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter your full name"
                                            required
                                            value={name}
                                            {...register('name', {
                                                required: 'First Name is required',
                                            })}
                                        />
                                        {errors.name && <p className="text-red-500 font-primary-font text-[12px]">{errors.name.message}</p>}
                                    </motion.div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        required
                                        value={email}
                                        {...registerLogin('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
                                                message: 'Email must be in lowercase',
                                            },
                                        })}
                                    />
                                    {errorsLogin.email &&
                                        <p className="text-red-500 font-primary-font text-[12px]">{errorsLogin.email.message}</p>
                                    }
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            placeholder="Enter your password"
                                            value={password}
                                            {...registerLogin("password", { required: "Password is required" })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={togglePasswordVisibility}
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </motion.div>
                                        </Button>
                                    </div>
                                    {errorsLogin.password && <p className="text-red-600 font-primary-font text-[12px]">{errorsLogin.password.message}</p>}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white group"
                                >
                                    {isLogin ? 'Login' : 'Sign Up'}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </motion.form>
                        </AnimatePresence>

                        <Separator className="my-4" />

                        <Button variant="outline" className="w-full">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_13183_10121)"><path d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z" fill="#3F83F8" /><path d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z" fill="#34A853" /><path d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z" fill="#FBBC04" /><path d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z" fill="#EA4335" /></g><defs><clipPath id="clip0_13183_10121"><rect width="20" height="20" fill="white" transform="translate(0.5)" /></clipPath></defs>
                            </svg>
                            Continue with Google
                        </Button>
                    </CardContent>

                    <CardFooter>
                        <p className="text-sm text-center w-full">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={toggleForm}
                                className="text-blue-600 hover:underline focus:outline-none"
                            >
                                {isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

