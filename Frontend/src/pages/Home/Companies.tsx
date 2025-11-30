import React from 'react';
import {motion} from 'framer-motion';
import ibm from '@/assets/ibm.svg';
import samsung from '@/assets/samsung.svg';
import google from '@/assets/google.svg';
import stripe from '@/assets/stripe.svg';
import {Award} from "lucide-react";
import {cn} from "@/lib/utils.ts";

const FloatingDot = ({index}: { index: number }) => {
    const initialX = Math.random() * 100;
    const initialY = Math.random() * 100;
    const size = Math.random() * 4 + 2;

    return (
        <motion.div
            key={index}
            className="absolute rounded-full bg-blue-300"
            style={{
                position: 'absolute',
                left: `${initialX}%`,
                top: `${initialY}%`,
                width: `${size}px`,
                height: `${size}px`,
                filter: 'blur(1px)',
                opacity: 0.5,
            }}
            animate={{
                x: [0, 20, 0],
                y: [0, 30, 0],
            }}
            transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "mirror"
            }}
        />
    );
};

const CircleBackground = () => (
    <div className="absolute inset-0">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"/>
        {/* Animated floating dots */}
        <div className="absolute inset-0">
            {[...Array(100)].map((_, i) => (  // Reduced number of dots for better performance
                <FloatingDot key={i} index={i}/>
            ))}
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-transparent to-blue-50/50"/>
    </div>
);

const LogoSection = () => {
    const logos = [
        {src: google, name: 'Google'},
        {src: ibm, name: 'IBM'},
        {src: samsung, name: 'Samsung'},
        {src: stripe, name: 'Stripe'}
    ];

    return (
        <div className="relative py-10 font-sans font-manrope overflow-hidden">
            {/* Main Content */}
            <div className="relative max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.6}}
                    className="text-center"
                >
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-medium mb-4">
                            <Award className="w-5 h-5"/>
                            <span>Trusted By</span>
                        </div>
                        <h2 className={cn(
                            "text-2xl md:text-3xl font-bold mb-16",
                            "bg-clip-text text-transparent",
                            "bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900",
                            "drop-shadow-sm"
                        )}>
                            Trusted by Innovators and Leaders Worldwide
                        </h2>
                    </div>

                    {/* Logo Grid with Animated Background */}
                    <div className="relative mb-12">
                        <div className="absolute inset-0 -mx-6 rounded-3xl overflow-hidden">
                            <CircleBackground/>
                        </div>

                        <div
                            className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center justify-items-center py-12">
                            {logos.map((logo, index) => (
                                <motion.div
                                    key={index}
                                    initial={{opacity: 0, y: 20}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{duration: 0.6, delay: index * 0.1}}
                                    className="relative group"
                                >
                                    <div
                                        className="absolute inset-0 bg-blue-100/50 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"/>
                                    <motion.div
                                        className="relative rounded-xl p-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 shadow-lg"
                                    >
                                        <img
                                            src={logo.src}
                                            alt={`${logo.name} logo`}
                                            className="h-12 w-auto"
                                        />
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Section */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.6, delay: 0.4}}
                        className="relative"
                    >
                        <div
                            className="inline-flex items-center space-x-2 bg-blue-100/80 backdrop-blur-sm rounded-full px-6 py-2 border border-blue-100/20">
                            <motion.span
                                className="text-blue-600 font-semibold"
                                initial={{opacity: 0}}
                                whileInView={{opacity: 1}}
                                viewport={{once: true}}
                                transition={{duration: 2}}
                            >
                                100,000+
                            </motion.span>
                            <span className="text-sm font-semibold text-gray-600">
                professionals from top-tier companies trust our platform
              </span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default LogoSection;
