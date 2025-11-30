import {combineReducers} from "@reduxjs/toolkit";
import authReducers from './auth/auth.slice'
import mcqReducers from './Mcq/Mcq.slice.ts'
import resumeReducers from '@/slices/Resume/Resume.slice'

const reducer = combineReducers(
    {
        auth: authReducers,
        mcq: mcqReducers,
        resume: resumeReducers
    }
)

export default reducer;
