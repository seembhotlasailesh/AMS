import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Edit3, RefreshCw, Save, UserCheck, UserX } from 'lucide-react';
import moment from 'moment';

const MarkAttendance = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [selectedPeriod, setSelectedPeriod] = useState(1);
    const [students, setStudents] = useState([]);
    const [attendanceState, setAttendanceState] = useState({});
    const [existingRecords, setExistingRecords] = useState([]);
    const [historyRecords, setHistoryRecords] = useState([]);
    const [historyFilters, setHistoryFilters] = useState({ classId: '', subjectId: '', date: '', period: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const filteredSubjects = useMemo(
        () => subjects.filter(subject => !selectedClass || subject.classId === selectedClass),
        [subjects, selectedClass]
    );

    const historySubjects = useMemo(
        () => subjects.filter(subject => !historyFilters.classId || subject.classId === historyFilters.classId),
        [subjects, historyFilters.classId]
    );

    const presentCount = students.filter(student => (attendanceState[student.id] || 'PRESENT') === 'PRESENT').length;
    const absentCount = Math.max(students.length - presentCount, 0);

    useEffect(() => {
        fetchLookups();
        fetchAttendanceHistory();
    }, []);

    useEffect(() => {
        const cls = classes.find(c => c.id === selectedClass);
        const classStudents = cls?.students || [];
        setStudents(classStudents);

        const defaultState = {};
        classStudents.forEach(student => {
            defaultState[student.id] = 'PRESENT';
        });
        setAttendanceState(defaultState);
        setExistingRecords([]);

        if (selectedSubject && !subjects.some(subject => subject.id === selectedSubject && subject.classId === selectedClass)) {
            setSelectedSubject('');
        }
    }, [selectedClass, classes, selectedSubject, subjects]);

    useEffect(() => {
        if (selectedClass && selectedSubject && selectedDate && selectedPeriod) {
            fetchExistingAttendance();
        }
    }, [selectedClass, selectedSubject, selectedDate, selectedPeriod]);

    const fetchLookups = async () => {
        const [classRes, subjectRes] = await Promise.all([
            axios.get('/faculty/classes'),
            axios.get('/faculty/subjects')
        ]);
        setClasses(classRes.data);
        setSubjects(subjectRes.data);
    };

    const fetchExistingAttendance = async () => {
        try {
            const { data } = await axios.get('/faculty/attendance', {
                params: {
                    classId: selectedClass,
                    subjectId: selectedSubject,
                    date: selectedDate,
                    period: Number(selectedPeriod)
                }
            });
            setExistingRecords(data);

            if (data.length > 0) {
                setAttendanceState(prev => {
                    const next = { ...prev };
                    data.forEach(record => {
                        next[record.studentId] = record.status;
                    });
                    return next;
                });
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load previous attendance');
        }
    };

    const fetchAttendanceHistory = async (filters = historyFilters) => {
        try {
            const { data } = await axios.get('/faculty/attendance', {
                params: {
                    classId: filters.classId || undefined,
                    subjectId: filters.subjectId || undefined,
                    date: filters.date || undefined,
                    period: filters.period || undefined
                }
            });
            setHistoryRecords(data.slice(0, 80));
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load attendance history');
        }
    };

    const updateHistoryFilter = (key, value) => {
        const next = {
            ...historyFilters,
            [key]: value,
            ...(key === 'classId' ? { subjectId: '' } : {})
        };
        setHistoryFilters(next);
        fetchAttendanceHistory(next);
    };

    const toggleStatus = (studentId) => {
        setAttendanceState(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
        }));
    };

    const markAll = (status) => {
        const nextState = {};
        students.forEach(student => {
            nextState[student.id] = status;
        });
        setAttendanceState(nextState);
    };

    const handleSubmit = async () => {
        if (!selectedClass || !selectedSubject || !selectedDate || !selectedPeriod) {
            setMessage('Select class, subject, date, and period before saving.');
            return;
        }
        if (students.length === 0) {
            setMessage('No students found for the selected class.');
            return;
        }

        setLoading(true);
        setMessage('');

        const records = students.map(student => ({
            studentId: student.id,
            status: attendanceState[student.id] || 'PRESENT'
        }));

        try {
            const { data } = await axios.post('/faculty/attendance', {
                classId: selectedClass,
                subjectId: selectedSubject,
                date: selectedDate,
                period: Number(selectedPeriod),
                records
            });
            setMessage(data.message || 'Attendance saved successfully');
            await Promise.all([fetchExistingAttendance(), fetchAttendanceHistory()]);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error saving attendance');
        } finally {
            setLoading(false);
        }
    };

    const updateSingleRecord = async (record) => {
        const nextStatus = record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
        try {
            await axios.put(`/faculty/attendance/${record.id}`, { status: nextStatus });
            setMessage('Attendance updated successfully');
            await Promise.all([
                selectedClass && selectedSubject ? fetchExistingAttendance() : Promise.resolve(),
                fetchAttendanceHistory()
            ]);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update attendance');
        }
    };

    const editFromHistory = (record) => {
        setSelectedClass(record.classId);
        setSelectedSubject(record.subjectId);
        setSelectedDate(moment(record.date).format('YYYY-MM-DD'));
        setSelectedPeriod(record.period);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <p className="page-kicker">Attendance</p>
                <h2 className="page-title">Mark Attendance</h2>
                <p className="page-subtitle">Select a class, load previous records, edit statuses, then save from the bottom of the roster.</p>
            </div>

            {message && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                    {message}
                </div>
            )}

            <section className="card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="section-title">Attendance Session</h3>
                        <p className="text-sm text-slate-500">Choose the exact class, subject, date, and period.</p>
                    </div>
                    <button
                        onClick={fetchExistingAttendance}
                        disabled={!selectedClass || !selectedSubject || loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <RefreshCw size={16} />
                        Load Previous
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium dark:text-slate-300">Class / Section</label>
                        <select className="input-field" required value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium dark:text-slate-300">Subject</label>
                        <select className="input-field" required value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                            <option value="">Select Subject</option>
                            {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium dark:text-slate-300">Date</label>
                        <input type="date" required className="input-field" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium dark:text-slate-300">Period / Hour</label>
                        <input type="number" required min="1" max="8" className="input-field" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} />
                    </div>
                </div>
            </section>

            {selectedClass && students.length > 0 && (
                <section className="card overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="section-title">Student Roster</h3>
                                <p className="text-sm text-slate-500">
                                    {students.length} students / {presentCount} present / {absentCount} absent
                                    {existingRecords.length ? ' / Previous attendance loaded' : ''}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => markAll('PRESENT')} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">Mark All Present</button>
                                <button onClick={() => markAll('ABSENT')} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-950 dark:text-red-300">Mark All Absent</button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 dark:border-dark-border dark:text-slate-400">
                                    <th className="px-6 py-4 font-medium">Roll No</th>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                                {students.map(student => {
                                    const status = attendanceState[student.id] || 'PRESENT';
                                    const isPresent = status === 'PRESENT';
                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-3 font-mono text-sm text-slate-500 dark:text-slate-400">{student.enrollmentNo}</td>
                                            <td className="px-6 py-3 font-medium dark:text-white">{student.name}</td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => toggleStatus(student.id)}
                                                    className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${isPresent
                                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
                                                        : 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800'
                                                        }`}
                                                >
                                                    {isPresent ? <UserCheck size={17} /> : <UserX size={17} />}
                                                    {status}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">
                            Save applies to the selected date and period. Existing records will be updated.
                        </p>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedClass || !selectedSubject || !selectedDate || !selectedPeriod || loading}
                            className="btn-primary inline-flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : existingRecords.length ? 'Update Attendance' : 'Save Attendance'}
                        </button>
                    </div>
                </section>
            )}

            {selectedClass && students.length === 0 && (
                <div className="card p-12 text-center text-slate-500 dark:text-slate-400">
                    No students found enrolled in this class.
                </div>
            )}

            <section className="card overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <CalendarDays className="text-blue-600" size={20} />
                                <h3 className="section-title">Previous Attendance</h3>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Filter by class, subject, date, or period. Open any row to edit the full session.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                            <select className="input-field" value={historyFilters.classId} onChange={e => updateHistoryFilter('classId', e.target.value)}>
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="input-field" value={historyFilters.subjectId} onChange={e => updateHistoryFilter('subjectId', e.target.value)}>
                                <option value="">All Subjects</option>
                                {historySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <input className="input-field" type="date" value={historyFilters.date} onChange={e => updateHistoryFilter('date', e.target.value)} />
                            <input className="input-field" type="number" min="1" max="8" placeholder="Period" value={historyFilters.period} onChange={e => updateHistoryFilter('period', e.target.value)} />
                            <button onClick={() => fetchAttendanceHistory()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white dark:border-dark-border dark:text-slate-300 dark:hover:bg-slate-800">
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-dark-border dark:text-slate-400">
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Class</th>
                                <th className="px-6 py-4 font-medium">Subject</th>
                                <th className="px-6 py-4 font-medium">Student</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                            {historyRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">No previous attendance records found.</td>
                                </tr>
                            ) : historyRecords.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{moment(record.date).format('DD MMM YYYY')} / P{record.period}</td>
                                    <td className="px-6 py-3 font-medium dark:text-white">{classes.find(c => c.id === record.classId)?.name || '-'}</td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{record.subject?.name || '-'}</td>
                                    <td className="px-6 py-3">
                                        <p className="font-medium dark:text-white">{record.student?.name}</p>
                                        <p className="font-mono text-xs text-slate-500">{record.student?.enrollmentNo}</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => updateSingleRecord(record)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-dark-border dark:text-slate-300">Toggle</button>
                                            <button onClick={() => editFromHistory(record)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                                                <Edit3 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default MarkAttendance;
