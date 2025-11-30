import {useState} from 'react';
import {Link, Outlet, useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {Menu, X} from 'lucide-react';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/Common/shadcnui/dropdown-menu';
import {Button} from '@/components/Common/shadcnui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/Common/shadcnui/avatar';
import {AiOutlineUser} from 'react-icons/ai';
import {IoSettingsOutline} from 'react-icons/io5';
import {FiLogOut} from 'react-icons/fi';
import {RootState} from '@/slices/store';
import {removeUser} from '@/slices/auth/auth.slice';
import {logOut} from '@/services/operations/authOperations';
import {Link as ScrollLink} from "react-scroll";
import {motion} from "framer-motion";
import logo from "../../assets/logo.png";

const Navbar = () => {
    const User = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logOut();
            dispatch(removeUser());
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error: any) {
            console.error(error);
        }
    };

    const links = [
        {
            name: "Home",
            scrollTo: "hero",
            path: "/",
        },
        {
            name: "About",
            scrollTo: "bento",
            path: "/"
        },
        {
            name: "Pricing",
            scrollTo: "pricing",
            path: "/"
        },
        {
            name: "FAQs",
            scrollTo: "faqs",
            path: "/"
        }
    ]

    const navigate = useNavigate();
    const handleScroll = (item: any) => {
        if (item.path === "/") {
            navigate("/", { state: { scrollTo: item.scrollTo } });
        } else {
            navigate(item.path);
        }
    }

    const MobileMenu = () => (
        <motion.div
            className="md:hidden fixed top-[80px] left-0 right-0 bg-white shadow-lg z-40"
            initial={{ opacity: 0, y: -100 }}
            animate={{
                opacity: isMobileMenuOpen ? 1 : 0,
                y: isMobileMenuOpen ? 0 : -100,
            }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex flex-col items-center p-4 space-y-4">
                {links.map((link) => (
                    <Button
                        key={link.name}
                        className="text-gray-700 size-2/4 transition-all duration-300 cursor-pointer bg-white hover:bg-white hover:text-black"
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleScroll(link);
                        }}
                    >
                        {link.name}
                    </Button>
                ))}

                {!User && (
                    <div className="flex flex-col font-manrope items-center space-y-2">
                        <Link
                            to="/login"
                            className="text-center text-blue-600 font-bold hover:opacity-90 py-2 mb-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 text-center mb-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </motion.div>
    );

    return (
        <>
            <div className="fixed w-full top-0 left-0 right-0 z-50 ">
                <nav className="max-w-7xl mx-auto w-[95%] h-[65px] rounded-2xl mt-5 bg-white/40 border border-[#e5e5e5] backdrop-blur-3xl flex items-center justify-between px-6 md:px-12">                    <ScrollLink to="hero" className={"cursor-pointer"} smooth={true} duration={500}>
                    <div className="flex items-center space-x-2">
                        {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg" /> */}
                        <Link to="/"
                            className="font-manrope  text-3xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                            <img src={logo} alt="" className='w-34 h-10' />
                        </Link>
                    </div>
                </ScrollLink>

                    {/* Desktop Navigation */}
                    <div className={`hidden ${User ? "mr-24" : "mr-0"}  font-manrope md:flex items-center text-[16px] font-semibold gap-10`}>
                        {
                            links.map((link) => (
                                <Button key={link.name} className={"text-gray-700  font-semibold hover:bg-transparent transition-colors p-0 bg-transparent text-md"}
                                    onClick={() => handleScroll(link)}
                                >
                                    {link.name}
                                </Button>
                            ))
                        }
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="focus:outline-none"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6 text-gray-700" />
                            ) : (
                                <Menu className="h-6 w-6 text-gray-700" />
                            )}
                        </button>
                    </div>

                    {/* User Actions */}
                    {User ? (
                        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" className="rounded-full hover:shadow-md transition-shadow">
                                    <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                                        <AvatarImage src="/placeholder-user.jpg" />
                                        <AvatarFallback
                                            className="bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
                                            {User.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 font-manrope border shadow-lg p-1">
                                <div>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/quiz/attempted"
                                            className="flex h-10 w-full items-center px-2 py-2 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-md cursor-pointer"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/personal"
                                            className="flex h-10 w-full items-center justify-between px-2 py-2 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-md cursor-pointer"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <span>My Profile</span>
                                            <AiOutlineUser className="text-blue-600" size={18} />
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/profilesetting"
                                            className="flex h-10 w-full items-center justify-between px-2 py-2 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-md cursor-pointer"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <span>Settings</span>
                                            <IoSettingsOutline className="text-blue-600" size={18} />
                                        </Link>
                                    </DropdownMenuItem>
                                </div>

                                <DropdownMenuSeparator className="my-1" />

                                <div>
                                    <DropdownMenuItem asChild>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                handleLogout();
                                            }}
                                            className="flex w-full h-10 items-center justify-between px-2 py-2 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-md cursor-pointer"
                                        >
                                            <span>Log Out</span>
                                            <FiLogOut className="text-blue-600" size={18} />
                                        </button>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="hidden md:flex font-manrope items-center gap-6">
                            <Link
                                to="/login"
                                className="text-sm font-bold hover:opacity-90 transition-opacity bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-5 py-3 w-24 font-bold text-sm flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </nav>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && <MobileMenu />}
            <Outlet />
        </>
    );
};

export default Navbar;
