const express = require('express');
const router = express.Router();
const {
    loginUser,
    logoutUser,
    getUserProfile,
    updateProfile,
    getProfileUpdateRequests,
    reviewProfileUpdateRequest,
    getNotifications,
    getNotificationRecipients,
    createNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification
} = require('../controllers/auth');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.get('/profile-requests', protect, getProfileUpdateRequests);
router.put('/profile-requests/:id', protect, reviewProfileUpdateRequest);
router.get('/notifications', protect, getNotifications);
router.get('/notification-recipients', protect, getNotificationRecipients);
router.post('/notifications', protect, createNotification);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.delete('/notifications/:id', protect, deleteNotification);

module.exports = router;
