import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const ManageColleges = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollege, setEditingCollege] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({ name: '', address: '', isActive: true });

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const { data } = await axios.get('/admin/colleges');
            setColleges(data);
        } catch (error) {
            console.error('Failed to fetch colleges');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCollege) {
                await axios.put(`/admin/colleges/${editingCollege.id}`, formData);
            } else {
                await axios.post('/admin/colleges', formData);
            }
            fetchColleges();
            closeModal();
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to save college');
        }
    };

    const openCreateModal = () => {
        setEditingCollege(null);
        setFormData({ name: '', address: '', isActive: true });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (college) => {
        setEditingCollege(college);
        setFormData({ name: college.name || '', address: college.address || '', isActive: college.isActive !== false });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCollege(null);
        setFormData({ name: '', address: '', isActive: true });
        setErrorMsg('');
    };

    const handleDelete = async (college) => {
        const confirmed = window.confirm(`Delete ${college.name}? This will also delete related departments/classes if Supabase cascade rules allow it.`);
        if (!confirmed) return;

        try {
            await axios.delete(`/admin/colleges/${college.id}`);
            fetchColleges();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete college');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">College Management</h2>
                    <p className="text-sm text-slate-500">Create colleges, manage status, and review department counts.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add College
                </button>
            </div>

            <div className="card overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-50/70 dark:bg-dark-bg border-b border-blue-100 dark:border-dark-border text-slate-600 dark:text-slate-400">
                            <th className="px-6 py-4 font-semibold">College Name</th>
                            <th className="px-6 py-4 font-semibold">Location</th>
                            <th className="px-6 py-4 font-semibold text-center">Departments</th>
                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-right w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                        {colleges.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No colleges found.</td>
                            </tr>
                        ) : (
                            colleges.map(college => (
                                <tr key={college.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-5 align-middle font-semibold text-slate-900 dark:text-white">{college.name}</td>
                                    <td className="px-6 py-5 align-middle text-slate-600 dark:text-slate-400">{college.address || 'N/A'}</td>
                                    <td className="px-6 py-5 align-middle text-center">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-sm font-medium">
                                            {college.departments?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 align-middle text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${college.isActive === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {college.isActive === false ? 'Inactive' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 align-middle text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(college)}
                                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(college)}
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

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{editingCollege ? 'Edit College' : 'Add New College'}</h3>
                        {errorMsg && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{errorMsg}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">College Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Address Location</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                Active college
                            </label>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-slate-300 dark:border-dark-border rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">{editingCollege ? 'Update College' : 'Save College'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageColleges;
