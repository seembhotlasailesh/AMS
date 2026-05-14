import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Check, X } from 'lucide-react';
import moment from 'moment';

const MyAttendance = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const { data } = await axios.get('/student/attendance');
            setRecords(data);
        } catch (error) {
            console.error('Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading records...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Attendance Log</h2>
                <button className="btn-primary text-sm">Download Report</button>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400">
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium text-center">Period</th>
                                <th className="px-6 py-4 font-medium">Subject</th>
                                <th className="px-6 py-4 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No attendance records found yet.</td>
                                </tr>
                            ) : (
                                records.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-400" />
                                            {moment(record.date).format('MMM DD, YYYY')}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-slate-500 dark:text-slate-400">
                                            P{record.period}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {record.subject?.name || 'Unknown'} <span className="text-xs text-slate-400 ml-1">({record.subject?.code})</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {record.status === 'PRESENT' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold tracking-wider">
                                                    <Check size={14} /> PRESENT
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold tracking-wider">
                                                    <X size={14} /> ABSENT
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyAttendance;
