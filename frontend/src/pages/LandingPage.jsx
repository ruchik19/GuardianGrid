import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { Navbar } from '../components/Navbar.jsx';
import { HeroSection } from '../components/HeroSection.jsx';
import { Features } from '../components/Features.jsx';
import { Aboutus } from '../components/Aboutus.jsx';

function LandingPage() {
  return (
    <>
      <Navbar />
      <div className='max-w-7xl mx-auto pt-20 px-6'>
        <HeroSection />
        <Features />
        <Aboutus />
      </div>
      
    </>
  );
}
export {LandingPage}