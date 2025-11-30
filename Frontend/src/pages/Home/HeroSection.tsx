import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ChevronRight} from 'lucide-react';
import {motion} from 'framer-motion';
import AnimatedGridPattern from "@/components/Common/shadcnui/animated-grid-pattern";
import {cn} from "@/lib/utils";

const HeroSection = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const stagger = {
        animate: {
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="relative min-h-screen font-manrope flex items-center justify-center overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <AnimatedGridPattern
                    maxOpacity={0.10} // Slightly reduced opacity
                    strokeDasharray={"4 2"}
                    duration={4} // Slightly slower animation
                    repeatDelay={1}
                    className={cn(
                        "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
                        "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
                    )}
                />
            </div>

            <motion.div
                initial="initial"
                animate="animate"
                variants={stagger}
                className="max-w-6xl mx-auto px-6 text-center relative z-10"
            >
                <motion.div
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                    className="inline-flex items-center space-x-2 bg-blue-50/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 hover:bg-blue-100/90 transition-colors group cursor-pointer border border-blue-100/50"
                    onClick={() => window.location.href = '/interview/takeinterview'}
                >
                    <span className="text-sm text-blue-600">✨ New Feature</span>
                    <span className="text-sm font-medium text-gray-600 mr-2">
                        AI-Powered Interview Practice
                    </span>
                    <ChevronRight
                        className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform"
                        strokeWidth={2.5}
                    />
                </motion.div>

                <motion.div
                    variants={fadeInUp}
                    className="mb-8"
                >
                    <h1 className={cn(
                        "text-4xl md:text-5xl lg:text-6xl font-bold",
                        "bg-clip-text text-transparent",
                        "bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900",
                        "drop-shadow-sm"
                    )}>
                        Your Arc to Career Excellence
                    </h1>
                </motion.div>

                <motion.p
                    variants={fadeInUp}
                    className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed"
                >
                    Level up your career with AI-powered interviews, personalized quizzes, and expert resources. Begin your journey to mastery today!
                </motion.p>

                <motion.div
                    variants={fadeInUp}
                    className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
                >
                    <Link
                        to='/interview/takeinterview'
                        className="group"
                    >
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-xl hover:from-blue-700 hover:to-cyan-700"
                        >
                            <span>Give AI Interview</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                        </motion.div>
                    </Link>
                    <Link
                        to='/quiz/create'
                        className="group"
                    >
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-3 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-colors shadow-md hover:shadow-xl border border-gray-200"
                        >
                            Take a Quiz
                        </motion.div>
                    </Link>
                </motion.div>

                <motion.p
                    variants={fadeInUp}
                    className="text-sm text-gray-500 mt-6"
                >
                    Give your first AI-Powered interview today
                </motion.p>
            </motion.div>
        </div>
    );
};

export default HeroSection;
