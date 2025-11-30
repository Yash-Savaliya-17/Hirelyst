import React, {useEffect, useState} from 'react';
import {Wand2} from 'lucide-react';
import {Button} from '@/components/Common/shadcnui/button';
import {toast} from 'sonner';
import QuestionComponents from "@/components/QuizComponents/QuestionComponents.tsx";
import {regenerateQuizQuestion} from "@/services/operations/QuizOperations.ts";

const Question = ({ data, index }:any) => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(data);
    useEffect(() => {
        setCurrentQuestion(data);
    }, [data]);
    const regenerateQuestion = async () => {
        setIsRegenerating(true);

        try {
            const res = await regenerateQuizQuestion(currentQuestion.sys_id)
            setCurrentQuestion(res.data);
        } catch (error) {
            toast.error("Failed to regenerate question");
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="flex-grow relative">
            <div className={`transition-opacity duration-300 ${isRegenerating ? 'opacity-50' : 'opacity-100'}`}>
                <QuestionComponents data={currentQuestion} index={index} />
            </div>

            <div className="absolute top-0 right-0 flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={regenerateQuestion}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Wand2 className={`h-4 w-4 ${isRegenerating ? 'animate-bounce' : ''}`} />
                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
            </div>

            {isRegenerating && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin">
                            <div className="absolute top-0 right-0 w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-400 rounded-full animate-spin animate-reverse" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Question;