const prisma = require('../db');
const {
    serializeFaculty,
    serializeAttendance,
    serializeLeave,
    serializeStudent
} = require('../utils/serializers');

// === PROFILE & DASHBOARD ===
const getStudentProfile = async (req, res) => {
    const student = await prisma.students.findUnique({
        where: { user_id: req.user.id },
        include: {
            users: true,
            departments: true,
            class_students: { include: { classes: true } }
        }
    });
    res.json(serializeStudent(student));
};

const getDashboard = async (req, res) => {
    try {
        const student = await prisma.students.findUnique({
            where: { user_id: req.user.id },
            include: {
                users: true,
                departments: true,
                class_students: { include: { classes: true } }
            }
        });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        const records = await prisma.attendance.findMany({
            where: { student_id: student.id },
            include: { subjects: true },
            orderBy: [{ date: 'desc' }, { hour_number: 'desc' }],
            take: 20
        });

        const present = records.filter(record => record.status === 'present').length;
        const absent = records.filter(record => record.status === 'absent').length;
        const total = records.length;

        res.json({
            student: serializeStudent(student),
            attendance: {
                present,
                absent,
                total,
                percentage: total ? Number(((present / total) * 100).toFixed(1)) : 0
            },
            recentAttendance: records.slice(0, 5).map(serializeAttendance)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading student dashboard', error: error.message });
    }
};

// === ATTENDANCE ===
const getMyAttendance = async (req, res) => {
    const student = await prisma.students.findUnique({ where: { user_id: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const records = await prisma.attendance.findMany({
        where: { student_id: student.id },
        include: { subjects: true },
        orderBy: { date: 'desc' }
    });
    res.json(records.map(serializeAttendance));
};

// === MARKS / PERFORMANCE ===
const getMyMarks = async (req, res) => {
    try {
        const student = await prisma.students.findUnique({ where: { user_id: req.user.id } });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        const marks = await prisma.marks.findMany({
            where: { student_id: student.id },
            include: {
                exams: {
                    include: {
                        subjects: true,
                        classes: true,
                        faculty: { include: { users: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const records = marks.map(mark => {
            const totalMarks = Number(mark.exams?.total_marks || 0);
            const obtained = Number(mark.marks_obtained || 0);
            const percentage = totalMarks ? Number(((obtained / totalMarks) * 100).toFixed(1)) : 0;

            return {
                id: mark.id,
                examId: mark.exam_id,
                subject: mark.exams?.subjects?.subject_name || 'Unknown Subject',
                className: mark.exams?.classes
                    ? `${mark.exams.classes.class_name}${mark.exams.classes.section ? ` - ${mark.exams.classes.section}` : ''}`
                    : '',
                examName: mark.exams?.exam_name,
                examType: mark.exams?.exam_type,
                semester: mark.exams?.semester,
                marksObtained: obtained,
                totalMarks,
                percentage,
                grade: percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'Fail',
                status: percentage >= 40 ? 'PASS' : 'FAIL',
                remarks: mark.remarks,
                facultyName: mark.exams?.faculty?.users?.name,
                createdAt: mark.created_at,
                updatedAt: mark.updated_at
            };
        });

        const average = records.length
            ? Number((records.reduce((sum, record) => sum + record.percentage, 0) / records.length).toFixed(1))
            : 0;

        res.json({
            summary: {
                totalAssessments: records.length,
                average,
                grade: average >= 80 ? 'A' : average >= 60 ? 'B' : average >= 40 ? 'C' : 'Fail',
                passCount: records.filter(record => record.status === 'PASS').length,
                failCount: records.filter(record => record.status === 'FAIL').length
            },
            records
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
};

// === LEAVES ===
const applyLeave = async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    const student = await prisma.students.findUnique({ where: { user_id: req.user.id } });

    try {
        const leave = await prisma.leave_requests.create({
            data: {
                student_id: student.id,
                start_date: new Date(startDate),
                end_date: new Date(endDate),
                reason
            },
            include: { students: { include: { users: true, departments: true } } }
        });
        res.status(201).json(serializeLeave(leave));
    } catch (error) {
        res.status(500).json({ message: 'Error applying for leave', error: error.message });
    }
};

const getMyLeaves = async (req, res) => {
    const student = await prisma.students.findUnique({ where: { user_id: req.user.id } });
    const leaves = await prisma.leave_requests.findMany({
        where: { student_id: student.id },
        include: { students: { include: { users: true, departments: true } } },
        orderBy: { created_at: 'desc' }
    });
    res.json(leaves.map(serializeLeave));
};

const getFacultyList = async (req, res) => {
    const faculty = await prisma.faculty.findMany({
        include: { users: true, departments: true },
        orderBy: { created_at: 'desc' }
    });

    res.json(faculty.map(serializeFaculty));
};

module.exports = {
    getDashboard,
    getStudentProfile,
    getMyAttendance,
    getMyMarks,
    applyLeave,
    getMyLeaves,
    getFacultyList
};
