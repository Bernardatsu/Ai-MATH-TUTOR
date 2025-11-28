
import React from 'react';
import { Github, Twitter, Linkedin, Heart } from 'lucide-react';
import { PageType } from '../types';

interface FooterProps {
  onNavigate?: (page: PageType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLinkClick = (e: React.MouseEvent, page?: PageType) => {
    e.preventDefault();
    if (page && onNavigate) {
      onNavigate(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Math<span className="text-indigo-600">Tutor</span></h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Empowering students and professionals with instant, step-by-step math solutions powered by advanced AI.
            </p>
            <div className="flex space-x-4">
              <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Github className="w-5 h-5" />
              </button>
              <button className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="text-slate-400 hover:text-blue-700 transition-colors">
                <Linkedin className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'home')} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Solver</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'video')} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Video AI</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'about')} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">About</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" onClick={(e) => handleLinkClick(e)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Documentation</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Math Guide</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Blog</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Community</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" onClick={(e) => handleLinkClick(e)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e)} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AI Math Tutor. All rights reserved.
          </p>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> by Agbenyo Bernard Atsu
          </p>
        </div>
      </div>
    </footer>
  );
};
