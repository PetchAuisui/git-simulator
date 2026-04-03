import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        if (token && username) {
            setUser({ username, token });
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const { data } = await authApi.login(username, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setUser({ username: data.username, token: data.token });
    };

    const register = async (username, password, firstName, lastName, dob) => {
        const { data } = await authApi.register(username, password, firstName, lastName, dob);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setUser({ username: data.username, token: data.token });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
