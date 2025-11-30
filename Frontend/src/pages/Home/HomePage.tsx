import React, {useEffect, useRef} from 'react';
import EnhancedCareerHub from "@/pages/Home/BentoGrid.tsx";
import HeroSection from "@/pages/Home/HeroSection.tsx";
import Companies from "@/pages/Home/Companies.tsx";
import PricingSection from "@/pages/Home/Pricing.tsx";
import Faqs from "@/pages/Home/Faqs.tsx";
import Footer from "@/components/Home/Footer.tsx";
import {useLocation} from "react-router-dom";
import AppComponents from './AppComponents';

const LandingPage = () => {
    const location = useLocation();
    const bentoRef = useRef(null);
    const pricingRef = useRef(null);
    const faqsRef = useRef(null);
    const heroRef = useRef(null);

    useEffect(() => {
        const scrollToSection = () => {
            if (location.state?.scrollTo) {
                const refs: any = {
                    'hero': heroRef,
                    'bento': bentoRef,
                    'pricing': pricingRef,
                    'faqs': faqsRef
                };

                const targetRef = refs[location.state.scrollTo];
                if (targetRef?.current) {
                    setTimeout(() => {
                        targetRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }, 50);
                }

                window.history.replaceState({}, document.title);
            }
        };

        scrollToSection();
    }, [location]);


    return (
        <div className="w-full min-h-screen bg-white relative">
            {/* Hero Section */}
            <section className="pb-24" id={"hero"} ref={heroRef}>
                <HeroSection/>
            </section>

            {/* Trusted By Section */}
            <section className="pb-24 pt-10" id={"companies"}>
                <Companies/>
            </section>

            {/* Bento Grid Section */}
            <section className="pb-24 pt-24" id={"bento"} ref={bentoRef}>
                <EnhancedCareerHub/>
            </section>

            <section className="pb-24 hidden sm:block md:block pt-10">
                <AppComponents/>
            </section>

            {/* Pricing Section */}
            <section className="pb-16 pt-10" id={"pricing"} ref={pricingRef}>
                <PricingSection/>
            </section>

            {/* FAQ Section (continued) */}
            <section className="py-36" id={"faqs"} ref={faqsRef}>
                <Faqs/>
            </section>

            {/* Footer */}
            <section id={"footer"} className="pt-12">
                <Footer/>
            </section>

        </div>
    );
};

export default LandingPage;
