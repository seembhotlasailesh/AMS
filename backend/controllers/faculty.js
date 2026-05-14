const prisma = require('../db');
const {
    serializeAttendance,
    serializeClass,
    serializeLeave,
    serializeSubject,
    toDbStatus
} = require('../utils/serializers');

const getManagedCollegeIds = async (user) => {
    if (['ADMIN', 'MAIN_ADMIN'].includes(user?.role)) return null;
    if (user?.role !== 'COLLEGE_ADMIN') return null;

    const permissions = await prisma.admin_college_permissions.findMany({
        where: { user_id: user.id },
        select: { college_id: true }
    });

    return permissions.map(permission => permission.college_id);
};

const getScopedClassWhere = async (user) => {
    const managedCollegeIds = await getManagedCollegeIds(user);
    return managedCollegeIds ? { departments: { college_id: { in: managedCollegeIds } } } : {};
};

const getFacultyForUser = async (user) => {
    if (user?.role !== 'FACULTY') return null;
    return prisma.faculty.findUnique({ where: { user_id: user.id } });
};

const ensureClassScope = async (req, res, classId) => {
    const faculty = await getFacultyForUser(req.user);
    if (faculty) {
        const classRow = await prisma.classes.findFirst({
            where: {
                id: classId,
                OR: [
                    { faculty_id: faculty.id },
                    { subjects: { some: { faculty_id: faculty.id } } }
                ]
            }
        });
        if (classRow) return true;
        res.status(403).json({ message: 'Not authorized for this class' });
        return false;
    }

    const managedCollegeIds = await getManagedCollegeIds(req.user);
    if (!managedCollegeIds) return true;

    const classRow = await prisma.classes.findUnique({
        where: { id: classId },
        include: { departments: true }
    });
    if (!classRow) {
        res.status(404).json({ message: 'Class not found' });
        return false;
    }
    if (managedCollegeIds.includes(classRow.departments.college_id)) return true;

    res.status(403).json({ message: 'Not authorized for this class' });
    return false;
};

