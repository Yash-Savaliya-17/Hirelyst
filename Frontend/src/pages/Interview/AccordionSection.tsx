import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';


interface AccordionSectionProps {
    title: string;
    content: JSX.Element | string;
    openIndex: any;
    index: number;
    score?: number | undefined | any;
    handleToggle: (index: number) => void;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, score, content, openIndex, index, handleToggle }) => {
    return (
        <motion.div className="w-full border rounded-lg overflow-hidden">
            <motion.div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => handleToggle(index)}>
                <div className="flex items-center space-x-2">
                    <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                    <span className="text-gray-700 font-medium">{title}</span>
                </div>
                {score &&
                    (<span className="text-blue-600 font-semibold">{(score * 100).toFixed(1)}%</span>)
                }
            </motion.div>

            <AnimatePresence>
                {openIndex === index && (
                    <motion.div initial="hidden" animate="visible" exit="hidden" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="overflow-hidden">
                        <div className="px-4 pb-4">
                            <motion.div className="bg-blue-50 rounded-lg p-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                {content}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AccordionSection;
