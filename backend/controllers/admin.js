const prisma = require('../db');
const bcrypt = require('bcryptjs');
const {
    serializeCollege,
    serializeDepartment,
    serializeFaculty,
    serializeStudent,
    serializeUser
} = require('../utils/serializers');

const isMainAdmin = (user) => ['MAIN_ADMIN', 'ADMIN'].includes(user?.role);
const isCollegeAdmin = (user) => user?.role === 'COLLEGE_ADMIN';

const getManagedCollegeIds = async (user) => {
    if (isMainAdmin(user)) return null;
    if (!isCollegeAdmin(user)) return [];

    const permissions = await prisma.admin_college_permissions.findMany({
        where: { user_id: user.id },
        select: { college_id: true }
    });

    return permissions.map(permission => permission.college_id);
};

const requireMainAdmin = (req, res) => {
    if (isMainAdmin(req.user)) return true;
    res.status(403).json({ message: 'Only Main Admin can perform this action' });
    return false;
};

const ensureCollegeAccess = async (req, res, collegeId) => {
    const managedCollegeIds = await getManagedCollegeIds(req.user);
    if (managedCollegeIds === null || managedCollegeIds.includes(collegeId)) return true;

    res.status(403).json({ message: 'Not authorized for this college' });
    return false;
};

const ensureDepartmentAccess = async (req, res, departmentId) => {
    const department = await prisma.departments.findUnique({ where: { id: departmentId } });
    if (!department) {
        res.status(404).json({ message: 'Department not found' });
        return false;
    }
    return ensureCollegeAccess(req, res, department.college_id);
};

const ensureClassAccess = async (req, res, classId) => {
    const classRow = await prisma.classes.findUnique({ where: { id: classId } });
    if (!classRow) {
        res.status(404).json({ message: 'Class not found' });
        return false;
    }
    return ensureDepartmentAccess(req, res, classRow.department_id);
};

