import React from 'react';

const Header = () => {
    return (
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <h1 className="text-xl font-bold text-black tracking-wider">SkinCareAi</h1>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;