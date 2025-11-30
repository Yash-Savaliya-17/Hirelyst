import InputField from "@/components/Common/InputField/InputField.tsx";
import { GoPerson } from "react-icons/go";
import { useForm } from 'react-hook-form';
import { RegisterUser } from "@/services/operations/authOperations.ts";
import { toast } from "sonner";
import { useState } from "react";
import { jelly } from 'ldrs';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Common/shadcnui/button";

jelly.register();

interface RegisterFormValue {
    name: string;
    email: string;
    password: string;
}

const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValue>();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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

    
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4 w-full px-4 sm:px-8 lg:px-0">
            <div className='flex flex-col gap-y-2'>
                <div>
                    <InputField
                        svg={<GoPerson className="h-5 w-5" />}
                        className="font-primary-font"
                        type="text"
                        id="name"
                        placeholder="Enter First Name"
                        {...register('name', {
                            required: 'First Name is required',
                        })}
                    />
                    {errors.name && <p className="text-red-500 font-primary-font text-[12px]">{errors.name.message}</p>}
                </div>
                <div>
                    <InputField
                        svg={<svg xmlns="http://www.w3.org/2000/svg" width="1em" className="h-5 w-5 bg-transparent"
                            height="1em" viewBox="0 0 24 24">
                            <path fill="currentColor"
                                d="M5 5h13a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3m0 1c-.5 0-.94.17-1.28.47l7.78 5.03l7.78-5.03C18.94 6.17 18.5 6 18 6zm6.5 6.71L3.13 7.28C3.05 7.5 3 7.75 3 8v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8c0-.25-.05-.5-.13-.72z" />
                        </svg>}
                        className="font-primary-font"
                        type="email"
                        id="email"
                        placeholder="Enter email address"
                        {...register('email', {
                            required: "Email is required",
                            pattern: {
                                value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
                                message: 'Email must be in lowercase',
                            },
                        })}
                    />
                    {errors.email && <p className="text-red-500 font-primary-font text-[12px]">{errors.email.message}</p>}
                </div>
                <div>
                    <InputField
                        svg={<svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                            viewBox="0 0 32 32">
                            <path fill="currentColor"
                                d="M21 2a8.998 8.998 0 0 0-8.612 11.612L2 24v6h6l10.388-10.388A9 9 0 1 0 21 2m0 16a7 7 0 0 1-2.032-.302l-1.147-.348l-.847.847l-3.181 3.181L12.414 20L11 21.414l1.379 1.379l-1.586 1.586L9.414 23L8 24.414l1.379 1.379L7.172 28H4v-3.172l9.802-9.802l.848-.847l-.348-1.147A7 7 0 1 1 21 18" />
                            <circle cx="22" cy="10" r="2" fill="currentColor" />
                        </svg>}
                        className="font-primary-font"
                        type="password"
                        id="password"
                        placeholder="Enter Password"
                        {...register('password', { required: "password is required" })}
                    />
                    {errors.password && <p className="text-red-500 font-primary-font text-[12px]">{errors.password.message}</p>}
                </div>
            </div>
            <div className='w-full'>
                <Button
                    type="submit"
                    className='font-manrope font-bold rounded-xl  bg-gradient-to-br from-[#034078] to-[#1282A2] text-[#FEFCF8] hover:bg-[#0b3457] text-md border-[1.5px] border-gray-300 w-full h-10'
                >
                    {
                        isLoading ? (
                            <div className="w-full h-full flex items-center justify-center cursor-not-allowed">
                                <l-jelly
                                    size="30"
                                    speed="0.9"
                                    color={'#FEFCF8'}
                                ></l-jelly>
                            </div>
                        ) : "Register"
                    }
                </Button>
            </div>
        </form>
    );
}

export default Register;
