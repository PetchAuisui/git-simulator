import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AuthScreen() {
    const { login, register } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isLogin && password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                await login(username, password);
                toast.success('Successfully logged in!');
            } else {
                await register(username, password, firstName, lastName, dob);
                toast.success('Successfully registered & logged in!');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen bg-slate-900 items-center justify-center relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-all duration-1000 ease-in-out"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-all duration-1000 ease-in-out"></div>

            <div className="z-10 w-full max-w-md p-8 rounded-2xl bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-2xl shadow-rose-500/10 transition-all">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent mb-2">
                        Git Di Waa
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {isLogin ? 'Sign in to access your workspace' : 'Create an account to start tracking'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-slate-100 placeholder-slate-500 transition-all"
                            placeholder="Enter your username"
                        />
                    </div>
                    {!isLogin && (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-300 mb-1">First Name (ชื่อ)</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-slate-100 placeholder-slate-500 transition-all"
                                    placeholder="First Name"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Last Name (นามสกุล)</label>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-slate-100 placeholder-slate-500 transition-all"
                                    placeholder="Last Name"
                                />
                            </div>
                        </div>
                    )}
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Date of Birth (วันเดือนปีเกิด)</label>
                            <input
                                type="date"
                                required={!isLogin}
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-slate-100 placeholder-slate-500 transition-all [color-scheme:dark]"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 text-slate-100 placeholder-slate-500 transition-all"
                            placeholder="Enter your password"
                        />
                    </div>
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required={!isLogin}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 text-slate-100 placeholder-slate-500 transition-all"
                                placeholder="Confirm your password"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-medium shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
                    >
                        {isLogin ? 'Register' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
