require('dotenv').config();

const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../db');

const PASSWORD = '12345678';
const colleges = [
  { code: 'dsu', name: 'Dhanalakshmi Srinivasan University (DSU)', address: 'Trichy, Tamil Nadu' },
  { code: 'srm', name: 'SRM Institute of Science and Technology (SRM)', address: 'Chennai, Tamil Nadu' },
];
const departmentCodes = ['AIDS', 'CSE', 'AIML', 'ECE', 'CIVIL', 'MECH', 'EEE', 'IT'];
const sections = ['A', 'B', 'C'];
const subjectBank = {
  AIDS: ['Data Science Foundations', 'Python for Analytics', 'Machine Learning', 'Big Data Analytics', 'Data Visualization'],
  CSE: ['Data Structures', 'Database Management Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering'],
  AIML: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision'],
  ECE: ['Digital Electronics', 'Signals and Systems', 'Communication Systems', 'Microprocessors', 'VLSI Design'],
  CIVIL: ['Structural Engineering', 'Fluid Mechanics', 'Surveying', 'Concrete Technology', 'Geotechnical Engineering'],
  MECH: ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing Technology', 'Heat Transfer'],
  EEE: ['Electrical Machines', 'Power Systems', 'Control Systems', 'Power Electronics', 'Circuit Theory'],
  IT: ['Web Technologies', 'Cloud Computing', 'Cyber Security', 'Data Structures', 'Computer Networks'],
};

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Karthik', 'Rohan', 'Rahul', 'Nikhil', 'Manoj', 'Sanjay', 'Vikram', 'Meera', 'Ananya', 'Priya', 'Sneha', 'Kavya', 'Divya', 'Nandini', 'Keerthi', 'Harini', 'Lakshmi', 'Ishita', 'Pooja'];
const lastNames = ['Reddy', 'Kumar', 'Sharma', 'Nair', 'Iyer', 'Rao', 'Menon', 'Patel', 'Krishnan', 'Varma', 'Prasad', 'Naidu', 'Das', 'Joshi', 'Babu', 'Shetty'];
const facultyTitles = ['Dr.', 'Prof.', 'Ms.', 'Mr.'];

