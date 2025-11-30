import {useEffect, useState} from "react";
import {Input} from "@/components/Common/shadcnui/input";

const QuestionComponents = ({ data, index }: { data: any, index: number }) => {

    const [isEditing, setIsEditing] = useState(false);
    // Use data.question directly instead of question?.question
    const [editedQuestion, setEditedQuestion] = useState(data.question.question || '');
    // If you have options, they should probably come from data.options
    const [editedOptions, setEditedOptions] = useState(data.question.options || []);

    useEffect(() => {
        setEditedQuestion(data.question.question);
        setEditedOptions(data.question.options);
    }, [data]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleConfirmClick = () => {
        setIsEditing(false);
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...editedOptions];
        newOptions[index] = { ...newOptions[index], option: value };
        setEditedOptions(newOptions);
    };


    return (
        <div key={index} className="w-full rounded-md font-dm-sans p-3 gap-y-3 flex flex-col">
        <div className="w-full flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-dm-sans">Question {index + 1}</h1>
            {/*{!isEditing ? (*/}
            {/*    <MdOutlineEditNote color="black" size={30} onClick={handleEditClick} className="cursor-pointer" />*/}
            {/*) : (*/}
            {/*    <Button className="mt-3 self-end" onClick={handleConfirmClick}>*/}
            {/*        Confirm*/}
            {/*    </Button>*/}
            {/*)}*/}
        </div>
    
        <div className="w-full pl-2 md:pl-5">
            <Input
                className="h-9 md:h-10  border-[0.5px] text-sm rounded-sm p-2 md:p-3"
                type="text"
                value={editedQuestion}
                onChange={(e) => setEditedQuestion(e.target.value)}
                placeholder="Write Question"
                readOnly={!isEditing}
            />
    
            <div className="w-full pl-4 md:pl-10 p-2 md:p-3 flex flex-col gap-y-2 md:gap-y-3">
                {editedOptions.map((option: any, index: number) => (
                    <div key={index} className="w-full flex items-center gap-x-2">
                        <h1 className="text-lg md:text-xl font-dm-sans">{String.fromCharCode(65 + index)}</h1>
                        <Input
                            className="h-9 w-full md:w-[70vh]  border-[0.5px] text-sm rounded-sm p-2 md:p-3"
                            type="text"
                            value={option.option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Options ${String.fromCharCode(65 + index)}`}
                            readOnly={!isEditing}
                        />
                    </div>
                ))}
            </div>
        </div>
    </div>
    
    );
};

export default QuestionComponents;
