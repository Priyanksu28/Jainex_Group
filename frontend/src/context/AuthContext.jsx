import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        if (userData?.role === 'Operator' && userData?.emp_id) {
            const opId = `OP-${String(userData.emp_id).padStart(3, '0')}`;
            navigate(`/${opId}/dashboard`);
        } else if (userData?.role === 'Rigger' && userData?.emp_id) {
            const rigId = `RIG-${String(userData.emp_id).padStart(3, '0')}`;
            navigate(`/${rigId}/dashboard`);
        } else {
            navigate('/dashboard');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};