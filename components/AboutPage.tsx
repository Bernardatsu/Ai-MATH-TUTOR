
import React from 'react';
import { ArrowLeft, GraduationCap, Sparkles, Zap, Globe, Heart, Linkedin, Github, Mail, Phone } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up pb-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors px-4 md:px-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tutor
      </button>

      {/* Hero Section */}
      <div className="text-center mb-16 px-4">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-6">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
          Empowering Students with <br/>
          <span className="text-indigo-600">AI Intelligence</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Math Tutor is more than just a calculator. It's a personalized learning companion designed to break down complex problems into clear, understandable steps for students everywhere.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 mb-20">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Smart Explanations</h3>
          <p className="text-slate-500 leading-relaxed">
            We don't just give answers. We provide step-by-step reasoning and conceptual breakdowns to help you actually learn.
          </p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Real-World Data</h3>
          <p className="text-slate-500 leading-relaxed">
            Integrated with Google Search to fetch up-to-date information for problems involving current statistics or facts.
          </p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Multimodal Learning</h3>
          <p className="text-slate-500 leading-relaxed">
            Upload images, documents, or even videos. Our AI analyzes visual content to solve problems from any format.
          </p>
        </div>
      </div>

      {/* Founder Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mx-4 md:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Column */}
          <div className="bg-slate-200 relative h-96 md:h-auto min-h-[400px]">
             {/* 
                TODO: Replace the src below with your actual image URL or local file path. 
                Example: src="/assets/bernard.jpg" or an external URL.
             */}
             <img 
               src="https://media.licdn.com/dms/image/v2/D4E03AQHZeRMtYWR49A/profile-displayphoto-shrink_800_800/B4EZcyY552HQAc-/0/1748897079881?e=1766016000&v=beta&t=801M7uUSi03khnB_OzaIhfsWGiDimvyq9_OXDCvkfqk" 
               alt="Agbenyo Bernard Atsu" 
               className="absolute inset-0 w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/40 to-transparent"></div>
             
             <div className="absolute bottom-0 left-0 p-8 z-10 text-white">
               <span className="inline-block px-3 py-1 bg-indigo-600/80 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-500/50 shadow-sm">The Founder</span>
               <h2 className="text-3xl font-bold mb-2 text-white">Agbenyo Bernard Atsu</h2>
               <p className="text-indigo-200 font-medium">Petroleum Engineering Student</p>
             </div>
          </div>
          
          {/* Details Column */}
          <div className="p-10 flex flex-col justify-center">
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mission</h4>
                 <p className="text-slate-600 leading-relaxed text-lg italic">
                 "I built Math Tutor to bridge the gap between complex engineering concepts and accessible technology. My goal is to make high-quality education available to every student at KNUST and beyond."
               </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Education</h4>
                <div className="flex items-start gap-3">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <GraduationCap className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="font-bold text-slate-800">Kwame Nkrumah University of Science and Technology (KNUST)</p>
                      <p className="text-slate-500 text-sm mt-1">2nd Year, Petroleum Engineering</p>
                   </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Connect with me</h4>
                <div className="flex gap-3">
                  <a 
                    href="https://www.linkedin.com/in/bernard-agbenyo/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                  <a 
                    href="mailto:b44438453@gmail.com" 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                   <a 
                    href="https://wa.me/233530311667" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-12 text-slate-400 flex items-center justify-center gap-2">
         Made with <Heart className="w-4 h-4 text-red-400 fill-red-400" /> in Kumasi, Ghana
      </div>
    </div>
  );
};
