const prisma = require('../db');
const bcrypt = require('bcryptjs');
const { generateToken, clearToken } = require('../utils/jwt');
const { serializeUser, serializeStudent, serializeFaculty } = require('../utils/serializers');

const editableProfileData = (body) => {
    const data = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) data.phone = String(body.phone).trim();
    return Object.fromEntries(Object.entries(data).filter(([, value]) => value));
};

const getFullUser = (userId) => prisma.users.findUnique({
    where: { id: userId },
    include: {
        students: {
            include: {
                departments: true,
                class_students: { include: { classes: true } }
            }
        },
        faculty: { include: { departments: true } }
    }
});

const serializeProfile = (user) => ({
    ...serializeUser(user),
    student: user.students ? serializeStudent(user.students) : undefined,
    faculty: user.faculty ? serializeFaculty(user.faculty) : undefined
});

// @desc    Auth user/set token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.users.findUnique({ where: { email } });

        if (user && (await bcrypt.compare(password, user.password))) {
            generateToken(res, user.id, user.role);

            res.status(200).json({
                id: user.id,
                email: user.email,
                role: serializeUser(user).role,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    clearToken(res);
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile (current user)
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await getFullUser(req.user.id);

        if (user) {
            res.status(200).json(serializeProfile(user));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const data = editableProfileData(req.body);
        if (!Object.keys(data).length) return res.status(400).json({ message: 'No profile changes provided' });

        if (req.user.role === 'STUDENT') {
            const [request] = await prisma.$queryRawUnsafe(
                'INSERT INTO profile_update_requests (user_id, requested_data) VALUES ($1, $2::jsonb) RETURNING id, user_id, requested_data, status, created_at',
                req.user.id,
                JSON.stringify(data)
            );
            return res.status(202).json({ message: 'Profile update submitted for approval', request });
        }

        await prisma.users.update({
            where: { id: req.user.id },
            data
        });
        const user = await getFullUser(req.user.id);
        res.json({ message: 'Profile updated successfully', user: serializeProfile(user) });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

const getProfileUpdateRequests = async (req, res) => {
    try {
        if (!['ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN', 'FACULTY'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to review profile requests' });
        }

        const where = { status: 'pending' };
        if (req.user.role === 'FACULTY') {
            const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
            if (!faculty) return res.json([]);
            where.users = { students: { department_id: faculty.department_id } };
        }

        const requests = await prisma.$queryRawUnsafe(
            `SELECT r.id, r.requested_data, r.status, r.created_at, u.id AS user_id
             FROM profile_update_requests r
             JOIN users u ON u.id = r.user_id
             LEFT JOIN students s ON s.user_id = u.id
             WHERE r.status = 'pending'
             ${req.user.role === 'FACULTY' ? 'AND s.department_id = $1' : ''}
             ORDER BY r.created_at DESC`,
            ...(req.user.role === 'FACULTY' ? [where.users.students.department_id] : [])
        );
        const users = await prisma.users.findMany({
            where: { id: { in: requests.map(request => request.user_id) } },
            include: {
                students: { include: { departments: true, class_students: { include: { classes: true } } } },
                faculty: { include: { departments: true } }
            }
        });
        const usersById = Object.fromEntries(users.map(user => [user.id, user]));

        res.json(requests.map(request => ({
            id: request.id,
            requestedData: request.requested_data,
            status: request.status,
            createdAt: request.created_at,
            user: serializeProfile(usersById[request.user_id])
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile requests', error: error.message });
    }
};

const reviewProfileUpdateRequest = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    try {
        if (!['ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN', 'FACULTY'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to review profile requests' });
        }
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ message: 'Invalid review action' });
        }

        const [request] = await prisma.$queryRawUnsafe(
            `SELECT r.id, r.user_id, r.requested_data, r.status, s.department_id
             FROM profile_update_requests r
             JOIN users u ON u.id = r.user_id
             LEFT JOIN students s ON s.user_id = u.id
             WHERE r.id = $1`,
            id
        );
        if (!request) return res.status(404).json({ message: 'Profile request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already reviewed' });

        if (req.user.role === 'FACULTY') {
            const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
            if (!faculty || request.department_id !== faculty.department_id) {
                return res.status(403).json({ message: 'Not authorized for this student request' });
            }
        }

        await prisma.$transaction(async (tx) => {
            if (action === 'approved') {
                await tx.users.update({
                    where: { id: request.user_id },
                    data: request.requested_data
                });
            }

            await tx.$executeRawUnsafe(
                'UPDATE profile_update_requests SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3',
                action,
                req.user.id,
                id
            );
        });

        res.json({ message: `Profile request ${action}` });
    } catch (error) {
        res.status(500).json({ message: 'Error reviewing profile request', error: error.message });
    }
};

const serializeNotification = (row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type || 'info',
    priority: row.priority || 'normal',
    category: row.category || 'general',
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    sender: row.sender_name ? { id: row.sender_id, name: row.sender_name, role: row.sender_role } : null
});

const getNotifications = async (req, res) => {
    try {
        const rows = await prisma.$queryRawUnsafe(
            `SELECT n.id, n.title, n.message, n.sender_id, n.is_read, n.type, n.priority, n.category, n.created_at,
                    s.name AS sender_name, s.role AS sender_role
             FROM notifications n
             LEFT JOIN users s ON s.id = n.sender_id
             WHERE n.recipient_id = $1::uuid
             ORDER BY n.created_at DESC
             LIMIT 50`,
            req.user.id
        );
        res.json(rows.map(serializeNotification));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

const getNotificationRecipients = async (req, res) => {
    try {
        if (!['ADMIN', 'MAIN_ADMIN', 'COLLEGE_ADMIN', 'FACULTY'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to send notifications' });
        }

        const [users, departments, classes] = await Promise.all([
            prisma.users.findMany({
                where: req.user.role === 'FACULTY' ? { role: 'student' } : {},
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    students: { select: { department_id: true, class_students: { select: { class_id: true } } } },
                    faculty: { select: { department_id: true } }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.departments.findMany({
                select: { id: true, department_name: true },
                orderBy: { department_name: 'asc' }
            }),
            prisma.classes.findMany({
                include: { departments: true },
                orderBy: [{ class_name: 'asc' }, { section: 'asc' }]
            })
        ]);

        let scopedUsers = users;
        if (req.user.role === 'FACULTY') {
            const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
            scopedUsers = faculty
                ? users.filter(user => user.students?.department_id === faculty.department_id)
                : [];
        }

        res.json({
            users: scopedUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            })),
            roles: ['admin', 'main_admin', 'college_admin', 'faculty', 'student'].map(role => ({
                id: role,
                name: role.replace('_', ' ').toUpperCase()
            })),
            departments: departments.map(department => ({ id: department.id, name: department.department_name })),
            classes: classes.map(classRow => ({
                id: classRow.id,
                name: `${classRow.class_name}${classRow.section ? ` - ${classRow.section}` : ''}`,
                department: classRow.departments?.department_name
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading notification recipients', error: error.message });
    }
};

const createNotification = async (req, res) => {
    const {
        recipientId,
        recipientEmail,
        targetType = 'user',
        targetId,
        title,
        message,
        type = 'info',
        priority = 'normal',
        category = 'general'
    } = req.body;

    try {
        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }
        if (!recipientId && !recipientEmail && !targetId) {
            return res.status(400).json({ message: 'Recipient, title, and message are required' });
        }

        let recipients = [];
        if (recipientId || recipientEmail) {
            const recipient = recipientId
                ? await prisma.users.findUnique({ where: { id: recipientId } })
                : await prisma.users.findUnique({ where: { email: String(recipientEmail).trim().toLowerCase() } });
            if (recipient) recipients = [recipient];
        } else if (targetType === 'role') {
            recipients = await prisma.users.findMany({ where: { role: targetId } });
        } else if (targetType === 'department') {
            const [students, faculty] = await Promise.all([
                prisma.students.findMany({ where: { department_id: targetId }, include: { users: true } }),
                prisma.faculty.findMany({ where: { department_id: targetId }, include: { users: true } })
            ]);
            recipients = [...students.map(row => row.users), ...faculty.map(row => row.users)];
        } else if (targetType === 'class') {
            const rows = await prisma.class_students.findMany({
                where: { class_id: targetId },
                include: { students: { include: { users: true } } }
            });
            recipients = rows.map(row => row.students.users);
        } else if (targetType === 'user') {
            const recipient = await prisma.users.findUnique({ where: { id: targetId } });
            if (recipient) recipients = [recipient];
        }

        if (req.user.role === 'FACULTY') {
            const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
            if (!faculty) return res.status(403).json({ message: 'Faculty profile not found' });
            const allowedStudents = await prisma.students.findMany({
                where: { department_id: faculty.department_id, user_id: { in: recipients.map(recipient => recipient.id) } },
                select: { user_id: true }
            });
            const allowedIds = new Set(allowedStudents.map(student => student.user_id));
            recipients = recipients.filter(recipient => allowedIds.has(recipient.id));
        }

        const uniqueRecipients = Object.values(recipients.reduce((acc, recipient) => {
            if (recipient?.id && recipient.id !== req.user.id) acc[recipient.id] = recipient;
            return acc;
        }, {}));
        if (!uniqueRecipients.length) return res.status(404).json({ message: 'No recipients found for this selection' });

        await prisma.$transaction(uniqueRecipients.map(recipient => prisma.$executeRawUnsafe(
            `INSERT INTO notifications (title, message, recipient_id, sender_id, type, priority, category)
             VALUES ($1, $2, $3::uuid, $4::uuid, $5, $6, $7)`,
            title,
            message,
            recipient.id,
            req.user.id,
            type,
            priority,
            category
        )));
        res.status(201).json({ message: `Notification sent to ${uniqueRecipients.length} recipient${uniqueRecipients.length > 1 ? 's' : ''}` });
    } catch (error) {
        res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        await prisma.$executeRawUnsafe(
            'UPDATE notifications SET is_read = true WHERE id = $1::uuid AND recipient_id = $2::uuid',
            req.params.id,
            req.user.id
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        await prisma.$executeRawUnsafe('UPDATE notifications SET is_read = true WHERE recipient_id = $1::uuid', req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error: error.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        await prisma.$executeRawUnsafe('DELETE FROM notifications WHERE id = $1::uuid AND recipient_id = $2::uuid', req.params.id, req.user.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
};

module.exports = {
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
    deleteNotification,
};
