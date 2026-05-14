import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Mail, Edit2, Building2, ChevronRight, ArrowLeft, Users } from 'lucide-react';

const ManageFaculty = () => {
    const [faculty, setFaculty] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        designation: '',
        departmentId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [facRes, deptRes] = await Promise.all([
                axios.get('/admin/faculty'),
                axios.get('/admin/departments')
            ]);
            setFaculty(facRes.data);
            setDepartments(deptRes.data);
        } catch (error) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFaculty) {
                await axios.put(`/admin/faculty/${editingFaculty.id}`, formData);
            } else {
                await axios.post('/admin/faculty', formData);
            }
            fetchData();
            closeModal();
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Error saving faculty');
        }
    };

    const openCreateModal = () => {
        setEditingFaculty(null);
        setFormData({ name: '', email: '', password: '', employeeId: '', designation: '', departmentId: '' });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (fac) => {
        setEditingFaculty(fac);
        setFormData({
            name: fac.name || '',
            email: fac.user?.email || '',
            password: '',
            employeeId: fac.employeeId || '',
            designation: fac.designation || '',
            departmentId: fac.departmentId || ''
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingFaculty(null);
        setFormData({ name: '', email: '', password: '', employeeId: '', designation: '', departmentId: '' });
        setErrorMsg('');
    };

    const handleDelete = async (fac) => {
        const confirmed = window.confirm(`Delete faculty ${fac.name}?`);
        if (!confirmed) return;

        try {
            await axios.delete(`/admin/faculty/${fac.id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete faculty');
        }
    };

    const facultyByDepartment = faculty.reduce((groups, fac) => {
        const departmentName = fac.department?.name || 'Unassigned Department';
        groups[departmentName] = groups[departmentName] || [];
        groups[departmentName].push(fac);
        return groups;
    }, {});
    const departmentEntries = Object.entries(facultyByDepartment);
    const selectedFaculty = selectedDepartment ? facultyByDepartment[selectedDepartment] || [] : [];

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Faculty Management</h2>
                    <p className="text-sm text-slate-500">Manage faculty records, departments, and login accounts.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Faculty
                </button>
            </div>

            {!selectedDepartment ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {departmentEntries.length === 0 ? (
                        <div className="card px-6 py-8 text-center text-slate-500 md:col-span-2 xl:col-span-3">No faculty members found.</div>
                    ) : departmentEntries.map(([departmentName, departmentFaculty]) => (
                        <button
                            key={departmentName}
                            type="button"
                            onClick={() => setSelectedDepartment(departmentName)}
                            className="card p-5 text-left transition hover:border-blue-300 hover:shadow-md dark:hover:border-blue-600"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-950 dark:text-white">{departmentName}</h3>
                                        <p className="text-sm text-slate-500">{departmentFaculty.length} faculty</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-400" size={18} />
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
            <div className="card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-dark-border dark:bg-dark-bg md:flex-row md:items-center md:justify-between">
                    <div>
                        <button onClick={() => setSelectedDepartment(null)} className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                            <ArrowLeft size={16} />
                            Departments
                        </button>
                        <h3 className="font-semibold text-slate-950 dark:text-white">{selectedDepartment}</h3>
                        <p className="text-sm text-slate-500">{selectedFaculty.length} faculty members</p>
                    </div>
                    <Users className="text-blue-500" size={20} />
                </div>
                <div className="overflow-x-auto">
                    <table className="table-compact w-full min-w-[900px] text-left">
                        <thead>
                            <tr className="bg-blue-50/70 dark:bg-dark-bg border-b border-blue-100 dark:border-dark-border text-slate-600 dark:text-slate-400">
                                <th className="w-40">Employee ID</th>
                                <th className="w-64">Faculty Name</th>
                                <th>Email</th>
                                <th className="w-44">Department</th>
                                <th className="text-right w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                            {selectedFaculty.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-500">No faculty members found.</td>
                                </tr>
                            ) : (
                                selectedFaculty.map(fac => (
                                    <tr key={fac.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition">
                                        <td className="font-mono text-sm text-slate-600 dark:text-slate-400">{fac.employeeId || 'Not set'}</td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex shrink-0 items-center justify-center font-bold text-sm">
                                                    {fac.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{fac.name}</p>
                                                    <p className="text-xs text-slate-500">{fac.designation || 'Faculty'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <Mail size={15} className="text-blue-500" />
                                                <span>{fac.user?.email || 'No email'}</span>
                                            </div>
                                        </td>
                                        <td className="text-slate-500 dark:text-slate-400">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-slate-800 rounded-full text-xs font-semibold">
                                                {fac.department?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(fac)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(fac)}
                                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{editingFaculty ? 'Edit Faculty' : 'Register Faculty'}</h3>
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
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Employee ID</label>
                                    <input
                                        type="text" required className="input-field"
                                        value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Designation</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    placeholder="Professor, Associate Professor, Assistant Professor..."
                                    value={formData.designation}
                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                />
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
                                    type="password" required={!editingFaculty} className="input-field"
                                    placeholder={editingFaculty ? 'Leave blank to keep current password' : ''}
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Assign Department</label>
                                <select
                                    className="input-field" required
                                    value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                >
                                    <option value="" disabled>Select Department...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.college?.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 dark:border-dark-border rounded-lg text-slate-700 dark:text-slate-300">Cancel</button>
                                <button type="submit" className="btn-primary">{editingFaculty ? 'Update Staff' : 'Register Staff'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageFaculty;
