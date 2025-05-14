
import React from 'react';
import { motion } from 'framer-motion';
import { SplineScene } from '@/components/ui/splite';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { InteractiveSpotlight } from '@/components/ui/interactive-spotlight';
import { AppTopBar } from '@/components/AppTopBar';
import { Footer } from '@/components/ui/footer';
import { Lock, Icosahedron } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0b1f] via-[#1a182d] to-[#23213A] text-white">
      {/* Top Bar */}
      <AppTopBar pageTitle="About" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-4">
            About Lockler
          </h1>
          <p className="text-xl text-purple-200/90 max-w-3xl mx-auto">
            A secure platform for conditional fund management on the blockchain
          </p>
        </motion.div>

        {/* 3D Scene Section */}
        <div className="mb-20">
          <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-purple-500/30">
            <Spotlight
              className="-top-40 left-0 md:left-60 md:-top-20"
              fill="purple"
            />
            <InteractiveSpotlight
              className="from-purple-300 via-pink-300 to-indigo-300"
              size={300}
            />
            
            <div className="flex h-full flex-col md:flex-row">
              {/* Left content */}
              <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-6 flex items-center gap-3">
                    <Lock className="h-8 w-8 text-purple-400" />
                    Secure by Design
                  </h2>
                  <p className="mt-4 text-neutral-300 max-w-lg">
                    Lockler combines advanced cryptographic security with intuitive design,
                    creating a platform where your digital assets are protected by cutting-edge
                    blockchain technology and conditional release mechanisms.
                  </p>
                </motion.div>
              </div>

              {/* Right content - 3D Scene */}
              <div className="flex-1 relative">
                <SplineScene 
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="w-full h-full"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          <Card className="bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Lock className="h-5 w-5" />
                Security First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-100/80">
                Built on proven cryptographic principles and audited smart contracts, 
                ensuring your funds are always protected.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Icosahedron className="h-5 w-5" />
                Decentralized Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-100/80">
                No central authority controls your assets. Conditional releases are 
                governed by transparent smart contract logic.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Lock className="h-5 w-5" />
                Easy Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-100/80">
                Designed for simplicity while maintaining powerful functionality. 
                Create new locklers in minutes with our intuitive interface.
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Technology Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <Card className="bg-indigo-900/20 border-indigo-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-indigo-300 flex items-center justify-center gap-2">
                <Icosahedron className="h-6 w-6" />
                Advanced Technology
              </CardTitle>
              <CardDescription className="text-center text-indigo-200/70">
                The building blocks that make Lockler secure and powerful
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-indigo-900/30 border border-indigo-500/30">
                  <h3 className="font-bold text-lg mb-2 text-indigo-300">Smart Contract Security</h3>
                  <p className="text-indigo-100/80">
                    Our smart contracts undergo rigorous security audits and follow 
                    industry best practices to ensure your assets remain secure.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-indigo-900/30 border border-indigo-500/30">
                  <h3 className="font-bold text-lg mb-2 text-indigo-300">Conditional Logic</h3>
                  <p className="text-indigo-100/80">
                    Create complex conditions for fund release based on time, events, 
                    multi-signature approval, or external oracle data.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-indigo-900/30 border border-indigo-500/30">
                  <h3 className="font-bold text-lg mb-2 text-indigo-300">Cross-Chain Compatibility</h3>
                  <p className="text-indigo-100/80">
                    Use Lockler across multiple blockchain networks, ensuring flexibility 
                    for all your asset management needs.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-indigo-900/30 border border-indigo-500/30">
                  <h3 className="font-bold text-lg mb-2 text-indigo-300">Zero Knowledge Proofs</h3>
                  <p className="text-indigo-100/80">
                    Advanced cryptographic techniques ensure privacy while maintaining 
                    security and verifiability of transactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Team Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Our Vision</h2>
          <p className="text-xl text-purple-100/90 max-w-3xl mx-auto">
            We believe in a world where financial agreements are transparent, 
            trustless, and accessible to everyone. Lockler is our contribution 
            to building this future, one secure transaction at a time.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
