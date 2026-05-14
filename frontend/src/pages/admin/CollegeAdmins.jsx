import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, ShieldCheck } from 'lucide-react';

const ManageCollegeAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        collegeId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [adminRes, collegeRes] = await Promise.all([
            axios.get('/admin/college-admins'),
            axios.get('/admin/colleges')
        ]);
        setAdmins(adminRes.data);
        setColleges(collegeRes.data);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setErrorMsg('');
        setFormData({ name: '', email: '', password: '', phone: '', collegeId: '' });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMsg('');

        try {
            await axios.post('/admin/college-admins', formData);
            await fetchData();
            closeModal();
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to create college admin');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">College Admins</h2>
                    <p className="text-sm text-slate-500">Manage college-level admin accounts and access.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Add College Admin
                </button>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full min-w-[720px] text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-50/70 dark:bg-dark-bg border-b border-blue-100 dark:border-dark-border text-slate-600 dark:text-slate-400">
                            <th className="px-6 py-4 font-semibold w-64">Admin Name</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">College</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                        {admins.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-slate-500">No college admins found.</td>
                            </tr>
                        ) : admins.map(admin => (
                            <tr key={admin.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition">
                                <td className="px-6 py-5 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex shrink-0 items-center justify-center">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <span className="font-semibold text-slate-900 dark:text-white">{admin.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 align-middle text-slate-600 whitespace-nowrap">{admin.email}</td>
                                <td className="px-6 py-5 align-middle text-slate-600">{admin.colleges?.map(college => college.name).join(', ') || 'Unassigned'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">Create College Admin</h3>
                        {errorMsg && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{errorMsg}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input className="input-field" required placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input className="input-field" required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <input className="input-field" required type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            <input className="input-field" placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            <select className="input-field" required value={formData.collegeId} onChange={e => setFormData({ ...formData, collegeId: e.target.value })}>
                                <option value="">Assign college...</option>
                                {colleges.filter(college => college.isActive !== false).map(college => (
                                    <option key={college.id} value={college.id}>{college.name}</option>
                                ))}
                            </select>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 dark:border-dark-border rounded-lg text-slate-700 dark:text-slate-300">Cancel</button>
                                <button type="submit" className="btn-primary">Create Admin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCollegeAdmins;
