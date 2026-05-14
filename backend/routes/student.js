const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const { getDashboard, getStudentProfile, getMyAttendance, getMyMarks, applyLeave, getMyLeaves, getFacultyList } = require('../controllers/student');

router.use(protect);
router.use(authorize('STUDENT'));

router.get('/dashboard', getDashboard);
router.get('/profile', getStudentProfile);
router.get('/attendance', getMyAttendance);
router.get('/marks', getMyMarks);
router.route('/leaves').get(getMyLeaves).post(applyLeave);
router.get('/faculty', getFacultyList);

module.exports = router;
