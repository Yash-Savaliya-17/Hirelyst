import { apiConnector } from "../apiConnector";
import { resumeEndPoints } from "../apis";


// export async function ParseResume(data: any) {
//     return await apiConnector("POST", resumeEndPoints.PARSE_RESUME, data);
// }

export async function resumeATSscore(data: any) {
    return await apiConnector("POST", resumeEndPoints.RESUME_ATS_SCORE, data);
}