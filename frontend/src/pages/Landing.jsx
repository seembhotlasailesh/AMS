import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Bell,
    BookOpenCheck,
    Building2,
    CalendarCheck,
    ChevronDown,
    Crown,
    GraduationCap,
    LineChart,
    Mail,
    Phone,
    School,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserRoundCheck,
    UsersRound
} from 'lucide-react';

const features = [
    { icon: CalendarCheck, title: 'Attendance Tracking', text: 'Mark, review, and monitor daily attendance with subject-level precision.' },
    { icon: LineChart, title: 'Performance Analytics', text: 'Understand academic trends with marks, progress, and performance views.' },
    { icon: UsersRound, title: 'Student Monitoring', text: 'Keep student records, attendance health, and leave activity organized.' },
    { icon: Bell, title: 'Notifications', text: 'Send targeted academic updates to students, faculty, classes, or departments.' },
    { icon: School, title: 'Faculty Management', text: 'Manage faculty profiles, subjects, classes, and academic responsibilities.' },
    { icon: BarChart3, title: 'College Analytics', text: 'Track institution-wide activity from clean, role-specific dashboards.' }
];

const roles = [
    { icon: Crown, title: 'Main Admin', text: 'Oversee colleges, users, departments, faculty, students, and platform analytics.' },
    { icon: Building2, title: 'College Admin', text: 'Manage institution operations with scoped access to faculty, students, and subjects.' },
    { icon: UserRoundCheck, title: 'Faculty', text: 'Handle attendance, marks, leave requests, subjects, and student progress.' },
    { icon: GraduationCap, title: 'Student', text: 'View attendance, marks, performance insights, leave status, and notifications.' }
];

const faqs = [
    ['What is AMS?', 'AMS is an Academic Management System for managing attendance, marks, users, colleges, and academic dashboards.'],
    ['Who can use this platform?', 'Main admins, college admins, faculty, and students can use role-specific workspaces.'],
    ['Does it support multiple colleges?', 'Yes. The current system includes college management and college-admin scoped access.'],
    ['Is role-based access supported?', 'Yes. Existing routing and backend authorization protect each role workspace.'],
    ['Can attendance and marks be tracked?', 'Yes. Faculty can manage attendance and marks, while students can view their own records.'],
    ['Does it provide analytics?', 'Yes. Dashboards provide attendance, performance, and operational insights for supported roles.']
];

const StatCard = ({ label, value, tone }) => (
    <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
);

