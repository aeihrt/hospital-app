import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function normalizeRole(role) {
    const raw = String(role || '').trim().toUpperCase();
    const roleMap = {
        ADMIN: 'R001',
        DOCTOR: 'R002',
        PATIENT: 'R003',
    };

    return roleMap[raw] || raw;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [hasAccess, setHasAccess] = useState(null);

    useEffect(() => {
        const hasLocalSession = Boolean(localStorage.getItem('user_id'));
        const currentRole = normalizeRole(localStorage.getItem('user_role'));
        const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRole(role));

        setIsAuthenticated(hasLocalSession);

        if (!hasLocalSession) {
            setHasAccess(false);
            return;
        }

        if (normalizedAllowedRoles.length === 0) {
            setHasAccess(true);
            return;
        }

        setHasAccess(normalizedAllowedRoles.includes(currentRole));
    }, []);

    if (isAuthenticated === null || hasAccess === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasAccess) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;