const getDashboard = async (req, res) => {
    try {
        const managedCollegeIds = await getManagedCollegeIds(req.user);
        const departmentWhere = managedCollegeIds ? { college_id: { in: managedCollegeIds } } : {};
        const facultyWhere = managedCollegeIds ? { departments: { college_id: { in: managedCollegeIds } } } : {};
        const studentWhere = managedCollegeIds ? { departments: { college_id: { in: managedCollegeIds } } } : {};
        const classWhere = managedCollegeIds ? { departments: { college_id: { in: managedCollegeIds } } } : {};
        const attendanceWhere = managedCollegeIds ? { classes: { departments: departmentWhere } } : {};

        const marksWhere = managedCollegeIds ? { exams: { classes: { departments: departmentWhere } } } : {};

        const [totalColleges, activeColleges, totalFaculty, totalStudents, totalClasses, attendanceCounts, studentAttendance, departments, marks] = await Promise.all([
            prisma.colleges.count({ where: managedCollegeIds ? { id: { in: managedCollegeIds } } : {} }),
            prisma.colleges.count({ where: { ...(managedCollegeIds ? { id: { in: managedCollegeIds } } : {}), is_active: true } }),
            prisma.faculty.count({ where: facultyWhere }),
            prisma.students.count({ where: studentWhere }),
            prisma.classes.count({ where: classWhere }),
            prisma.attendance.groupBy({
                by: ['status'],
                where: attendanceWhere,
                _count: { status: true }
            }),
            prisma.attendance.groupBy({
                by: ['student_id', 'status'],
                where: attendanceWhere,
                _count: { status: true }
            }),
            prisma.departments.findMany({
                where: departmentWhere,
                select: {
                    id: true,
                    department_name: true,
                    classes: {
                        select: {
                            attendance: {
                                select: { status: true }
                            }
                        }
                    }
                },
                orderBy: { department_name: 'asc' }
            }),
            prisma.marks.findMany({
                where: marksWhere,
                include: {
                    students: { include: { users: true, departments: true } },
                    exams: {
                        include: {
                            subjects: true,
                            classes: { include: { departments: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            })
        ]);

        const present = attendanceCounts.find(row => row.status === 'present')?._count.status || 0;
        const totalMarked = attendanceCounts.reduce((sum, row) => sum + row._count.status, 0);
        const byStudent = studentAttendance.reduce((acc, row) => {
            acc[row.student_id] = acc[row.student_id] || { present: 0, total: 0 };
            acc[row.student_id].total += row._count.status;
            if (row.status === 'present') acc[row.student_id].present += row._count.status;
            return acc;
        }, {});
        const atRiskStudentIds = Object.entries(byStudent)
            .filter(([, item]) => item.total > 0 && (item.present / item.total) * 100 < 75)
            .map(([studentId]) => studentId);
        const atRiskStudents = atRiskStudentIds.length;
        const atRiskStudentRows = atRiskStudentIds.length
            ? await prisma.students.findMany({
                where: { id: { in: atRiskStudentIds } },
                include: {
                    users: true,
                    departments: true,
                    class_students: { include: { classes: true } }
                },
                take: 50
            })
            : [];
        const departmentAttendance = departments.map(department => {
            const statuses = department.classes.flatMap(classRow => classRow.attendance.map(record => record.status));
            const deptPresent = statuses.filter(status => status === 'present').length;
            return {
                name: department.department_name,
                present: statuses.length ? Number(((deptPresent / statuses.length) * 100).toFixed(1)) : 0,
                absent: statuses.length ? Number((((statuses.length - deptPresent) / statuses.length) * 100).toFixed(1)) : 0
            };
        });
        const markRows = marks.map(mark => {
            const totalMarks = Number(mark.exams?.total_marks || 0);
            const obtained = Number(mark.marks_obtained || 0);
            const percentage = totalMarks ? Number(((obtained / totalMarks) * 100).toFixed(1)) : 0;

            return {
                id: mark.id,
                studentId: mark.student_id,
                studentName: mark.students?.users?.name || 'Unknown Student',
                rollNumber: mark.students?.roll_number,
                department: mark.exams?.classes?.departments?.department_name || mark.students?.departments?.department_name || 'Unassigned',
                className: mark.exams?.classes
                    ? `${mark.exams.classes.class_name}${mark.exams.classes.section ? ` - ${mark.exams.classes.section}` : ''}`
                    : 'Unassigned',
                subject: mark.exams?.subjects?.subject_name || 'Unknown Subject',
                examName: mark.exams?.exam_name,
                examType: mark.exams?.exam_type,
                marksObtained: obtained,
                totalMarks,
                percentage,
                status: percentage >= 40 ? 'PASS' : 'FAIL',
                remarks: mark.remarks || '',
                attendance: byStudent[mark.student_id]?.total
                    ? Number(((byStudent[mark.student_id].present / byStudent[mark.student_id].total) * 100).toFixed(1))
                    : 0
            };
        });
        const averageMarks = markRows.length
            ? Number((markRows.reduce((sum, row) => sum + row.percentage, 0) / markRows.length).toFixed(1))
            : 0;
        const marksByDepartment = Object.values(markRows.reduce((acc, row) => {
            acc[row.department] = acc[row.department] || { name: row.department, total: 0, count: 0, pass: 0, fail: 0 };
            acc[row.department].total += row.percentage;
            acc[row.department].count += 1;
            if (row.status === 'PASS') acc[row.department].pass += 1;
            else acc[row.department].fail += 1;
            return acc;
        }, {})).map(row => ({
            name: row.name,
            average: Number((row.total / row.count).toFixed(1)),
            pass: row.pass,
            fail: row.fail
        }));
        const marksBySubject = Object.values(markRows.reduce((acc, row) => {
            acc[row.subject] = acc[row.subject] || { subject: row.subject, total: 0, count: 0, pass: 0, fail: 0 };
            acc[row.subject].total += row.percentage;
            acc[row.subject].count += 1;
            if (row.status === 'PASS') acc[row.subject].pass += 1;
            else acc[row.subject].fail += 1;
            return acc;
        }, {})).map(row => ({
            subject: row.subject,
            average: Number((row.total / row.count).toFixed(1)),
            passRate: Number(((row.pass / row.count) * 100).toFixed(1)),
            fail: row.fail
        }));
        const weakStudents = markRows
            .filter(row => row.percentage < 40)
            .map(row => ({ ...row, riskStatus: row.attendance < 75 ? 'High Risk' : 'Academic Risk' }))
            .slice(0, 25);
        const lowAttendanceStudents = atRiskStudentRows.map(student => {
            const attendance = byStudent[student.id];
            const percentage = attendance?.total ? Number(((attendance.present / attendance.total) * 100).toFixed(1)) : 0;
            const firstClass = student.class_students?.[0]?.classes;
            return {
                id: student.id,
                studentName: student.users?.name || 'Unknown Student',
                rollNumber: student.roll_number,
                department: student.departments?.department_name || 'Unassigned',
                className: firstClass ? `${firstClass.class_name}${firstClass.section ? ` - ${firstClass.section}` : ''}` : 'Unassigned',
                attendance: percentage,
                totalMarked: attendance?.total || 0,
                riskStatus: percentage < 50 ? 'Critical' : 'Low Attendance'
            };
        });

        res.json({
            totalColleges,
            activeColleges,
            totalFaculty,
            totalStudents,
            totalClasses,
            attendanceRate: totalMarked ? Number(((present / totalMarked) * 100).toFixed(1)) : 0,
            atRiskStudents,
            departmentAttendance,
            marksAnalytics: {
                totalMarksEntries: markRows.length,
                averageMarks,
                passCount: markRows.filter(row => row.status === 'PASS').length,
                failCount: markRows.filter(row => row.status === 'FAIL').length,
                marksByDepartment,
                marksBySubject,
                weakStudents,
                passedStudents: markRows.filter(row => row.status === 'PASS').slice(0, 25),
                recentMarks: markRows.slice(0, 50)
            },
            lowAttendanceStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading dashboard', error: error.message });
    }
};

// === COLLEGES ===
const getColleges = async (req, res) => {
    const managedCollegeIds = await getManagedCollegeIds(req.user);
    const colleges = await prisma.colleges.findMany({
        where: managedCollegeIds ? { id: { in: managedCollegeIds } } : {},
        include: { departments: true },
        orderBy: { created_at: 'desc' }
    });
    res.json(colleges.map(serializeCollege));
};

const createCollege = async (req, res) => {
    if (!requireMainAdmin(req, res)) return;

    const { name, address, isActive } = req.body;
    try {
        const college = await prisma.colleges.create({
            data: { college_name: name, address: address || '', is_active: isActive ?? true },
            include: { departments: true }
        });
        res.status(201).json(serializeCollege(college));
    } catch (error) {
        res.status(500).json({ message: 'Error creating college', error: error.message });
    }
};

const updateCollege = async (req, res) => {
    if (!requireMainAdmin(req, res)) return;

    const { id } = req.params;
    const { name, address, isActive } = req.body;

    try {
        const college = await prisma.colleges.update({
            where: { id },
            data: {
                ...(name ? { college_name: name } : {}),
                ...(address !== undefined ? { address: address || '' } : {}),
                ...(isActive !== undefined ? { is_active: Boolean(isActive) } : {})
            },
            include: { departments: true }
        });
        res.json(serializeCollege(college));
    } catch (error) {
        res.status(500).json({ message: 'Error updating college', error: error.message });
    }
};

const deleteCollege = async (req, res) => {
    if (!requireMainAdmin(req, res)) return;

    const { id } = req.params;

    try {
        await prisma.colleges.delete({ where: { id } });
        res.json({ message: 'College deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting college', error: error.message });
    }
};

// === DEPARTMENTS ===
const getDepartments = async (req, res) => {
    const managedCollegeIds = await getManagedCollegeIds(req.user);
    const departments = await prisma.departments.findMany({
        where: managedCollegeIds ? { college_id: { in: managedCollegeIds } } : {},
        include: { colleges: true },
        orderBy: { department_name: 'asc' }
    });
    res.json(departments.map(serializeDepartment));
};

const createDepartment = async (req, res) => {
    const { name, collegeId } = req.body;
    try {
        if (!(await ensureCollegeAccess(req, res, collegeId))) return;

        const dept = await prisma.departments.create({
            data: { department_name: name, college_id: collegeId },
            include: { colleges: true }
        });
        res.status(201).json(serializeDepartment(dept));
    } catch (error) {
        res.status(500).json({ message: 'Error creating department', error: error.message });
    }
};

const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, collegeId } = req.body;

    try {
        if (collegeId && !(await ensureCollegeAccess(req, res, collegeId))) return;
        if (!collegeId && !(await ensureDepartmentAccess(req, res, id))) return;

        const dept = await prisma.departments.update({
            where: { id },
            data: {
                ...(name ? { department_name: name } : {}),
                ...(collegeId ? { college_id: collegeId } : {})
            },
            include: { colleges: true }
        });
        res.json(serializeDepartment(dept));
    } catch (error) {
        res.status(500).json({ message: 'Error updating department', error: error.message });
    }
};

const deleteDepartment = async (req, res) => {
    const { id } = req.params;

    try {
        if (!(await ensureDepartmentAccess(req, res, id))) return;

        await prisma.departments.delete({ where: { id } });
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting department', error: error.message });
    }
};

// === FACULTY ===
const getFaculties = async (req, res) => {
    const managedCollegeIds = await getManagedCollegeIds(req.user);
    const faculties = await prisma.faculty.findMany({
        where: managedCollegeIds ? { departments: { college_id: { in: managedCollegeIds } } } : {},
        include: { users: true, departments: true },
        orderBy: { created_at: 'desc' }
    });
    res.json(faculties.map(serializeFaculty));
};

const createFaculty = async (req, res) => {
    const { email, password, name, employeeId, designation, departmentId, phone } = req.body;
    try {
        if (!(await ensureDepartmentAccess(req, res, departmentId))) return;

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'faculty',
                phone: phone || '',
                faculty: {
                    create: {
                        employee_id: employeeId || null,
                        designation: designation || 'Faculty',
                        department_id: departmentId
                    }
                }
            },
            include: { faculty: { include: { users: true, departments: true } } }
        });
        res.status(201).json(serializeFaculty(user.faculty));
    } catch (error) {
        res.status(500).json({ message: 'Error creating faculty', error: error.message });
    }
};

const updateFaculty = async (req, res) => {
    const { id } = req.params;
    const { email, password, name, employeeId, designation, departmentId, phone } = req.body;

    try {
        const current = await prisma.faculty.findUnique({ where: { id } });
        if (!current) return res.status(404).json({ message: 'Faculty not found' });
        if (!(await ensureDepartmentAccess(req, res, current.department_id))) return;
        if (departmentId && !(await ensureDepartmentAccess(req, res, departmentId))) return;

        const userData = {};
        if (name) userData.name = name;
        if (email) userData.email = email;
        if (phone !== undefined) userData.phone = phone || '';
        if (password) userData.password = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.users.update({
                where: { id: current.user_id },
                data: userData
            }),
            prisma.faculty.update({
                where: { id },
                data: {
                    ...(employeeId !== undefined ? { employee_id: employeeId || null } : {}),
                    ...(designation ? { designation } : {}),
                    ...(departmentId ? { department_id: departmentId } : {})
                }
            })
        ]);

        const faculty = await prisma.faculty.findUnique({
            where: { id },
            include: { users: true, departments: true }
        });
        res.json(serializeFaculty(faculty));
    } catch (error) {
        res.status(500).json({ message: 'Error updating faculty', error: error.message });
    }
};

