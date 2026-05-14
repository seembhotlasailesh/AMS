const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {
    getDashboard,
    getClasses, createClass,
    getSubjects, createSubject, updateSubject, deleteSubject,
    markAttendance, getAttendance, updateAttendanceRecord,
    getExams, createExam, getExamMarks, saveExamMarks,
    getLeaveRequests, updateLeaveStatus
} = require('../controllers/faculty');

router.use(protect);

router.get('/dashboard', authorize('FACULTY'), getDashboard);

router.route('/classes').get(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), getClasses).post(authorize('FACULTY'), createClass);
router.route('/subjects').get(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), getSubjects).post(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), createSubject);
router.route('/subjects/:id').put(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), updateSubject).delete(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), deleteSubject);
router.route('/attendance').get(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), getAttendance).post(authorize('FACULTY'), markAttendance);
router.put('/attendance/:id', authorize('FACULTY'), updateAttendanceRecord);
router.route('/exams').get(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), getExams).post(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), createExam);
router.route('/exams/:examId/marks').get(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), getExamMarks).post(authorize('FACULTY', 'ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'), saveExamMarks);
router.route('/leaves').get(authorize('FACULTY'), getLeaveRequests);
router.put('/leaves/:id', authorize('FACULTY'), updateLeaveStatus);

module.exports = router;
