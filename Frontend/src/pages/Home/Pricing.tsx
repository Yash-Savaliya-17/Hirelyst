import React from 'react';
import {SparklesCore} from "@/components/Common/shadcnui/sparkles";
import {BackgroundGradient} from "@/components/Common/shadcnui/background-gradient";
import {Link} from 'react-router-dom';
import {Check, CreditCard} from 'lucide-react';
import {cn} from "@/lib/utils.ts";

interface PricingPlan {
    title: string;
    price: string;
    features: string[];
    buttonText: string;
    buttonLink?: string;
    highlight?: boolean;
}

const pricingPlans: PricingPlan[] = [
    {
        title: "Starter",
        price: "Free",
        features: [
            "Limited AI Interviews",
            "Limited Quiz Access",
            "Basic Resume Review",
            "Community Support"
        ],
        buttonText: "Get Started",
        buttonLink: "/interview"
    },
    {
        title: "Pro",
        price: "$9.99/month",
        features: [
            "Unlimited Quiz Access",
            "Comprehensive Resume Review",
            "AI Interview Practice",
            "Personalized Learning Paths"
        ],
        buttonText: "Go Pro",
        highlight: true
    },
    {
        title: "Enterprise",
        price: "Custom Pricing",
        features: [
            "Team Collaboration Tools",
            "Advanced Analytics",
            "Dedicated Support",
            "Custom Integration"
        ],
        buttonText: "Contact Sales"
    }
];

const PricingSection: React.FC = () => {
    return (
        <>
            <div className="w-full absolute min-h-screen">
                <div className="absolute inset-0 bg-grid-slate-100/50 opacity-40"/>
                <SparklesCore
                    id="tsparticlesfullpage"
                    background="transparent"
                    minSize={0.4}
                    maxSize={1.2}
                    particleDensity={80} // Slightly reduced density
                    particleColor="#4F46E5"
                    className="opacity-70" // Add some transparency
                />
            </div>
            <div id="pricing" className="py-20 font-manrope bg-white">

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-medium mb-4">
                            <CreditCard className="w-5 h-5"/>
                            <span>Pricing</span>
                        </div>
                        <h2 className={cn(
                            "text-3xl md:text-4xl font-bold mb-4",
                            "bg-clip-text text-transparent",
                            "bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900",
                            "drop-shadow-sm",
                            "pb-3"
                        )}>
                            Flexible Pricing for Every Career Stage
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Choose the plan that best fits your career development needs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                        {pricingPlans.map((plan, index) => (
                            <div key={index} className="relative">
                                <BackgroundGradient className="rounded-2xl p-px h-full">
                                    <div className={`h-full rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm
                                        ${plan.highlight ? 'ring-2 ring-blue-500' : 'ring-1 ring-neutral-200 dark:ring-neutral-800'}
                                        p-8 relative
                                    `}>
                                        {plan.highlight && (
                                            <div className="absolute -top-4 left-0 right-0 mx-auto w-32">
                                                <div
                                                    className="text-center text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-400 px-3 py-1 rounded-full">
                                                    Most Popular
                                                </div>
                                            </div>
                                        )}

                                        <div className="text-center">
                                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                                                {plan.title}
                                            </h3>
                                            <div className="mt-4 flex items-baseline justify-center gap-x-2">
                                                <span
                                                    className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                                    {plan.price.split('/')[0]}
                                                </span>
                                                {plan.price.includes('/') && (
                                                    <span
                                                        className="text-lg text-neutral-600 dark:text-neutral-400">/month</span>
                                                )}
                                            </div>
                                        </div>

                                        <ul className="mt-8 space-y-4">
                                            {plan.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-center gap-3">
                                                    <Check className="h-5 w-5 flex-none text-blue-500"/>
                                                    <span className="text-neutral-700 dark:text-neutral-300">
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mt-8">
                                            {plan.buttonLink ? (
                                                <Link
                                                    to={plan.buttonLink}
                                                    className={`
                                                        block w-full px-6 py-3 text-center rounded-lg font-medium
                                                        ${plan.highlight
                                                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                                                        : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                                    }
                                                        transition-colors duration-200
                                                    `}
                                                >
                                                    {plan.buttonText}
                                                </Link>
                                            ) : (
                                                <button
                                                    className={`
                                                        w-full px-6 py-3 rounded-lg font-medium
                                                        ${plan.highlight
                                                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                                                        : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                                    }
                                                    transition-colors duration-200
                                                    `}
                                                >
                                                    {plan.buttonText}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </BackgroundGradient>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PricingSection;
