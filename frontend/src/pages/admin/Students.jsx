import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Mail, Edit2, Building2, ChevronRight, ArrowLeft, Users } from 'lucide-react';

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        enrollmentNo: '',
        classId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stuRes, classRes] = await Promise.all([
                axios.get('/admin/students'),
                axios.get('/faculty/classes').catch(() => ({ data: [] })) // Note: Admin might need a global classes endpoint in a real app
            ]);
            setStudents(stuRes.data);
            setClasses(classRes.data);
        } catch (error) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                await axios.put(`/admin/students/${editingStudent.id}`, formData);
            } else {
                await axios.post('/admin/students', formData);
            }
            fetchData();
            closeModal();
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Error saving student');
        }
    };

    const openCreateModal = () => {
        setEditingStudent(null);
        setFormData({ name: '', email: '', password: '', enrollmentNo: '', classId: '' });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (stu) => {
        setEditingStudent(stu);
        setFormData({
            name: stu.name || '',
            email: stu.user?.email || '',
            password: '',
            enrollmentNo: stu.enrollmentNo || '',
            classId: stu.class?.id || ''
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
        setFormData({ name: '', email: '', password: '', enrollmentNo: '', classId: '' });
        setErrorMsg('');
    };

    const handleDelete = async (stu) => {
        const confirmed = window.confirm(`Delete student ${stu.name}?`);
        if (!confirmed) return;

        try {
            await axios.delete(`/admin/students/${stu.id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete student');
        }
    };

    const studentsByDepartmentAndSection = students.reduce((groups, student) => {
        const departmentName = student.department?.name || 'Unassigned Department';
        const sectionName = student.class?.name || 'Unassigned Section';
        groups[departmentName] = groups[departmentName] || {};
        groups[departmentName][sectionName] = groups[departmentName][sectionName] || [];
        groups[departmentName][sectionName].push(student);
        return groups;
    }, {});
    const departmentEntries = Object.entries(studentsByDepartmentAndSection);
    const sectionEntries = selectedDepartment ? Object.entries(studentsByDepartmentAndSection[selectedDepartment] || {}) : [];
    const selectedStudents = selectedDepartment && selectedSection
        ? studentsByDepartmentAndSection[selectedDepartment]?.[selectedSection] || []
        : [];

    const openDepartment = (departmentName) => {
        setSelectedDepartment(departmentName);
        setSelectedSection(null);
    };

    const backToDepartments = () => {
        setSelectedDepartment(null);
        setSelectedSection(null);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Management</h2>
                    <p className="text-sm text-slate-500">Students are grouped by department and class section.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Student
                </button>
            </div>

            {students.length === 0 ? (
                <div className="card px-6 py-8 text-center text-slate-500">No students found.</div>
            ) : !selectedDepartment ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {departmentEntries.map(([departmentName, sections]) => {
                        const studentCount = Object.values(sections).reduce((sum, sectionStudents) => sum + sectionStudents.length, 0);
                        return (
                            <button
                                key={departmentName}
                                type="button"
                                onClick={() => openDepartment(departmentName)}
                                className="card p-5 text-left transition hover:border-blue-300 hover:shadow-md dark:hover:border-blue-600"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-950 dark:text-white">{departmentName}</h3>
                                            <p className="text-sm text-slate-500">{Object.keys(sections).length} sections / {studentCount} students</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-400" size={18} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : !selectedSection ? (
                <div className="space-y-4">
                    <button onClick={backToDepartments} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                        <ArrowLeft size={16} />
                        Departments
                    </button>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{selectedDepartment}</h3>
                        <p className="text-sm text-slate-500">Select a section to view students.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sectionEntries.map(([sectionName, sectionStudents]) => (
                            <button
                                key={sectionName}
                                type="button"
                                onClick={() => setSelectedSection(sectionName)}
                                className="card p-5 text-left transition hover:border-blue-300 hover:shadow-md dark:hover:border-blue-600"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-950 dark:text-white">{sectionName}</h3>
                                            <p className="text-sm text-slate-500">{sectionStudents.length} students</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-400" size={18} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-dark-border dark:bg-dark-bg md:flex-row md:items-center md:justify-between">
                        <div>
                            <button onClick={() => setSelectedSection(null)} className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                                <ArrowLeft size={16} />
                                {selectedDepartment}
                            </button>
                            <h3 className="font-semibold text-slate-950 dark:text-white">{selectedSection}</h3>
                            <p className="text-sm text-slate-500">{selectedStudents.length} students</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table-compact w-full min-w-[760px] text-left">
                            <thead>
                                <tr className="bg-blue-50/70 text-slate-600 dark:bg-dark-bg dark:text-slate-400">
                                    <th className="w-44">Enrollment No</th>
                                    <th className="w-64">Student Name</th>
                                    <th>Email</th>
                                    <th className="w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                                {selectedStudents.map(stu => (
                                    <tr key={stu.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition">
                                        <td className="font-mono text-sm text-slate-600 dark:text-slate-400">{stu.enrollmentNo}</td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-blue-700">
                                                    {stu.name?.substring(0, 2)}
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-white">{stu.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <Mail size={15} className="text-blue-500" />
                                                <span>{stu.user?.email || 'No email'}</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(stu)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(stu)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition" title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{editingStudent ? 'Edit Student' : 'Register Student'}</h3>
                        {errorMsg && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{errorMsg}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Name</label>
                                    <input
                                        type="text" required className="input-field"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Enrollment No</label>
                                    <input
                                        type="text" required className="input-field"
                                        value={formData.enrollmentNo} onChange={e => setFormData({ ...formData, enrollmentNo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Email (Login ID)</label>
                                <input
                                    type="email" required className="input-field"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Password</label>
                                <input
                                    type="password" required={!editingStudent} className="input-field"
                                    placeholder={editingStudent ? 'Leave blank to keep current password' : ''}
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Assign Class</label>
                                <select
                                    className="input-field"
                                    value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 dark:border-dark-border rounded-lg text-slate-700 dark:text-slate-300">Cancel</button>
                                <button type="submit" className="btn-primary">{editingStudent ? 'Update Student' : 'Register Student'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStudents;
