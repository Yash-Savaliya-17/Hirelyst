import { jwtDecode } from "jwt-decode";
import { useEffect, useState, useCallback, } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUser, UserDataType } from '@/slices/auth/auth.slice.ts'
import { LottieAnimation } from "../Common/LottieAnimation";
import Loading from '@/assets/json/loading.json'

const AuthLayout = (authentication: boolean, children: any) => {

    const authStatus = authentication ? authentication : false;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);

    const getCookie = (name: string): string | null => {
        const cookieString = document.cookie;
        const cookies = cookieString.split("; ");

        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    };

    const tokenAuth = useCallback(() => {
        const data = decodedData();
        if (data) {
            dispatch(addUser(data));
        }
    }, []);

    const decodedData = () => {
        const token = getCookie("interview_auth_token");
        if (token !== null) {
            const data = jwtDecode<UserDataType>(token);
            return data;
        }
    }


    useEffect(() => {
        if (getCookie("erp_auth_token")) {
            tokenAuth();
        } else {
            if (authentication && !authStatus) {
                navigate("/login");
            } else if (!authentication && authStatus) {
                navigate("/");
            }
        }

        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, [authStatus, navigate, tokenAuth, authentication]);


    if (loading) {
        return (
            <>
                <div className="w-full h-[100vh] flex justify-center items-center">
                    <LottieAnimation  />
                </div>
            </>
        )
    }

    return <>{children}</>;

}

export default AuthLayout;