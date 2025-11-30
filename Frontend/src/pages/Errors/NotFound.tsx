import { Frown, Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="min-h-screen font-manrope bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            {/* Subtle animated background overlay */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20"></div>
            </div>

            <div className="max-w-lg w-full">
                <div className="bg-white/90 dark:bg-gray-900/90 shadow-xl rounded-2xl p-8 space-y-6 backdrop-blur-sm">
                    {/* Icon with subtle animation */}
                    <div className="relative flex justify-center">
                        <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-xl"></div>
                        <Frown
                            className="relative text-indigo-600 dark:text-indigo-400"
                            size={80}
                            strokeWidth={1.5}
                        />
                    </div>

                    <div className="space-y-2 text-center">
                        <h1 className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                            404
                        </h1>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                            Page Not Found
                        </h2>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                        We apologize, but the page you're looking for doesn't exist or has been moved.
                        Please check the URL or navigate back to our homepage.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                        >
                            <Home size={18} />
                            <span>Return Home</span>
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center space-x-2 border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-6 py-2.5 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                        >
                            <ArrowLeft size={18} />
                            <span>Go Back</span>
                        </button>
                    </div>
                </div>

                {/* Optional: Add a subtle footer */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    If you believe this is a mistake, please contact support.
                </p>
            </div>
        </div>
    );
};

export default NotFound;
