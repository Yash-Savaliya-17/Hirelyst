import React from 'react';
import { MdEmail } from "react-icons/md";
import { Briefcase, Instagram, Linkedin, MessageCircle, Twitter } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r font-manrope from-blue-50 to-cyan-50 pt-16 pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                            {import.meta.env.VITE_SITE_NAME}
                        </h3>
                        <p className="text-blue-700">Empowering students for successful careers</p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300">
                                <Linkedin className="w-6 h-6" />
                            </a>
                            <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300">
                                <Twitter className="w-6 h-6" />
                            </a>
                            <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300">
                                <Instagram className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-blue-700 mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300 flex items-center space-x-2">
                                    <span>Home</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300 flex items-center space-x-2">
                                    <span>About Us</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300 flex items-center space-x-2">
                                    <span>Services</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300 flex items-center space-x-2">
                                    <span>Contact</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-blue-700 mb-4">Our Services</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300 flex items-center space-x-2">
                                    <span>AI Interviews</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300 flex items-center space-x-2">
                                    <span>Skill Quizzes</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors duration-300 flex items-center space-x-2">
                                    <span>Resume Builder</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-blue-700 mb-4">Get in Touch</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-3">
                                <Briefcase className="w-5 h-5 text-cyan-600" />
                                <span className="text-blue-600">Mon-Fri: 9AM to 5PM</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <MdEmail className="w-5 h-5 text-cyan-600" />
                                <span className="text-blue-600">jalaym825@gmail.com</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <MessageCircle className="w-5 h-5 text-cyan-600" />
                                <span className="text-blue-600">+1 (555) 123-4567</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-blue-100 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-sm text-blue-600">&copy; 2024 {import.meta.env.VITE_SITE_NAME}. All rights reserved.</p>
                    <div className="mt-4 sm:mt-0 space-x-6">
                        <a href="#" className="text-sm text-blue-600 hover:text-cyan-600 transition-colors duration-300">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-sm text-blue-600 hover:text-cyan-600 transition-colors duration-300">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
