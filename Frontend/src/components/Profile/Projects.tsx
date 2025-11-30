import React, { useEffect, useState } from 'react';
import { Button } from "@/components/Common/shadcnui/button";
import { Boxes, Calendar, Code, EditIcon, PlusIcon, SaveIcon, TrashIcon } from 'lucide-react';
import MonthAndYearPicker from '../Common/MonthAndYearPeaker/MonthAndYearPeaker';
import { useSelector } from "react-redux";
import { RootState } from "@/slices/store";
import { deleteProject, getProject, saveProject as saveProjectAPI } from "@/services/operations/UserOperations";
import { Switch } from "@/components/Common/shadcnui/switch";
import { Label } from "@/components/Common/shadcnui/label";
import { toast } from "sonner";
import { Skeleton } from '../Common/shadcnui/skeleton';

interface ValidationError {
    field: string;
    message: string;
}

interface ProjectWithId {
    sys_id: number;
    title: string;
    startDate: string;
    endDate: string | null;
    description: string;
    technologies: string[];
    isEditing: boolean;
    isPresent: boolean;
    errors?: ValidationError[];
    temporary: boolean;
}

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<ProjectWithId[]>([]);
    const [validationErrors, setValidationErrors] = useState<{ [key: number]: ValidationError[] }>({});
    const [isLoading, setIsLoading] = useState(false);
    const parsedResume = useSelector((state: RootState) => state.resume.data);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                const response = await getProject();
                const formattedProjects = response.data.map((proj: any) => ({
                    ...proj,
                    isEditing: false,
                    isPresent: proj.endDate === null,
                    temporary: false
                }));
                setProjects(prevProjects => [...prevProjects, ...formattedProjects]);
            } catch (error) {
                console.error('Error fetching project data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, []);

    useEffect(() => {
        if (parsedResume?.projects && parsedResume.projects.length > 0) {
            const existingIds = projects.map(proj => proj.sys_id);
            const formattedProjects = parsedResume.projects.map((proj: any) => {
                const newId = generateInt32Id(existingIds);
                existingIds.push(newId);
                return {
                    sys_id: newId,
                    title: proj.name || '',
                    startDate: proj.startDate || new Date().toISOString(),
                    endDate: proj.endDate || null,
                    description: proj.description || '',
                    technologies: proj.technologies || [],
                    isEditing: true,
                    isPresent: !proj.endDate,
                    temporary: true
                };
            });
            setProjects(prevProjects => [...prevProjects, ...formattedProjects]);
        }
    }, [parsedResume]);

    const validateProject = (project: ProjectWithId): ValidationError[] => {
        const errors: ValidationError[] = [];

        if (!project.title) {
            errors.push({ field: 'title', message: 'Title is required' });
        } else if (project.title.trim().length < 2) {
            errors.push({ field: 'title', message: 'Title must be at least 2 characters' });
        }

        if (!project.technologies || project.technologies.length === 0) {
            errors.push({ field: 'technologies', message: 'At least one technology is required' });
        }

        if (!project.startDate) {
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

    const handleChange = (sys_id: number, field: keyof ProjectWithId, value: any) => {
        setProjects(prevProjects =>
            prevProjects.map(proj => {
                if (proj.sys_id === sys_id) {
                    if (field === 'isPresent' && typeof value === 'boolean') {
                        return {
                            ...proj,
                            [field]: value,
                            endDate: value ? null : new Date().toISOString(),
                        };
                    }
                    const updatedProject = { ...proj, [field]: value };
                    const currentErrors = validationErrors[sys_id] || [];
                    const updatedErrors = currentErrors.filter(error => error.field !== field);
                    setValidationErrors({
                        ...validationErrors,
                        [sys_id]: updatedErrors
                    });
                    return updatedProject;
                }
                return proj;
            })
        );
    };

    const handleTechnologiesChange = (sys_id: number, value: string) => {
        const techArray = value.split(',').map(tech => tech.trim()).filter(tech => tech);
        handleChange(sys_id, 'technologies', techArray);
    };

    const handleDateChange = (sys_id: number, field: 'startDate' | 'endDate', value: string) => {
        setProjects(prevProjects =>
            prevProjects.map(proj =>
                proj.sys_id === sys_id ? { ...proj, [field]: value } : proj
            )
        );
    };

    const toggleEdit = async (sys_id: number) => {
        const project = projects.find(proj => proj.sys_id === sys_id);
        if (!project) return;

        if (project.isEditing) {
            const errors = validateProject(project);
            if (errors.length > 0) {
                setValidationErrors({
                    ...validationErrors,
                    [sys_id]: errors
                });
                return;
            }
            try {
                await saveProjectAPI(project);
                toast.success("Project saved successfully");
                setProjects(projects.map(proj =>
                    proj.sys_id === sys_id ? { ...proj, isEditing: false, temporary: false } : proj
                ));
            } catch (error: any) {
                const errorMessage = error.response?.data?.errors?.[0] || "Failed to save project";
                toast.error(errorMessage);
            }
        } else {
            setProjects(projects.map(proj =>
                proj.sys_id === sys_id ? { ...proj, isEditing: true } : proj
            ));
        }
    };

    const addNewItem = () => {
        const existingIds = projects.map(proj => proj.sys_id);
        const newProject: ProjectWithId = {
            sys_id: generateInt32Id(existingIds),
            title: "",
            startDate: new Date().toISOString(),
            endDate: null,
            description: "",
            technologies: [],
            isEditing: true,
            isPresent: true,
            temporary: true
        };
        setProjects([...projects, newProject]);
    };

    const removeItem = async (sys_id: number) => {
        try {
            if (!projects.find(proj => proj.sys_id === sys_id)?.temporary)
                await deleteProject(sys_id);
            setProjects(projects.filter((item) => item.sys_id !== sys_id));
            toast.success("Project removed successfully");
        } catch (error) {
            toast.error("Failed to remove project");
            console.error('Error removing project:', error);
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

    const renderProjectForm = (project: ProjectWithId, index: number) => (
        <div key={project.sys_id}
            className="bg-white rounded-xl font-manrope shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header Section */}
            <div className="border-b border-gray-100">
                <div className="px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <h1 className="font-manrope text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span
                            className="bg-blue-50 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                            {index + 1}
                        </span>
                        {project.title || "New Project"}
                    </h1>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                        {project.isEditing ? (
                            <Button
                                variant="secondary"
                                onClick={() => toggleEdit(project.sys_id)}
                                className="border-[0.5px] font-semibold font-manrope p-5 w-32 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                            >
                                <SaveIcon className="w-4 h-4 mr-2" /> Save
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                onClick={() => toggleEdit(project.sys_id)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-medium px-3 sm:px-5 py-2 sm:w-32 border-[0.5px] border-emerald-200 rounded-lg transition-color"
                            >
                                <EditIcon className="w-4 h-4 mr-2" /> Edit
                            </Button>
                        )}
                        <Button
                            variant="destructive"
                            onClick={() => removeItem(project.sys_id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600  font-medium p-5 w-32 border-[0.5px] border-red-200  rounded-lg transition-colors"
                        >
                            <TrashIcon className="w-4 h-4 mr-2" /> Remove
                        </Button>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-6 space-y-6">
                {/* Project Title & Technologies Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-gray-400" />
                            Project Title
                        </label>
                        <input
                            placeholder="Enter project title"
                            value={project.title}
                            onChange={(e) => handleChange(project.sys_id, 'title', e.target.value)}
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!project.isEditing}
                        />
                        {renderError(project.sys_id, 'title')}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Code className="w-4 h-4 text-gray-400" />
                            Technologies
                        </label>
                        <input
                            placeholder="Enter technologies (comma-separated)"
                            value={project.technologies.join(', ')}
                            onChange={(e) => handleTechnologiesChange(project.sys_id, e.target.value)}
                            className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-3 sm:pl-5 py-2 sm:py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                            disabled={!project.isEditing}
                        />
                        {renderError(project.sys_id, 'technologies')}
                    </div>
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
                                startYear={project.startDate ? parseInt(project.startDate.split('-')[0]) : new Date().getFullYear()}
                                startMonth={project.startDate ? parseInt(project.startDate.split('-')[1]) : new Date().getMonth() + 1}
                                disabled={!project.isEditing}
                                onDateChange={(date) => handleDateChange(project.sys_id, 'startDate', date)}
                            />
                        </div>
                        {renderError(project.sys_id, 'startDate')}
                    </div>

                    {/* Present Switch */}
                    <div className="space-y-2">
                        <label className=" text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Currently Working
                        </label>
                        <div className="flex items-center gap-2 rounded-lg ring-1 ring-gray-200 p-2 h-[42px]">
                            <Switch
                                id={`present-${project.sys_id}`}
                                checked={project.isPresent}
                                onCheckedChange={(checked) => handleChange(project.sys_id, 'isPresent', checked)}
                                disabled={!project.isEditing}
                                className="data-[state=checked]:bg-blue-500"
                            />
                            <Label className="text-sm text-gray-600">Present</Label>
                        </div>
                    </div>

                    {/* End Date */}
                    {!project.isPresent && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                End Date
                            </label>
                            <div className={` ${project.isPresent ? 'opacity-50' : ''}`}>
                                <MonthAndYearPicker
                                    startYear={project.endDate ? parseInt(project.endDate.split('-')[0]) : new Date().getFullYear()}
                                    startMonth={project.endDate ? parseInt(project.endDate.split('-')[1]) : new Date().getMonth() + 1}
                                    disabled={!project.isEditing || project.isPresent}
                                    onDateChange={(date) => handleDateChange(project.sys_id, 'endDate', date)}
                                />
                            </div>
                            {renderError(project.sys_id, 'endDate')}
                        </div>
                    )}
                </div>

                {/* Description */}

                <div className='space-y-2'>
                    <label htmlFor={`description-${project.sys_id}`}
                        className="block text-sm font-manrope font-medium">Description</label>
                    <textarea
                        id={`description-${project.sys_id}`}
                        placeholder="Project Description"
                        value={project.description}
                        onChange={(e) => handleChange(project.sys_id, 'description', e.target.value)}
                        className="w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-5 py-3 focus:outline-none focus:ring-1 focus:ring-blue-800"
                        disabled={!project.isEditing}
                        rows={4}
                    />
                    {renderError(project.sys_id, 'description')}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
            {projects.map((project, index) => renderProjectForm(project, index))}
            <div className="flex justify-center pt-4">
                <Button
                    onClick={addNewItem}
                    className="border-[0.5px] font-semibold font-manrope p-6 w-56 rounded-md border-[#c3deff] hover:bg-[#e5f1ff] bg-[#f6faff] text-[#4a516d]"
                >
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Project
                </Button>
            </div>
        </div>
    );
};

export default Projects;
