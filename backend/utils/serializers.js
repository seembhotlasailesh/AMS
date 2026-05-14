const toAppRole = (role) => {
    if (role === 'admin') return 'MAIN_ADMIN';
    return role?.toUpperCase();
};
const toDbRole = (role) => role?.toLowerCase();
const toAppStatus = (status) => status?.toUpperCase();
const toDbStatus = (status) => status?.toLowerCase();

const serializeUser = (user) => user && ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: toAppRole(user.role),
    phone: user.phone,
    createdAt: user.created_at
});

const serializeCollege = (college) => college && ({
    id: college.id,
    name: college.college_name,
    address: college.address,
    isActive: college.is_active,
    createdAt: college.created_at,
    departments: college.departments?.map(serializeDepartment) || []
});

const serializeDepartment = (department) => department && ({
    id: department.id,
    name: department.department_name,
    collegeId: department.college_id,
    createdAt: department.created_at,
    college: department.colleges ? serializeCollege(department.colleges) : undefined
});

const serializeFaculty = (faculty) => faculty && ({
    id: faculty.id,
    userId: faculty.user_id,
    employeeId: faculty.employee_id,
    designation: faculty.designation,
    name: faculty.users?.name,
    departmentId: faculty.department_id,
    createdAt: faculty.created_at,
    user: faculty.users ? serializeUser(faculty.users) : undefined,
    department: faculty.departments ? serializeDepartment(faculty.departments) : undefined
});

const serializeStudent = (student) => {
    if (!student) return student;
    const firstClass = student.class_students?.[0]?.classes;

    return {
        id: student.id,
        userId: student.user_id,
        enrollmentNo: student.roll_number,
        rollNumber: student.roll_number,
        name: student.users?.name,
        departmentId: student.department_id,
        batchYear: student.batch_year,
        createdAt: student.created_at,
        user: student.users ? serializeUser(student.users) : undefined,
        department: student.departments ? serializeDepartment(student.departments) : undefined,
        class: firstClass ? serializeClass(firstClass) : undefined
    };
};

const serializeClass = (classRow) => classRow && ({
    id: classRow.id,
    name: `${classRow.class_name}${classRow.section ? ` - ${classRow.section}` : ''}`,
    className: classRow.class_name,
    section: classRow.section,
    departmentId: classRow.department_id,
    facultyId: classRow.faculty_id,
    createdAt: classRow.created_at,
    department: classRow.departments ? serializeDepartment(classRow.departments) : undefined,
    faculty: classRow.faculty ? serializeFaculty(classRow.faculty) : undefined,
    students: classRow.class_students?.map((row) => serializeStudent(row.students)) || []
});

const serializeSubject = (subject) => subject && ({
    id: subject.id,
    name: subject.subject_name,
    code: subject.subject_name,
    classId: subject.class_id,
    facultyId: subject.faculty_id,
    createdAt: subject.created_at,
    class: subject.classes ? serializeClass(subject.classes) : undefined
});

const serializeAttendance = (record) => record && ({
    id: record.id,
    studentId: record.student_id,
    subjectId: record.subject_id,
    classId: record.class_id,
    date: record.date,
    period: record.hour_number,
    status: toAppStatus(record.status),
    markedBy: record.marked_by,
    createdAt: record.created_at,
    subject: record.subjects ? serializeSubject(record.subjects) : undefined,
    student: record.students ? serializeStudent(record.students) : undefined
});

const serializeLeave = (leave) => leave && ({
    id: leave.id,
    studentId: leave.student_id,
    startDate: leave.start_date,
    endDate: leave.end_date,
    reason: leave.reason,
    status: toAppStatus(leave.status),
    createdAt: leave.created_at,
    student: leave.students ? serializeStudent(leave.students) : undefined,
    faculty: undefined
});

module.exports = {
    serializeAttendance,
    serializeClass,
    serializeCollege,
    serializeDepartment,
    serializeFaculty,
    serializeLeave,
    serializeStudent,
    serializeSubject,
    serializeUser,
    toAppRole,
    toAppStatus,
    toDbRole,
    toDbStatus
};
