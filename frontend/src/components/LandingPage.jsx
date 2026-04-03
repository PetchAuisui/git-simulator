import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-50 relative overflow-hidden font-sans selection:bg-orange-500/30">
            {/* Background Animations & Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-orange-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-rose-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
            
            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent flex items-center gap-2">
                    Git Di Waa
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/auth')}
                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => navigate('/auth')}
                        className="px-4 py-2 text-sm font-medium rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all shadow-lg hover:shadow-orange-500/20"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8 shadow-inner">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    The Next Generation Git Simulator
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                    Master Source Control <br /> 
                    <span className="bg-gradient-to-r from-orange-400 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                        Without The Headache
                    </span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
                    Git Di Waa is an interactive, visual Git workspace designed for you to practice, simulate, and understand branch workflows safely in your own isolated environment.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button 
                        onClick={() => navigate('/auth')}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-bold text-lg shadow-xl shadow-orange-500/25 transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                        Start Your Workspace
                    </button>
                    <button 
                        onClick={() => navigate('/auth')}
                        className="px-8 py-4 rounded-xl bg-slate-800/80 backdrop-blur hover:bg-slate-700 border border-slate-700 text-white font-bold text-lg transition-all"
                    >
                        Explore Features
                    </button>
                </div>

                {/* Dashboard Preview / Glassmorphic Card */}
                <div className="mt-20 w-full rounded-3xl bg-slate-900/50 backdrop-blur-2xl border border-slate-800 shadow-2xl p-2 md:p-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                    <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800/50 overflow-hidden flex flex-col relative group">
                        
                        {/* Mock header */}
                        <div className="h-12 w-full bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                            </div>
                            <div className="mx-auto px-4 py-1 rounded bg-slate-950 text-xs text-slate-500 border border-slate-800 font-mono">
                                ~/workspace/git-di-waa
                            </div>
                        </div>

                        {/* Mock body */}
                        <div className="flex-1 flex p-6 gap-6">
                            <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col p-4 opacity-70">
                                <div className="h-4 w-24 bg-slate-800 rounded mb-4"></div>
                                <div className="h-3 w-full bg-slate-800/50 rounded mb-2"></div>
                                <div className="h-3 w-4/5 bg-slate-800/50 rounded mb-2"></div>
                                <div className="h-3 w-full bg-slate-800/50 rounded mb-2"></div>
                            </div>
                            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl relative overflow-hidden group-hover:bg-slate-900 transition-colors duration-500">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500 border-dashed animate-[spin_10s_linear_infinite] opacity-50"></div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </main>
        </div>
    );
}
