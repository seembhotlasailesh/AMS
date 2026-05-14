import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { BadgeCheck, Bell, Check, Mail, Moon, Phone, Search, ShieldCheck, Sun, UserCircle, X } from 'lucide-react';
import axios from 'axios';

const pageLabels = {
    dashboard: 'Dashboard',
    colleges: 'Colleges',
    'college-admins': 'College Admins',
    faculty: 'Faculty',
    students: 'Students',
    subjects: 'Subjects',
    marks: 'Marks',
    attendance: 'Attendance',
    leaves: 'Leave Requests',
    performance: 'Performance'
};

const TopNav = () => {
    const { user, refreshUser } = useAuth();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [recipientOptions, setRecipientOptions] = useState({ users: [], roles: [], departments: [], classes: [] });
    const [notifyForm, setNotifyForm] = useState({ targetType: 'user', targetId: '', title: '', message: '', type: 'info', priority: 'normal', category: 'general' });
    const [notifyMessage, setNotifyMessage] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState('');
    const displayName = user?.name || user?.student?.name || user?.faculty?.name || user?.email || 'User';
    const pageKey = location.pathname.split('/').filter(Boolean).pop();
    const pageTitle = pageLabels[pageKey] || 'AMS Portal';

    async function loadNotifications() {
        const { data } = await axios.get('/auth/notifications');
        setNotifications(data);
    }

    useEffect(() => {
        // Check local storage or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
        loadNotifications().catch(() => setNotifications([]));
    }, [user]);

    const loadRequests = async () => {
        if (!['ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN', 'FACULTY'].includes(user?.role)) return;
        const { data } = await axios.get('/auth/profile-requests');
        setRequests(data);
    };

    const openProfile = async () => {
        setMessage('');
        setProfileOpen(true);
        await loadRequests();
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setMessage('');
        try {
            const { data } = await axios.put('/auth/profile', formData);
            setMessage(data.message || 'Profile saved');
            if (user?.role !== 'STUDENT') await refreshUser();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to save profile');
        }
    };

    const reviewRequest = async (id, action) => {
        await axios.put(`/auth/profile-requests/${id}`, { action });
        await loadRequests();
        setMessage(`Request ${action}`);
    };

    const loadRecipientOptions = async () => {
        if (!['ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN', 'FACULTY'].includes(user?.role)) return;
        const { data } = await axios.get('/auth/notification-recipients');
        setRecipientOptions(data);
    };

    const openNotifications = async () => {
        setNotificationOpen(!notificationOpen);
        setNotifyMessage('');
        if (!notificationOpen) {
            await Promise.all([loadNotifications(), loadRecipientOptions()]);
        }
    };

    const markRead = async (id) => {
        await axios.put(`/auth/notifications/${id}/read`);
        await loadNotifications();
    };

    const markAllRead = async () => {
        await axios.put('/auth/notifications/read-all');
        await loadNotifications();
    };

    const deleteNotification = async (id) => {
        await axios.delete(`/auth/notifications/${id}`);
        await loadNotifications();
    };

    const sendNotification = async (event) => {
        event.preventDefault();
        setNotifyMessage('');
        try {
            await axios.post('/auth/notifications', notifyForm);
            setNotifyForm({ targetType: 'user', targetId: '', title: '', message: '', type: 'info', priority: 'normal', category: 'general' });
            setNotifyMessage('Message sent successfully');
            await loadNotifications();
        } catch (error) {
            setNotifyMessage(error.response?.data?.message || 'Failed to send message');
        }
    };

    const targetOptions = recipientOptions[`${notifyForm.targetType}s`] || [];

    const toggleTheme = () => {
        if (darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setDarkMode(true);
        }
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-blue-100 bg-white/95 px-4 transition-colors duration-200 dark:border-dark-border dark:bg-dark-surface md:px-6">
            <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-slate-950 dark:text-white">{pageTitle}</h1>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">Welcome back, {displayName}</p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                        className="h-9 w-64 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 dark:border-dark-border dark:bg-dark-bg dark:text-white"
                        placeholder="Search"
                    />
                </div>
                <button onClick={openNotifications} className="relative rounded-md p-2 text-slate-500 transition hover:bg-blue-50 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800">
                    <Bell size={18} />
                    {notifications.some(item => !item.isRead) && (
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                </button>
                <button
                    onClick={toggleTheme}
                    className="rounded-md p-2 text-slate-500 transition hover:bg-blue-50 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                    type="button"
                    onClick={openProfile}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 transition hover:bg-primary-200"
                    title="Profile"
                >
                    {displayName.charAt(0).toUpperCase()}
                </button>
            </div>

            {notificationOpen && (
                <div className="absolute right-20 top-14 z-40 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-blue-100 bg-white shadow-xl dark:border-dark-border dark:bg-dark-surface">
                    <div className="flex items-center justify-between border-b border-slate-100 p-3 dark:border-dark-border">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Notifications</h3>
                            <p className="text-xs text-slate-500">{notifications.filter(item => !item.isRead).length} unread</p>
                        </div>
                        <button onClick={markAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Mark all read</button>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                        ) : notifications.map(item => (
                            <div key={item.id} className={`mb-2 rounded-lg border p-3 text-sm ${item.isRead ? 'border-slate-100 bg-white dark:border-dark-border dark:bg-dark-surface' : 'border-blue-100 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20'}`}>
                                <div className="mb-1 flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-slate-950 dark:text-white">{item.title}</p>
                                        <p className="mt-1 text-slate-600 dark:text-slate-300">{item.message}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.type === 'warning' || item.type === 'alert' ? 'bg-amber-100 text-amber-700' : item.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {item.type}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                    <span>{item.category} / {item.priority}</span>
                                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="mt-2 flex justify-end gap-2">
                                    {!item.isRead && <button onClick={() => markRead(item.id)} className="text-xs font-semibold text-blue-600">Read</button>}
                                    <button onClick={() => deleteNotification(item.id)} className="text-xs font-semibold text-red-600">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {['ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN', 'FACULTY'].includes(user?.role) && (
                        <form onSubmit={sendNotification} className="space-y-2 border-t border-slate-100 p-3 dark:border-dark-border">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Send notification</p>
                            {notifyMessage && (
                                <div className={`rounded-md border px-3 py-2 text-xs font-medium ${
                                    notifyMessage.includes('success')
                                        ? 'border-green-200 bg-green-50 text-green-700'
                                        : 'border-red-200 bg-red-50 text-red-700'
                                }`}>
                                    {notifyMessage}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="input-field"
                                    value={notifyForm.targetType}
                                    onChange={e => setNotifyForm({ ...notifyForm, targetType: e.target.value, targetId: '' })}
                                >
                                    <option value="user">Individual</option>
                                    <option value="class">Class</option>
                                    <option value="department">Department</option>
                                    <option value="role">Role</option>
                                </select>
                                <select
                                    className="input-field"
                                    value={notifyForm.targetId}
                                    onChange={e => setNotifyForm({ ...notifyForm, targetId: e.target.value })}
                                    required
                                >
                                    <option value="">Select recipient...</option>
                                    {targetOptions.map(option => (
                                        <option key={option.id} value={option.id}>
                                            {notifyForm.targetType === 'user'
                                                ? `${option.name} (${option.email})`
                                                : notifyForm.targetType === 'class'
                                                    ? `${option.name}${option.department ? ` / ${option.department}` : ''}`
                                                    : option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input className="input-field" placeholder="Title" value={notifyForm.title} onChange={e => setNotifyForm({ ...notifyForm, title: e.target.value })} required />
                            <textarea className="input-field h-20 resize-none" placeholder="Message" value={notifyForm.message} onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })} required />
                            <div className="grid grid-cols-3 gap-2">
                                <select className="input-field" value={notifyForm.type} onChange={e => setNotifyForm({ ...notifyForm, type: e.target.value })}>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="success">Success</option>
                                    <option value="alert">Alert</option>
                                </select>
                                <select className="input-field" value={notifyForm.priority} onChange={e => setNotifyForm({ ...notifyForm, priority: e.target.value })}>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <input className="input-field" placeholder="Category" value={notifyForm.category} onChange={e => setNotifyForm({ ...notifyForm, category: e.target.value })} />
                            </div>
                            <button className="btn-primary w-full" type="submit">Send</button>
                        </form>
                    )}
                </div>
            )}

            {profileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-blue-100 bg-white text-left shadow-2xl shadow-slate-900/20 dark:border-dark-border dark:bg-dark-card">
                        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-6 py-5 dark:border-dark-border dark:from-slate-900 dark:via-dark-card dark:to-slate-900">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                                        <UserCircle size={30} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Profile</p>
                                        <h2 className="mt-1 truncate text-2xl font-bold text-slate-950 dark:text-white">{displayName}</h2>
                                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold uppercase text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                                                <ShieldCheck size={14} />
                                                {user?.role}
                                            </span>
                                            {(user?.student?.department?.name || user?.faculty?.department?.name) && (
                                                <span>{user?.student?.department?.name || user?.faculty?.department?.name}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setProfileOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                    aria-label="Close profile"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-5">
                            {message && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                                    <BadgeCheck size={17} />
                                    {message}
                                </div>
                            )}

                            <div className="mb-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-dark-border dark:bg-dark-bg">
                                    <Mail className="text-blue-600" size={18} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
                                        <p className="truncate font-medium text-slate-900 dark:text-white">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-dark-border dark:bg-dark-bg">
                                    <Phone className="text-blue-600" size={18} />
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500">Phone</p>
                                        <p className="font-medium text-slate-900 dark:text-white">{user?.phone || 'Not set'}</p>
                                    </div>
                                </div>
                                {user?.student && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 dark:border-dark-border dark:bg-dark-card dark:text-slate-200"><span className="text-xs font-semibold uppercase text-slate-500">Roll No</span><p className="mt-1 font-semibold">{user.student.enrollmentNo}</p></div>}
                                {user?.student?.class && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 dark:border-dark-border dark:bg-dark-card dark:text-slate-200"><span className="text-xs font-semibold uppercase text-slate-500">Class</span><p className="mt-1 font-semibold">{user.student.class.name}</p></div>}
                                {user?.faculty && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 dark:border-dark-border dark:bg-dark-card dark:text-slate-200"><span className="text-xs font-semibold uppercase text-slate-500">Employee ID</span><p className="mt-1 font-semibold">{user.faculty.employeeId || 'Not set'}</p></div>}
                                {user?.faculty && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 dark:border-dark-border dark:bg-dark-card dark:text-slate-200"><span className="text-xs font-semibold uppercase text-slate-500">Designation</span><p className="mt-1 font-semibold">{user.faculty.designation}</p></div>}
                            </div>

                            <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-950 dark:text-white">Account Details</h3>
                                        <p className="text-xs text-slate-500">Keep your contact information accurate.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-500">Name</label>
                                        <input className="input-field h-11" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email</label>
                                        <input className="input-field h-11" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-500">Phone</label>
                                        <input className="input-field h-11" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 dark:shadow-none" type="submit">
                                        <Check size={17} />
                                        {user?.role === 'STUDENT' ? 'Submit for Approval' : 'Update Profile'}
                                    </button>
                                </div>
                            </form>

                            {['ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN', 'FACULTY'].includes(user?.role) && (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Pending Student Requests</h3>
                                            <p className="text-xs text-slate-500">Review profile changes before they go live.</p>
                                        </div>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-dark-card dark:text-slate-300">{requests.length} pending</span>
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        {requests.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-dark-border dark:bg-dark-card">No pending profile requests.</div>
                                        ) : requests.map(request => (
                                            <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-card">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white">{request.user?.name}</p>
                                                        <p className="text-xs text-slate-500">{request.user?.student?.department?.name} / {request.user?.student?.class?.name}</p>
                                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                            {Object.entries(request.requestedData || {}).map(([key, value]) => `${key}: ${value}`).join(' | ')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => reviewRequest(request.id, 'rejected')} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">Reject</button>
                                                        <button onClick={() => reviewRequest(request.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Approve</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default TopNav;
