import InputField from "@/components/Common/InputField/InputField.tsx";
import { LoginUser } from "@/services/operations/authOperations.ts";
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { jelly } from 'ldrs';
import { useState } from "react";
import { addUser } from "@/slices/auth/auth.slice.ts";
import { useDispatch } from "react-redux";
import { MailIcon } from "lucide-react";
import { Button } from "@/components/Common/shadcnui/button";
jelly.register();


interface LoginFormValue {
    email: string;
    password: string;
}


const Login = () => {
    const {
        register: registerLogin,
        handleSubmit: handleSubmitLogin,
        formState: { errors: errorsLogin }
    } = useForm<LoginFormValue>();
    

    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUri = searchParams.get('redirect_uri');


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
        <form onSubmit={handleSubmitLogin(onSubmitLogin)} className="flex flex-col gap-y-4 w-full px-4 sm:px-8 lg:px-0">
            <div className='flex flex-col gap-y-2'>
                <div>
                    <InputField
                        svg={<MailIcon className="h-5 w-5" />}
                        className="font-primary-font text-black"
                        type="email"
                        id="email"
                        placeholder="Enter email address"
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
                <div>
                    <InputField
                        svg={<svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                            viewBox="0 0 32 32">
                            <path fill="currentColor"
                                d="M21 2a8.998 8.998 0 0 0-8.612 11.612L2 24v6h6l10.388-10.388A9 9 0 1 0 21 2m0 16a7 7 0 0 1-2.032-.302l-1.147-.348l-.847.847l-3.181 3.181L12.414 20L11 21.414l1.379 1.379l-1.586 1.586L9.414 23L8 24.414l1.379 1.379L7.172 28H4v-3.172l9.802-9.802l.848-.847l-.348-1.147A7 7 0 1 1 21 18" />
                            <circle cx="22" cy="10" r="2" fill="currentColor" />
                        </svg>}
                        id="password"
                        className="font-primary-font"
                        type="password"
                        placeholder="Enter Password"
                        {...registerLogin("password", { required: "Password is required" })}
                    />
                    <div className="flex flex-row w-full">
                        <div className="w-[64%]">
                            {errorsLogin.password && <p className="text-red-600 font-primary-font text-[12px]">{errorsLogin.password.message}</p>}
                        </div>
                        <div className="flex justify-end w-[40%]">
                            <Link to="/forgot-password" className="text-[13px] font-primary-font text-gray-400">Forgot Password?</Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className='w-full'>
                <Button
                    type="submit"
                    className='font-manrope font-bold  bg-gradient-to-br from-[#034078] to-[#1282A2] text-[#FEFCF8] hover:bg-[#0b3457] rounded-xl text-md border-[1.5px] border-gray-300  w-full h-10'
                >
                    {isLoading ? (
                        <div className="w-full  h-full flex items-center justify-center cursor-not-allowed">
                            <l-jelly size="30" speed="0.9" color={"#FEFCF8"}></l-jelly>
                        </div>
                    ) : "Login"}
                </Button>
            </div>
        </form>
    );
}

export default Login;