const deleteFaculty = async (req, res) => {
    const { id } = req.params;

    try {
        const faculty = await prisma.faculty.findUnique({ where: { id } });
        if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
        if (!(await ensureDepartmentAccess(req, res, faculty.department_id))) return;

        await prisma.users.delete({ where: { id: faculty.user_id } });
        res.json({ message: 'Faculty deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting faculty', error: error.message });
    }
};

// === STUDENTS ===
const getStudents = async (req, res) => {
    const managedCollegeIds = await getManagedCollegeIds(req.user);
    const students = await prisma.students.findMany({
        where: managedCollegeIds ? { departments: { college_id: { in: managedCollegeIds } } } : {},
        include: {
            users: true,
            departments: true,
            class_students: { include: { classes: true } }
        },
        orderBy: { created_at: 'desc' }
    });
    res.json(students.map(serializeStudent));
};

const createStudent = async (req, res) => {
    const { email, password, name, enrollmentNo, classId, departmentId, batchYear, phone } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const selectedClass = classId
            ? await prisma.classes.findUnique({ where: { id: classId } })
            : null;
        const resolvedDepartmentId = departmentId || selectedClass?.department_id;

        if (!resolvedDepartmentId) {
            return res.status(400).json({ message: 'departmentId or classId is required' });
        }
        if (classId && !(await ensureClassAccess(req, res, classId))) return;
        if (!(await ensureDepartmentAccess(req, res, resolvedDepartmentId))) return;

        const user = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'student',
                phone: phone || '',
                students: {
                    create: {
                        roll_number: enrollmentNo,
                        department_id: resolvedDepartmentId,
                        batch_year: Number(batchYear) || new Date().getFullYear(),
                        ...(classId ? { class_students: { create: { class_id: classId } } } : {})
                    }
                }
            },
            include: {
                students: {
                    include: {
                        users: true,
                        departments: true,
                        class_students: { include: { classes: true } }
                    }
                }
            }
        });
        res.status(201).json(serializeStudent(user.students));
    } catch (error) {
        res.status(500).json({ message: 'Error creating student', error: error.message });
    }
};

