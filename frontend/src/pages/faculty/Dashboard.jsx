import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Activity, BookOpen, CalendarCheck, TrendingUp, Users } from 'lucide-react';

const StatCard = ({ icon, label, value, tone, helper }) => (
    <div className="card p-5">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</h3>
                {helper && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                {icon}
            </div>
        </div>
    </div>
);

const FacultyDashboard = () => {
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        totalSubjects: 0,
        averageAttendance: 0,
        recentActivities: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await axios.get('/faculty/dashboard');
                setStats(data);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const attendanceTone = useMemo(() => {
        if (stats.averageAttendance >= 85) return 'text-emerald-600';
        if (stats.averageAttendance >= 75) return 'text-blue-600';
        return 'text-red-600';
    }, [stats.averageAttendance]);

    if (loading) {
        return <div className="card p-8 text-sm text-slate-500">Loading faculty dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <p className="page-kicker">Faculty Workspace</p>
                <h2 className="page-title">Teaching Overview</h2>
                <p className="page-subtitle">Track your assigned classes, subjects, attendance, and recent academic activity.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={<BookOpen size={22} />} label="Assigned Classes" value={stats.totalClasses} helper="Sections under your subjects" tone="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300" />
                <StatCard icon={<Users size={22} />} label="Students Covered" value={stats.totalStudents} helper="Unique enrolled students" tone="bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300" />
                <StatCard icon={<CalendarCheck size={22} />} label="Subjects Assigned" value={stats.totalSubjects} helper="Active teaching load" tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300" />
                <StatCard icon={<TrendingUp size={22} />} label="Avg Attendance" value={`${stats.averageAttendance}%`} helper="Across marked records" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <section className="card p-5 xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="section-title">Recent Attendance Activity</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Latest saved attendance entries.</p>
                        </div>
                        <Activity className="text-blue-600" size={22} />
                    </div>

                    {stats.recentActivities.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-dark-border">
                            No recent attendance activity.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-dark-border">
                            {stats.recentActivities.map(activity => (
                                <div key={activity.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{activity.className}</p>
                                        <p className="text-sm text-slate-500">{activity.subject} / Period {activity.period}</p>
                                    </div>
                                    <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                                        {activity.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="card p-5">
                    <h3 className="section-title">Attendance Health</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Current average for your assigned subjects.</p>
                    <div className="mt-6 flex items-end gap-3">
                        <span className={`text-5xl font-bold ${attendanceTone}`}>{stats.averageAttendance}%</span>
                        <span className="pb-2 text-sm text-slate-500">average</span>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(stats.averageAttendance, 100)}%` }} />
                    </div>
                    <p className="mt-4 text-xs text-slate-500">Use Mark Attendance to review past records or update incorrect entries.</p>
                </section>
            </div>
        </div>
    );
};

export default FacultyDashboard;