const getDashboard = async (req, res) => {
    try {
        const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
        if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

        const [classes, subjects, attendanceCounts, recentAttendance] = await Promise.all([
            prisma.classes.findMany({
                where: { faculty_id: faculty.id },
                include: { class_students: true },
                orderBy: [{ class_name: 'asc' }, { section: 'asc' }]
            }),
            prisma.subjects.findMany({
                where: { faculty_id: faculty.id },
                orderBy: { subject_name: 'asc' }
            }),
            prisma.attendance.groupBy({
                by: ['status'],
                where: { subjects: { faculty_id: faculty.id } },
                _count: { status: true }
            }),
            prisma.attendance.findMany({
                where: { subjects: { faculty_id: faculty.id } },
                include: { subjects: true, classes: true },
                orderBy: { created_at: 'desc' },
                take: 5
            })
        ]);

        const studentIds = new Set(classes.flatMap(classRow => classRow.class_students.map(row => row.student_id)));
        const present = attendanceCounts.find(row => row.status === 'present')?._count.status || 0;
        const totalMarked = attendanceCounts.reduce((sum, row) => sum + row._count.status, 0);

        res.json({
            totalStudents: studentIds.size,
            totalSubjects: subjects.length,
            totalClasses: classes.length,
            averageAttendance: totalMarked ? Number(((present / totalMarked) * 100).toFixed(1)) : 0,
            recentActivities: recentAttendance.map(record => ({
                id: record.id,
                subject: record.subjects?.subject_name,
                className: `${record.classes?.class_name || ''}${record.classes?.section ? ` - ${record.classes.section}` : ''}`,
                date: record.date,
                period: record.hour_number,
                status: record.status
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading faculty dashboard', error: error.message });
    }
};

// === CLASSES ===
const getClasses = async (req, res) => {
    const faculty = await getFacultyForUser(req.user);
    const scopedWhere = await getScopedClassWhere(req.user);
    const classes = await prisma.classes.findMany({
        where: faculty
            ? {
                OR: [
                    { faculty_id: faculty.id },
                    { subjects: { some: { faculty_id: faculty.id } } }
                ]
            }
            : scopedWhere,
        include: {
            departments: true,
            class_students: { include: { students: { include: { users: true, departments: true } } } }
        },
        orderBy: [{ class_name: 'asc' }, { section: 'asc' }]
    });
    res.json(classes.map(serializeClass));
};

const createClass = async (req, res) => {
    const { name, departmentId, section } = req.body;
    const fUser = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
    try {
        const newClass = await prisma.classes.create({
            data: {
                class_name: name,
                section: section || 'A',
                department_id: departmentId || fUser.department_id,
                faculty_id: fUser.id
            },
            include: { departments: true, class_students: true }
        });
        res.status(201).json(serializeClass(newClass));
    } catch (error) {
        res.status(500).json({ message: 'Error creating class', error: error.message });
    }
};

// === SUBJECTS ===
const getSubjects = async (req, res) => {
    const { classId } = req.query;
    const faculty = await getFacultyForUser(req.user);
    const scopedClassWhere = await getScopedClassWhere(req.user);
    const subjects = await prisma.subjects.findMany({
        where: {
            ...(classId ? { class_id: classId } : {}),
            ...(faculty ? { faculty_id: faculty.id } : {}),
            ...(Object.keys(scopedClassWhere).length ? { classes: scopedClassWhere } : {})
        },
        include: { classes: true, faculty: { include: { users: true } } },
        orderBy: { subject_name: 'asc' }
    });
    res.json(subjects.map(serializeSubject));
};

const createSubject = async (req, res) => {
    const { name, classId, facultyId } = req.body;
    try {
        if (!(await ensureClassScope(req, res, classId))) return;

        const classRow = await prisma.classes.findUnique({ where: { id: classId } });
        if (!classRow) return res.status(404).json({ message: 'Class not found' });

        const fUser = req.user.role === 'FACULTY'
            ? await prisma.faculty.findUnique({ where: { user_id: req.user.id } })
            : null;
        const resolvedFacultyId = facultyId || fUser?.id || classRow.faculty_id;

        const subject = await prisma.subjects.create({
            data: { subject_name: name, class_id: classId, faculty_id: resolvedFacultyId },
            include: { classes: true, faculty: { include: { users: true } } }
        });
        res.status(201).json(serializeSubject(subject));
    } catch (error) {
        res.status(500).json({ message: 'Error creating subject', error: error.message });
    }
};

const updateSubject = async (req, res) => {
    const { id } = req.params;
    const { name, classId, facultyId } = req.body;

    try {
        if (classId && !(await ensureClassScope(req, res, classId))) return;

        const subject = await prisma.subjects.update({
            where: { id },
            data: {
                ...(name ? { subject_name: name } : {}),
                ...(classId ? { class_id: classId } : {}),
                ...(facultyId ? { faculty_id: facultyId } : {})
            },
            include: { classes: true, faculty: { include: { users: true } } }
        });
        res.json(serializeSubject(subject));
    } catch (error) {
        res.status(500).json({ message: 'Error updating subject', error: error.message });
    }
};

const deleteSubject = async (req, res) => {
    const { id } = req.params;

    try {
        const subject = await prisma.subjects.findUnique({ where: { id } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        if (!(await ensureClassScope(req, res, subject.class_id))) return;

        await prisma.subjects.delete({ where: { id } });
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subject', error: error.message });
    }
};

// === ATTENDANCE ===
const markAttendance = async (req, res) => {
    const { classId, subjectId, date, period, records } = req.body; // records = [{ studentId, status }, ...]

    try {
        if (!classId || !subjectId || !date || !period) {
            return res.status(400).json({ message: 'Class, subject, date, and period are required' });
        }
        if (!records?.length) {
            return res.status(400).json({ message: 'At least one attendance record is required' });
        }

        const subject = await prisma.subjects.findUnique({ where: { id: subjectId } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        if (!(await ensureClassScope(req, res, classId))) return;
        const faculty = await getFacultyForUser(req.user);
        if (faculty && subject.faculty_id !== faculty.id) {
            return res.status(403).json({ message: 'Not authorized for this subject' });
        }
        if (subject.class_id !== classId) {
            return res.status(400).json({ message: 'Selected subject does not belong to selected class' });
        }

        const attendanceData = records.map(record => ({
            student_id: record.studentId,
            marked_by: req.user.id,
            subject_id: subjectId,
            class_id: classId,
            date: new Date(date),
            hour_number: period,
            status: toDbStatus(record.status)
        }));

        await prisma.$transaction(async (tx) => {
            await tx.attendance.deleteMany({
                where: {
                    class_id: classId,
                    subject_id: subjectId,
                    date: new Date(date),
                    hour_number: period
                }
            });

            await tx.attendance.createMany({ data: attendanceData });
        });

        res.status(201).json({ message: 'Attendance saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
};

const getAttendance = async (req, res) => {
    const { classId, subjectId, date, period } = req.query;

    try {
        if (classId && !(await ensureClassScope(req, res, classId))) return;
        const faculty = await getFacultyForUser(req.user);
        const scopedClassWhere = await getScopedClassWhere(req.user);
        const records = await prisma.attendance.findMany({
            where: {
                ...(classId ? { class_id: classId } : {}),
                ...(subjectId ? { subject_id: subjectId } : {}),
                ...(date ? { date: new Date(date) } : {}),
                ...(period ? { hour_number: Number(period) } : {}),
                ...(faculty ? { subjects: { faculty_id: faculty.id } } : {}),
                ...(Object.keys(scopedClassWhere).length ? { classes: scopedClassWhere } : {})
            },
            include: {
                subjects: true,
                students: { include: { users: true, departments: true } },
                classes: true
            },
            orderBy: [{ date: 'desc' }, { hour_number: 'asc' }]
        });

        res.json(records.map(serializeAttendance));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

const updateAttendanceRecord = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const existingRecord = await prisma.attendance.findUnique({
            where: { id },
            include: { subjects: true }
        });
        if (!existingRecord) return res.status(404).json({ message: 'Attendance record not found' });

        const faculty = await getFacultyForUser(req.user);
        if (faculty && existingRecord.subjects?.faculty_id !== faculty.id) {
            return res.status(403).json({ message: 'Not authorized to update this attendance record' });
        }

        const record = await prisma.attendance.update({
            where: { id },
            data: { status: toDbStatus(status) },
            include: {
                subjects: true,
                students: { include: { users: true, departments: true } },
                classes: true
            }
        });
        res.json(serializeAttendance(record));
    } catch (error) {
        res.status(500).json({ message: 'Error updating attendance', error: error.message });
    }
};

// === EXAMS & MARKS ===
const getExams = async (req, res) => {
    const { classId, subjectId } = req.query;

    try {
        const exams = await prisma.exams.findMany({
            where: {
                ...(classId ? { class_id: classId } : {}),
                ...(subjectId ? { subject_id: subjectId } : {})
            },
            include: { classes: true, subjects: true, faculty: { include: { users: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
    }
};

const createExam = async (req, res) => {
    const { classId, subjectId, examName, examType, semester, totalMarks, examDate, facultyId } = req.body;

    try {
        if (!(await ensureClassScope(req, res, classId))) return;

        const subject = await prisma.subjects.findUnique({ where: { id: subjectId } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        if (subject.class_id !== classId) return res.status(400).json({ message: 'Subject does not belong to selected class' });

        const faculty = req.user.role === 'FACULTY'
            ? await prisma.faculty.findUnique({ where: { user_id: req.user.id } })
            : null;

        const exam = await prisma.exams.create({
            data: {
                class_id: classId,
                subject_id: subjectId,
                faculty_id: facultyId || faculty?.id || subject.faculty_id,
                exam_name: examName,
                exam_type: examType,
                semester: semester ? Number(semester) : null,
                total_marks: Number(totalMarks),
                exam_date: examDate ? new Date(examDate) : null
            }
        });
        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Error creating exam', error: error.message });
    }
};

const getExamMarks = async (req, res) => {
    const { examId } = req.params;

    try {
        const marks = await prisma.marks.findMany({
            where: { exam_id: examId },
            include: { students: { include: { users: true, departments: true } }, exams: true },
            orderBy: { students: { roll_number: 'asc' } }
        });
        res.json(marks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
};

const saveExamMarks = async (req, res) => {
    const { examId } = req.params;
    const { records } = req.body; // [{ studentId, marksObtained, remarks }]

    try {
        const exam = await prisma.exams.findUnique({ where: { id: examId } });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (!(await ensureClassScope(req, res, exam.class_id))) return;
        if (!records?.length) return res.status(400).json({ message: 'Marks records are required' });

        await prisma.$transaction(records.map(record => prisma.marks.upsert({
            where: { exam_id_student_id: { exam_id: examId, student_id: record.studentId } },
            update: {
                marks_obtained: Number(record.marksObtained),
                remarks: record.remarks || null,
                updated_at: new Date()
            },
            create: {
                exam_id: examId,
                student_id: record.studentId,
                marks_obtained: Number(record.marksObtained),
                remarks: record.remarks || null
            }
        })));

        res.json({ message: 'Marks saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving marks', error: error.message });
    }
};

// === LEAVE REQUESTS ===
const getLeaveRequests = async (req, res) => {
    const fUser = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
    const leaves = await prisma.leave_requests.findMany({
        where: { students: { department_id: fUser.department_id } },
        include: { students: { include: { users: true, departments: true } } },
        orderBy: { created_at: 'desc' }
    });
    res.json(leaves.map(serializeLeave));
};

const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // "APPROVED" or "REJECTED"
    try {
        const leave = await prisma.leave_requests.update({
            where: { id },
            data: { status: toDbStatus(status) },
            include: { students: { include: { users: true, departments: true } } }
        });
        res.json(serializeLeave(leave));
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave', error: error.message });
    }
};

module.exports = {
    getDashboard,
    getClasses, createClass,
    getSubjects, createSubject, updateSubject, deleteSubject,
    markAttendance, getAttendance, updateAttendanceRecord,
    getExams, createExam, getExamMarks, saveExamMarks,
    getLeaveRequests, updateLeaveStatus
};
