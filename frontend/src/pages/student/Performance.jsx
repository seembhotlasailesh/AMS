import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Award, BarChart3, BookOpen, CheckCircle2, Search, TrendingUp } from 'lucide-react';

const formatExamType = (type) => ({
    cat_1: 'CAT-1',
    cat_2: 'CAT-2',
    assignment: 'Assignment',
    internal: 'Internals',
    semester: 'Semester Exam',
    cumulative: 'Cumulative Marks',
    custom: 'Custom'
}[type] || type || 'Assessment');

const Performance = () => {
    const [summary, setSummary] = useState({ totalAssessments: 0, average: 0, grade: 'N/A', passCount: 0, failCount: 0 });
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const { data } = await axios.get('/student/marks');
                setSummary(data.summary || {});
                setRecords(data.records || []);
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    const subjectGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        const filtered = query
            ? records.filter(record =>
                record.subject?.toLowerCase().includes(query) ||
                record.examName?.toLowerCase().includes(query) ||
                record.examType?.toLowerCase().includes(query)
            )
            : records;

        return filtered.reduce((groups, record) => {
            groups[record.subject] = groups[record.subject] || [];
            groups[record.subject].push(record);
            return groups;
        }, {});
    }, [records, search]);

    if (loading) return <div>Loading performance...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Student Academic Record</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Performance</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">View marks entered by faculty, grouped by subject and assessment.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input className="input-field pl-9" placeholder="Search subject or exam..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="card p-5">
                    <div className="mb-3 flex items-center gap-2 text-blue-600"><TrendingUp size={18} /><span className="text-sm font-semibold">Average</span></div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.average || 0}%</p>
                </div>
                <div className="card p-5">
                    <div className="mb-3 flex items-center gap-2 text-blue-600"><Award size={18} /><span className="text-sm font-semibold">Grade</span></div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.grade || 'N/A'}</p>
                </div>
                <div className="card p-5">
                    <div className="mb-3 flex items-center gap-2 text-green-600"><CheckCircle2 size={18} /><span className="text-sm font-semibold">Passed</span></div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.passCount || 0}</p>
                </div>
                <div className="card p-5">
                    <div className="mb-3 flex items-center gap-2 text-blue-600"><BarChart3 size={18} /><span className="text-sm font-semibold">Assessments</span></div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.totalAssessments || 0}</p>
                </div>
            </div>

            {records.length === 0 ? (
                <div className="card p-8 text-center">
                    <BookOpen className="mx-auto mb-3 text-slate-400" size={32} />
                    <h3 className="font-semibold text-slate-900 dark:text-white">No marks published yet</h3>
                    <p className="mt-1 text-sm text-slate-500">Your marks will appear here after faculty saves them.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(subjectGroups).map(([subject, subjectRecords]) => (
                        <section key={subject} className="card overflow-hidden">
                            <div className="border-b border-slate-200 p-5 dark:border-dark-border">
                                <h3 className="font-semibold text-slate-900 dark:text-white">{subject}</h3>
                                <p className="text-sm text-slate-500">{subjectRecords.length} assessment{subjectRecords.length > 1 ? 's' : ''}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 dark:bg-dark-bg dark:text-slate-400">
                                            <th className="px-6 py-4 font-medium">Assessment</th>
                                            <th className="px-6 py-4 font-medium">Type</th>
                                            <th className="px-6 py-4 font-medium">Marks</th>
                                            <th className="px-6 py-4 font-medium">Grade</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium">Faculty Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                                        {subjectRecords.map(record => (
                                            <tr key={record.id}>
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{record.examName}</td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatExamType(record.examType)}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                                    {record.marksObtained} / {record.totalMarks}
                                                    <span className="ml-2 text-sm font-normal text-slate-500">({record.percentage}%)</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{record.grade}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.status === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.remarks || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Performance;
