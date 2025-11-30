import {AlertTriangle} from "lucide-react";
import {Link} from "react-router-dom";

const GenericError = () => {
    return (
        <div className="min-h-screen font-manrope bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 text-center space-y-6">
                <AlertTriangle className="mx-auto text-yellow-500" size={100} strokeWidth={1.5} />
                <h1 className="text-3xl font-bold text-yellow-800">Something Went Wrong</h1>
                <p className="text-gray-600">
                    We're experiencing an unexpected issue.
                    Don't worry, our team has been automatically notified and is working on a fix.
                </p>
                <div className="flex space-x-4 justify-center">
                    <Link
                        to="/"
                        className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition"
                    >
                        Refresh
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="border border-yellow-500 text-yellow-500 px-6 py-3 rounded-lg hover:bg-yellow-50 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}
export default GenericError
