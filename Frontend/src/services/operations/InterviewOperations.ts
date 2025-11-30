import {apiConnector} from "../apiConnector";
import {interviewEndPoints} from "../apis";

export async function getQuestion(interviewId: number) {
    return await apiConnector("GET", interviewEndPoints.GET_QUESTION + "/" + interviewId);
}
export function submitResponse(data: { interviewId: number, questionId: string, s3Url: string }) {
    return apiConnector("POST", interviewEndPoints.SUBMIT_RESPONSE, data);
}
export function startInterview(data: { domain: string, codomain: string, level: string, count: number }) {
    return apiConnector("POST", interviewEndPoints.START_INTERVIEW, data);
}
export function startAnalysisApi(data: { interviewId: number }) {
    return apiConnector("POST", interviewEndPoints.START_ANALYSIS, data);
}
export function getAnalysis(interviewId: any) {
    return apiConnector("GET", interviewEndPoints.GET_ANALYSIS  + interviewId + "/analysis");
}
export function getDomains() {
    return apiConnector("GET", interviewEndPoints.GET_DOMAINS);
}