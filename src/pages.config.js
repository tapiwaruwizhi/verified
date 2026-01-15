import Assignments from './pages/Assignments';
import Home from './pages/Home';
import MySubmissions from './pages/MySubmissions';
import RevealRequests from './pages/RevealRequests';
import SessionAnalysis from './pages/SessionAnalysis';
import StudentEditor from './pages/StudentEditor';
import StudentForensics from './pages/StudentForensics';
import TeacherDashboard from './pages/TeacherDashboard';
import Courses from './pages/Courses';
import ManageCourses from './pages/ManageCourses';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assignments": Assignments,
    "Home": Home,
    "MySubmissions": MySubmissions,
    "RevealRequests": RevealRequests,
    "SessionAnalysis": SessionAnalysis,
    "StudentEditor": StudentEditor,
    "StudentForensics": StudentForensics,
    "TeacherDashboard": TeacherDashboard,
    "Courses": Courses,
    "ManageCourses": ManageCourses,
}

export const pagesConfig = {
    mainPage: "StudentEditor",
    Pages: PAGES,
    Layout: __Layout,
};