import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import robo from "../../assets/json/robo.json";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { Button } from "@/components/Common/shadcnui/button";
import logo from "../../assets/logo.png";
import { BrainCircuit, LucideRocket, LucideTarget, LucideUsers } from "lucide-react";

const AuthTemplate = () => {
    const location = useLocation();
    const isLoginActive = location.pathname.toLowerCase() === "/login";

    const [toggleActive, setToggleActive] = useState(isLoginActive ? 'login' : 'register');

    const toggleToRegisterHandler = () => setToggleActive('register');
    const toggleToLoginHandler = () => setToggleActive('login');

    const handleContinueWithGoogle = async () => {
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const redirectUri = searchParams.get('redirect_uri') || '/';

            // Use a simple string instead of JSON
            const URI = import.meta.env.VITE_BACKEND_URL + '/api/auth/google-redirect'
            const state = JSON.stringify({
                redirectUri: URI,
                from: redirectUri
            });

            window.location.href = window.location.href = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?response_type=code&redirect_uri=${URI}&scope=email%20profile&state=${encodeURIComponent(state)}&client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}`

            // window.location.href = ${import.meta.env.VITE_BACKEND_URL}/api/auth/google?state=${encodeURIComponent(redirectUri)};
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "An error occurred");
        }
    };
    const FeatureCard = ({ icon: Icon, title }: { icon: any; title: string }) => (
        <div className="flex items-center gap-x-3 text-white mb-3 p-2 rounded-lg">
            <Icon className="text-green-400" size={24} />
            <p className="text-lg font-medium">{title}</p>
        </div>
    );

    return (
        <>
            <div className="min-h-screen font-manrope bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-8">
                <div className="w-full h-[75vh] lg:h-[90vh] max-w-4xl bg-white flex shadow-2xl rounded-xl lg:rounded-3xl overflow-hidden">
                    {/* Left Side - Feature Section */}
                    <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#034078] to-[#1282A2] flex-col gap-y-6 items-center justify-center p-10">
                        <h1 className="text-4xl flex items-center gap-x-2 font-extrabold text-white mb-4 text-center">
                            <BrainCircuit className="text-green-400" size={40} />
                            {import.meta.env.VITE_SITE_NAME}
                        </h1>
                        <p className="text-gray-300 text-center text-lg mb-6">
                            Your Arc to Career Excellence
                        </p>

                        <div className="w-full">
                            <FeatureCard icon={LucideTarget} title="Personalized Career Insights" />
                            <FeatureCard icon={LucideUsers} title="Professional Networking" />
                            <FeatureCard icon={LucideRocket} title="Career Growth Accelerator" />
                        </div>
                    </div>

                    {/* Right Side - Authentication Section */}
                    <div className="flex lg:w-[50%] w-full flex-col items-center justify-center">
                        <div className="lg:w-[90%] w-full mx-auto">
                            {toggleActive === 'register' ? (
                                <>
                                    <h1 className="text-3xl flex flex-col font-bold text-[#0b3457] mb-2 justify-center items-center text-center">
                                        <img src={logo} alt="" className='w-36  sm:hidden' />
                                        <span className="">Get Started</span>
                                    </h1>
                                    <p className="text-gray-600 text-center text-[12px] ">Create your PrepArc account and unlock</p>
                                    <p className="text-gray-600 text-center text-[12px] mb-2"> AI-powered interview preparations</p>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-3xl flex flex-col font-bold text-[#0b3457] mb-2 justify-center items-center text-center">
                                        <img src={logo} alt="" className='w-36 sm:hidden' />
                                        <span>Welcome Back!</span>
                                    </h1>
                                    <p className="text-gray-600 text-center text-sm mb-2">Continue your interview preparation journey</p>
                                </>
                            )}


                            {/* Toggle Switch - Original Sliding Animation */}
                            <div className="w-full flex flex-col items-center mb-6">
                                <div className="w-[93%] lg:w-[80%] flex flex-col gap-y-4">
                                    <div className="bg-white p-1 rounded-xl h-12 font-semibold font-primary-font relative shadow-md">
                                        <motion.div
                                            className={`h-full w-1/2 -z-10 bg-gradient-to-br from-[#034078] to-[#1282A2] text-[#FEFCF8] rounded-xl`}
                                            initial={{ x: '0%' }}
                                            animate={{ x: toggleActive === 'register' ? '100%' : '0%' }}
                                            transition={{ duration: 0.2 }}
                                        />
                                        <div className="absolute text-sm font-manrope font-bold w-full z-10 h-full top-0 left-0 flex">
                                            <Link to="/login" className="w-1/2">
                                                <button
                                                    type="button"
                                                    onClick={toggleToLoginHandler}
                                                    className={`w-full rounded-xl h-full transition-colors duration-200 ${toggleActive !== 'register' ? 'text-white' : 'text-[#0b3457]'}`}
                                                >
                                                    Sign In
                                                </button>
                                            </Link>
                                            <Link to="/register" className="w-1/2">
                                                <button
                                                    type="button"
                                                    onClick={toggleToRegisterHandler}
                                                    className={`w-full rounded-xl h-full transition-colors duration-200 ${toggleActive === 'register' ? 'text-white' : 'text-[#0b3457]'}`}
                                                >
                                                    Sign Up
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Authentication Outlet */}
                            <div className="w-full lg:w-[80%] mx-auto mb-3">
                                <Outlet />
                            </div>

                            {/* Divider */}
                            <div className="flex justify-center w-full my-2 space-x-3">
                                <div className="w-[80%] gap-x-2 flex items-center justify-center">
                                    <div className="flex-grow h-[1px] bg-gradient-to-r from-[#0b3457]/10 to-[#0b3457]/50"></div>
                                    <p className="text-sm text-gray-600 font-medium">OR</p>
                                    <div className="flex-grow h-[1px] bg-gradient-to-l from-[#0b3457]/10 to-[#0b3457]/50"></div>
                                </div>
                            </div>

                            {/* Google Sign In */}
                            <div className="w-[93%] lg:w-[80%] mx-auto">
                                <Button
                                    className="flex items-center font-primary-font justify-center w-full h-10 text-black border-[#0b3457] bg-gray-200 hover:bg-gray-200 hover:shadow-md rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0b3457]/50"
                                    onClick={handleContinueWithGoogle}
                                >
                                    <FcGoogle className="mr-2" size={24} />
                                    <span className="text-md font-medium">Continue with Google</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default AuthTemplate;