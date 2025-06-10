import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/skincare');
    };

    return (
        <main className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

                    <div className="space-y-8">
                        <div>
                            <h1 className="text-6xl lg:text-8xl font-black text-black leading-none tracking-tight">
                                SKINCARE
                                <br />
                                <span className="text-5xl lg:text-7xl">To It's Finest</span>
                                <br />
                                <span className="text-6xl lg:text-8xl">30% OFF</span>
                            </h1>
                        </div>

                        <p className="text-gray-700 text-lg max-w-md leading-relaxed">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Nunc vulputate libero et velit interdum, ac aliquet odio mattis.
                        </p>

                        <button
                            onClick={handleGetStarted}
                            className="bg-black text-white px-8 py-4 flex items-center space-x-3 hover:bg-gray-800 transition-colors w-fit cursor-pointer"
                        >
                            <span className="font-medium tracking-wide">GET STARTED</span>
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="relative flex justify-center items-center">
                        {/* Sparkles */}
                        <div className="absolute top-20 left-8 text-white text-3xl animate-pulse">✦</div>
                        <div className="absolute top-60 right-12 text-white text-2xl animate-pulse delay-1000">✦</div>
                        <div className="absolute top-32 right-4 text-white text-xl animate-pulse delay-500">✧</div>
                        <div className="absolute bottom-40 left-4 text-white text-2xl animate-pulse delay-700">✦</div>

                        {/* Product Container */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-radial from-pink-300/20 to-transparent rounded-full blur-3xl scale-150"></div>
                            <div className="relative z-10">
                                <div className="w-48 h-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-2xl mx-auto mb-2 shadow-lg relative">
                                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-white/20 rounded-full"></div>
                                </div>
                                <div className="w-52 h-64 bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 rounded-3xl rounded-t-2xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                                    <div className="absolute top-4 left-4 w-12 h-24 bg-gradient-to-br from-white/30 to-transparent rounded-full transform -rotate-12"></div>
                                    <div className="text-center z-10">
                                        <div className="text-white font-bold text-xl tracking-widest drop-shadow-lg">OUHERS</div>
                                        <div className="text-white/90 text-xs tracking-wider mt-1">SKINCARE</div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-pink-700/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-white/5 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
        </main>
    );
};

export default HeroSection;