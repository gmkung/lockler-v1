
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Users, Bot, Shield } from 'lucide-react';

const features = [
  {
    icon: <Lock className="h-8 w-8" />,
    title: "P2P Escrow",
    description: "Create secure peer-to-peer escrows with customizable terms and conditions.",
    color: "from-pink-500 to-purple-600",
    shadow: "shadow-pink-500/20"
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Grant Distribution",
    description: "Trustless grant distribution with conditional payouts based on milestones.",
    color: "from-purple-500 to-indigo-600",
    shadow: "shadow-purple-500/20"
  },
  {
    icon: <Bot className="h-8 w-8" />,
    title: "Oracle Integration",
    description: "Leverage Kleros Optimistic Oracle for decentralized verification of conditions.",
    color: "from-indigo-500 to-blue-600",
    shadow: "shadow-indigo-500/20"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Ultimate Security",
    description: "Built on Gnosis Safe, the industry standard for secure multi-sig wallets.",
    color: "from-blue-500 to-cyan-600",
    shadow: "shadow-blue-500/20"
  }
];

export const FeaturesSection = () => {
  return (
    <div className="relative z-10 py-24 px-4 max-w-7xl mx-auto">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
          Advanced Features
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6" />
        <p className="text-lg text-purple-100/80 max-w-2xl mx-auto">
          Explore the cutting-edge technology behind Lockler's secure and flexible conditional payment system
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className={`bg-[#1a182d]/70 backdrop-blur-sm border border-purple-800/30 rounded-xl overflow-hidden ${feature.shadow} hover:shadow-xl transition-all duration-300`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div className="p-6 sm:p-8">
              <div className={`bg-gradient-to-r ${feature.color} p-3 rounded-lg inline-block mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-purple-100/80">{feature.description}</p>
            </div>
            <div className={`h-1 w-full bg-gradient-to-r ${feature.color}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
