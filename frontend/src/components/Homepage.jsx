import React from 'react';
import Header from './Header';
import HeroSection from './HeroSection';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300">
            <Header />
            <HeroSection />
        </div>
    );
};

export default HomePage;