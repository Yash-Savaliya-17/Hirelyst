import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Interface for Contact Information
interface ContactInformation {
    phone: string;
    email: string;
    linkedIn?: string;
    gitHub?: string;
    address?: string;
    city?: string;
    state?: string;
}

// Interface for Education
export interface Education {
    grade: string;
    fieldOfStudy: string;
    institution: string;
    location: string;
    degree: string;
    startDate: string;
    endDate: string;
    details?: string;
    cgpa?: string;
}

// Interface for Skills
interface Skills {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
}

// Interface for Experience
export interface Experience {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
}

// Interface for Projects
export interface Project {
    name: string;
    technologies: string[];
    description: string;
    status?: string;
    startDate: string;
    endDate: string;
    link ?: string;
}

// Interface for Coding Platforms
interface CodingPlatform {
    name: string;
    problemsSolved?: string | null;
    rating?: string | null;
    details?: string;
}

// Interface for Resume Data
export interface ResumeData {
    name: string;
    contactInformation: ContactInformation;
    education: Education[];
    skills: Skills;
    experience: Experience[];
    projects: Project[];
    extracurricularActivities: string[];
    codingPlatforms: CodingPlatform[];
}

// Initial State
export interface ResumeState {
    data: ResumeData | null;
    status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: ResumeState = {
    data: null,
    status: "idle",
};

// Redux Slice
const resumeSlice = createSlice({
    name: "resume",
    initialState,
    reducers: {
        setResumeData: (state, action: PayloadAction<ResumeData>) => {
            state.data = action.payload;
            state.status = "succeeded";
        },
        clearResumeData: (state) => {
            state.data = null;
            state.status = "idle";
        },
        setLoading: (state) => {
            state.status = "loading";
        },
        setError: (state) => {
            state.status = "failed";
        },
    },
});

// Export actions and reducer
export const { setResumeData, clearResumeData, setLoading, setError } = resumeSlice.actions;
export default resumeSlice.reducer;
