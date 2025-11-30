import React, {useEffect} from 'react';
import {Button} from '@/components/Common/shadcnui/button';
import {Input} from '@/components/Common/shadcnui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/Common/shadcnui/select';
import {Book, BookOpen, CheckCircle, HelpCircle, X} from 'lucide-react';
import {getAiQuizDomains, getSubjects} from "@/services/operations/QuizOperations.ts";

const SubjectSelection = ({
    handleAddSelection,
    handleSubjectChange,
    handleTopicChange,
    selectedSubject,
    selectedTopic,
    questionCount,
    setQuestionCount,
    handleRemoveSelection,
    selections,
    handlekeyDown,
    switchValue,
    subjects, setSubjects,
    topicOptions, setTopicOptions
}: any) => {
    useEffect(() => {
        const GetSubjectsFromDB = async () => {
            try {
                const response = await getSubjects();
                setSubjects(response.data.subjects);
                const questionTopic = response.data.subjects.reduce((acc: any, subject: any) => {
                    acc[subject.name] = subject.questionTopic;
                    return acc;
                }, {});
                setTopicOptions(questionTopic);
            } catch (error) {
                console.error('Error fetching subjects:', error);
            }
        }

        const GetAiSubjects = async () => {
            try {
                const response = await getAiQuizDomains();
                const domains = response.data.domains;

                // Transform AI domains to match DB structure
                const normalizedSubjects = Object.keys(domains).map((domain, index) => ({
                    sys_id: `ai_subject_${index}`,
                    name: domain,
                    questionTopic: domains[domain].map((topic: string, topicIndex: number) => ({
                        sys_id: `ai_topic_${index}_${topicIndex}`,
                        name: topic,
                        subject: domain
                    }))
                }));

                setSubjects(normalizedSubjects);

                // Create topic options in the same format as DB data
                const normalizedTopicOptions = normalizedSubjects.reduce((acc: any, subject: any) => {
                    acc[subject.name] = subject.questionTopic;
                    return acc;
                }, {});

                setTopicOptions(normalizedTopicOptions);
            } catch (error) {
                console.error('Error fetching AI domains:', error);
                GetSubjectsFromDB();
            }
        }

        if (switchValue) {
            GetAiSubjects();
        } else {
            GetSubjectsFromDB();
        }
    }, [switchValue]);

    const handleSelectionAdd = () => {
        handleAddSelection();
        // Force reset the select values after state update
        const subjectSelect = document.querySelector('[role="combobox"]') as HTMLElement;
        const topicSelect = document.querySelectorAll('[role="combobox"]')[1] as HTMLElement;
        if (subjectSelect) subjectSelect.click();
        if (topicSelect) topicSelect.click();
    };

    return (
        <div className="space-y-6 p-7 font-dm-sans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Subject Selection */}
                <div className="space-y-2 transform transition-all duration-200 hover:translate-y-[-2px]">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Book className="h-4 w-4 transition-colors duration-200 group-hover:text-indigo-600" />
                        Subject
                    </label>
                    <Select
                        onValueChange={handleSubjectChange}
                        value={selectedSubject?.subjectId?.toString() || ""}
                    >
                        <SelectTrigger className="w-full p-4 h-12 transition-all duration-200 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
                            <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 font-manrope">
                            {subjects.map((subject: any) => (
                                <SelectItem
                                    key={subject.sys_id}
                                    value={subject.sys_id.toString()}
                                    className={`py-2 transition-colors duration-150 hover:bg-indigo-50 ${selectedSubject?.subjectId === subject.sys_id ? 'bg-indigo-50 font-semibold' : ''}`}
                                >
                                    {subject.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Topic Selection */}
                <div className="space-y-2 transform transition-all duration-200 hover:translate-y-[-2px]">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 transition-colors duration-200 group-hover:text-indigo-600" />
                        Topic
                    </label>
                    <Select
                        onValueChange={handleTopicChange}
                        disabled={!selectedSubject}
                        value={selectedTopic?.topicId?.toString() || ""}
                    >
                        <SelectTrigger className="w-full p-4 h-12 transition-all duration-200 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
                            <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        {selectedSubject && (
                            <SelectContent className="max-h-60 font-manrope">
                                {topicOptions[selectedSubject.subject]?.map((topic: any) => (
                                    <SelectItem
                                        key={topic.sys_id}
                                        value={topic.sys_id.toString()}
                                        className={`py-2 transition-colors duration-150 hover:bg-indigo-50 ${selectedTopic?.topicId === topic.sys_id ? 'bg-indigo-50 font-semibold' : ''}`}
                                    >
                                        {topic.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        )}
                    </Select>
                </div>

                {/* Question Count */}
                <div className="space-y-2 transform transition-all duration-200 hover:translate-y-[-2px]">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 transition-colors duration-200 group-hover:text-indigo-600" />
                        Questions
                    </label>
                    <Input
                        type="number"
                        placeholder="Number of questions"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                        min="1"
                        max="50"
                        className="h-12 transition-all duration-200 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                        onKeyDown={handlekeyDown}
                    />
                </div>
            </div>

            {/* Add Selection Button */}
            <div className="flex justify-center py-4">
                <Button
                    onClick={handleSelectionAdd}
                    disabled={!selectedSubject || !selectedTopic || !questionCount}
                    className="w-[200px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add Selection
                </Button>
            </div>

            {/* Selections Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selections.map((selection: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border bg-white shadow-sm transform transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
                    >
                        <span className="font-medium text-gray-700">
                            {selection.subject} - {selection.topic} ({selection.count})
                        </span>
                        <button
                            onClick={() => handleRemoveSelection(index)}
                            className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubjectSelection;