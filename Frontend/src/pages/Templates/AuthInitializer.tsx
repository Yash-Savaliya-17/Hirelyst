import { useEffect, useState } from 'react'
import { useDispatch } from "react-redux";
import { LoginWithMe } from "@/services/operations/authOperations.ts";
import { addUser } from "@/slices/auth/auth.slice.ts";
import { LottieAnimation } from "@/components/Common/LottieAnimation.tsx";
import Loading from "@/assets/json/loading.json";

const AuthInitializer = ({ children }: any) => {
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const user = await LoginWithMe();
                dispatch(addUser(user.data));
                setLoading(false);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, [])

    if (loading) {
        return (
            <div className='w-full h-[100vh] flex justify-center items-center'>
                <LottieAnimation />
            </div>
        )
    }

    return (
        <div>{children}</div>
    )
}
export default AuthInitializer
