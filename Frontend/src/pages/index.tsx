import Login from "@/pages/Authentication/Login.tsx";
import Register from "@/pages/Authentication/Register.tsx";
import AuthTemplate from "@/pages/Templates/AuthTemplate.tsx";
import {MainHeader} from "@/pages/Templates/MainHeader.tsx";
import Header from "@/pages/Templates/Header.tsx";
import ResetPassword from "@/pages/Authentication/ResetPassword.tsx"
import Navbar from "@/components/Navbar/Navbar.tsx";
// import SideNavbar from "@/components/Navbar/SideNavbar.tsx";
import ForgotPassword from "@/pages/Authentication/ForgotPassword.tsx";
import HomePage from "@/pages/Home/HomePage.tsx";
import GenerateQuiz from "@/pages/Quiz/GenerateQuiz/GenerateQuiz.tsx";
import McqPage from "@/pages/Quiz/McqPage.tsx";
import QuizQuestions from "@/pages/Quiz/QuizQuestions/QuizQuestions.tsx";
import ProfileTemplate from "@/pages/Templates/ProfileTemplate.tsx";
import Personal from "@/components/Profile/Personal.tsx";
import Certificates from "@/components/Profile/Personal.tsx";
import PersonalSetting from "@/components/Profile/Personal.tsx";
import Education from "@/components/Profile/Education.tsx";
import Projects from "@/components/Profile/Projects.tsx";
import Experience from "@/components/Profile/Experience.tsx";
import HomeQuiz from "@/pages/Quiz/HomeQuiz.tsx";
// import DashboardTemplate from "./Templates/DashboardTemplate.tsx";
import Quizzes from "./Dashboard/Quizzes.tsx";
import Leaderboard from "./Dashboard/Leaderboard.tsx";
import AttemptedQuizzes from "./Dashboard/AttemptedQuizzes.tsx";
import CreatedQuizzes from "./Dashboard/CreatedQuizzes.tsx";
import Setting from "./Setting/Setting.tsx";
import WebcamRecorder from "@/pages/Interview";
import ResumeScore from "./ResumeATS/ResumeScore.tsx";
import Logout from "@/components/Profile/Logout.tsx";
import VerifyEmail from "@/pages/Authentication/VerifyEmail.tsx";
import QuizReport from "@/pages/Quiz/QuizReport.tsx";
import InterviewReport from "@/pages/Interview/InterviewReport.tsx";

export {
    QuizReport,
    VerifyEmail,
    Login,
    Register,
    AuthTemplate,
    ResetPassword,
    ForgotPassword,
    MainHeader,
    AttemptedQuizzes,
    CreatedQuizzes,
    Navbar,
    ResumeScore,
    // DashboardTemplate,
    HomePage,
    PersonalSetting,
    Logout,
    // SideNavbar,
    GenerateQuiz,
    McqPage,
    Header,
    ProfileTemplate,
    Personal,
    HomeQuiz,
    Education,
    Projects,
    QuizQuestions,
    Experience,
    Certificates,
    WebcamRecorder,
    Quizzes,
    Leaderboard,
    Setting,
    InterviewReport
};
