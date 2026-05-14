import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Award, BarChart3, Building2, Search, School, TrendingDown, UserCheck, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const iconTones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
};

const textValue = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'object') return value.name || value.email || value.id || fallback;
    return value;
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalColleges: 0,
        totalFaculty: 0,
        totalStudents: 0,
        totalClasses: 0,
        attendanceRate: 0,
        atRiskStudents: 0,
        marksAnalytics: {
            totalMarksEntries: 0,
            averageMarks: 0,
            passCount: 0,
            failCount: 0,
            marksByDepartment: [],
            marksBySubject: [],
            weakStudents: []
        }
    });
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [detailRows, setDetailRows] = useState([]);
    const [detailSearch, setDetailSearch] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await axios.get('/admin/dashboard');
                setStats(data);
                setAttendanceData(data.departmentAttendance?.length
                    ? data.departmentAttendance
                    : [{ name: 'Overall', present: data.attendanceRate, absent: 100 - data.attendanceRate }]
                );
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const isCollegeAdmin = user?.role === 'COLLEGE_ADMIN';
    const COLORS = ['#22c55e', '#ef4444'];
    const openDetail = async (type, title, rows = []) => {
        setDetail({ type, title });
        setDetailSearch('');
        if (type === 'students') {
            const { data } = await axios.get('/admin/students');
            setDetailRows(data);
        } else if (type === 'faculty') {
            const { data } = await axios.get('/admin/faculty');
            setDetailRows(data);
        } else if (type === 'colleges') {
            const { data } = await axios.get('/admin/colleges');
            setDetailRows(data);
        } else if (type === 'classes') {
            const { data } = await axios.get('/faculty/classes');
            setDetailRows(data);
        } else {
            setDetailRows(rows);
        }
    };
    const filteredDetailRows = detailRows.filter(row => JSON.stringify(row).toLowerCase().includes(detailSearch.toLowerCase()));
    const detailHeaders = {
        colleges: ['College', 'Address', 'Departments', 'Status', 'Created'],
        classes: ['Class', 'Department', 'Faculty', 'Students', 'Created'],
        students: ['Student', 'Department/Class', 'Email', 'Roll No', 'Status'],
        faculty: ['Faculty', 'Department', 'Email', 'Employee ID', 'Designation'],
        marks: ['Student', 'Department/Class', 'Subject', 'Marks', 'Remarks', 'Risk'],
        failed: ['Student', 'Department/Class', 'Subject', 'Marks', 'Remarks', 'Risk'],
        attendance: ['Student', 'Department/Class', 'Subject', 'Attendance', 'Remarks', 'Risk']
    };
    const detailCells = (row) => {
        if (detail?.type === 'colleges') {
            return [
                textValue(row.name),
                textValue(row.address),
                `${row.departments?.length || 0}`,
                row.isActive === false ? 'Inactive' : 'Active',
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
            ];
        }
        if (detail?.type === 'classes') {
            return [
                textValue(row.name),
                textValue(row.department?.name),
                textValue(row.faculty?.name || row.faculty?.user?.name),
                `${row.students?.length || 0}`,
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
            ];
        }
        if (detail?.type === 'students') {
            return [
                textValue(row.name),
                `${textValue(row.department?.name)}${row.class?.name ? ` / ${row.class.name}` : ''}`,
                textValue(row.user?.email),
                textValue(row.enrollmentNo),
                'Active'
            ];
        }
        if (detail?.type === 'faculty') {
            return [
                textValue(row.name),
                textValue(row.department?.name),
                textValue(row.user?.email),
                textValue(row.employeeId),
                textValue(row.designation)
            ];
        }
        return [
            textValue(row.studentName || row.name),
            `${textValue(row.department?.name || row.department)}${row.className || row.class?.name ? ` / ${textValue(row.className || row.class?.name, '')}` : ''}`,
            textValue(row.subject?.name || row.subject || row.designation || row.user?.email),
            row.marksObtained !== undefined ? `${row.marksObtained} / ${row.totalMarks} (${row.percentage}%)` : row.attendance !== undefined ? `${row.attendance}%` : textValue(row.enrollmentNo),
            textValue(row.remarks),
            textValue(row.riskStatus || row.status, 'Normal')
        ];
    };
    const kpis = [
        { label: isCollegeAdmin ? 'Managed Colleges' : 'Active Colleges', value: stats.activeColleges ?? stats.totalColleges, icon: Building2, tone: 'blue', onClick: () => openDetail('colleges', isCollegeAdmin ? 'Managed Colleges' : 'Colleges') },
        { label: 'Students', value: stats.totalStudents, icon: UserCheck, tone: 'green', onClick: () => openDetail('students', 'Students') },
        { label: 'Faculty', value: stats.totalFaculty, icon: Users, tone: 'cyan', onClick: () => openDetail('faculty', 'Faculty') },
        { label: 'Classes', value: stats.totalClasses, icon: School, tone: 'indigo', onClick: () => openDetail('classes', 'Classes') }
    ];

    if (loading) return <div className="page-stack text-sm text-slate-500">Loading dashboard...</div>;

    return (
        <div className="page-stack">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                    <p className="page-kicker">{isCollegeAdmin ? 'College Operations' : 'Platform Analytics'}</p>
                    <h2 className="page-title">{isCollegeAdmin ? 'College Admin Overview' : 'Main Admin Overview'}</h2>
                    <p className="page-subtitle">Attendance, users, academics, and performance signals in one view.</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-white px-4 py-3 shadow-sm dark:border-dark-border dark:bg-dark-surface">
                    <p className="text-xs text-slate-500">Average Attendance</p>
                    <div className="mt-1 flex items-center gap-3">
                        <p className="text-2xl font-semibold text-slate-950 dark:text-white">{stats.attendanceRate}%</p>
                        <div className="h-2 w-36 rounded-full bg-slate-100 dark:bg-slate-700">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon, tone, onClick }) => (
                    <button key={label} type="button" onClick={onClick} disabled={!onClick} className="stat-card text-left transition hover:border-blue-300 hover:shadow-md disabled:cursor-default disabled:hover:border-blue-100 disabled:hover:shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
                            </div>
                            <div className={`rounded-lg p-2.5 ${iconTones[tone]}`}>
                                <Icon size={19} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <button type="button" onClick={() => openDetail('marks', 'Recent Marks', stats.marksAnalytics?.recentMarks || [])} className="stat-card text-left transition hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-2 text-blue-600"><Award size={17} /><span className="text-xs font-semibold">Average Marks</span></div>
                    <p className="mt-2 text-xl font-semibold dark:text-white">{stats.marksAnalytics?.averageMarks || 0}%</p>
                </button>
                <button type="button" onClick={() => openDetail('marks', 'Passed Students', stats.marksAnalytics?.passedStudents || [])} className="stat-card text-left transition hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-2 text-green-600"><UserCheck size={17} /><span className="text-xs font-semibold">Pass Entries</span></div>
                    <p className="mt-2 text-xl font-semibold dark:text-white">{stats.marksAnalytics?.passCount || 0}</p>
                </button>
                <button type="button" onClick={() => openDetail('failed', 'Failed Students', stats.marksAnalytics?.weakStudents || [])} className="stat-card text-left transition hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-2 text-red-600"><TrendingDown size={17} /><span className="text-xs font-semibold">Fail Entries</span></div>
                    <p className="mt-2 text-xl font-semibold dark:text-white">{stats.marksAnalytics?.failCount || 0}</p>
                </button>
                <button type="button" onClick={() => openDetail('attendance', 'Low Attendance Students', stats.lowAttendanceStudents || [])} className="stat-card text-left transition hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-2 text-amber-600"><AlertTriangle size={17} /><span className="text-xs font-semibold">At-Risk Students</span></div>
                    <p className="mt-2 text-xl font-semibold dark:text-white">{stats.atRiskStudents}</p>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <section className="card p-4 xl:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="section-title">Department Attendance</h3>
                            <p className="section-subtitle">Present and absent distribution by department.</p>
                        </div>
                        <BarChart3 size={18} className="text-primary-600" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} name="Present %" />
                                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="card p-4">
                    <h3 className="section-title">System Attendance</h3>
                    <p className="section-subtitle">Overall marked attendance ratio.</p>
                    <div className="relative mt-3 flex h-64 items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Present', value: stats.attendanceRate },
                                        { name: 'Absent', value: 100 - stats.attendanceRate }
                                    ]}
                                    innerRadius={68}
                                    outerRadius={88}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill={COLORS[0]} />
                                    <Cell fill={COLORS[1]} />
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute text-center">
                            <span className="text-2xl font-semibold text-slate-950 dark:text-white">{stats.attendanceRate}%</span>
                            <p className="text-sm text-slate-500">Present</p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="card p-4">
                    <h3 className="section-title">Department Marks Performance</h3>
                    <p className="section-subtitle">Average marks grouped by department.</p>
                    <div className="mt-3 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.marksAnalytics?.marksByDepartment || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="average" fill="#2563eb" radius={[4, 4, 0, 0]} name="Average %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="card p-4">
                    <h3 className="section-title">Subject Pass Rate</h3>
                    <p className="section-subtitle">Pass rate across marked subjects.</p>
                    <div className="mt-3 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.marksAnalytics?.marksBySubject || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="passRate" fill="#22c55e" radius={[4, 4, 0, 0]} name="Pass Rate %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            <div className="card overflow-hidden">
                <div className="border-b border-slate-200 p-4 dark:border-dark-border">
                    <h3 className="section-title">Weak Students From Marks</h3>
                    <p className="section-subtitle">Students below 40% in any marked assessment.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-compact w-full min-w-[760px] text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 dark:bg-dark-bg dark:text-slate-400">
                                <th>Student</th>
                                <th>Department</th>
                                <th>Class</th>
                                <th>Subject</th>
                                <th>Assessment</th>
                                <th>Marks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                            {(stats.marksAnalytics?.weakStudents || []).length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-6 text-center text-slate-500">No weak marks records found yet.</td>
                                </tr>
                            ) : stats.marksAnalytics.weakStudents.map(record => (
                                <tr key={record.id}>
                                    <td>
                                        <p className="font-medium text-slate-900 dark:text-white">{record.studentName}</p>
                                        <p className="text-xs text-slate-500">{record.rollNumber}</p>
                                    </td>
                                    <td className="text-slate-600 dark:text-slate-300">{record.department}</td>
                                    <td className="text-slate-600 dark:text-slate-300">{record.className}</td>
                                    <td className="text-slate-600 dark:text-slate-300">{record.subject}</td>
                                    <td className="text-slate-600 dark:text-slate-300">{record.examName}</td>
                                    <td className="font-semibold text-red-600">{record.marksObtained} / {record.totalMarks} ({record.percentage}%)</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="card max-h-[88vh] w-full max-w-5xl overflow-hidden">
                        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-dark-border md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="section-title">{detail.title}</h3>
                                <p className="section-subtitle">{filteredDetailRows.length} records</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                    <input className="input-field pl-9" placeholder="Search details..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} />
                                </div>
                                <button onClick={() => setDetail(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="max-h-[68vh] overflow-auto">
                            <table className="table-compact w-full min-w-[840px] text-left">
                                <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-dark-bg dark:text-slate-400">
                                    <tr>
                                        {(detailHeaders[detail.type] || detailHeaders.marks).map(header => (
                                            <th key={header}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                                    {filteredDetailRows.length === 0 ? (
                                        <tr><td colSpan={(detailHeaders[detail.type] || detailHeaders.marks).length} className="py-8 text-center text-slate-500">No records found.</td></tr>
                                    ) : filteredDetailRows.map(row => (
                                        <tr key={row.id}>
                                            {detailCells(row).map((cell, index) => (
                                                <td key={index} className={index === 0 ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}>
                                                    {index === detailCells(row).length - 1 && ['Active', 'Inactive', 'Normal', 'PASS', 'FAIL', 'High Risk', 'Academic Risk', 'Critical', 'Low Attendance'].includes(String(cell)) ? (
                                                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{cell}</span>
                                                    ) : cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
