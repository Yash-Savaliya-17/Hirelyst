import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import './App.css';
import { AttemptedQuizzes, AuthTemplate, CreatedQuizzes, Education, Experience, ForgotPassword, GenerateQuiz, HomePage, HomeQuiz, InterviewReport, Leaderboard, Login, MainHeader, McqPage, Navbar, Personal, ProfileTemplate, Projects, QuizQuestions, QuizReport, Register, ResetPassword, ResumeScore, Setting, VerifyEmail, WebcamRecorder } from './pages/index.tsx';
import ProtectedLayout from "@/pages/Templates/ProtectedLayout.tsx";
import { GenericError, NotFound } from "@/pages/Errors";
import QuizAttendees from "@/pages/Quiz/QuizAttendees.tsx";
import BaseLayout from "@/pages/Templates/BaseLayout.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path="/error" element={<GenericError />} />
            <Route path="*" element={<NotFound />} />

            {/* Protected MCQ route */}
            <Route element={<ProtectedLayout requireAuth={true} />}>
                <Route path="/mcq/:id" element={<McqPage />} />
            </Route>

            <Route path="/" element={<Navbar />}>
                <Route index element={<HomePage />} />

                {/* Protected Profile and Settings routes */}
                <Route element={<ProtectedLayout requireAuth={true} />}>
                    <Route element={<ProfileTemplate />}>
                        <Route path="personal" element={<Personal />} />
                        <Route path="education" element={<Education />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="experience" element={<Experience />} />
                        <Route path="profilesetting" element={<Setting />} />
                    </Route>
                </Route>

                {/* Quiz routes */}
                <Route path="quiz">
                    <Route path=":id" element={<><BaseLayout /><HomeQuiz /></>} />
                    {/* Protected Quiz Report */}
                    <Route element={<ProtectedLayout requireAuth={true} />}>
                        <Route path=":id/report" element={<QuizReport />} />
                        <Route path=":id/leaderboard" element={<Leaderboard />} />
                        <Route path=":id/manage" element={<QuizAttendees />} />
                    </Route>
                </Route>
                <Route path='interview' element={<BaseLayout />}>
                    <Route path=":id/report" element={<InterviewReport />} />
                </Route>
            </Route>


            {/* Protected Dashboard routes */}
            <Route path='quiz' element={<ProtectedLayout requireAuth={true} withNavbar={false} />}>
                <Route element={<MainHeader />}>
                    <Route path="attempted" element={<AttemptedQuizzes />} />
                    <Route path="created" element={<CreatedQuizzes />} />
                    <Route path="create" element={<GenerateQuiz />} />
                    <Route path="create/:id/questions" element={<QuizQuestions />} />
                </Route>
            </Route>

            <Route path='interview' element={<ProtectedLayout requireAuth={true} withNavbar={false} />}>
                <Route element={<MainHeader />}>
                    <Route path="takeinterview" element={<WebcamRecorder />} />
                </Route>
            </Route>

            <Route path='resume' element={<ProtectedLayout requireAuth={true} withNavbar={false} />}>
                <Route element={<MainHeader />}>
                    <Route path="resumescore" element={<ResumeScore />} />
                </Route>
            </Route>

            {/* Auth routes */}
            <Route path="/" element={<AuthTemplate />}>
                <Route path="register" element={<Register />} />
                <Route path="login" element={<Login />} />
            </Route>

            {/* Public routes */}
            <Route path="/">
                <Route path="reset-password/:token" element={<ResetPassword />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="verify/:token" element={<VerifyEmail />} />
            </Route>
        </>
    )
);
export { router };
