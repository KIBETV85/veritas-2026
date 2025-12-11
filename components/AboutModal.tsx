import React from 'react';
import { X } from './Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-2 bg-white/80 rounded-full hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header Image/Pattern */}
        <div className="h-32 bg-stone-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          <h2 className="text-3xl font-serif font-bold text-white relative z-10 tracking-tight">Veritas 2026</h2>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2 font-serif">A Daily Spiritual Companion</h3>
              <p className="text-stone-600 leading-relaxed">
                Veritas 2026 is an AI-powered guide designed to accompany you through the Bible in one year. 
                From January 1st to December 31st, discover daily passages, thoughtful reflections, 
                and meaningful prayers tailored to foster spiritual growth.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-xl">
                <h4 className="font-semibold text-stone-900 text-sm mb-1">Daily Readings</h4>
                <p className="text-stone-500 text-xs">Curated scripture passages for every day of the year.</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl">
                <h4 className="font-semibold text-stone-900 text-sm mb-1">Reflections</h4>
                <p className="text-stone-500 text-xs">Insightful commentaries to apply lessons to daily life.</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl">
                <h4 className="font-semibold text-stone-900 text-sm mb-1">Prayer</h4>
                <p className="text-stone-500 text-xs">Guided prayers to deepen your connection.</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl">
                <h4 className="font-semibold text-stone-900 text-sm mb-1">Progress</h4>
                <p className="text-stone-500 text-xs">Track your journey through the year.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400">
                Powered by Google Gemini • Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;