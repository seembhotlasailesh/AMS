export const roleHomePath = (role) => {
    switch (role) {
        case 'MAIN_ADMIN':
        case 'ADMIN':
            return '/main-admin/dashboard';
        case 'COLLEGE_ADMIN':
            return '/college-admin/dashboard';
        case 'FACULTY':
            return '/faculty/dashboard';
        case 'STUDENT':
            return '/student/dashboard';
        default:
            return '/login';
    }
};
