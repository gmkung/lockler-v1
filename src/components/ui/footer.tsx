import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-[#1a1831] to-[#231a2c] text-gray-400 py-6">
      <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-xs text-center md:text-left mb-4 md:mb-0">
          © {currentYear} Lockler. All rights reserved.
        </div>
        <div className="flex space-x-4 text-xs">
          <Link to="/terms" className="hover:text-purple-300 transition">Terms of Service</Link>
          <a
            href="https://github.com/gmkung/lockler-v1.git"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-300 transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
