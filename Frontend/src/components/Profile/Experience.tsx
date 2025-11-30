import React, { useEffect, useState } from 'react';
import { Button } from "@/components/Common/shadcnui/button";
import { EditIcon, PlusIcon, SaveIcon, TrashIcon, Building2, Briefcase, MapPin, Calendar } from 'lucide-react';
import MonthAndYearPicker from '../Common/MonthAndYearPeaker/MonthAndYearPeaker';
import { getExperience, saveExperience as saveExperienceAPI, deleteExperience } from "@/services/operations/UserOperations";
import { ResumeData } from "@/slices/Resume/Resume.slice";
import { useSelector } from "react-redux";
import { RootState } from "@/slices/store";
import { toast } from "sonner";
import { Switch } from "@/components/Common/shadcnui/switch";
import { Label } from "@/components/Common/shadcnui/label";
import { Skeleton } from '../Common/shadcnui/skeleton';

interface ExperienceWithId {
    sys_id: number;
    userId: number;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string | null;
    description: string;
    createdAt: string;
    updatedAt: string;
    isEditing: boolean;
    isPresent: boolean;
    temporary: boolean;
}

const Experience: React.FC = () => {
    const [experiences, setExperiences] = useState<ExperienceWithId[]>([]);
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const parsedResume: ResumeData | null = useSelector((state: RootState) => state.resume.data);

    useEffect(() => {
        const fetchExperience = async () => {
            try {
                setIsLoading(true);
                const response = await getExperience();
                const formattedExperiences = response.data.map((exp: ExperienceWithId) => ({
                    ...exp,
                    isEditing: false,
                    isPresent: exp.endDate === null,
                    temporary: false
                }));
                setExperiences(formattedExperiences);
                setIsInitialDataLoaded(true);
            } catch (error) {
                console.error('Error fetching experience data:', error);
                setIsInitialDataLoaded(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExperience();
    }, []);



    useEffect(() => {
        if (isInitialDataLoaded && parsedResume?.experience) {
            const existingIds = experiences.map(exp => exp.sys_id);
            const parsedExperiences = parsedResume.experience.map((exp) => ({
                sys_id: generateInt32Id(existingIds),
                userId: 0,
                title: exp.title || '',
                company: exp.company || '',
                location: exp.location || '',
                startDate: exp.startDate || new Date().toISOString(),
                endDate: exp.endDate || null,
                description: exp.description || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isEditing: true,
                isPresent: !exp.endDate,
                temporary: true
            }));

            setExperiences(prevExperiences => {
                const newExperiences = [...prevExperiences];
                parsedExperiences.forEach(parsedExp => {
                    if (!newExperiences.some(exp =>
                        exp.company === parsedExp.company &&
                        exp.title === parsedExp.title
                    )) {
                        newExperiences.push(parsedExp);
                    }
                });
                return newExperiences;
            });
        }
    }, [parsedResume, isInitialDataLoaded, experiences]);

    const generateInt32Id = (existing: number[]): number => {
        const MIN_VALUE = 1;
        const MAX_VALUE = 2147483647;
        let newId: number;
        do {
            newId = Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE) + MIN_VALUE);
        } while (existing.includes(newId));
        return newId;
    };

    const handleChange = (
        sys_id: number,
        field: keyof ExperienceWithId,
        value: string | boolean
    ) => {
        setExperiences(prevExperiences =>
            prevExperiences.map(exp => {
                if (exp.sys_id === sys_id) {
                    if (field === 'isPresent' && typeof value === 'boolean') {
                        return {
                            ...exp,
                            [field]: value,
                            endDate: value ? null : new Date().toISOString(),
                        };
                    }
                    return { ...exp, [field]: value };
                }
                return exp;
            })
        );
    };

    const handleDateChange = (sys_id: number, field: 'startDate' | 'endDate', value: string) => {
        setExperiences(prevExperiences =>
            prevExperiences.map(exp =>
                exp.sys_id === sys_id ? { ...exp, [field]: value } : exp
            )
        );
    };

    const saveExperience = async (experience: ExperienceWithId) => {
        try {
            const expToSave = {
                ...experience,
                endDate: experience.isPresent ? null : experience.endDate, // Ensure endDate is null when isPresent is true
            };
            const response = await saveExperienceAPI(expToSave);
            toast.success("Experience saved successfully");
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response.data.errors[0] || "Failed to save experience";
            toast.error(errorMessage);
            throw error;
        }
    };

    const toggleEdit = async (sys_id: number) => {
        const experience = experiences.find(exp => exp.sys_id === sys_id);
        if (!experience) return;

        if (experience.isEditing) {
            try {
                await saveExperience(experience);
                setExperiences(prevExperiences =>
                    prevExperiences.map(exp =>
                        exp.sys_id === sys_id ? { ...exp, isEditing: false, temporary: false } : exp
                    )
                );
            } catch (error) {
                console.error('Failed to save experience:', error);
            }
        } else {
            setExperiences(prevExperiences =>
                prevExperiences.map(exp =>
                    exp.sys_id === sys_id ? { ...exp, isEditing: true } : exp
                )
            );
        }
    };

    const addNewItem = () => {
        const existingIds = experiences.map(exp => exp.sys_id);
        const newExperience: ExperienceWithId = {
            sys_id: generateInt32Id(existingIds),
            userId: 0,
            title: "",
            company: "",
            location: "",
            startDate: new Date().toISOString(),
            endDate: null,
            description: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEditing: true,
            isPresent: true,
            temporary: true
        };
        setExperiences(prevExperiences => [...prevExperiences, newExperience]);
    };

    const removeItem = async (sys_id: number) => {
        try {
            if (!experiences.find(exp => exp.sys_id === sys_id)?.temporary)
                await deleteExperience(sys_id);
            setExperiences(prevExperiences =>
                prevExperiences.filter(item => item.sys_id !== sys_id)
            );
            toast.success("Experience removed successfully");
        } catch (error) {
            toast.error("Failed to remove experience");
            console.error('Error removing experience:', error);
        }
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

    const renderExperienceForm = (experience: ExperienceWithId, index: number) => (
        <div key={experience.sys_id} className="bg-white font-manrope rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header Section */}
            <div className="border-b border-gray-100">
                <div className="px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <h1 className="font-manrope text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                            {index + 1}
                        </span>
                        {experience.company || "New Experience"}
                    </h1>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                        {experience.isEditing ? (
                            <Button
                                variant="secondary"
                                onClick={() => toggleEdit(experience.sys_id)}
                                className="border-[0.5px] font-semibold font-manrope p-5 w-32 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                            >
                                <SaveIcon className="w-4 h-4 mr-2" /> Save
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                onClick={() => toggleEdit(experience.sys_id)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-medium px-3 sm:px-5 py-2 sm:w-32 border-[0.5px] border-emerald-200 rounded-lg transition-color"
                            >
                                <EditIcon className="w-4 h-4 mr-2" /> Edit
                            </Button>
                        )}
                        <Button
                            variant="destructive"
                            onClick={() => removeItem(experience.sys_id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600  font-medium p-5 w-32 border-[0.5px] border-red-200  rounded-lg transition-color"
                        >
                            <TrashIcon className="w-4 h-4 mr-2" /> Remove
                        </Button>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-6 space-y-6">
                {/* Company & Job Title Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            Company Name
                        </label>
                        <input
                            placeholder="Enter company name"
                            value={experience.company}
                            onChange={(e) => handleChange(experience.sys_id, 'company', e.target.value)}
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!experience.isEditing}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            Job Title
                        </label>
                        <input
                            placeholder="Enter job title"
                            value={experience.title}
                            onChange={(e) => handleChange(experience.sys_id, 'title', e.target.value)}
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!experience.isEditing}
                        />
                    </div>
                </div>

                {/* Location Row */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        Location
                    </label>
                    <input
                        placeholder="Enter location"
                        value={experience.location}
                        onChange={(e) => handleChange(experience.sys_id, 'location', e.target.value)}
                        className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-5 py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                        disabled={!experience.isEditing}
                    />
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Start Date
                        </label>
                        <div className="">
                            <MonthAndYearPicker
                                startYear={experience.startDate ? parseInt(experience.startDate.split('-')[0]) : new Date().getFullYear()}
                                startMonth={experience.startDate ? parseInt(experience.startDate.split('-')[1]) : new Date().getMonth() + 1}
                                disabled={!experience.isEditing}
                                onDateChange={(date) => handleDateChange(experience.sys_id, 'startDate', date)}
                            />
                        </div>
                    </div>

                    {/* Present Switch */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Currently Working
                        </label>
                        <div className="flex items-center gap-2 rounded-lg ring-1 ring-gray-200 p-2 h-[42px]">
                            <Switch
                                id={`present-${experience.sys_id}`}
                                checked={experience.isPresent}
                                onCheckedChange={(checked) => handleChange(experience.sys_id, 'isPresent', checked)}
                                disabled={!experience.isEditing}
                                className="data-[state=checked]:bg-blue-500"
                            />
                            <Label className="text-sm text-gray-600">Present</Label>
                        </div>
                    </div>

                    {/* End Date */}
                    {
                        !experience.isPresent &&
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                End Date
                            </label>
                            <div className={` ${experience.isPresent ? 'opacity-50' : ''}`}>
                                <MonthAndYearPicker
                                    startYear={experience.endDate ? parseInt(experience.endDate.split('-')[0]) : new Date().getFullYear()}
                                    startMonth={experience.endDate ? parseInt(experience.endDate.split('-')[1]) : new Date().getMonth() + 1}
                                    disabled={!experience.isEditing || experience.isPresent}
                                    onDateChange={(date) => handleDateChange(experience.sys_id, 'endDate', date)}
                                />
                            </div>
                        </div>
                    }
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        placeholder="Describe your role and responsibilities..."
                        value={experience.description}
                        onChange={(e) => handleChange(experience.sys_id, 'description', e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-lg border-0 ring-1 ring-gray-200 text-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px] resize-y"
                        disabled={!experience.isEditing}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
            {experiences.map((experience, index) => renderExperienceForm(experience, index))}
            <div className="flex justify-center pt-4">
                <Button
                    onClick={addNewItem}
                    className="border-[0.5px] font-semibold font-manrope p-6 w-56 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                >
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Experience
                </Button>
            </div>
        </div>
    );
}

export default Experience;
