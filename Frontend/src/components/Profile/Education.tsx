import React, { useEffect, useState } from 'react';
import { Button } from "@/components/Common/shadcnui/button";
import { Boxes, Calendar, EditIcon, GraduationCap, PlusIcon, SaveIcon, TrashIcon } from 'lucide-react';
import MonthAndYearPicker from '../Common/MonthAndYearPeaker/MonthAndYearPeaker';
import { deleteEducation, getEducation, saveEducation as saveEducationAPI } from "@/services/operations/UserOperations";
import { ResumeData } from "@/slices/Resume/Resume.slice";
import { useSelector } from "react-redux";
import { RootState } from "@/slices/store";
import { toast } from "sonner";
import { Switch } from "@/components/Common/shadcnui/switch.tsx";
import { Label } from "@/components/Common/shadcnui/label.tsx";
import { Skeleton } from '../Common/shadcnui/skeleton';

interface ValidationError {
    field: string;
    message: string;
}

interface EducationWithId {
    sys_id: number;
    userId: number;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    location: string;
    grade?: string;
    startDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
    isEditing: boolean;
    isPresent: boolean;
    errors?: ValidationError[];
    temporary: boolean;
}

const Education: React.FC = () => {
    const [educations, setEducations] = useState<EducationWithId[]>([]);
    const [validationErrors, setValidationErrors] = useState<{ [key: number]: ValidationError[] }>({});
    const [isLoading, setIsLoading] = useState(false);
    const parsedResume: ResumeData | null = useSelector((state: RootState) => state.resume.data);

    useEffect(() => {
        const fetchEducation = async () => {
            try {
                setIsLoading(true);
                const response = await getEducation();
                const formattedEducations = response.data.map((edu: any) => ({
                    ...edu,
                    isEditing: false,
                    isPresent: edu.endDate === null,
                    temporary: false
                }));
                setEducations(prevEducations => [...prevEducations, ...formattedEducations]);
            } catch (error) {
                console.error('Error fetching education data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEducation();
    }, []);

    const validateEducation = (education: EducationWithId): ValidationError[] => {
        const errors: ValidationError[] = [];

        if (!education.institution) {
            errors.push({ field: 'institution', message: 'Institution is required' });
        }
        if (!education.degree) {
            errors.push({ field: 'degree', message: 'Degree is required' });
        }
        if (!education.startDate) {
            errors.push({ field: 'startDate', message: 'Start date is required' });
        }

        return errors;
    };

    const generateInt32Id = (existing: number[]): number => {
        const MIN_VALUE = 1;
        const MAX_VALUE = 2147483647;
        let newId: number;
        do {
            newId = Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE) + MIN_VALUE);
        } while (existing.includes(newId));
        return newId;
    };

    useEffect(() => {
        if (parsedResume && parsedResume.education) {
            const existingIds = educations.map(edu => edu.sys_id);
            const parsedEducations = parsedResume.education.map((edu) => {
                const newId = generateInt32Id(existingIds);
                existingIds.push(newId);
                return {
                    sys_id: newId,
                    userId: 0,
                    institution: edu.institution,
                    degree: edu.degree,
                    fieldOfStudy: edu.fieldOfStudy,
                    location: edu.location,
                    grade: edu.grade,
                    startDate: edu.startDate,
                    endDate: edu.endDate,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isEditing: true,
                    isPresent: !edu.endDate,
                    temporary: true
                };
            });
            setEducations(prevEducations => [...prevEducations, ...parsedEducations]);
        }
    }, [parsedResume]);

    const handleChange = (sys_id: number, field: keyof EducationWithId, value: any) => {
        setEducations(prevEducations =>
            prevEducations.map(edu => {
                if (edu.sys_id === sys_id) {
                    if (field === 'isPresent' && typeof value === 'boolean') {
                        return {
                            ...edu,
                            [field]: value,
                            endDate: value ? null : new Date().toISOString(),
                        };
                    }
                    const updatedEducation = { ...edu, [field]: value };
                    const currentErrors = validationErrors[sys_id] || [];
                    const updatedErrors = currentErrors.filter(error => error.field !== field);
                    setValidationErrors({
                        ...validationErrors,
                        [sys_id]: updatedErrors
                    });
                    return updatedEducation;
                }
                return edu;
            })
        );
    };

    const handleDateChange = (sys_id: number, field: 'startDate' | 'endDate', value: string) => {
        setEducations(prevEducations =>
            prevEducations.map(edu =>
                edu.sys_id === sys_id ? { ...edu, [field]: value } : edu
            )
        );
    };

    const toggleEdit = async (sys_id: number) => {
        const education = educations.find(edu => edu.sys_id === sys_id);
        if (!education) return;

        if (education.isEditing) {
            const errors = validateEducation(education);
            if (errors.length > 0) {
                setValidationErrors({
                    ...validationErrors,
                    [sys_id]: errors
                });
                return;
            }
            try {
                await saveEducationAPI(education);
                toast.success("Education saved successfully");
                setEducations(educations.map(edu =>
                    edu.sys_id === sys_id ? { ...edu, isEditing: false, temporary: false } : edu
                ));
            } catch (error: any) {
                const errorMessage = error.response?.data?.errors?.[0] || "Failed to save education";
                toast.error(errorMessage);
            }
        } else {
            setEducations(educations.map(edu =>
                edu.sys_id === sys_id ? { ...edu, isEditing: true } : edu
            ));
        }
    };

    const addNewItem = () => {
        const existingIds = educations.map(edu => edu.sys_id);
        const newEducation: EducationWithId = {
            sys_id: generateInt32Id(existingIds),
            userId: 0,
            institution: "",
            degree: "",
            fieldOfStudy: "",
            location: "",
            grade: "",
            startDate: new Date().toISOString(),
            endDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEditing: true,
            isPresent: true,
            temporary: true
        };
        setEducations([...educations, newEducation]);
    };

    const removeItem = async (sys_id: number) => {
        try {
            if (!educations.find(edu => edu.sys_id === sys_id)?.temporary)
                await deleteEducation(sys_id);
            setEducations(educations.filter((item) => item.sys_id !== sys_id));
            toast.success("Education removed successfully");
        } catch (error) {
            toast.error("Failed to remove education");
            console.error('Error removing education:', error);
        }
    };

    const renderError = (sys_id: number, field: string) => {
        const errors = validationErrors[sys_id] || [];
        const error = errors.find(e => e.field === field);
        if (error) {
            return <span className="text-red-500 text-sm mt-1">{error.message}</span>;
        }
        return null;
    };

    if (isLoading)
        return (
            <div className='space-y-4 p-4'>
                <div className="bg-white rounded-xl font-manrope shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
                    <div className="border-b border-gray-100">
                        <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                            <h1 className="flex items-center gap-2">
                                <Skeleton className="bg-blue-50 w-8 h-8 rounded-full" />
                                <Skeleton className="h-6 w-40" />
                            </h1>
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-20 rounded-lg" />
                                <Skeleton className="h-9 w-20 rounded-lg" />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-10 w-[80%] rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        );



    const renderEducationForm = (education: EducationWithId, index: number) => (
        <div
            key={education.sys_id}
            className="bg-white rounded-xl font-manrope shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
        >
            {/* Header Section */}
            <div className="border-b border-gray-100">
                <div className="px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <h1 className="font-manrope text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                            {index + 1}
                        </span>
                        {education.institution || "New Education"}
                    </h1>
                    <div className="flex  gap-2 mt-2 sm:mt-0">
                        {education.isEditing ? (
                            <Button
                                variant="secondary"
                                onClick={() => toggleEdit(education.sys_id)}
                                className="border-[0.5px] font-semibold font-manrope p-4 sm:p-5 sm:w-32 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                            >
                                <SaveIcon className="w-4 h-4 mr-2" /> Save
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                onClick={() => toggleEdit(education.sys_id)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-medium px-3 sm:px-5 py-2 sm:w-32 border-[0.5px] border-emerald-200 rounded-lg transition-color"
                            >
                                <EditIcon className="w-4 h-4 mr-2" /> Edit
                            </Button>
                        )}
                        <Button
                            variant="destructive"
                            onClick={() => removeItem(education.sys_id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 sm:px-5 py-2 sm:w-32 border-[0.5px] border-red-200 rounded-lg transition-color"
                        >
                            <TrashIcon className="w-4 h-4 mr-2" /> Remove
                        </Button>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-6 space-y-6">
                {/* Institution & Degree Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-gray-400" />
                            Institution
                        </label>
                        <input
                            placeholder="Enter institution name"
                            value={education.institution}
                            onChange={(e) =>
                                handleChange(education.sys_id, "institution", e.target.value)
                            }
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!education.isEditing}
                        />
                        {renderError(education.sys_id, "institution")}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                            Degree
                        </label>
                        <input
                            placeholder="Enter degree"
                            value={education.degree}
                            onChange={(e) =>
                                handleChange(education.sys_id, "degree", e.target.value)
                            }
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!education.isEditing}
                        />
                        {renderError(education.sys_id, "degree")}
                    </div>
                </div>

                {/* Field of Study & Grade Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-gray-400" />
                            Field of Study
                        </label>
                        <input
                            placeholder="Enter field of study"
                            value={education.fieldOfStudy}
                            onChange={(e) =>
                                handleChange(education.sys_id, "fieldOfStudy", e.target.value)
                            }
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!education.isEditing}
                        />
                        {renderError(education.sys_id, "fieldOfStudy")}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-gray-400" />
                            Grade
                        </label>
                        <input
                            placeholder="Enter grade"
                            value={education.grade}
                            onChange={(e) =>
                                handleChange(education.sys_id, "grade", e.target.value)
                            }
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!education.isEditing}
                        />
                    </div>
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Start Date
                        </label>
                        <div>
                            <MonthAndYearPicker
                                startYear={
                                    education.startDate
                                        ? parseInt(education.startDate.split("-")[0])
                                        : new Date().getFullYear()
                                }
                                startMonth={
                                    education.startDate
                                        ? parseInt(education.startDate.split("-")[1])
                                        : new Date().getMonth() + 1
                                }
                                disabled={!education.isEditing}
                                onDateChange={(date) =>
                                    handleDateChange(education.sys_id, "startDate", date)
                                }
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Currently Working
                        </label>
                        <div className="flex items-center gap-2 rounded-lg ring-1 ring-gray-200 p-2 h-[42px]">
                            <Switch
                                id={`present-${education.sys_id}`}
                                checked={education.isPresent}
                                onCheckedChange={(checked) =>
                                    handleChange(education.sys_id, "isPresent", checked)
                                }
                                disabled={!education.isEditing}
                                className="data-[state=checked]:bg-blue-500"
                            />
                            <Label className="text-sm text-gray-600">Present</Label>
                        </div>
                    </div>
                    {!education.isPresent && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                End Date
                            </label>
                            <div>
                                <MonthAndYearPicker
                                    startYear={
                                        education.endDate
                                            ? parseInt(education.endDate.split("-")[0])
                                            : new Date().getFullYear()
                                    }
                                    startMonth={
                                        education.endDate
                                            ? parseInt(education.endDate.split("-")[1])
                                            : new Date().getMonth() + 1
                                    }
                                    disabled={!education.isEditing || education.isPresent}
                                    onDateChange={(date) =>
                                        handleDateChange(education.sys_id, "endDate", date)
                                    }
                                />
                            </div>
                            {renderError(education.sys_id, "endDate")}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor={`location-${education.sys_id}`}
                        className="block text-sm font-manrope font-medium"
                    >
                        Location
                    </label>
                    <div className="relative w-full sm:w-[80%]">
                        <input
                            id={`location-${education.sys_id}`}
                            placeholder="Location"
                            value={education.location}
                            onChange={(e) =>
                                handleChange(education.sys_id, "location", e.target.value)
                            }
                            disabled={!education.isEditing}
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                        />
                    </div>
                </div>
            </div>
        </div>

    );

    return (
        <div className="space-y-4 p-4">
            {educations.length > 0 ? (
                educations.map((education, index) => renderEducationForm(education, index))
            ) : null}
            <div className="flex justify-center">
                <Button onClick={addNewItem}
                    className="border-[0.5px] font-semibold font-manrope p-6 w-56 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]">
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Education
                </Button>
            </div>
        </div>
    );
};

export default Education;
