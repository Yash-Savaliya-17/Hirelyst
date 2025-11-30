import React from 'react';
import {Input} from '@/components/Common/shadcnui/input';
import {ArrowRight, Lightbulb} from 'lucide-react';
import {Label} from "@/components/Common/shadcnui/label";
import {Switch} from "@/components/Common/shadcnui/switch";

const Title = ({
    value,
    handlekeyDown,
    onChange,
    switchValue,
    setSwitchValue
}: {
    value: any,
    handlekeyDown: any,
    onChange: any,
    switchValue: boolean,
    setSwitchValue: any
}) => {
    return (
        <div className="w-full max-w-2xl mx-auto py-8 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="space-y-2">
                    <p className="text-gray-500">Craft an engaging quiz title that captures your audience's attention</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <Label htmlFor="quiz-title" className="text-sm font-medium inline-flex items-center gap-2 text-gray-700">
                        Quiz Title
                        <span className="text-xs text-gray-500">(Required)</span>
                    </Label>
                    <Input
                        id="quiz-title"
                        className="h-12 text-lg border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 rounded-lg transition-all duration-200"
                        placeholder="e.g., JavaScript Fundamentals Quiz"
                        onKeyDown={handlekeyDown}
                        value={value}
                        onChange={onChange}
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lightbulb className="h-4 w-4" />
                        <span>Make it clear and descriptive for better engagement</span>
                    </div>
                </div>

                {/* AI Switch Section */}
                <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-lg border border-indigo-100">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="ai-quiz" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                AI Quiz Generation
                                <ArrowRight className="h-4 w-4 text-indigo-500" />
                            </Label>
                            <p className="text-xs text-gray-500">
                                Enable AI assistance to generate engaging quiz questions automatically
                            </p>
                        </div>
                        <Switch
                            id="ai-quiz"
                            checked={switchValue}
                            onCheckedChange={setSwitchValue}
                            className="data-[state=checked]:bg-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div className="mt-6 px-4 py-3 bg-gray-50/50 rounded-lg">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="font-medium">Pro tip:</span>
                    <span>Press Enter after typing your title to proceed to the next step</span>
                </div>
            </div>
        </div>
    );
}

export default Title;