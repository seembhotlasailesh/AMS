import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, FileText } from 'lucide-react';
import moment from 'moment';

const ApplyLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        reason: '',
        facultyId: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchMyLeaves();
        fetchFaculty();
    }, []);

    const fetchMyLeaves = async () => {
        try {
            const { data } = await axios.get('/student/leaves');
            setLeaves(data);
        } catch (error) { }
    };

    const fetchFaculty = async () => {
        try {
            const { data } = await axios.get('/student/faculty');
            setFacultyList(data);
        } catch (error) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            await axios.post('/student/leaves', formData);
            setMsg('Leave application submitted successfully.');
            setFormData({ startDate: '', endDate: '', reason: '', facultyId: '' });
            fetchMyLeaves();
        } catch (error) {
            setMsg('Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold dark:text-white">Leave Application</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <FileText size={20} className="text-primary-500" />
                            New Request
                        </h3>

                        {msg && (
                            <div className={`p-3 rounded-lg mb-4 text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {msg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">To (Faculty / Advisor)</label>
                                <select
                                    required className="input-field"
                                    value={formData.facultyId}
                                    onChange={e => setFormData({ ...formData, facultyId: e.target.value })}
                                >
                                    <option value="" disabled>Select faculty member...</option>
                                    {facultyList.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.department?.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Start Date</label>
                                    <input
                                        type="date" required className="input-field"
                                        value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">End Date</label>
                                    <input
                                        type="date" required className="input-field"
                                        value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Reason</label>
                                <textarea
                                    required className="input-field h-24 resize-none"
                                    value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="State the reason for your leave of absence..."
                                />
                            </div>

                            <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2 mt-4">
                                <Send size={18} />
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold dark:text-white">My Application History</h3>

                    {leaves.length === 0 ? (
                        <div className="card p-12 text-center text-slate-500">
                            No past leave applications found.
                        </div>
                    ) : (
                        leaves.map(leave => (
                            <div key={leave.id} className="card p-5 hover:border-slate-300 dark:hover:border-slate-600 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-white">{leave.reason}</h4>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            leave.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                        {leave.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                                    <p><strong>To:</strong> Dr. {leave.faculty?.name || 'Unknown'}</p>
                                    <p><strong>Period:</strong> {moment(leave.startDate).format('MMM DD, YYYY')} to {moment(leave.endDate).format('MMM DD, YYYY')}</p>
                                    <p><strong>Applied on:</strong> {moment(leave.createdAt).format('MMM DD, YYYY')}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyLeave;
