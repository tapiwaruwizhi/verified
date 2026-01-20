import Assignments from './pages/Assignments';
import Courses from './pages/Courses';
import Home from './pages/Home';
import ManageCourses from './pages/ManageCourses';
import MySubmissions from './pages/MySubmissions';
import RevealRequests from './pages/RevealRequests';
import SessionAnalysis from './pages/SessionAnalysis';
import StudentAssignments from './pages/StudentAssignments';
import StudentEditor from './pages/StudentEditor';
import StudentForensics from './pages/StudentForensics';
import TeacherDashboard from './pages/TeacherDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assignments": Assignments,
    "Courses": Courses,
    "Home": Home,
    "ManageCourses": ManageCourses,
    "MySubmissions": MySubmissions,
    "RevealRequests": RevealRequests,
    "SessionAnalysis": SessionAnalysis,
    "StudentAssignments": StudentAssignments,
    "StudentEditor": StudentEditor,
    "StudentForensics": StudentForensics,
    "TeacherDashboard": TeacherDashboard,
}

export const pagesConfig = {
    mainPage: "StudentEditor",
    Pages: PAGES,
    Layout: __Layout,
};