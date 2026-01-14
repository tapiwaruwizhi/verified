import StudentEditor from './pages/StudentEditor';
import TeacherDashboard from './pages/TeacherDashboard';
import SessionAnalysis from './pages/SessionAnalysis';
import Assignments from './pages/Assignments';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "StudentEditor": StudentEditor,
    "TeacherDashboard": TeacherDashboard,
    "SessionAnalysis": SessionAnalysis,
    "Assignments": Assignments,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "StudentEditor",
    Pages: PAGES,
    Layout: __Layout,
};