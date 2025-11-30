// import { useState } from 'react';
// import { CheckCircle } from "lucide-react";
// import { AnimatePresence, motion } from "framer-motion";
import { logOut } from '@/services/operations/authOperations';
import { removeUser } from '@/slices/auth/auth.slice';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const ProfileTemplate = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeItem, setActiveItem] = useState(() => {
        const path = location.pathname.slice(1);
        return path.charAt(0).toUpperCase() + path.slice(1);
    });

    const handleLogout = async () => {
        try {
            await logOut();
            dispatch(removeUser());
            navigate('/');
        } catch (error: any) {
            console.error(error);
        }
    };

    const item = [
        {
            name: 'Profile setting',
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>

        },
        {
            name: 'Logout',
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-0.5 -0.5 16 16" strokeLinecap="round"
                strokeLinejoin="round" stroke="#000000" id="Logout--Streamline-Mynaui" height="20" width="20">
                <desc>Logout Streamline Icon: https://streamlinehq.com</desc>
                <path
                    d="M8.435 13.125H4.0625c-0.690625 0 -1.25 -0.719375 -1.25 -1.606875V3.48125c0 -0.8868750000000001 0.559375 -1.60625 1.25 -1.60625h4.375M10 9.6875l2.1875 -2.1875L10 5.3125m-4.0625 2.185h6.25"
                    strokeWidth="1"></path>
            </svg>
        }
    ];
    const items = [
        {
            name: 'Personal',
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    clipRule="evenodd" />
            </svg>
        },
        {
            name: 'Education',
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path
                    d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                <path
                    d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z" />
                <path
                    d="M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z" />
            </svg>
        },
        {
            name: 'Experience',
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd"
                    d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                    clipRule="evenodd" />
                <path
                    d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
            </svg>
        },
        {
            name: 'Projects',
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path
                    d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657ZM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6ZM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 0 1 6.75 6h10.5a3 3 0 0 1 2.683 1.657A4.505 4.505 0 0 0 18.75 7.5H5.25Z" />
            </svg>
        }
    ];
    return (
        <div className="w-full h-[89vh] flex flex-col md:flex-row">
            <div className="w-full md:w-[25%]  flex flex-col gap-y-7 pt-24 pl-5 md:pl-10 pr-5">
                <div className="w-full font-manrope rounded-xl border border-[#e6e8f0]">
                    <div className="flex flex-col space-y-1 p-3">
                        {item.map((item) => (
                            item.name === 'Logout' ? (
                                <button
                                    key={item.name}
                                    onClick={handleLogout}
                                    className={`flex items-center gap-x-3 px-3 py-2.5 rounded-lg font-manrope font-semibold text-[14px] cursor-pointer transition-colors duration-200 ${activeItem === item.name ? 'text-[#605DFF] bg-[#605DFF]/5' : 'text-gray-700 hover:bg-[#605DFF]/5 hover:text-[#605DFF]'}`}
                                >
                                    {item.icon}
                                    <span className="ml-4 font-semibold text-sm">{item.name}</span>
                                </button>
                            ) : (
                                <Link
                                    key={item.name}
                                    to={`/${item.name.toLowerCase().trim().replace(/\s+/g, '')}`}
                                    onClick={() => setActiveItem(item.name)}
                                    className={`flex items-center gap-x-3 px-3 py-2.5 rounded-lg font-manrope font-semibold text-[14px] cursor-pointer transition-colors duration-200 ${activeItem === item.name ? 'text-[#605DFF] bg-[#605DFF]/5' : 'text-gray-700 hover:bg-[#605DFF]/5 hover:text-[#605DFF]'}`}
                                >
                                    <span className="flex-shrink-0">{item.icon}</span>
                                    <span className="ml-4 font-semibold text-sm">{item.name}</span>
                                </Link>
                            )
                        ))}
                    </div>
                </div>

                <div>
                    <h1 className="font-manrope ml-3 text-md font-bold text-[#1c2035]">Resume Details</h1>
                    <div className="w-full rounded-xl border border-[#e6e8f0]">
                        <nav className="flex flex-col gap-y-1 p-3">
                            {items.map((item) => (
                                <Link
                                    to={`/${item.name.toLowerCase()}`}
                                    key={item.name}
                                    className={`flex items-center gap-x-4 px-3 py-2.5 rounded-lg font-manrope font-semibold text-[14px] cursor-pointer transition-colors duration-200 ${activeItem === item.name
                                        ? 'text-[#605DFF] bg-[#605DFF]/5'
                                        : 'text-gray-700 hover:bg-[#605DFF]/5 hover:text-[#605DFF]'
                                        }`}
                                    onClick={() => setActiveItem(item.name)}>
                                    <span className="flex-shrink-0">{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="w-full md:w-[75%] pt-24 pr-5 pl-5 md:pr-10 pb-5">
                <div className="w-full  rounded-xl border border-[#e6e8f0]">
                    <div className="rounded-t-xl p-3 bg-[#f6faff]">
                        <h1 className="text-[16px] font-semibold text-[#4a516d] font-manrope px-6">{activeItem}</h1>
                    </div>
                    <div className='h-[76vh] overflow-y-scroll'>
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>

    )
};

export default ProfileTemplate;


