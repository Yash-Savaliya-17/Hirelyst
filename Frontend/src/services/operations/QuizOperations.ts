import {apiConnector} from "../apiConnector";
import {quizEndPoints} from "../apis";

export async function startQuiz(quizId: number) {
    return await apiConnector("PUT", quizEndPoints.START_QUIZ + quizId)
}

export async function checkRegistration(quizId: number) {
    return await apiConnector("GET", quizEndPoints.CHECK_REGISTRATION + quizId);
}


export async function sendQuizInvite(quizId: number, emails: string[]) {
    return await apiConnector("POST", quizEndPoints.GET_QUIZ_API + quizId + "/send-quiz-invites", { emails })
}

export async function CreateQuiz(data: any) {
    return await apiConnector("POST", quizEndPoints.CREATE_QUIZ_API, data);
}

export async function getSubjects() {
    return await apiConnector("GET", quizEndPoints.GET_SUBJECTS_API);
}

export async function getQuiz(quizId: any) {
    return await apiConnector("GET", quizEndPoints.GET_QUIZ_API + quizId);
}

export async function getAttendees(quizId: any) {
    return await apiConnector("GET", quizEndPoints.GET_QUIZ_API + quizId + "/attendees");
}

export async function getQuizQuestions(quizId: any) {
    return await apiConnector("GET", quizEndPoints.GET_QUIZ_API + quizId + "/questions");
}

export async function RegisterQuiz(quizId: any) {
    return await apiConnector("PUT", quizEndPoints.REGISTER_QUIZ_API + quizId);
}

export async function SubmitResponse(quizId: any, questionId: any, data: any) {
    return await apiConnector("PUT", quizEndPoints.SUBMIT_RESPONSE + quizId + "/submit-response/" + questionId, { response: data.response, status: data.status });
}

export async function getQuizReport(quizId: any) {
    return await apiConnector("GET", quizEndPoints.GET_QUIZ_REPORT + quizId + "/report");
}

export async function getLeaderBoard(quizId: number) {
    return await apiConnector("GET", quizEndPoints.GET_QUIZ_LEADERBOARD + quizId + "/leaderboard");
}

export async function getAiQuizDomains() {
    return await apiConnector("GET", quizEndPoints.GET_AI_QUIZ_DOMAINS);
}

export async function GenerateAiQuiz(data: any) {
    return await apiConnector("POST", quizEndPoints.GENERATE_AI_QUIZ, data);
}

export async function regenerateQuizQuestion(quizQuestionId: number) {
    return await apiConnector("POST", quizEndPoints.REGENERATE_QUESTION + `${quizQuestionId}` , {});
}