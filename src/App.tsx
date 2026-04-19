import React, { useState } from 'react';
import { useAppConfig } from './hooks/useAppConfig';
import { emailService } from './services/emailService';

import { ParticleBackground } from './components/common/ParticleBackground';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { SafraSense } from './components/sections/SafraSense';
import { Raiznet } from './components/sections/Raiznet';
import { Manifesto } from './components/sections/Manifesto';
import { Waitlist } from './components/sections/Waitlist';
import { FAQ } from './components/sections/FAQ';
import { Footer } from './components/layout/Footer';

export default function App() {
  const { theme, lang, setLang, t, toggleTheme } = useAppConfig();
  
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted || isSubmitting) return;

    const form = e.target as HTMLFormElement;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const email = emailInput?.value;
    
    if (!email) return;

    setIsSubmitting(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const campaignRef = urlParams.get('ref') || urlParams.get('source') || 'Nenhum';

      await emailService.submitToWaitlist(email, campaignRef);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission info:', error);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-['Montserrat'] transition-colors duration-500 ${theme === 'dark' ? 'dark' : ''} ${
      theme === 'light' 
        ? 'bg-white text-[#1A1A1A] selection:bg-[#1A1A1A] selection:text-white' 
        : 'bg-black text-[#FAFAFA] selection:bg-[#FAFAFA] selection:text-black'
    }`}>
      
      <ParticleBackground theme={theme} />

      <Navbar 
        theme={theme} 
        toggleTheme={toggleTheme} 
        lang={lang} 
        setLang={setLang} 
        t={t} 
      />

      <Hero 
        t={t} 
        theme={theme} 
      />

      <SafraSense 
        t={t} 
        theme={theme} 
      />

      <Raiznet 
        t={t} 
        theme={theme} 
      />

      <Manifesto 
        t={t} 
        theme={theme} 
      />

      <Waitlist 
        t={t} 
        theme={theme} 
        isSubmitting={isSubmitting} 
        isSubmitted={isSubmitted} 
        handleEmailSubmit={handleEmailSubmit} 
      />

      <FAQ 
        t={t} 
        theme={theme} 
        openFaq={openFaq} 
        setOpenFaq={setOpenFaq} 
      />

      <Footer 
        t={t} 
        theme={theme} 
      />
    </div>
  );
}
