import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building2, Crown, GraduationCap, LogIn, School, UserRoundCheck } from 'lucide-react';

const roles = [
    {
        id: 'main-admin',
        title: 'Main Admin',
        description: 'Manage platform, colleges, users, and system analytics.',
        icon: Crown,
        accent: 'from-blue-600 to-indigo-600',
        placeholder: 'admin@system.com'
    },
    {
        id: 'college-admin',
        title: 'College Admin',
        description: 'Manage institution operations, departments, faculty, and students.',
        icon: Building2,
        accent: 'from-sky-600 to-blue-600',
        placeholder: 'college.admin@university.edu'
    },
    {
        id: 'faculty',
        title: 'Faculty',
        description: 'Manage attendance, marks, subjects, and student progress.',
        icon: School,
        accent: 'from-cyan-600 to-blue-600',
        placeholder: 'faculty@university.edu'
    },
    {
        id: 'student',
        title: 'Student',
        description: 'View attendance, performance, marks, and notifications.',
        icon: GraduationCap,
        accent: 'from-blue-500 to-sky-500',
        placeholder: 'student@university.edu'
    }
];

const Login = () => {
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const role = roles.find(item => item.id === selectedRole);
    const RoleIcon = role?.icon || UserRoundCheck;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
            setIsLoading(false);
        }
    };

    const chooseRole = (roleId) => {
        setSelectedRole(roleId);
        setEmail('');
        setPassword('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-blue-50/60 px-4 py-6 text-slate-950">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm">
                        <GraduationCap size={26} />
                    </div>
                    <p className="page-kicker">Academic Management System</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">AMS Portal</h1>
                    <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                        Select your role to continue into the right workspace.
                    </p>
                </div>

                {!selectedRole ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {roles.map(item => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => chooseRole(item.id)}
                                    className="group card p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                                >
                                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm`}>
                                        <Icon size={24} />
                                    </div>
                                    <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                                    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{item.description}</p>
                                    <div className="mt-5 inline-flex text-sm font-semibold text-primary-600 transition group-hover:translate-x-1">
                                        Continue
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-xl md:grid-cols-[0.9fr_1.1fr]">
                        <div className={`bg-gradient-to-br ${role.accent} p-6 text-white md:p-8`}>
                            <button
                                type="button"
                                onClick={() => setSelectedRole(null)}
                                className="mb-8 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                            >
                                <ArrowLeft size={16} />
                                Change role
                            </button>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                                <RoleIcon size={28} />
                            </div>
                            <h2 className="mt-5 text-2xl font-semibold">{role.title} Login</h2>
                            <p className="mt-3 text-sm leading-6 text-blue-50">{role.description}</p>
                            <div className="mt-8 rounded-lg bg-white/10 p-4 text-sm text-blue-50">
                                Secure role-based access using the existing AMS authentication system.
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="mb-6">
                                <p className="page-kicker">Sign in</p>
                                <h3 className="page-title">{role.title} Workspace</h3>
                                <p className="page-subtitle">Use your registered email and password.</p>
                            </div>

                            {error && (
                                <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="input-field"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={role.placeholder}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="input-field"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                    />
                                </div>

                                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                                    {isLoading ? 'Signing in...' : (
                                        <>
                                            <LogIn size={18} />
                                            <span>Sign In</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
