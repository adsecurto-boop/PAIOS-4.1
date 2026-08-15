import React, { useState } from 'react';
import {
  Pill,
  ShieldAlert,
  HeartPulse,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Copy,
  FileText,
  Calendar,
  PhoneCall,
  Info,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Flame,
} from 'lucide-react';
import {
  Medication,
  DoseEvent,
  DoseStatus,
  RefillInventory,
  VitalSign,
} from '../types';
import { PAIOSStorage, getTodayDateString } from '../storage';

interface HealthScreenProps {
  medications: Medication[];
  doseEvents: DoseEvent[];
  refillInventories: RefillInventory[];
  vitalSigns: VitalSign[];
  onLogDose: (doseId: string, status: DoseStatus, note?: string) => void;
  onUpdateRefill: (id: string, newQty: number) => void;
  onLogVital: (vital: Omit<VitalSign, 'id' | 'timestampMillis'>) => void;
  onAddMedication: (med: Medication) => void;
}

export const HealthScreen: React.FC<HealthScreenProps> = ({
  medications,
  doseEvents,
  refillInventories,
  vitalSigns,
  onLogDose,
  onUpdateRefill,
  onLogVital,
  onAddMedication,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'regimen' | 'vitals' | 'briefing' | 'safety'>('schedule');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  // Vitals Form State
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [heartRate, setHeartRate] = useState<string>('72');
  const [weight, setWeight] = useState<string>('70');
  const [dizziness, setDizziness] = useState<number>(1);
  const [sedation, setSedation] = useState<number>(1);
  const [symptomsNote, setSymptomsNote] = useState<string>('');
  const [copiedBriefing, setCopiedBriefing] = useState(false);

  // New Medication Form State
  const [newGenericName, setNewGenericName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newStrength, setNewStrength] = useState('50');
  const [newUnit, setNewUnit] = useState('mg');
  const [newForm, setNewForm] = useState('tablet');
  const [newInstructions, setNewInstructions] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDoctor, setNewDoctor] = useState('');

  const todayStr = getTodayDateString();

  // Stats
  const takenCount = doseEvents.filter((d) => d.status === 'TAKEN' || d.status === 'TAKEN_LATE').length;
  const totalCount = doseEvents.length;
  const adherencePercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  const lowSupplyRefills = refillInventories.filter(
    (r) => r.quantityRemaining / (r.dailyBurnRate || 1) <= r.minimumThresholdDays
  );

  const latestVital = vitalSigns.length > 0 ? vitalSigns[0] : null;

  const handleSaveVitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogVital({
      systolicBp: parseInt(systolic) || undefined,
      diastolicBp: parseInt(diastolic) || undefined,
      restingHeartRate: parseInt(heartRate) || undefined,
      weightKg: parseFloat(weight) || undefined,
      dizzinessSeverity: dizziness,
      sedationSeverity: sedation,
      symptoms: symptomsNote || undefined,
    });
    setSymptomsNote('');
  };

  const handleCreateMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenericName.trim()) return;
    const newMed: Medication = {
      id: `med_${Date.now()}`,
      genericName: newGenericName,
      brandName: newBrandName || newGenericName,
      dosageStrength: parseFloat(newStrength) || 10,
      dosageUnit: newUnit,
      form: newForm,
      route: 'oral',
      status: 'active',
      instructions: newInstructions || `Take 1 ${newForm} daily.`,
      scheduleTimes: [newTime],
      createdAtMillis: Date.now(),
      prescribingDoctor: newDoctor || 'Prescribing Physician',
    };
    onAddMedication(newMed);
    setShowAddMedModal(false);
    setNewGenericName('');
    setNewBrandName('');
  };

  const doctorBriefingText = `
================================================================================
                    PAIOS CLINICAL VISIT BRIEFING DOCUMENT
Generated: ${new Date().toLocaleString()} | Patient Profile: Alex
================================================================================
1. ACTIVE MEDICATIONS (RECORDED REGIMEN)
${medications.map((m) => `  • ${m.genericName} (${m.brandName}) ${m.dosageStrength}${m.dosageUnit} - ${m.instructions} [RxNorm CUI: ${m.rxNormCui || 'N/A'}] (Dr: ${m.prescribingDoctor || 'Unspecified'})`).join('\n')}

2. ADHERENCE SUMMARY (TODAY & RECENT)
  • Adherence Score: ${adherencePercent}% (${takenCount}/${totalCount} doses recorded today)
  • Logged Doses Today (${todayStr}):
${doseEvents.map((d) => `    - [${d.scheduledTime}] ${d.medicationName}: ${d.status}`).join('\n')}

3. PATIENT-REPORTED SYMPTOMS & VITALS TELEMETRY
  • Latest Vitals: ${latestVital ? `BP: ${latestVital.systolicBp || '--'}/${latestVital.diastolicBp || '--'} mmHg | Resting HR: ${latestVital.restingHeartRate || '--'} bpm | Weight: ${latestVital.weightKg || '--'} kg` : 'None logged today.'}
  • Dizziness Severity: ${latestVital?.dizzinessSeverity ? `${latestVital.dizzinessSeverity}/10` : 'None'}
  • Recent Symptoms: ${latestVital?.symptoms || 'No acute side effects reported.'}

4. PHARMACY REFILL INVENTORY ALERTS
${lowSupplyRefills.map((r) => `  ⚠️ ${r.medicationName}: Only ${r.quantityRemaining} ${r.unit} left (${r.pharmacyName || 'Pharmacy'}).`).join('\n') || '  • All medication supplies are adequate.'}

5. PATIENT PREPARED DISCUSSION POINTS
  • Discuss morning alertness and whether evening dose timing should be adjusted.
  • Review potential multi-agent serotonergic / anticholinergic overlaps.
================================================================================
NOTICE: Generated automatically by PAIOS for patient-clinician discussion.
================================================================================
  `.trim();

  const handleCopyBriefing = () => {
    navigator.clipboard.writeText(doctorBriefingText);
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Top Banner / Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Health & Medication Engine</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Local-First
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              RxNorm-grounded regimen tracking, deterministic dose ledger & clinical safety support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-xl transition-all shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Red-Flag Check</span>
          </button>
          <button
            onClick={() => setShowAddMedModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Critical Refill Warning Banner (If Low Supply) */}
      {lowSupplyRefills.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm space-y-1">
            <span className="font-semibold text-amber-300">Medication Refill Warning:</span>
            <div className="text-slate-300">
              {lowSupplyRefills.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-0.5">
                  <span>
                    <strong>{r.medicationName}</strong> — {r.quantityRemaining} {r.unit} remaining ({Math.max(1, Math.floor(r.quantityRemaining / (r.dailyBurnRate || 1)))} days supply left)
                  </span>
                  <span className="text-amber-400 font-mono text-xs">{r.pharmacyPhone || 'Call Pharmacy'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Adherence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{adherencePercent}%</div>
          <div className="text-xs text-slate-500">{takenCount} of {totalCount} doses recorded</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Regimen</span>
            <Pill className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{medications.filter((m) => m.status === 'active').length}</div>
          <div className="text-xs text-slate-500">RxNorm Grounded Regimen</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Supply Vault</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {lowSupplyRefills.length > 0 ? (
              <span className="text-amber-400">{lowSupplyRefills.length} Low</span>
            ) : (
              <span className="text-emerald-400">OK</span>
            )}
          </div>
          <div className="text-xs text-slate-500">Refill burn rate tracker</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Latest Vitals</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {latestVital ? `${latestVital.systolicBp || '--'}/${latestVital.diastolicBp || '--'}` : '120/80'}
          </div>
          <div className="text-xs text-slate-500">
            {latestVital?.restingHeartRate ? `${latestVital.restingHeartRate} bpm` : '68 bpm resting'}
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Header */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'schedule'
              ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Schedule Ledger</span>
        </button>

        <button
          onClick={() => setActiveSubTab('regimen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'regimen'
              ? 'bg-slate-800 text-indigo-400 font-semibold shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Active Regimen & Refill Vault</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vitals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'vitals'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Vitals & Symptom Logger</span>
        </button>

        <button
          onClick={() => setActiveSubTab('briefing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'briefing'
              ? 'bg-slate-800 text-purple-400 font-semibold shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Doctor Visit Briefing</span>
        </button>

        <button
          onClick={() => setActiveSubTab('safety')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'safety'
              ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Drug Safety Review</span>
        </button>
      </div>

      {/* TAB CONTENT 1: Today's Schedule & Dose Ledger */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Medication Schedule for Today ({todayStr})</span>
            </h2>
            <span className="text-xs text-slate-400">Deterministic Adherence Ledger</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doseEvents.map((dose) => {
              const med = medications.find((m) => m.id === dose.medicationId);
              const refill = refillInventories.find((r) => r.medicationId === dose.medicationId);

              return (
                <div
                  key={dose.id}
                  className={`border rounded-2xl p-4 transition-all space-y-3 ${
                    dose.status === 'TAKEN' || dose.status === 'TAKEN_LATE'
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : dose.status === 'SKIPPED'
                      ? 'bg-amber-950/20 border-amber-800/40'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-mono rounded-lg bg-slate-800 text-emerald-300 font-semibold">
                          {dose.scheduledTime}
                        </span>
                        <h3 className="text-sm font-bold text-white">{dose.medicationName}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{med?.instructions || 'Take as prescribed.'}</p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        dose.status === 'TAKEN'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : dose.status === 'TAKEN_LATE'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : dose.status === 'SKIPPED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {dose.status}
                    </span>
                  </div>

                  {/* Metadata Indicators */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    {med?.foodRelation && (
                      <span className="capitalize bg-slate-800/60 px-2 py-0.5 rounded text-slate-300">
                        {med.foodRelation.replace('_', ' ')}
                      </span>
                    )}
                    {refill && (
                      <span className={refill.quantityRemaining <= 7 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                        Supply: {refill.quantityRemaining} {refill.unit} left
                      </span>
                    )}
                  </div>

                  {/* Interactive Dose Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onLogDose(dose.id, 'TAKEN')}
                      className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        dose.status === 'TAKEN'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Take Dose</span>
                    </button>

                    <button
                      onClick={() => onLogDose(dose.id, 'SKIPPED')}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        dose.status === 'SKIPPED'
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Skip</span>
                    </button>

                    <button
                      onClick={() => onLogDose(dose.id, 'TAKEN_LATE')}
                      className="py-1.5 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                    >
                      Taken Late
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Active Regimen & Refill Inventory Vault */}
      {activeSubTab === 'regimen' && (
        <div className="space-y-6">
          {/* Active Regimen List */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-indigo-400" />
              <span>Active Prescriptions & Regimen Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications.map((med) => {
                const refill = refillInventories.find((r) => r.medicationId === med.id);
                return (
                  <div key={med.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{med.genericName}</h3>
                          <span className="text-xs text-slate-400">({med.brandName})</span>
                        </div>
                        <p className="text-xs font-mono text-indigo-300 mt-0.5">
                          {med.dosageStrength} {med.dosageUnit} • {med.form} • Oral
                        </p>
                      </div>

                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        RxCUI: {med.rxNormCui || '284205'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                      <strong>Instructions:</strong> {med.instructions}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>Doctor: {med.prescribingDoctor || 'Sarah Jenkins, MD'}</span>
                      <span className="text-emerald-400 font-medium">Daily: {med.scheduleTimes.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refill Inventory Vault */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Refill Vault & Pharmacy Supply Inventory</span>
            </h2>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Medication</th>
                      <th className="px-4 py-3">Remaining Supply</th>
                      <th className="px-4 py-3">Days Left</th>
                      <th className="px-4 py-3">Pharmacy Info</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {refillInventories.map((refill) => {
                      const daysLeft = Math.floor(refill.quantityRemaining / (refill.dailyBurnRate || 1));
                      const isLow = daysLeft <= refill.minimumThresholdDays;

                      return (
                        <tr key={refill.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">{refill.medicationName}</td>
                          <td className="px-4 py-3 font-mono">
                            <span className={isLow ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                              {refill.quantityRemaining} {refill.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isLow ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {daysLeft} days
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            <div>{refill.pharmacyName || 'CVS Pharmacy'}</div>
                            <div className="text-slate-500 font-mono">{refill.pharmacyPhone || '(555) 019-2831'}</div>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <button
                              onClick={() => onUpdateRefill(refill.id, refill.quantityRemaining + 30)}
                              className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30"
                            >
                              + Refill 30
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Vitals & Symptom Logger */}
      {activeSubTab === 'vitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logger Form */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Log Vitals & Side Effect Telemetry</span>
            </h2>

            <form onSubmit={handleSaveVitalSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Resting Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    placeholder="70.5"
                  />
                </div>
              </div>

              {/* Dizziness & Sedation Severity Sliders */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Dizziness Severity Score</span>
                    <span className="font-bold text-cyan-400">{dizziness}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={dizziness}
                    onChange={(e) => setDizziness(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Daytime Sedation Score</span>
                    <span className="font-bold text-indigo-400">{sedation}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sedation}
                    onChange={(e) => setSedation(parseInt(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Symptom Notes & Context</label>
                <textarea
                  rows={2}
                  value={symptomsNote}
                  onChange={(e) => setSymptomsNote(e.target.value)}
                  placeholder="e.g. Felt lightheaded for 10 mins after morning Propranolol dose."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-md transition-all"
              >
                Log Vital & Symptom Record
              </button>
            </form>
          </div>

          {/* Historical Telemetry List */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Recent Vitals & Symptom Logs</span>
            </h2>

            <div className="space-y-3">
              {vitalSigns.map((v) => (
                <div key={v.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {new Date(v.timestampMillis).toLocaleDateString()} at{' '}
                      {new Date(v.timestampMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
                        BP: {v.systolicBp || '--'}/{v.diastolicBp || '--'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                        HR: {v.restingHeartRate || '--'} bpm
                      </span>
                    </div>
                  </div>

                  {v.symptoms && <p className="text-xs text-slate-200">"{v.symptoms}"</p>}

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Dizziness: {v.dizzinessSeverity || 0}/10</span>
                    <span>Sedation: {v.sedationSeverity || 0}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Doctor Visit Briefing */}
      {activeSubTab === 'briefing' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Clinical Visit Briefing Document</h2>
            </div>

            <button
              onClick={handleCopyBriefing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedBriefing ? 'Copied Briefing!' : 'Copy Clinical Briefing'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {doctorBriefingText}
          </pre>
        </div>
      )}

      {/* TAB CONTENT 5: Drug Safety Review */}
      {activeSubTab === 'safety' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pharmacological Reference Review</h2>
              <p className="text-xs text-slate-400">
                Structured clinical discussion questions for doctor or pharmacist consultation
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4" />
                1. Serotonergic Overlap (Sertraline 50 mg + Clomipramine 25 mg)
              </h3>
              <p className="text-slate-400">
                Co-administration of an SSRI and a TCA involves dual serotonergic uptake inhibition. Discuss with your physician monitoring for early signs of Serotonin Toxicity (e.g. tremor, hyperreflexia, sweating).
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4" />
                2. Additive CNS & Sedation (Quetiapine + Clonazepam + Clomipramine)
              </h3>
              <p className="text-slate-400">
                Three evening agents exhibit sedating properties. Track morning grogginess and avoid driving if daytime sedation occurs.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4" />
                3. Hemodynamic & Heart Rate Aspects (Propranolol + Quetiapine)
              </h3>
              <p className="text-slate-400">
                Propranolol reduces heart rate; quetiapine can induce mild orthostatic blood pressure drops upon standing. Log morning blood pressure and heart rate regularly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Red-Flag Modal Overlay */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-white">Emergency Red-Flag Safety Protocol</h2>
                <p className="text-xs text-red-300">Level 5 Hard Stop Medical Override</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If you or someone nearby is experiencing any of the following symptoms, call emergency services immediately:
            </p>

            <ul className="text-xs text-slate-200 space-y-1.5 list-disc list-inside bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
              <li>Crushing chest pain or pressure radiating to arm/jaw</li>
              <li>Sudden shortness of breath or throat closing (Anaphylaxis)</li>
              <li>Slurred speech, facial drooping, or sudden weakness</li>
              <li>Severe disorientation, hyperthermia, or uncontrollable tremors</li>
            </ul>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href="tel:911"
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg text-center"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Emergency Services (911 / 112)</span>
              </a>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-400" />
              <span>Add New Prescribed Medication</span>
            </h2>

            <form onSubmit={handleCreateMedication} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Generic Name *</label>
                <input
                  type="text"
                  required
                  value={newGenericName}
                  onChange={(e) => setNewGenericName(e.target.value)}
                  placeholder="e.g. Sertraline HCl"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Zoloft"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Strength</label>
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Instructions</label>
                <input
                  type="text"
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Take 1 tablet every morning with food"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  Save Medication
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
