const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {
    getDashboard,
    getColleges, createCollege, updateCollege, deleteCollege,
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getFaculties, createFaculty, updateFaculty, deleteFaculty,
    getStudents, createStudent, updateStudent, deleteStudent,
    getCollegeAdmins, createCollegeAdmin
} = require('../controllers/admin');

router.use(protect);
router.use(authorize('ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN'));

router.get('/dashboard', getDashboard);

router.route('/colleges').get(getColleges).post(createCollege);
router.route('/colleges/:id').put(updateCollege).delete(deleteCollege);
router.route('/college-admins').get(getCollegeAdmins).post(createCollegeAdmin);
router.route('/departments').get(getDepartments).post(createDepartment);
router.route('/departments/:id').put(updateDepartment).delete(deleteDepartment);
router.route('/faculty').get(getFaculties).post(createFaculty);
router.route('/faculty/:id').put(updateFaculty).delete(deleteFaculty);
router.route('/students').get(getStudents).post(createStudent);
router.route('/students/:id').put(updateStudent).delete(deleteStudent);

module.exports = router;
