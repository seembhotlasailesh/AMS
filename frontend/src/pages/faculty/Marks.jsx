import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle2, ClipboardList, Edit3, Plus, Save, Search } from 'lucide-react';

const EXAM_TYPES = [
    { value: 'cat_1', label: 'CAT-1', total: 50 },
    { value: 'cat_2', label: 'CAT-2', total: 50 },
    { value: 'assignment', label: 'Assignment', total: 10 },
    { value: 'internal', label: 'Internals', total: 40 },
    { value: 'semester', label: 'Semester Exam', total: 100 },
    { value: 'cumulative', label: 'Cumulative Marks', total: 100 },
    { value: 'custom', label: 'Custom Assessment', total: 100 }
];

const formatExamType = (type) => EXAM_TYPES.find(item => item.value === type)?.label || type;

const Marks = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [marksState, setMarksState] = useState({});
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [examForm, setExamForm] = useState({
        examName: '',
        examType: 'cat_1',
        totalMarks: 50,
        semester: '',
        examDate: ''
    });

    const selectedClassRow = classes.find(cls => cls.id === selectedClass);
    const selectedSubjectRow = subjects.find(subject => subject.id === selectedSubject);
    const selectedExamRow = exams.find(exam => exam.id === selectedExam);
    const students = selectedClassRow?.students || [];
    const filteredSubjects = useMemo(
        () => subjects.filter(subject => subject.classId === selectedClass),
        [subjects, selectedClass]
    );
    const visibleStudents = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return students;
        return students.filter(student =>
            student.name?.toLowerCase().includes(query) ||
            student.enrollmentNo?.toLowerCase().includes(query)
        );
    }, [students, search]);
    const enteredCount = students.filter(student => marksState[student.id]?.marksObtained !== undefined && marksState[student.id]?.marksObtained !== '').length;

    useEffect(() => {
        fetchLookups();
    }, []);

    useEffect(() => {
        setSelectedSubject('');
        setSelectedExam('');
        setMarksState({});
        setExams([]);
    }, [selectedClass]);

    useEffect(() => {
        setSelectedExam('');
        setMarksState({});
        if (selectedClass && selectedSubject) fetchExams();
    }, [selectedClass, selectedSubject]);

    useEffect(() => {
        if (selectedExam) fetchMarks();
    }, [selectedExam]);

    const showMessage = (type, text) => setMessage({ type, text });

    const fetchLookups = async () => {
        try {
            const [classRes, subjectRes] = await Promise.all([
                axios.get('/faculty/classes'),
                axios.get('/faculty/subjects')
            ]);
            setClasses(classRes.data);
            setSubjects(subjectRes.data);
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Unable to load classes and subjects');
        }
    };

    const fetchExams = async () => {
        const { data } = await axios.get('/faculty/exams', {
            params: { classId: selectedClass, subjectId: selectedSubject }
        });
        setExams(data);
    };

    const fetchMarks = async () => {
        const { data } = await axios.get(`/faculty/exams/${selectedExam}/marks`);
        const next = {};
        data.forEach(mark => {
            next[mark.student_id] = {
                marksObtained: Number(mark.marks_obtained),
                remarks: mark.remarks || ''
            };
        });
        setMarksState(next);
    };

    const handleExamTypeChange = (examType) => {
        const preset = EXAM_TYPES.find(type => type.value === examType);
        setExamForm({
            ...examForm,
            examType,
            totalMarks: preset?.total || examForm.totalMarks,
            examName: examForm.examName || preset?.label || ''
        });
    };

    const createExam = async (event) => {
        event.preventDefault();
        if (!selectedClass || !selectedSubject) {
            showMessage('error', 'Select class and subject before creating an exam.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post('/faculty/exams', {
                ...examForm,
                classId: selectedClass,
                subjectId: selectedSubject
            });
            await fetchExams();
            setSelectedExam(data.id);
            setExamForm({ examName: '', examType: 'cat_1', totalMarks: 50, semester: '', examDate: '' });
            showMessage('success', 'Exam created successfully. You can enter marks now.');
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to create exam');
        } finally {
            setLoading(false);
        }
    };

    const saveMarks = async () => {
        if (!selectedExam) {
            showMessage('error', 'Select or create an exam first.');
            return;
        }

        const totalMarks = Number(selectedExamRow?.total_marks || examForm.totalMarks);
        const records = students
            .filter(student => marksState[student.id]?.marksObtained !== undefined && marksState[student.id]?.marksObtained !== '')
            .map(student => ({
                studentId: student.id,
                marksObtained: marksState[student.id].marksObtained,
                remarks: marksState[student.id].remarks || ''
            }));

        if (!records.length) {
            showMessage('error', 'Enter marks for at least one student.');
            return;
        }
        if (records.some(record => Number(record.marksObtained) < 0 || Number(record.marksObtained) > totalMarks)) {
            showMessage('error', `Marks must be between 0 and ${totalMarks}.`);
            return;
        }

        setLoading(true);
        try {
            await axios.post(`/faculty/exams/${selectedExam}/marks`, { records });
            await fetchMarks();
            showMessage('success', `Marks saved successfully for ${records.length} student${records.length > 1 ? 's' : ''}.`);
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to save marks');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Faculty Assessment Desk</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Marks Management</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Create assessments, view previous entries, and update student marks from one workspace.</p>
                </div>
                <button onClick={saveMarks} disabled={!selectedExam || loading} className="btn-primary flex items-center justify-center gap-2">
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Marks'}
                </button>
            </div>

            {message && (
                <div className={`rounded-lg border p-4 text-sm font-medium ${
                    message.type === 'success'
                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300'
                        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
                }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' && <CheckCircle2 size={18} />}
                        {message.text}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <section className="card p-5 xl:col-span-2">
                    <div className="mb-4 flex items-center gap-2">
                        <BookOpen className="text-blue-600" size={20} />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Academic Selection</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            <option value="">Select class / section</option>
                            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                        </select>
                        <select className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
                            <option value="">Select subject</option>
                            {filteredSubjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                        </select>
                        <select className="input-field" value={selectedExam} onChange={e => setSelectedExam(e.target.value)} disabled={!selectedSubject}>
                            <option value="">Select previous exam</option>
                            {exams.map(exam => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.exam_name} - {formatExamType(exam.exam_type)}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className="card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ClipboardList className="text-blue-600" size={20} />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Current Sheet</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-dark-bg">
                            <p className="text-xs text-slate-500">Students</p>
                            <p className="text-xl font-bold dark:text-white">{students.length}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-dark-bg">
                            <p className="text-xs text-slate-500">Entered</p>
                            <p className="text-xl font-bold dark:text-white">{enteredCount}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-dark-bg">
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="text-xl font-bold dark:text-white">{selectedExamRow?.total_marks || '-'}</p>
                        </div>
                    </div>
                </section>
            </div>

            {selectedClass && selectedSubject && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <form onSubmit={createExam} className="card p-5 xl:col-span-2">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Create New Assessment</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Use presets for university exam types or choose custom.</p>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                <Plus size={18} />
                                Create
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <select className="input-field" value={examForm.examType} onChange={e => handleExamTypeChange(e.target.value)}>
                                {EXAM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                            <input required className="input-field md:col-span-2" placeholder="Assessment name" value={examForm.examName} onChange={e => setExamForm({ ...examForm, examName: e.target.value })} />
                            <input required type="number" min="1" className="input-field" placeholder="Total marks" value={examForm.totalMarks} onChange={e => setExamForm({ ...examForm, totalMarks: e.target.value })} />
                            <input type="number" min="1" className="input-field" placeholder="Semester" value={examForm.semester} onChange={e => setExamForm({ ...examForm, semester: e.target.value })} />
                        </div>
                    </form>

                    <section className="card p-5">
                        <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Previous Assessments</h3>
                        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {exams.length === 0 && <p className="text-sm text-slate-500">No exams created yet for this subject.</p>}
                            {exams.map(exam => (
                                <button
                                    key={exam.id}
                                    type="button"
                                    onClick={() => setSelectedExam(exam.id)}
                                    className={`w-full rounded-lg border p-3 text-left transition ${
                                        selectedExam === exam.id
                                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                                            : 'border-slate-200 hover:border-blue-300 dark:border-dark-border'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{exam.exam_name}</p>
                                            <p className="text-xs text-slate-500">{formatExamType(exam.exam_type)} / {exam.total_marks} marks</p>
                                        </div>
                                        <Edit3 size={16} className="text-slate-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {selectedExam && (
                <section className="card overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-dark-border md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {selectedExamRow?.exam_name} Marks Entry
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {selectedClassRow?.name} / {selectedSubjectRow?.name} / {formatExamType(selectedExamRow?.exam_type)}
                            </p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input className="input-field pl-9" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 dark:bg-dark-bg dark:text-slate-400">
                                    <th className="px-6 py-4 font-medium">Roll No</th>
                                    <th className="px-6 py-4 font-medium">Student</th>
                                    <th className="px-6 py-4 font-medium">Marks Obtained</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Faculty Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                                {visibleStudents.map(student => {
                                    const value = marksState[student.id]?.marksObtained ?? '';
                                    const pass = value !== '' && Number(value) >= Number(selectedExamRow?.total_marks || 100) * 0.4;
                                    return (
                                        <tr key={student.id}>
                                            <td className="px-6 py-3 font-mono text-sm text-slate-500">{student.enrollmentNo}</td>
                                            <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{student.name}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={selectedExamRow?.total_marks || 100}
                                                        className="input-field w-28"
                                                        value={value}
                                                        onChange={e => setMarksState({
                                                            ...marksState,
                                                            [student.id]: { ...marksState[student.id], marksObtained: e.target.value }
                                                        })}
                                                    />
                                                    <span className="text-sm text-slate-500">/ {selectedExamRow?.total_marks}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                {value === '' ? (
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-dark-bg">Pending</span>
                                                ) : (
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {pass ? 'Pass' : 'Needs Improvement'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    className="input-field"
                                                    placeholder="Optional remark"
                                                    value={marksState[student.id]?.remarks ?? ''}
                                                    onChange={e => setMarksState({
                                                        ...marksState,
                                                        [student.id]: { ...marksState[student.id], remarks: e.target.value }
                                                    })}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Marks;
