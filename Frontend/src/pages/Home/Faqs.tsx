import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils.ts";

const EnhancedFAQ = () => {
    const faqs = [
        {
            question: `How is ${import.meta.env.VITE_SITE_NAME} different from other career platforms?`,
            answer: "We combine AI-driven insights, personalized learning, and real-world simulation to provide a holistic career development experience. Our platform uses advanced machine learning to create truly adaptive learning paths.",
        },
        {
            question: "Are the interview simulations really effective?",
            answer: "Our AI interview simulators are developed by ex-HR professionals and use natural language processing to provide nuanced, context-aware feedback. We've helped over 50,000 users improve their interview skills with 87% reporting increased confidence.",
        },
        {
            question: "How secure is my personal and professional data?",
            answer: "We implement bank-grade encryption, comply with GDPR and CCPA, and use zero-knowledge architecture. Your data is anonymized, encrypted, and never sold to third parties.",
        }
    ];

    const [openIndex, setOpenIndex] = useState<any>(null);

    return (
        <section className="relative py-16 bg-gradient-to-b from-white via-white to-blue-50/20 overflow-hidden">            
            <div className="max-w-4xl font-manrope mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-medium mb-4">
                            <HelpCircle className="w-5 h-5"/>
                            <span>Need help?</span>
                        </div>
                        <h2 className={cn(
                            "text-3xl md:text-4xl font-bold mb-4",
                            "bg-clip-text text-transparent",
                            "bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900",
                            "drop-shadow-sm"
                        )}>
                            Frequently Asked Questions
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Get expert answers to your most critical career development questions,
                            curated by industry professionals
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-5 hover:bg-white/90 transition-colors relative overflow-hidden shadow-lg"
                        >
                            <div
                                className="flex justify-between items-start cursor-pointer"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {faq.question}
                                    </h3>
                                    {openIndex === index && (
                                        <p className="text-gray-600 mt-4 animate-fade-in">
                                            {faq.answer}
                                        </p>
                                    )}
                                </div>
                                <ChevronDown
                                    className={`w-6 h-6 text-gray-500 transition-transform ${
                                        openIndex === index ? 'rotate-180' : ''
                                    }`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Gradient Overlay to blend edges */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </section>
    );
};

export default EnhancedFAQ;