const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { email, password, name, enrollmentNo, classId, departmentId, batchYear, phone } = req.body;

    try {
        const current = await prisma.students.findUnique({ where: { id } });
        if (!current) return res.status(404).json({ message: 'Student not found' });
        if (!(await ensureDepartmentAccess(req, res, current.department_id))) return;

        const selectedClass = classId
            ? await prisma.classes.findUnique({ where: { id: classId } })
            : null;
        const resolvedDepartmentId = departmentId || selectedClass?.department_id || current.department_id;
        if (classId && !(await ensureClassAccess(req, res, classId))) return;
        if (!(await ensureDepartmentAccess(req, res, resolvedDepartmentId))) return;

        const userData = {};
        if (name) userData.name = name;
        if (email) userData.email = email;
        if (phone !== undefined) userData.phone = phone || '';
        if (password) userData.password = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            await tx.users.update({
                where: { id: current.user_id },
                data: userData
            });

            await tx.students.update({
                where: { id },
                data: {
                    ...(enrollmentNo ? { roll_number: enrollmentNo } : {}),
                    department_id: resolvedDepartmentId,
                    ...(batchYear ? { batch_year: Number(batchYear) } : {})
                }
            });

            if (classId !== undefined) {
                await tx.class_students.deleteMany({ where: { student_id: id } });
                if (classId) {
                    await tx.class_students.create({
                        data: { student_id: id, class_id: classId }
                    });
                }
            }
        });

        const student = await prisma.students.findUnique({
            where: { id },
            include: {
                users: true,
                departments: true,
                class_students: { include: { classes: true } }
            }
        });
        res.json(serializeStudent(student));
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    const { id } = req.params;

    try {
        const student = await prisma.students.findUnique({ where: { id } });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (!(await ensureDepartmentAccess(req, res, student.department_id))) return;

        await prisma.users.delete({ where: { id: student.user_id } });
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    }
};

