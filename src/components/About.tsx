import { Info, Shield, Cpu, Code, HelpCircle } from 'lucide-react';
import { Database } from '../types';

interface AboutProps {
  db: Database;
}

export default function About({ db }: AboutProps) {
  const futureCapabilities = [
    'Live Broadcast', 'QR Verification', 'Online Registration',
    'Judge Panel', 'Attendance Tracking',
    'WhatsApp Sharing', 'Multi-Admin', 'Cloud Backup'
  ];

  const eventTitle = db.settings.eventName || 'Result Management System';

  return (
    <div className="view active pb-20 max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand-gold-500" />
        <h2 className="font-display font-bold text-brand-green-900 text-sm md:text-base">
          About the Application
        </h2>
      </div>

      {/* Info Card - Main Purpose */}
      <div className="bg-brand-panel border border-brand-line rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-brand-green-900">
          <Info className="w-5 h-5 text-brand-gold-600" />
          <h3 className="font-display font-bold text-xs md:text-sm">Platform Mission</h3>
        </div>
        <p className="text-xs text-brand-ink-soft leading-relaxed">
          The {eventTitle} Result Management System is a professional digital application built for managing arts, cultural, and academic competitions. The platform offers instant live result reporting, automated points compilation, secure multi-user sync capabilities, and simplified event coordination.
        </p>
      </div>

      {/* Info Card - Secure Administration */}
      <div className="bg-brand-panel border border-brand-line rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-brand-green-900">
          <Shield className="w-5 h-5 text-brand-gold-600" />
          <h3 className="font-display font-bold text-xs md:text-sm">Administration Security</h3>
        </div>
        <p className="text-xs text-brand-ink-soft leading-relaxed">
          Platform controls are protected under a secure two-step authentication gate requiring an administrator password followed by a secondary Security PIN. Only authenticated operators can alter point systems, manage candidates, and post scores.
        </p>
      </div>

      {/* Developer Profile Card */}
      <div className="bg-brand-panel border border-brand-line rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-brand-green-900">
          <Code className="w-5 h-5 text-brand-gold-600" />
          <h3 className="font-display font-bold text-xs md:text-sm">Developer Profile</h3>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-brand-ink font-semibold">
            KALIMA 2k26 MEELAD FEST Platform
          </p>
          <p className="text-xs text-brand-ink-soft leading-relaxed">
            The <b>KALIMA 2k26 MEELAD FEST Platform</b> is a professional event management system designed for real-time score compilation, participant searching, live scoreboards, and automated competition management.
          </p>
          <p className="text-xs text-brand-ink-soft leading-relaxed">
            His core objective remains constructing clean, user-friendly, and accessible websites that assist community organizations and institutions in managing records dynamically.
          </p>
        </div>
      </div>

      {/* Technical parameters */}
      <div className="bg-brand-panel border border-brand-line rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-brand-green-900">
          <Cpu className="w-5 h-5 text-brand-gold-600" />
          <h3 className="font-display font-bold text-xs md:text-sm">Technical Specifications</h3>
        </div>
        <p className="text-xs text-brand-ink-soft leading-relaxed">
          Vite &bull; React 19 &bull; Tailwind CSS v4 &bull; Local Storage Offline Caching &bull; Firebase Realtime Database Sync API &bull; SheetJS Bulk Import Integration &bull; Fully Landscape A4 Native Printing Layouts &bull; Mobile First Responsive UI design.
        </p>
      </div>

      {/* Future Capabilities Segment */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-gold-600" />
          <h3 className="font-display font-bold text-brand-green-900 text-xs md:text-sm">Future Modules Roadmap</h3>
        </div>
        <div className="flex flex-wrap gap-2 select-none">
          {futureCapabilities.map((item, idx) => (
            <span 
              key={idx}
              className="px-3.5 py-1.5 bg-brand-green-100 text-brand-green-800 text-[10px] font-bold rounded-full border border-brand-green-600/10"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
