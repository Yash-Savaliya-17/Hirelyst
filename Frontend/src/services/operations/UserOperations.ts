import { apiConnector } from "../apiConnector";
import { resumeEndPoints, userEndPoints } from "../apis";

export async function saveProfileData(data: any) {
    return await apiConnector("PUT", userEndPoints.SAVE_PERSONAL_DATA, data)
}

export async function getEducation() {
    return await apiConnector("GET", userEndPoints.GET_EDUCATION);
}

export async function saveEducation(data: any) {
    return await apiConnector("PUT", userEndPoints.SAVE_EDUCATION, data);
}

export async function deleteEducation(id: number) {
    return await apiConnector("DELETE", userEndPoints.SAVE_EDUCATION + `/${id}`);
}

export async function getExperience() {
    return await apiConnector("GET", userEndPoints.GET_EXPERIENCE);
}

export async function saveExperience(data: any) {
    return await apiConnector("PUT", userEndPoints.GET_EXPERIENCE, data);
}

export async function deleteExperience(id: number) {
    return await apiConnector("DELETE", userEndPoints.GET_EXPERIENCE + `/${id}`);
}

export async function getProject() {
    return await apiConnector("GET", userEndPoints.GET_PROJECTS);
}

export async function saveProject(data: any) {
    return await apiConnector("PUT", userEndPoints.GET_PROJECTS, data);
}

export async function deleteProject(id: number) {
    return await apiConnector("DELETE", userEndPoints.GET_PROJECTS + `/${id}`);
}

export async function getUserQuizzes() {
    return await apiConnector("GET", userEndPoints.GET_USER_QUIZZES);
}

export async function updateEmail(email: string) {
    return await apiConnector("PUT", userEndPoints.UPDATE_EMAIL, { email })
}

export async function parseResume(data: any) {
    return await apiConnector("POST", userEndPoints.PARSE_RESUME, data);
}

export async function getUserCreatedQuizzes() {
    return await apiConnector("GET", userEndPoints.GET_USER_CREATED_QUIZZES);
}

