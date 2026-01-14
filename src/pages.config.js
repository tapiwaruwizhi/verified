import StudentEditor from './pages/StudentEditor';
import TeacherDashboard from './pages/TeacherDashboard';
import SessionAnalysis from './pages/SessionAnalysis';
import Assignments from './pages/Assignments';
import Home from './pages/Home';
import MySubmissions from './pages/MySubmissions';
import StudentForensics from './pages/StudentForensics';
import RevealRequests from './pages/RevealRequests';
import __Layout from './Layout.jsx';


export const PAGES = {
    "StudentEditor": StudentEditor,
    "TeacherDashboard": TeacherDashboard,
    "SessionAnalysis": SessionAnalysis,
    "Assignments": Assignments,
    "Home": Home,
    "MySubmissions": MySubmissions,
    "StudentForensics": StudentForensics,
    "RevealRequests": RevealRequests,
}

export const pagesConfig = {
    mainPage: "StudentEditor",
    Pages: PAGES,
    Layout: __Layout,
};