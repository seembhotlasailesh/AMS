import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, BookOpen, Building2, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ManageSubjects = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [formData, setFormData] = useState({ name: '', classId: '', facultyId: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [subjectRes, classRes, facultyRes] = await Promise.all([
            axios.get('/faculty/subjects'),
            axios.get('/faculty/classes'),
            ['ADMIN', 'MAIN_ADMIN'].includes(user?.role) ? axios.get('/admin/faculty') : Promise.resolve({ data: [] })
        ]);
        setSubjects(subjectRes.data);
        setClasses(classRes.data);
        setFaculty(facultyRes.data);
    };

    const openCreateModal = () => {
        setEditingSubject(null);
        setFormData({ name: '', classId: '', facultyId: '' });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name || '',
            classId: subject.classId || '',
            facultyId: subject.facultyId || ''
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSubject(null);
        setFormData({ name: '', classId: '', facultyId: '' });
        setErrorMsg('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMsg('');

        if (!formData.name || !formData.classId) {
            setErrorMsg('Subject name and class are required.');
            return;
        }

        try {
            if (editingSubject) {
                await axios.put(`/faculty/subjects/${editingSubject.id}`, formData);
            } else {
                await axios.post('/faculty/subjects', formData);
            }
            await fetchData();
            closeModal();
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to save subject');
        }
    };

    const handleDelete = async (subject) => {
        const confirmed = window.confirm(`Delete subject ${subject.name}? Attendance linked to this subject may block deletion.`);
        if (!confirmed) return;

        try {
            await axios.delete(`/faculty/subjects/${subject.id}`);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete subject');
        }
    };

    const subjectsByDepartmentAndSection = subjects.reduce((groups, subject) => {
        const classRow = classes.find(cls => cls.id === subject.classId);
        const departmentName = classRow?.department?.name || subject.class?.department?.name || 'Unassigned Department';
        const sectionName = classRow?.name || subject.class?.name || 'Unassigned Section';
        groups[departmentName] = groups[departmentName] || {};
        groups[departmentName][sectionName] = groups[departmentName][sectionName] || [];
        groups[departmentName][sectionName].push(subject);
        return groups;
    }, {});
    const departmentEntries = Object.entries(subjectsByDepartmentAndSection);
    const sectionEntries = selectedDepartment ? Object.entries(subjectsByDepartmentAndSection[selectedDepartment] || {}) : [];
    const selectedSubjects = selectedDepartment && selectedSection
        ? subjectsByDepartmentAndSection[selectedDepartment]?.[selectedSection] || []
        : [];

    const openDepartment = (departmentName) => {
        setSelectedDepartment(departmentName);
        setSelectedSection(null);
    };

    const backToDepartments = () => {
        setSelectedDepartment(null);
        setSelectedSection(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Subject Management</h2>
                    <p className="text-sm text-slate-500">Subjects are organized by department and class section.</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Add Subject
                </button>
            </div>

            {subjects.length === 0 ? (
                <div className="card px-6 py-8 text-center text-slate-500">No subjects found.</div>
            ) : !selectedDepartment ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {departmentEntries.map(([departmentName, sections]) => {
                        const subjectCount = Object.values(sections).reduce((sum, sectionSubjects) => sum + sectionSubjects.length, 0);
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
                                            <p className="text-sm text-slate-500">{Object.keys(sections).length} sections / {subjectCount} subjects</p>
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
                        <p className="text-sm text-slate-500">Select a section to view subjects.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sectionEntries.map(([sectionName, sectionSubjects]) => (
                            <button
                                key={sectionName}
                                type="button"
                                onClick={() => setSelectedSection(sectionName)}
                                className="card p-5 text-left transition hover:border-blue-300 hover:shadow-md dark:hover:border-blue-600"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-950 dark:text-white">{sectionName}</h3>
                                            <p className="text-sm text-slate-500">{sectionSubjects.length} subjects</p>
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
                            <p className="text-sm text-slate-500">{selectedSubjects.length} subjects</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table-compact w-full min-w-[520px] text-left">
                            <thead>
                                <tr className="bg-blue-50/70 text-slate-600 dark:bg-dark-bg dark:text-slate-400">
                                    <th>Subject</th>
                                    <th className="w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                                {selectedSubjects.map(subject => (
                                    <tr key={subject.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition">
                                        <td className="font-semibold text-slate-900 dark:text-white">{subject.name}</td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(subject)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(subject)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition" title="Delete">
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
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h3>
                        {errorMsg && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Subject Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={event => setFormData({ ...formData, name: event.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Class / Section</label>
                                <select
                                    required
                                    className="input-field"
                                    value={formData.classId}
                                    onChange={event => setFormData({ ...formData, classId: event.target.value })}
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>

                            {['ADMIN', 'MAIN_ADMIN'].includes(user?.role) && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Faculty</label>
                                    <select
                                        className="input-field"
                                        value={formData.facultyId}
                                        onChange={event => setFormData({ ...formData, facultyId: event.target.value })}
                                    >
                                        <option value="">Use class faculty</option>
                                        {faculty.map(fac => (
                                            <option key={fac.id} value={fac.id}>{fac.name} ({fac.department?.name})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 dark:border-dark-border rounded-lg text-slate-700 dark:text-slate-300">Cancel</button>
                                <button type="submit" className="btn-primary">{editingSubject ? 'Update Subject' : 'Save Subject'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSubjects;
