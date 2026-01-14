import StudentEditor from './pages/StudentEditor';
import TeacherDashboard from './pages/TeacherDashboard';
import SessionAnalysis from './pages/SessionAnalysis';
import Assignments from './pages/Assignments';


export const PAGES = {
    "StudentEditor": StudentEditor,
    "TeacherDashboard": TeacherDashboard,
    "SessionAnalysis": SessionAnalysis,
    "Assignments": Assignments,
}

export const pagesConfig = {
    mainPage: "StudentEditor",
    Pages: PAGES,
};