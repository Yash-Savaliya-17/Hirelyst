import {Outlet} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {useEffect, useState} from 'react';
import {Unauthorized} from '@/pages/Errors';

export default function ProtectedLayout({ allowedRoles = [], requireAuth = true, withNavbar = true }: {
    allowedRoles?: string[],
    requireAuth?: boolean,
    withNavbar?: boolean
}) {
    const user = useSelector((state: any) => state.auth.user);
    const [component, setComponent] = useState<JSX.Element | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (requireAuth && !user) {
            setComponent(<Unauthorized uri={window.location.pathname} />);
        } else if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
            setComponent(<Unauthorized uri={window.location.pathname} />);
        } else {
            setComponent(null); // Clear any previous Unauthorized component
        }
        setLoading(false);
    }, []);

    if (loading) return <div>Loading...</div>;
    if (component) return component;
    if (!withNavbar) return <Outlet />;
    return (
        <div>
            <Outlet />
        </div>
    );
}
