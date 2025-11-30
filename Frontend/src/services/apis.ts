const BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api/auth/"

export const authEndPoints = {
    LOGIN_API: BASE_URL + "login",
    REGISTER_API: BASE_URL + "register",
    SENT_RESET_PASSWORD_API: BASE_URL + "send-reset-password-link",
    CHANGE_PASSWORD_API: BASE_URL + "change-password",
    VERIFY_RESET_PASSWORD_API: BASE_URL + "verify-reset-password-link/",
    RESET_PASSWORD_API: BASE_URL + "reset-password/",
    VERIFY_EMAIL_API: BASE_URL + "verify-email/",
    VERIFY_EMAIL: BASE_URL + "verify/",
    GOOGLE_LOGIN: BASE_URL + "google",
    AUTH_ME: BASE_URL + "me",
    LOGOUT: BASE_URL + "logout",
    SEND_VERIFICATION_MAIL: BASE_URL + "send-verification-mail",
}

const BASE_QUIZ_URL = import.meta.env.VITE_BACKEND_URL + "/api/quiz/"

export const quizEndPoints = {
    CREATE_QUIZ_API: BASE_QUIZ_URL,
    GET_SUBJECTS_API: BASE_QUIZ_URL + "subjects",
    GET_QUIZ_API: BASE_QUIZ_URL,
    GET_QUIZ_QUESTIONS_API: BASE_QUIZ_URL + "questions",
    SEND_QUIZ_INVITES: BASE_QUIZ_URL,
    REGISTER_QUIZ_API: BASE_QUIZ_URL + "register/",
    SUBMIT_RESPONSE: BASE_QUIZ_URL,
    CHECK_REGISTRATION: BASE_QUIZ_URL + "isRegistered/",
    START_QUIZ: BASE_QUIZ_URL + "start/",
    GET_QUIZ_REPORT: BASE_QUIZ_URL,
    GET_QUIZ_LEADERBOARD: BASE_QUIZ_URL,
    GET_AI_QUIZ_DOMAINS: BASE_QUIZ_URL + "ai-domains",
    GENERATE_AI_QUIZ: BASE_QUIZ_URL + "generate-ai-quiz",
    REGENERATE_QUESTION: BASE_QUIZ_URL + "regenerate-quiz-question/"
}


export const resumeEndPoints = {
    // PARSE_RESUME: import.meta.env.VITE_RESUME_SERVER_URL + '/parse-resume'
    RESUME_ATS_SCORE: import.meta.env.VITE_BACKEND_URL + '/api/resume/get-ats-score'
};

const INTERVIEW_BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api/interview/"

export const interviewEndPoints = {
    UPLOAD_VIDEO: INTERVIEW_BASE_URL + "upload-video",
    FINALIZE_UPLOAD: INTERVIEW_BASE_URL + "finalize-upload",
    SUBMIT_RESPONSE: INTERVIEW_BASE_URL + "submit-response",
    START_INTERVIEW: INTERVIEW_BASE_URL + "start",
    GET_QUESTION: INTERVIEW_BASE_URL + "next-question",
    START_ANALYSIS: INTERVIEW_BASE_URL + "start-analysis",
    GET_ANALYSIS: INTERVIEW_BASE_URL,
    GET_DOMAINS: INTERVIEW_BASE_URL + "domains"
}

const USER_BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api/users/"

export const userEndPoints = {
    SAVE_PERSONAL_DATA: USER_BASE_URL + 'personal-data',
    GET_EDUCATION: USER_BASE_URL + 'education',
    SAVE_EDUCATION: USER_BASE_URL + 'education',
    GET_EXPERIENCE: USER_BASE_URL + 'experience',
    GET_PROJECTS: USER_BASE_URL + 'projects',
    GET_USER_QUIZZES: USER_BASE_URL + 'quizzes',
    UPDATE_EMAIL: USER_BASE_URL + "email",
    PARSE_RESUME: USER_BASE_URL + "parse-resume",
    GET_USER_CREATED_QUIZZES: USER_BASE_URL + 'created-quizzes',
}
