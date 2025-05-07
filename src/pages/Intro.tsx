import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';
import { Footer } from '@/components/ui/footer';
import { ParticleField } from '@/components/intro/ParticleField';
import { GlowingOrbs } from '@/components/intro/GlowingOrbs';
import { FloatingGrid } from '@/components/intro/FloatingGrid';
import { HeroSection } from '@/components/intro/HeroSection';
import { FeaturesSection } from '@/components/intro/FeaturesSection';
import { HowItWorksSection } from '@/components/intro/HowItWorksSection';

export default function Intro() {
  useEffect(() => {
    // Smooth scrolling for anchor links (only for real in-page anchors, not hash router links)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      const href = anchor.getAttribute('href');
      // Only attach if it's a real in-page anchor (not a hash route)
      if (href && href.length > 1 && !href.startsWith("#/")) {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    });
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#0e0b1f] via-[#1a182d] to-[#23213A] text-white overflow-hidden">
      {/* Background elements */}
      <ParticleField />
      <GlowingOrbs />
      <FloatingGrid />
      
      {/* Header - Minimalist for landing page */}
      <header className="relative z-10 py-6 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-10 w-10 text-pink-400" />
            <h1 className="text-2xl font-bold text-white">Lockler</h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-purple-200 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-purple-200 hover:text-white transition-colors">How It Works</a>
            <Link to="/myLocklers" className="text-purple-200 hover:text-white transition-colors">My Locklers</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Features Section */}
        <section id="features">
          <FeaturesSection />
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works">
          <HowItWorksSection />
        </section>
        
        {/* CTA Section */}
        <section className="relative z-10 py-24 px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300"
              initial={{ y: 30 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Ready to Secure Your Funds?
            </motion.h2>
            
            <motion.p 
              className="text-xl text-purple-100/80 mb-10"
              initial={{ y: 30 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Create your first Lockler in minutes and experience the future of conditional payment systems.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap justify-center gap-6"
              initial={{ y: 30 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800 text-white text-xl px-10 py-7 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(219,39,119,0.5)] hover:shadow-[0_0_30px_rgba(219,39,119,0.7)]"
              >
                <Link to="/setup">Create New Lockler</Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-2 border-indigo-500/70 bg-indigo-900/40 text-white hover:bg-indigo-800/50 hover:text-white text-xl px-10 py-7 transition-all duration-300 hover:scale-105 backdrop-blur-sm hover:border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]"
              >
                <Link to="/myLocklers">View My Locklers</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <div className="relative z-10">
         <Footer />
      </div>
    </div>
  );
}
