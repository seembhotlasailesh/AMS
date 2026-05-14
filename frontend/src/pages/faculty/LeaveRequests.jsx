import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import moment from 'moment';

const LeaveRequests = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const { data } = await axios.get('/faculty/leaves');
            setLeaves(data);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`/faculty/leaves/${id}`, { status });
            fetchLeaves(); // refresh
        } catch (error) {
            console.error('Failed to update leave string');
        }
    };

    if (loading) return <div>Loading records...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold dark:text-white">Student Leave Approvals</h2>

            <div className="grid grid-cols-1 gap-4">
                {leaves.length === 0 ? (
                    <div className="card p-12 text-center text-slate-500">
                        <Calendar className="mx-auto mb-4 text-slate-300" size={48} />
                        <p>No pending leave requests to review.</p>
                    </div>
                ) : (
                    leaves.map(leave => (
                        <div key={leave.id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold dark:text-white">{leave.student?.name}</h3>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            leave.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                        {leave.status}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">Roll No: {leave.student?.enrollmentNo}</p>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold">Reason:</span> {leave.reason}
                                </p>

                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg inline-flex">
                                    <Calendar size={16} />
                                    <span>
                                        {moment(leave.startDate).format('MMM DD, YYYY')} - {moment(leave.endDate).format('MMM DD, YYYY')}
                                    </span>
                                </div>
                            </div>

                            {leave.status === 'PENDING' && (
                                <div className="flex gap-3 md:flex-col lg:flex-row shrink-0 w-full md:w-auto mt-4 md:mt-0">
                                    <button
                                        onClick={() => updateStatus(leave.id, 'REJECTED')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 rounded-lg transition"
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        onClick={() => updateStatus(leave.id, 'APPROVED')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition"
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LeaveRequests;
