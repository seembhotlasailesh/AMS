import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useAuth } from '../../context/AuthContext';
import { roleHomePath } from '../../utils/roles';

const Layout = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center p-8 text-slate-500">Loading AMS...</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={roleHomePath(user.role)} replace />;
    }

    return (
        <div className="flex min-h-screen bg-blue-50/50 font-sans text-slate-900 transition-colors duration-200 dark:bg-dark-bg">
            <Sidebar />
            <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                <TopNav />
                <main className="flex-1 overflow-y-auto px-4 py-4 md:px-5 lg:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
