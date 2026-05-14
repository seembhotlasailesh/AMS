import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import moment from 'moment';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        percentage: 0,
        total: 0
    });
    const [profile, setProfile] = useState(user?.student);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await axios.get('/student/dashboard');
                setProfile(data.student);
                setStats(data.attendance);
                setRecentAttendance(data.recentAttendance || []);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const COLORS = ['#22c55e', '#ef4444'];

    if (loading) return <div>Loading profile...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl text-white shadow-lg overflow-hidden relative">
                <div className="z-10 relative">
                    <h2 className="text-3xl font-bold mb-1">Hello, {profile?.name || user?.name}</h2>
                    <p className="text-blue-100 opacity-90">
                        Enrollment: <span className="font-mono">{profile?.enrollmentNo}</span>
                        {' '}| Class: {profile?.class?.name || 'Assigned soon'}
                        {' '}| Department: {profile?.department?.name || 'Unassigned'}
                    </p>
                </div>
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 14L20.85 9.58L12 5.16L3.15 9.58L12 14ZM12 16.14L3.15 11.72L1.5 12.55L12 17.8L22.5 12.55L20.85 11.72L12 16.14Z" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 card p-6 flex flex-col justify-center items-center">
                    <h3 className="text-lg font-bold mb-4 w-full text-left dark:text-white">Attendance Overview</h3>
                    <div className="h-64 w-full relative flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Present', value: stats.present },
                                        { name: 'Absent', value: stats.absent }
                                    ]}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill={COLORS[0]} />
                                    <Cell fill={COLORS[1]} />
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute text-center flex flex-col items-center pointer-events-none">
                            <span className={`text-4xl font-black ${stats.percentage >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {stats.percentage}%
                            </span>
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Total</span>
                        </div>
                    </div>

                    <div className="w-full flex justify-between mt-4 px-4 text-sm font-medium">
                        <div className="flex items-center gap-2 text-green-600">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div> Present: {stats.present}
                        </div>
                        <div className="flex items-center gap-2 text-red-600">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div> Absent: {stats.absent}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6 flex flex-col">
                    {stats.percentage < 75 ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-4 flex-1">
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-red-800 dark:text-red-300 font-bold text-lg">Shortage Warning</h3>
                                <p className="text-red-600 dark:text-red-400 mt-1">Your attendance is below the required 75% threshold. Please attend upcoming classes regularly to recover.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl flex items-start gap-4 flex-1">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full shrink-0">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-green-800 dark:text-green-300 font-bold text-lg">Good Standing</h3>
                                <p className="text-green-600 dark:text-green-400 mt-1">Your attendance is above the 75% threshold. Keep up the good work!</p>
                            </div>
                        </div>
                    )}

                    <div className="card p-6 flex-1">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Recent Attendance Logs</h3>
                        <div className="space-y-4">
                            {recentAttendance.length === 0 ? (
                                <p className="text-sm text-slate-500">No attendance records found yet.</p>
                            ) : recentAttendance.map(record => (
                                <div key={record.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition border border-transparent hover:border-slate-100 dark:hover:border-dark-border">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={20} className="text-slate-400" />
                                        <div>
                                            <p className="font-medium dark:text-white">{record.subject?.name || 'Unknown Subject'}</p>
                                            <p className="text-xs text-slate-500">{moment(record.date).format('MMM DD, YYYY')} - Period {record.period}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {record.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