const Landing = () => {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="min-h-screen bg-white text-slate-950">
            <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                            <GraduationCap size={22} />
                        </span>
                        <span>
                            <span className="block text-sm font-bold tracking-wide">AMS</span>
                            <span className="hidden text-xs text-slate-500 sm:block">Academic Management System</span>
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
                        <a href="#features" className="hover:text-primary-600">Features</a>
                        <a href="#roles" className="hover:text-primary-600">Roles</a>
                        <a href="#analytics" className="hover:text-primary-600">Analytics</a>
                        <a href="#contact" className="hover:text-primary-600">Contact</a>
                    </nav>

                    <Link to="/login" className="btn-primary">Login</Link>
                </div>
            </header>

            <main>
                <section className="relative overflow-hidden border-b border-blue-50 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_70%)]">
                    <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-18 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
                        <div className="animate-fade-up">
                            <p className="page-kicker">Academic ERP for modern institutions</p>
                            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                                Smart Academic Management for Modern Institutions
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                                AMS brings attendance, marks, faculty operations, student monitoring, notifications, and analytics into one secure role-based platform.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link to="/login" className="btn-primary px-5 py-3">Get Started</Link>
                                <a href="#contact" className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-primary-700 shadow-sm transition hover:border-primary-500 hover:bg-primary-50">
                                    Book Demo
                                </a>
                            </div>
                            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                                <StatCard label="Roles" value="4" tone="text-primary-600" />
                                <StatCard label="Insights" value="Live" tone="text-cyan-600" />
                                <StatCard label="Access" value="Secure" tone="text-emerald-600" />
                            </div>
                        </div>

                        <div className="animate-fade-up rounded-lg border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-900/10">
                            <div className="rounded-md bg-slate-950 p-4 text-white">
                                <div className="mb-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-blue-200">Institution Dashboard</p>
                                        <h2 className="mt-1 text-lg font-semibold">Academic Intelligence</h2>
                                    </div>
                                    <Sparkles className="text-cyan-300" size={24} />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {['Attendance', 'Performance', 'Risk'].map((label, index) => (
                                        <div key={label} className="rounded-lg bg-white/10 p-3">
                                            <p className="text-xs text-blue-100">{label}</p>
                                            <p className="mt-2 text-2xl font-bold">{[92, 84, 12][index]}{index === 2 ? '' : '%'}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 rounded-lg bg-white p-4 text-slate-900">
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-sm font-semibold">Attendance Overview</p>
                                        <TrendingUp className="text-emerald-600" size={18} />
                                    </div>
                                    <div className="flex h-36 items-end gap-2">
                                        {[58, 72, 64, 86, 78, 92, 88, 96].map((height, index) => (
                                            <div key={index} className="flex flex-1 flex-col items-center gap-2">
                                                <div className="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-cyan-400" style={{ height: `${height}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="page-kicker">Core modules</p>
                        <h2 className="mt-2 text-3xl font-bold">Everything academic teams need in one workspace</h2>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="group rounded-lg border border-blue-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-500 hover:shadow-lg">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                    <Icon size={22} />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="roles" className="bg-blue-50/60 py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div className="max-w-2xl">
                                <p className="page-kicker">Role-based access</p>
                                <h2 className="mt-2 text-3xl font-bold">Every user lands in the right dashboard</h2>
                            </div>
                            <Link to="/login" className="btn-primary w-fit">Select Role</Link>
                        </div>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {roles.map(({ icon: Icon, title, text }) => (
                                <Link key={title} to="/login" className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-500 hover:shadow-lg">
                                    <Icon className="text-primary-600" size={28} />
                                    <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="analytics" className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                    <div>
                        <p className="page-kicker">Analytics and benefits</p>
                        <h2 className="mt-2 text-3xl font-bold">Turn academic records into clear decisions</h2>
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                            AMS helps institutions identify attendance gaps, monitor performance, detect risk early, and keep academic operations visible from role-specific dashboards.
                        </p>
                        <div className="mt-6 space-y-3">
                            {['Real-time academic analytics', 'Attendance insights and student tracking', 'Risk detection for low attendance and weak performance', 'Dashboard intelligence for admins and faculty'].map(item => (
                                <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                    <ShieldCheck className="text-emerald-600" size={18} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold">Attendance Health</p>
                            <p className="mt-2 text-4xl font-bold text-primary-600">89%</p>
                            <div className="mt-4 h-2 rounded-full bg-blue-100">
                                <div className="h-full w-[89%] rounded-full bg-primary-600" />
                            </div>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold">Students Monitored</p>
                            <p className="mt-2 text-4xl font-bold text-cyan-600">1.2k</p>
                            <p className="mt-4 text-sm text-slate-500">Across departments and classes</p>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm sm:col-span-2">
                            <p className="text-sm font-semibold">Academic Signals</p>
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                {['Present', 'Improving', 'Needs Review'].map((label, index) => (
                                    <div key={label} className="rounded-md bg-blue-50 p-3">
                                        <p className="text-xs text-slate-500">{label}</p>
                                        <p className="mt-1 text-xl font-bold text-slate-950">{[76, 18, 6][index]}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="contact" className="bg-slate-950 py-14 text-white">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Book a demo</p>
                            <h2 className="mt-2 text-3xl font-bold">Bring AMS to your institution</h2>
                            <p className="mt-4 text-sm leading-6 text-blue-100">
                                Connect with PASHAM MANIKANTAREDDY for a professional walkthrough of the platform, role flows, dashboards, and academic management capabilities.
                            </p>
                            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                <a href="mailto:pashammanikantareddy@gmail.com" className="btn-primary px-5 py-3">
                                    <Mail size={18} /> Email
                                </a>
                                <a href="tel:+918074747773" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                    <Phone size={18} /> Call
                                </a>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-lg border border-white/10 bg-white/10 p-5">
                                <p className="text-xs uppercase tracking-wide text-blue-200">Name</p>
                                <p className="mt-3 font-semibold">PASHAM MANIKANTAREDDY</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/10 p-5">
                                <p className="text-xs uppercase tracking-wide text-blue-200">Phone</p>
                                <p className="mt-3 font-semibold">+91 8074747773</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/10 p-5">
                                <p className="text-xs uppercase tracking-wide text-blue-200">Email</p>
                                <p className="mt-3 break-words font-semibold">pashammanikantareddy@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="page-kicker">FAQ</p>
                        <h2 className="mt-2 text-3xl font-bold">Common questions</h2>
                    </div>
                    <div className="mt-8 space-y-3">
                        {faqs.map(([question, answer], index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={question} className="rounded-lg border border-blue-100 bg-white shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? -1 : index)}
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold"
                                    >
                                        {question}
                                        <ChevronDown className={`shrink-0 text-primary-600 transition ${isOpen ? 'rotate-180' : ''}`} size={18} />
                                    </button>
                                    <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                        <div className="overflow-hidden">
                                            <p className="px-5 pb-4 text-sm leading-6 text-slate-600">{answer}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <footer className="border-t border-blue-100 bg-blue-50/60">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                                <BookOpenCheck size={19} />
                            </span>
                            <span className="font-bold">AMS</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">Academic Management System for modern institutions.</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Quick Links</p>
                        <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                            <a href="#features" className="hover:text-primary-600">Features</a>
                            <a href="#roles" className="hover:text-primary-600">Roles</a>
                            <a href="#contact" className="hover:text-primary-600">Contact</a>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Contact</p>
                        <p className="mt-3 text-sm text-slate-600">+91 8074747773</p>
                        <p className="mt-1 break-words text-sm text-slate-600">pashammanikantareddy@gmail.com</p>
                        <div className="mt-4 flex gap-2">
                            {['in', 'x', 'yt'].map(item => (
                                <span key={item} className="flex h-8 w-8 items-center justify-center rounded-md border border-blue-200 bg-white text-xs font-bold uppercase text-primary-600">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="border-t border-blue-100 px-4 py-4 text-center text-xs text-slate-500">
                    Copyright 2026 AMS - Academic Management System. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Landing;
