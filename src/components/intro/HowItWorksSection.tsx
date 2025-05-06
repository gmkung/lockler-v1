
import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: "01",
    title: "Create Lockler",
    description: "Choose between P2P escrow or grant distribution. Set your terms, conditions, and funding amount.",
    color: "from-pink-500 to-purple-500"
  },
  {
    number: "02",
    title: "Define Conditions",
    description: "Specify the exact requirements that need to be met for fund release, with customizable verification methods.",
    color: "from-purple-500 to-indigo-500"
  },
  {
    number: "03",
    title: "Fund Your Lockler",
    description: "Deposit cryptocurrency into your newly created Gnosis Safe with advanced security features.",
    color: "from-indigo-500 to-blue-500"
  },
  {
    number: "04",
    title: "Verify & Release",
    description: "Once conditions are met, funds are automatically released to the recipient according to your terms.",
    color: "from-blue-500 to-cyan-500"
  }
];

export const HowItWorksSection = () => {
  return (
    <div className="relative z-10 py-24 px-4 max-w-7xl mx-auto">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-200">
          How Lockler Works
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mb-6" />
        <p className="text-lg text-purple-100/80 max-w-2xl mx-auto">
          A simple four-step process to create secure, condition-based fund transfers
        </p>
      </motion.div>
      
      <div className="relative">
        {/* Connecting line between steps */}
        <div className="absolute left-[26px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-pink-500 via-indigo-500 to-cyan-500 hidden sm:block" />
        
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="relative flex flex-col sm:flex-row items-start mb-12 sm:mb-24 last:mb-0"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: index * 0.1 }}
          >
            {/* Step number circle */}
            <motion.div 
              className={`flex-shrink-0 w-14 h-14 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-10`}
              initial={{ scale: 0.8 }}
              whileInView={{ scale: [0.8, 1.2, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              {step.number}
            </motion.div>
            
            <div className={`pt-3 sm:pt-0 ${index % 2 === 0 ? 'sm:ml-12 md:ml-0 md:mr-[7%] md:text-right md:self-end' : 'sm:ml-12 md:ml-[7%] md:text-left'}`}>
              <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
              <p className="text-lg text-purple-100/80 max-w-md">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