const getCollegeAdmins = async (req, res) => {
    if (!requireMainAdmin(req, res)) return;

    try {
        const admins = await prisma.users.findMany({
            where: { role: 'college_admin' },
            include: { admin_college_permissions: { include: { colleges: true } } },
            orderBy: { created_at: 'desc' }
        });

        res.json(admins.map(admin => ({
            ...serializeUser(admin),
            colleges: admin.admin_college_permissions.map(permission => serializeCollege(permission.colleges))
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching college admins', error: error.message });
    }
};

const createCollegeAdmin = async (req, res) => {
    if (!requireMainAdmin(req, res)) return;

    const { name, email, password, phone, collegeId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'college_admin',
                phone: phone || '',
                admin_college_permissions: {
                    create: {
                        college_id: collegeId,
                        can_manage_departments: true,
                        can_manage_faculty: true,
                        can_manage_students: true,
                        can_manage_reports: true,
                        can_manage_notifications: true,
                        can_manage_settings: true
                    }
                }
            },
            include: { admin_college_permissions: { include: { colleges: true } } }
        });

        res.status(201).json({
            ...serializeUser(user),
            colleges: user.admin_college_permissions.map(permission => serializeCollege(permission.colleges))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating college admin', error: error.message });
    }
};

module.exports = {
    getDashboard,
    getColleges, createCollege, updateCollege, deleteCollege,
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getFaculties, createFaculty, updateFaculty, deleteFaculty,
    getStudents, createStudent, updateStudent, deleteStudent,
    getCollegeAdmins, createCollegeAdmin
};
