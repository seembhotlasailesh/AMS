import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, BookOpen, CalendarCheck, Settings, LogOut, ClipboardList, GraduationCap } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    let menuItems = [];

    if (user?.role === 'MAIN_ADMIN' || user?.role === 'ADMIN') {
        menuItems = [
            { path: '/main-admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { path: '/main-admin/colleges', icon: <BookOpen size={20} />, label: 'Colleges' },
            { path: '/main-admin/college-admins', icon: <Users size={20} />, label: 'College Admins' },
            { path: '/main-admin/subjects', icon: <BookOpen size={20} />, label: 'Subjects' },
            { path: '/main-admin/faculty', icon: <Users size={20} />, label: 'Faculty' },
            { path: '/main-admin/students', icon: <Users size={20} />, label: 'Students' },
        ];
    } else if (user?.role === 'COLLEGE_ADMIN') {
        menuItems = [
            { path: '/college-admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { path: '/college-admin/subjects', icon: <BookOpen size={20} />, label: 'Subjects' },
            { path: '/college-admin/faculty', icon: <Users size={20} />, label: 'Faculty' },
            { path: '/college-admin/students', icon: <Users size={20} />, label: 'Students' },
        ];
    } else if (user?.role === 'FACULTY') {
        menuItems = [
            { path: '/faculty/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { path: '/faculty/subjects', icon: <BookOpen size={20} />, label: 'Subjects' },
            { path: '/faculty/marks', icon: <ClipboardList size={20} />, label: 'Marks' },
            { path: '/faculty/attendance', icon: <CalendarCheck size={20} />, label: 'Mark Attendance' },
            { path: '/faculty/leaves', icon: <Settings size={20} />, label: 'Leave Requests' },
        ];
    } else if (user?.role === 'STUDENT') {
        menuItems = [
            { path: '/student/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { path: '/student/performance', icon: <ClipboardList size={20} />, label: 'Performance' },
            { path: '/student/attendance', icon: <CalendarCheck size={20} />, label: 'My Attendance' },
            { path: '/student/leaves', icon: <Settings size={20} />, label: 'Apply Leave' },
        ];
    }

    return (
        <aside className="flex min-h-screen w-16 shrink-0 flex-col border-r border-blue-100 bg-white text-slate-700 transition-all duration-300 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 md:w-60">
            <div className="border-b border-blue-50 p-4 dark:border-dark-border">
                <div className="flex items-center justify-center gap-3 md:justify-start">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                        <GraduationCap size={19} />
                    </div>
                    <div className="hidden md:block">
                        <h1 className="text-sm font-bold tracking-wide text-slate-950 dark:text-white">AMS Portal</h1>
                        <p className="mt-0.5 text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role?.toLowerCase()} Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4 md:px-3">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-600/20 dark:text-primary-100'
                                : 'text-slate-600 hover:bg-blue-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="hidden font-medium md:inline">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-blue-50 p-3 dark:border-dark-border">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <LogOut size={18} />
                    <span className="hidden md:inline">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