function nameAt(index) {
  return `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;
}

function facultyName(index) {
  return `${facultyTitles[index % facultyTitles.length]} ${nameAt(index + 7)}`;
}

function phoneAt(index) {
  return `9${String(100000000 + index).slice(0, 9)}`;
}

function toEmailPart(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function recentWeekdays(count) {
  const days = [];
  const cursor = new Date();
  cursor.setHours(9, 0, 0, 0);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days.unshift(new Date(cursor));
  }
  return days;
}

function marksFor(studentIndex, totalMarks, examIndex) {
  const group = studentIndex % 10;
  const drift = ((studentIndex * 7 + examIndex * 11) % 12) - 5;
  let percentage = 86 + drift;
  if (group <= 1) percentage = 32 + drift;
  else if (group <= 3) percentage = 55 + drift;
  else if (group <= 6) percentage = 72 + drift;
  percentage = Math.max(18, Math.min(98, percentage));
  return Number(((totalMarks * percentage) / 100).toFixed(1));
}

function attendanceStatus(studentIndex, dayIndex) {
  const group = studentIndex % 10;
  let target = 0.9;
  if (group === 0) target = 0.48;
  else if (group === 1) target = 0.62;
  else if (group === 2) target = 0.72;
  else if (group <= 5) target = 0.82;
  return (studentIndex * 17 + dayIndex * 29) % 100 < target * 100 ? 'present' : 'absent';
}

async function createManyInBatches(model, rows, batchSize = 1000) {
  for (let i = 0; i < rows.length; i += batchSize) {
    await prisma[model].createMany({ data: rows.slice(i, i + batchSize) });
  }
}

async function resetData() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      activity_logs,
      notifications,
      profile_update_requests,
      leave_requests,
      marks,
      exams,
      attendance,
      class_students,
      subjects,
      classes,
      students,
      faculty,
      admin_college_permissions,
      college_settings,
      departments,
      colleges,
      users
    RESTART IDENTITY CASCADE
  `);
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const attendanceDays = recentWeekdays(22);
  const rows = {
    users: [],
    colleges: [],
    college_settings: [],
    admin_college_permissions: [],
    departments: [],
    faculty: [],
    classes: [],
    students: [],
    class_students: [],
    subjects: [],
    exams: [],
    marks: [],
    attendance: [],
    notifications: [],
    activity_logs: [],
  };
  const mainAdmins = [];
  const seededFaculty = [];
  const lowAttendanceStudents = new Map();
  let userIndex = 1;
  let studentIndex = 0;

  function addUser(name, email, role) {
    const user = {
      id: randomUUID(),
      name,
      email,
      password: passwordHash,
      role,
      phone: phoneAt(userIndex++),
    };
    rows.users.push(user);
    return user;
  }

  mainAdmins.push(addUser('Main Admin DSU', 'admin1@dsu.com', 'main_admin'));
  mainAdmins.push(addUser('Main Admin SRM', 'admin2@srm.com', 'main_admin'));

  for (const collegeSeed of colleges) {
    const college = {
      id: randomUUID(),
      college_name: collegeSeed.name,
      address: collegeSeed.address,
      is_active: true,
    };
    rows.colleges.push(college);
    rows.college_settings.push({ college_id: college.id, required_attendance: 75, email_enabled: true, sms_enabled: false });

    const collegeAdmin = addUser(`${collegeSeed.code.toUpperCase()} College Admin`, `admin.${collegeSeed.code}@${collegeSeed.code}.com`, 'college_admin');
    rows.admin_college_permissions.push({
      user_id: collegeAdmin.id,
      college_id: college.id,
      can_manage_departments: true,
      can_manage_faculty: true,
      can_manage_students: true,
      can_manage_reports: true,
      can_manage_notifications: true,
      can_manage_settings: true,
    });

    for (const deptCode of departmentCodes) {
      const department = { id: randomUUID(), department_name: deptCode, college_id: college.id };
      rows.departments.push(department);

      const departmentFaculty = [];
      for (let i = 1; i <= 10; i += 1) {
        const facultyUser = addUser(facultyName(userIndex), `faculty.${toEmailPart(deptCode)}${i}@${collegeSeed.code}.com`, 'faculty');
        const faculty = {
          id: randomUUID(),
          user_id: facultyUser.id,
          department_id: department.id,
          designation: i <= 2 ? 'Associate Professor' : 'Assistant Professor',
          employee_id: `${collegeSeed.code.toUpperCase()}-${deptCode}-F${String(i).padStart(2, '0')}`,
          user: facultyUser,
        };
        rows.faculty.push({
          id: faculty.id,
          user_id: faculty.user_id,
          department_id: faculty.department_id,
          designation: faculty.designation,
          employee_id: faculty.employee_id,
        });
        departmentFaculty.push(faculty);
        seededFaculty.push({ ...faculty, department: deptCode });
      }

      for (const [sectionIndex, section] of sections.entries()) {
        const classRow = {
          id: randomUUID(),
          class_name: `${deptCode} ${section}`,
          section,
          department_id: department.id,
          faculty_id: departmentFaculty[sectionIndex].id,
        };
        rows.classes.push(classRow);

        const classStudents = [];
        for (let i = 1; i <= 16; i += 1) {
          studentIndex += 1;
          const studentUser = addUser(nameAt(studentIndex), `student.${toEmailPart(deptCode)}${section.toLowerCase()}${i}@${collegeSeed.code}.com`, 'student');
          const student = {
            id: randomUUID(),
            user_id: studentUser.id,
            department_id: department.id,
            roll_number: `${collegeSeed.code.toUpperCase()}${deptCode}${section}${String(i).padStart(3, '0')}`,
            batch_year: 2022 + sectionIndex,
            user: studentUser,
            index: studentIndex,
            department: deptCode,
            section,
          };
          rows.students.push({
            id: student.id,
            user_id: student.user_id,
            department_id: student.department_id,
            roll_number: student.roll_number,
            batch_year: student.batch_year,
          });
          rows.class_students.push({ class_id: classRow.id, student_id: student.id });
          classStudents.push(student);
        }

        const classSubjects = subjectBank[deptCode].map((subjectName, subjectIndex) => {
          const faculty = departmentFaculty[(subjectIndex + sectionIndex) % departmentFaculty.length];
          const subject = {
            id: randomUUID(),
            subject_name: subjectName,
            class_id: classRow.id,
            faculty_id: faculty.id,
            facultyUserId: faculty.user.id,
          };
          rows.subjects.push({
            id: subject.id,
            subject_name: subject.subject_name,
            class_id: subject.class_id,
            faculty_id: subject.faculty_id,
          });
          return subject;
        });

        for (const [subjectIndex, subject] of classSubjects.entries()) {
          const examSeeds = [
            { exam_name: 'Internal Assessment 1', exam_type: 'internal', total_marks: 40, offset: 18 },
            { exam_name: 'External Assessment', exam_type: 'external', total_marks: 60, offset: 8 },
            { exam_name: 'Semester Examination', exam_type: 'semester', total_marks: 100, offset: 3 },
          ];

          for (const [examIndex, examSeed] of examSeeds.entries()) {
            const exam = {
              id: randomUUID(),
              class_id: classRow.id,
              subject_id: subject.id,
              faculty_id: subject.faculty_id,
              exam_name: examSeed.exam_name,
              exam_type: examSeed.exam_type,
              semester: 3 + sectionIndex,
              total_marks: examSeed.total_marks,
              exam_date: attendanceDays[Math.max(0, attendanceDays.length - examSeed.offset)],
            };
            rows.exams.push(exam);

            for (const student of classStudents) {
              const marks = marksFor(student.index, examSeed.total_marks, subjectIndex + examIndex);
              rows.marks.push({
                exam_id: exam.id,
                student_id: student.id,
                marks_obtained: marks,
                remarks: marks < examSeed.total_marks * 0.4 ? 'Needs improvement' : 'Good progress',
              });
            }
          }
        }

        for (const [dayIndex, date] of attendanceDays.entries()) {
          const subject = classSubjects[dayIndex % classSubjects.length];
          for (const student of classStudents) {
            const status = attendanceStatus(student.index, dayIndex);
            if (status === 'absent' && student.index % 10 <= 1) lowAttendanceStudents.set(student.id, student);
            rows.attendance.push({
              student_id: student.id,
              subject_id: subject.id,
              class_id: classRow.id,
              date,
              hour_number: (dayIndex % 6) + 1,
              status,
              marked_by: subject.facultyUserId,
            });
          }
        }
      }
    }
  }

  for (const admin of mainAdmins) {
    rows.notifications.push({
      title: 'Demo data refreshed',
      message: 'Clean DSU and SRM academic data is ready for dashboard testing.',
      recipient_id: admin.id,
      sender_id: null,
      type: 'success',
      priority: 'medium',
      category: 'system',
      is_read: false,
    });
    rows.activity_logs.push({ user_id: admin.id, action: 'seed_data' });
  }

  for (const faculty of seededFaculty.slice(0, 24)) {
    rows.notifications.push({
      title: 'Academic review meeting',
      message: `Please review ${faculty.department} attendance and marks before the weekly meeting.`,
      recipient_id: faculty.user.id,
      sender_id: mainAdmins[0].id,
      type: 'info',
      priority: 'medium',
      category: 'announcement',
      is_read: false,
    });
  }

  for (const student of Array.from(lowAttendanceStudents.values()).slice(0, 80)) {
    rows.notifications.push({
      title: 'Attendance warning',
      message: `Your attendance in ${student.department} ${student.section} needs immediate attention.`,
      recipient_id: student.user.id,
      sender_id: mainAdmins[1].id,
      type: 'warning',
      priority: 'high',
      category: 'attendance',
      is_read: false,
    });
  }

  console.log('Clearing old demo data...');
  await resetData();
  console.log('Inserting clean demo data...');

  await createManyInBatches('users', rows.users);
  await createManyInBatches('colleges', rows.colleges);
  await createManyInBatches('college_settings', rows.college_settings);
  await createManyInBatches('admin_college_permissions', rows.admin_college_permissions);
  await createManyInBatches('departments', rows.departments);
  await createManyInBatches('faculty', rows.faculty);
  await createManyInBatches('classes', rows.classes);
  await createManyInBatches('students', rows.students);
  await createManyInBatches('class_students', rows.class_students);
  await createManyInBatches('subjects', rows.subjects);
  await createManyInBatches('exams', rows.exams);
  await createManyInBatches('marks', rows.marks);
  await createManyInBatches('attendance', rows.attendance);
  for (const notification of rows.notifications) {
    await prisma.$executeRaw`
      INSERT INTO notifications (recipient_id, sender_id, title, message, type, priority, category, is_read)
      VALUES (
        ${notification.recipient_id}::uuid,
        ${notification.sender_id}::uuid,
        ${notification.title},
        ${notification.message},
        ${notification.type},
        ${notification.priority},
        ${notification.category},
        ${notification.is_read}
      )
    `;
  }
  await createManyInBatches('activity_logs', rows.activity_logs);

  console.log('Demo data reset complete.');
  console.log(JSON.stringify({
    colleges: rows.colleges.length,
    departments: rows.departments.length,
    faculty: rows.faculty.length,
    students: rows.students.length,
    classes: rows.classes.length,
    subjects: rows.subjects.length,
    exams: rows.exams.length,
    marks: rows.marks.length,
    attendance: rows.attendance.length,
    notifications: rows.notifications.length,
  }, null, 2));
  console.log('Demo password for every account: 12345678');
  console.log('Main admin logins: admin1@dsu.com, admin2@srm.com');
  console.log('College admin logins: admin.dsu@dsu.com, admin.srm@srm.com');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
