import {Home, LockIcon} from "lucide-react";
import {Link} from "react-router-dom";

const Unauthorized = ({uri}: {uri:string})=> {
    return (
        <div className="min-h-screen font-manrope bg-gradient-to-br from-red-100 via-red-50 to-red-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            {/* Subtle animated background overlay */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-700 opacity-20"></div>
            </div>

            <div className="max-w-lg w-full">
                <div className="bg-white/90 dark:bg-gray-900/90 shadow-xl rounded-2xl p-8 space-y-6 backdrop-blur-sm">
                    {/* Icon with subtle animation */}
                    <div className="relative flex justify-center">
                        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full blur-xl"></div>
                        <LockIcon
                            className="relative text-red-600 dark:text-red-400"
                            size={80}
                            strokeWidth={1.5}
                        />
                    </div>

                    <div className="space-y-2 text-center">
                        <h1 className="text-5xl font-bold text-red-600 dark:text-red-400">
                            403
                        </h1>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                            Access Denied
                        </h2>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                        You do not have permission to access this page.
                        Please log in with appropriate credentials or contact your system administrator.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                        <Link
                            to={`/login?redirect_uri=${uri}`}
                            className="inline-flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                        >
                            <LockIcon size={18} />
                            <span>Login</span>
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center space-x-2 border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-6 py-2.5 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                        >
                            <Home size={18} />
                            <span>Return Home</span>
                        </Link>
                    </div>
                </div>

                {/* Optional: Add a subtle footer */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Need help? Contact your system administrator.
                </p>
            </div>
        </div>
    );
};

export default Unauthorized;
