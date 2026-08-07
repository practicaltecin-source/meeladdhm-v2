import { useState } from 'react';
import { Database, Program } from '../types';
import { GENDERS, AGES, AGE_ICONS, GENDER_ICONS } from '../db';
import { Search, MapPin, Clock, Users, FileText, Calendar, Printer, X, ChevronDown, Layers, Sparkles, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProgramsProps {
  db: Database;
  onGenerateReport?: (filename: string, title: string, bodyHTML: string) => void;
}

export function isGeneralProgram(p: Program): boolean {
  if (!p.categories || p.categories.length === 0) return true;
  return p.categories.some(c => 
    c.gender === 'General' || 
    c.age === 'General' || 
    c.age === 'All'
  );
}

export default function Programs({ db, onGenerateReport }: ProgramsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<'All' | 'Boys' | 'Girls' | 'General'>('All');
  const [selectedAge, setSelectedAge] = useState<'All' | 'Kids' | 'Sub Junior' | 'Junior' | 'Senior' | 'Super Senior'>('All');
  const [selectedStageType, setSelectedStageType] = useState<'All' | 'Main Stage' | 'Offstage' | 'General'>('All');
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  const [showCatGuide, setShowCatGuide] = useState(false);

  // Compute program counts
  const totalProgramCount = db.programs.length;
  const mainStageCount = db.programs.filter(p => (p.stageType || 'Main Stage') === 'Main Stage').length;
  const offStageCount = db.programs.filter(p => p.stageType === 'Offstage').length;
  const generalCount = db.programs.filter(p => isGeneralProgram(p)).length;

  const filteredPrograms = db.programs.filter(p => {
    // Stage type / General filter
    if (selectedStageType !== 'All') {
      if (selectedStageType === 'General') {
        if (!isGeneralProgram(p)) return false;
      } else {
        const pStage = p.stageType || 'Main Stage';
        if (pStage !== selectedStageType) {
          return false;
        }
      }
    }

    // Selected Team filter
    if (selectedTeam !== 'All') {
      const teamParticipants = db.participants.filter(
        part => part.teamId === selectedTeam && part.programIds && part.programIds.includes(p.id)
      );
      if (teamParticipants.length === 0) {
        return false;
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();

      const matchesCode = p.code.toLowerCase().includes(term);
      const matchesName = p.name.toLowerCase().includes(term);
      const matchesMeta = (p.venue && p.venue.toLowerCase().includes(term)) || 
                          (p.day && p.day.toLowerCase().includes(term)) ||
                          (p.schedule && p.schedule.toLowerCase().includes(term)) ||
                          (p.description && p.description.toLowerCase().includes(term));

      // Find teams matching search term
      const matchingTeamIds = db.teams
        .filter(t => t.name.toLowerCase().includes(term) || t.id.toLowerCase().includes(term))
        .map(t => t.id);

      const matchesTeam = matchingTeamIds.length > 0 && db.participants.some(
        part => matchingTeamIds.includes(part.teamId) && part.programIds && part.programIds.includes(p.id)
      );

      // Find participant names matching search term
      const matchesParticipant = db.participants.some(
        part => part.name.toLowerCase().includes(term) && part.programIds && part.programIds.includes(p.id)
      );

      if (!matchesCode && !matchesName && !matchesMeta && !matchesTeam && !matchesParticipant) {
        return false;
      }
    }

    // Gender filter
    if (selectedGender !== 'All') {
      if (selectedGender === 'General') {
        if (!isGeneralProgram(p)) return false;
      } else if (!p.categories.some(c => c.gender === selectedGender)) {
        return false;
      }
    }

    // Age filter
    if (selectedAge !== 'All') {
      if (selectedAge === 'Kids' && isGeneralProgram(p)) {
        return false;
      }
      if (!p.categories.some(c => c.age === selectedAge)) {
        return false;
      }
    }

    return true;
  });

  const handlePrintProgramSheet = () => {
    const eventName = db.settings.eventName || 'KALIMA 2k26 MEELAD FEST';
    const boardName = db.settings.boardName || 'KALIMA 2k26 MEELAD FEST';

    const bodyHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px double #15803d; padding-bottom: 16px;">
          <h1 style="margin: 0; color: #15803d; font-size: 26px; font-weight: bold;">${eventName}</h1>
          <h2 style="margin: 6px 0 0; color: #b45309; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">${boardName}</h2>
          <p style="margin: 6px 0 0; color: #4b5563; font-size: 13px; font-weight: 600;">Official Competition Program Sheet</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
          <thead>
            <tr style="background-color: #15803d; color: white;">
              <th style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: left; width: 90px;">Program Code</th>
              <th style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: left;">Program Name</th>
              <th style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: left; width: 100px;">Gender</th>
              <th style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: left; width: 130px;">Age Category</th>
              <th style="padding: 10px 8px; border: 1px solid #d1d5db; text-align: left; width: 120px;">Program Type</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPrograms.map((p, i) => {
              const genders = Array.from(new Set(p.categories.map(c => c.gender))).join(', ') || 'General';
              const ages = Array.from(new Set(p.categories.map(c => c.age))).join(', ') || 'All';
              const progType = (p.single && p.group) ? 'Single & Group' : p.group ? 'Group' : 'Single';
              return `
                <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                  <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; font-family: monospace; color: #15803d;">${p.code}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${p.name}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${genders}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${ages}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${progType}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; font-size: 10px; color: #6b7280; text-align: center; border-t: 1px solid #e5e7eb; padding-top: 10px;">
          Generated on ${new Date().toLocaleDateString()} &bull; Total Programs: ${filteredPrograms.length}
        </div>
      </div>
    `;

    if (onGenerateReport) {
      onGenerateReport('Program_Sheet', 'Official Program Sheet', bodyHTML);
    } else {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`<html><head><title>Program Sheet</title></head><body>${bodyHTML}</body></html>`);
        printWin.document.close();
        printWin.print();
      }
    }
  };

  const handleExportProgramsExcel = () => {
    if (filteredPrograms.length === 0) {
      alert('ℹ️ No programs found matching selected filters.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const rows = [
      ['Program Code', 'Program Name', 'Gender Section', 'Age Category', 'Stage / Venue', 'Day / Date', 'Time Schedule', 'Program Type', 'Max Candidates', 'Enrolled Candidates']
    ];

    filteredPrograms.forEach(p => {
      const genders = Array.from(new Set((p.categories || []).map(c => c.gender))).join(', ') || 'General';
      const ages = Array.from(new Set((p.categories || []).map(c => c.age))).join(', ') || 'All';
      const progType = (p.single && p.group) ? 'Single & Group' : p.group ? 'Group' : 'Single';
      
      const enrolledCount = db.participants.filter(pt => pt.programIds && pt.programIds.includes(p.id)).length;

      rows.push([
        p.code || '—',
        p.name,
        genders,
        ages,
        p.venue ? `${p.stageType || 'Main Stage'} (${p.venue})` : (p.stageType || 'Main Stage'),
        p.day || 'Day 1',
        p.startTime ? `${p.startTime}${p.endTime ? ' - ' + p.endTime : ''}` : (p.schedule || '—'),
        progType,
        p.maxParticipants ? String(p.maxParticipants) : 'Unlimited',
        String(enrolledCount)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 }, // Code
      { wch: 32 }, // Name
      { wch: 16 }, // Gender
      { wch: 18 }, // Age Category
      { wch: 22 }, // Stage / Venue
      { wch: 12 }, // Day
      { wch: 22 }, // Time Schedule
      { wch: 16 }, // Type
      { wch: 16 }, // Max
      { wch: 20 }  // Enrolled Count
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Program Sheet');
    const fileName = `Program_List_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="view active pb-20 max-w-2xl mx-auto space-y-4">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-gold-500 animate-pulse" />
          <h2 className="font-display font-bold text-brand-green-950 text-base md:text-lg">
            Academic Competition Programs
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportProgramsExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
            title="Download complete program sheet as Microsoft Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>📊 Download Excel Sheet (.xlsx)</span>
          </button>
          <button
            onClick={handlePrintProgramSheet}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
            title="Print or view printable PDF program sheet"
          >
            <Printer className="w-3.5 h-3.5 text-brand-gold-400" />
            <span>🖨️ Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Program Count Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setSelectedStageType('All')}
          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
            selectedStageType === 'All'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-md ring-2 ring-brand-gold-400/50'
              : 'bg-brand-panel text-brand-ink border-brand-line hover:border-brand-gold-400/50 shadow-2xs'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            selectedStageType === 'All' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            🌐
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${
              selectedStageType === 'All' ? 'text-brand-gold-300' : 'text-brand-ink-soft'
            }`}>
              All Programs
            </span>
            <span className={`text-base font-extrabold leading-none ${
              selectedStageType === 'All' ? 'text-white' : 'text-brand-green-900'
            }`}>
              {totalProgramCount}
            </span>
          </div>
        </button>

        <button
          onClick={() => setSelectedStageType('Main Stage')}
          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
            selectedStageType === 'Main Stage'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-md ring-2 ring-brand-gold-400/50'
              : 'bg-brand-panel text-brand-ink border-brand-line hover:border-brand-gold-400/50 shadow-2xs'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            selectedStageType === 'Main Stage' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
          }`}>
            🎭
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${
              selectedStageType === 'Main Stage' ? 'text-brand-gold-300' : 'text-brand-ink-soft'
            }`}>
              Main Stage
            </span>
            <span className={`text-base font-extrabold leading-none ${
              selectedStageType === 'Main Stage' ? 'text-white' : 'text-brand-green-900'
            }`}>
              {mainStageCount}
            </span>
          </div>
        </button>

        <button
          onClick={() => setSelectedStageType('Offstage')}
          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
            selectedStageType === 'Offstage'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-md ring-2 ring-brand-gold-400/50'
              : 'bg-brand-panel text-brand-ink border-brand-line hover:border-brand-gold-400/50 shadow-2xs'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            selectedStageType === 'Offstage' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            📝
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${
              selectedStageType === 'Offstage' ? 'text-brand-gold-300' : 'text-brand-ink-soft'
            }`}>
              Off Stage
            </span>
            <span className={`text-base font-extrabold leading-none ${
              selectedStageType === 'Offstage' ? 'text-white' : 'text-brand-green-900'
            }`}>
              {offStageCount}
            </span>
          </div>
        </button>

        <button
          onClick={() => setSelectedStageType('General')}
          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
            selectedStageType === 'General'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-md ring-2 ring-brand-gold-400/50'
              : 'bg-brand-panel text-brand-ink border-brand-line hover:border-brand-gold-400/50 shadow-2xs'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            selectedStageType === 'General' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
          }`}>
            🌟
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${
              selectedStageType === 'General' ? 'text-brand-gold-300' : 'text-brand-ink-soft'
            }`}>
              General
            </span>
            <span className={`text-base font-extrabold leading-none ${
              selectedStageType === 'General' ? 'text-white' : 'text-brand-green-900'
            }`}>
              {generalCount}
            </span>
          </div>
        </button>
      </div>

      {/* Searchbar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search team name, program code, candidate, venue..."
          className="w-full pl-11 pr-10 py-3 bg-brand-panel border border-brand-line rounded-2xl text-xs md:text-sm text-brand-ink placeholder:text-brand-ink-soft/60 focus:outline-none focus:border-brand-gold-500 transition-colors shadow-sm"
        />
        <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-brand-ink-soft/50" />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-3.5 text-brand-ink-soft/60 hover:text-brand-ink p-0.5 rounded-full"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips - Teams */}
      {db.teams && db.teams.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-brand-gold-700 tracking-wider uppercase px-1">
            Filter By Team
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
            <button
              onClick={() => setSelectedTeam('All')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all ${
                selectedTeam === 'All'
                  ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
                  : 'bg-brand-panel text-brand-ink-soft border-brand-line hover:border-brand-gold-400/50'
              }`}
            >
              All Teams
            </button>
            {db.teams.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all flex items-center gap-1.5 ${
                  selectedTeam === t.id
                    ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
                    : 'bg-brand-panel text-brand-ink-soft border-brand-line hover:border-brand-gold-400/50'
                }`}
              >
                <span>{t.symbol || '🛡️'}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stage & Category Location Tabs */}
      <div className="bg-brand-panel border border-brand-line rounded-2xl p-1.5 flex gap-1 shadow-sm select-none overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSelectedStageType('All')}
          className={`flex-1 min-w-[70px] py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center border leading-tight ${
            selectedStageType === 'All'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
              : 'bg-transparent text-brand-ink-soft border-transparent hover:bg-brand-bg hover:border-brand-line/50'
          }`}
        >
          🌐 All ({totalProgramCount})
        </button>
        <button
          onClick={() => setSelectedStageType('Main Stage')}
          className={`flex-1 min-w-[90px] py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center border leading-tight ${
            selectedStageType === 'Main Stage'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
              : 'bg-transparent text-brand-ink-soft border-transparent hover:bg-brand-bg hover:border-brand-line/50'
          }`}
          title="Events conducted on main stage"
        >
          🎭 Main Stage ({mainStageCount})
        </button>
        <button
          onClick={() => setSelectedStageType('Offstage')}
          className={`flex-1 min-w-[80px] py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center border leading-tight ${
            selectedStageType === 'Offstage'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
              : 'bg-transparent text-brand-ink-soft border-transparent hover:bg-brand-bg hover:border-brand-line/50'
          }`}
          title="Events conducted in classrooms / offstage"
        >
          📝 Offstage ({offStageCount})
        </button>
        <button
          onClick={() => setSelectedStageType('General')}
          className={`flex-1 min-w-[75px] py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center border leading-tight ${
            selectedStageType === 'General'
              ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
              : 'bg-transparent text-brand-ink-soft border-transparent hover:bg-brand-bg hover:border-brand-line/50'
          }`}
          title="General competition programs open to all"
        >
          🌟 General ({generalCount})
        </button>
      </div>

      {/* Gender Filters */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-brand-gold-700 tracking-wider uppercase px-1">
          Sections
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
          {['All', ...GENDERS].map(g => (
            <button
              key={g}
              onClick={() => setSelectedGender(g as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all ${
                selectedGender === g
                  ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
                  : 'bg-brand-panel text-brand-ink-soft border-brand-line hover:border-brand-gold-400/50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Age Filters */}
      {selectedGender !== 'General' && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-brand-gold-700 tracking-wider uppercase px-1">
            Age Divisions
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
            {['All', ...AGES].map(a => (
              <button
                key={a}
                onClick={() => setSelectedAge(a as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-all ${
                  selectedAge === a
                    ? 'bg-brand-green-800 text-white border-brand-green-800 shadow-sm'
                    : 'bg-brand-panel text-brand-ink-soft border-brand-line hover:border-brand-gold-400/50'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Program List */}
      {filteredPrograms.length === 0 ? (
        <div className="p-12 bg-brand-panel border border-brand-line rounded-2xl text-center space-y-1 shadow-sm select-none">
          <div className="text-3xl">📋</div>
          <b className="block text-xs text-brand-ink font-bold">No programs loaded</b>
          <p className="text-[10px] text-brand-ink-soft max-w-xs mx-auto">
            Try adjusting your section or category filters to find the competition program.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPrograms.map(p => {
            return (
              <div 
                key={p.id}
                className="bg-brand-panel border border-brand-line rounded-2xl p-4.5 shadow-sm space-y-3 hover:shadow transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[9px] font-extrabold bg-brand-green-100 text-brand-green-800 px-2.5 py-0.5 rounded">
                        {p.code}
                      </span>
                      {p.stageType === 'Offstage' ? (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-sans">
                          📝 Offstage / Classroom
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-sans">
                          🎭 Main Stage
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-xs md:text-sm text-brand-ink mt-1.5">
                      {p.name}
                    </h3>
                  </div>
                </div>

                {/* Subcategory criteria */}
                <div className="flex flex-wrap gap-1.5">
                  {p.categories.map((cat, idx) => {
                    const tagClass = cat.gender === 'Boys' 
                      ? 'bg-sky-100 text-sky-950 border border-sky-300 font-extrabold' 
                      : cat.gender === 'Girls' 
                        ? 'bg-pink-100 text-pink-950 border border-pink-300 font-extrabold' 
                        : 'bg-purple-100 text-purple-950 border border-purple-300 font-extrabold';
                    return (
                      <span key={idx} className={`text-[10px] px-2.5 py-0.5 rounded-full ${tagClass}`}>
                        {GENDER_ICONS[cat.gender]} {cat.gender}
                        {cat.age !== 'All' ? `  •  ${AGE_ICONS[cat.age]} ${cat.age}` : ''}
                      </span>
                    );
                  })}
                </div>

                {/* Type tags */}
                <div className="flex gap-2">
                  {p.single && (
                    <span className="text-[9px] font-bold bg-brand-gold-100 text-brand-gold-700 px-2 py-0.5 rounded">
                      Single Entry
                    </span>
                  )}
                  {p.group && (
                    <span className="text-[9px] font-bold bg-brand-gold-100 text-brand-gold-700 px-2 py-0.5 rounded">
                      Group Entry
                    </span>
                  )}
                </div>

                {/* Meta details list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-brand-ink-soft bg-brand-bg/55 p-3 rounded-xl border border-brand-line/50">
                  <div className="flex flex-wrap items-center gap-2 col-span-1 md:col-span-2 bg-brand-green-50/60 p-2 rounded-lg border border-brand-green-100 text-brand-green-950">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-green-800 shrink-0" />
                      <span className="font-bold">{p.day || 'Day 1'}</span>
                    </div>
                    <span>&bull;</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-green-800 shrink-0" />
                      <span className="font-bold">{p.startTime ? `${p.startTime}${p.endTime ? ' - ' + p.endTime : ''}` : (p.schedule || 'Schedule Pending')}</span>
                    </div>
                    {p.venue && (
                      <>
                        <span>&bull;</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold-600 shrink-0" />
                          <span className="font-bold">{p.venue}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {p.schedule && (
                    <div className="flex items-center gap-1.5 text-brand-ink-soft col-span-1 md:col-span-2 text-[9px] italic">
                      <span>Schedule Note:</span> <span>{p.schedule}</span>
                    </div>
                  )}

                  {p.maxParticipants !== null && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-brand-gold-600 shrink-0" />
                      <span>Max Candidates: {p.maxParticipants}</span>
                    </div>
                  )}
                </div>

                {p.description && (
                  <div className="text-[10px] text-brand-ink-soft leading-relaxed flex gap-1.5 border-t border-brand-line/30 pt-2.5">
                    <FileText className="w-3.5 h-3.5 text-brand-ink-soft/40 shrink-0 mt-0.5" />
                    <p>{p.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
