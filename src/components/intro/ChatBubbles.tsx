
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Define the structure for each chat message
interface Message {
  id: number;
  sender: 'alice' | 'bob';
  text: string;
  delay: number;
}

// Conversations that highlight Lockler's benefits
const conversations: Message[][] = [
  // Conversation 1: Trustless nature
  [
    { id: 1, sender: 'alice', text: "Hey, I need to send you payment for that design work but I'm worried about sending it upfront 😕", delay: 0 },
    { id: 2, sender: 'bob', text: "Let's use Lockler! It's completely trustless", delay: 1500 },
    { id: 3, sender: 'alice', text: "What's that? 🤔", delay: 3000 },
    { id: 4, sender: 'bob', text: "It creates a Safe gatekept by Kleros Court. You send funds there, and I only get paid if I fulfil our agreement", delay: 4500 },
    { id: 5, sender: 'alice', text: "So I don't have to trust you or a middleman? That sounds perfect! 👍", delay: 6500 },
    { id: 6, sender: 'bob', text: "I created a Lockler at 0x7F3e2b1D...9eA5! Check terms and send ETH there 🚀", delay: 8000 },
  ],
  
  // Conversation 2: No contract calls needed
  [
    { id: 1, sender: 'bob', text: "I want to sell you the rights to my NFT collection, but smart contracts escrows are complicated...", delay: 0 },
    { id: 2, sender: 'alice', text: "With Lockler, you don't need to call any smart contract directly", delay: 1500 },
    { id: 3, sender: 'bob', text: "Really? How does it work then? 🧐", delay: 3000 },
    { id: 4, sender: 'alice', text: "Just send the payments or rights to the Lockler address (basically a Safe).", delay: 4500 },
    { id: 5, sender: 'bob', text: "That's so much easier! No complex contract interactions 🙌", delay: 6500 },
    { id: 6, sender: 'alice', text: "Here is the Lockler at 0x2dB98c4F...5aC3! Vámonos 💯", delay: 8000 },
  ],
  
  // Conversation 3: Subjective conditions
  [
    { id: 1, sender: 'alice', text: "I need you to redesign my website, but how can we agree when it's 'good enough'? It's so subjective 🤷‍♀️", delay: 0 },
    { id: 2, sender: 'bob', text: "Lockler uses the Kleros Optimistic Oracle for exactly these situations", delay: 1500 },
    { id: 3, sender: 'alice', text: "What's that? 🤔", delay: 3000 },
    { id: 4, sender: 'bob', text: "It's a decentralized court system. If we disagree, neutral jurors decide based on our agreement", delay: 4500 },
    { id: 5, sender: 'alice', text: "So it can handle subjective conditions? That's amazing! Let's use Lockler for this project 🎉", delay: 6500 },
    { id: 6, sender: 'bob', text: "Made a Lockler at 0x9Ad4c5E2...3fF8! Check terms and fund it when ready 🔐", delay: 8000 },
  ]
];

export const ChatBubbles: React.FC = () => {
  const [activeConversation, setActiveConversation] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  
  // Function to display messages one by one with delays
  useEffect(() => {
    // Reset visible messages when conversation changes
    setVisibleMessages([]);
    
    // Get current conversation
    const currentConversation = conversations[activeConversation];
    
    // Show messages with delays
    const timeouts: NodeJS.Timeout[] = [];
    
    currentConversation.forEach((message) => {
      const timeout = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, message]);
      }, message.delay);
      
      timeouts.push(timeout);
    });
    
    // After conversation completes, wait and change to next conversation
    const conversationChangeTimeout = setTimeout(() => {
      setActiveConversation((prev) => (prev + 1) % conversations.length);
    }, 14000); // Extended wait time to accommodate the new message
    
    // Cleanup timeouts on unmount or conversation change
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      clearTimeout(conversationChangeTimeout);
    };
  }, [activeConversation]);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="relative w-full h-full max-w-5xl mx-auto">
        {/* Left side bubbles - moved up by adjusting top value from 10% to 5% */}
        <div className="absolute top-[5%] left-[-30px] md:left-[-100px] lg:left-[-120px] opacity-30 md:opacity-40 w-60 md:w-72 transform rotate-[-8deg] scale-75 md:scale-90">
          <AnimatePresence mode="wait">
            {visibleMessages.map((message) => 
              message.sender === 'alice' && (
                <motion.div 
                  key={`${activeConversation}-${message.id}`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-3 max-w-xs bg-white rounded-t-lg rounded-br-lg p-3 text-gray-800 shadow-md text-sm md:text-base ml-auto"
                >
                  {message.text}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
        
        {/* Right side bubbles - moved up by adjusting top value from 20% to 12% */}
        <div className="absolute top-[12%] right-[-30px] md:right-[-100px] lg:right-[-120px] opacity-30 md:opacity-40 w-60 md:w-72 transform rotate-[8deg] scale-75 md:scale-90">
          <AnimatePresence mode="wait">
            {visibleMessages.map((message) => 
              message.sender === 'bob' && (
                <motion.div 
                  key={`${activeConversation}-${message.id}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-3 max-w-xs bg-purple-100 rounded-t-lg rounded-bl-lg p-3 text-purple-900 shadow-md text-sm md:text-base"
                >
                  {message.text}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
