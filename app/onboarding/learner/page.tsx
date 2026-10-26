"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Trophy, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

const DEFAULT_SETTINGS = {
  classes: ["Class 9", "Class 10", "Class 11", "Class 12", "Dropper"],
  exams: ["JEE", "NEET", "NDA", "UPSC", "SSC", "CUET", "Other"],
  subjects: ["Physics", "Chemistry", "Maths", "Biology", "English", "Social Science", "Computer"],
  streams: ["Science (PCM)", "Science (PCB)", "Commerce", "Arts", "Other"],
  hobbies: ["Music", "Dancing", "Calisthenics", "Gaming", "Reading", "Art"],
};

const MEDIUMS = ["English", "Hindi", "Hinglish"];
const TARGETS_LIST = ["Business", "Coding/Tech", "Design", "Medical", "Defence", "Civil Services"];

function SelectChip({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2
        ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" 
                     : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}
    >
      {label} {isSelected && <Check className="w-4 h-4" />}
    </button>
  );
}

function LearnerOnboardingContent() {
  const { dbUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "1";

  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<"school" | "competitive" | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);

  // School State
  const [schoolClass, setSchoolClass] = useState("");
  const [medium, setMedium] = useState("");
  const [stream, setStream] = useState<string[]>([]);

  // Competitive State
  const [exams, setExams] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);

  // Dono ke liye (school students se bhi ab subjects poochhe jaate hain)
  const [subjects, setSubjects] = useState<string[]>([]);

  // Common State
  const [targets, setTargets] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState("");

  const prefilledRef = useRef(false);

  const approvedMaster = dbUser?.role === "master" && dbUser?.masterStatus === "approved";
  const shouldLeave = !!dbUser && (approvedMaster || (dbUser.isProfileComplete && !isEdit));

  // Guard: login nahi => /auth. Approved master ya (edit ke bina) complete profile => home.
  useEffect(() => {
    if (loading) return;
    if (!dbUser) { router.replace("/auth"); return; }
    if (shouldLeave) router.replace("/");
  }, [dbUser, loading, shouldLeave, router]);

  // Edit mode: purana data form me bharo
  useEffect(() => {
    if (!isEdit || !dbUser || prefilledRef.current) return;
    prefilledRef.current = true;

    const d = dbUser.learnerDetails || {};
    if (dbUser.profileType === "school" || dbUser.profileType === "competitive") {
      setProfileType(dbUser.profileType);
      setStep(2);
    }
    setSchoolClass(d.schoolClass || "");
    setMedium(d.medium || "");
    setStream(d.stream || []);
    setExams(d.competitiveExams || []);
    setSubjects(d.subjects || []);
    setStrongSubjects(d.strongSubjects || []);
    setWeakSubjects(d.weakSubjects || []);
    setTargets(d.targets || []);
    setHobbies(d.hobbies || []);
  }, [isEdit, dbUser]);

  // Admin ke settings (agar load na ho to default options chalte hain)
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success && data.data) {
          const s = data.data;
          setSettings({
            classes: s.classes?.length ? s.classes : DEFAULT_SETTINGS.classes,
            exams: s.exams?.length ? s.exams : DEFAULT_SETTINGS.exams,
            subjects: s.subjects?.length ? s.subjects : DEFAULT_SETTINGS.subjects,
            streams: s.streams?.length ? s.streams : DEFAULT_SETTINGS.streams,
            hobbies: s.hobbies?.length ? s.hobbies : DEFAULT_SETTINGS.hobbies,
          });
        }
      } catch (err) {
        console.error("Failed to load settings");
      } finally {
        setFetchingSettings(false);
      }
    }
    fetchSettings();
  }, []);

  const toggleSelection = (item: string, state: string[], setState: (val: string[]) => void) => {
    setState(state.includes(item) ? state.filter((i) => i !== item) : [...state, item]);
  };

  const toggleSubject = (s: string) => {
    if (subjects.includes(s)) {
      setSubjects(subjects.filter((x) => x !== s));
      setStrongSubjects(strongSubjects.filter((x) => x !== s));
      setWeakSubjects(weakSubjects.filter((x) => x !== s));
    } else {
      setSubjects([...subjects, s]);
    }
  };

  // Ek subject strong aur weak dono nahi ho sakta
  const toggleStrong = (s: string) => {
    if (strongSubjects.includes(s)) setStrongSubjects(strongSubjects.filter((x) => x !== s));
    else { setStrongSubjects([...strongSubjects, s]); setWeakSubjects(weakSubjects.filter((x) => x !== s)); }
  };
  const toggleWeak = (s: string) => {
    if (weakSubjects.includes(s)) setWeakSubjects(weakSubjects.filter((x) => x !== s));
    else { setWeakSubjects([...weakSubjects, s]); setStrongSubjects(strongSubjects.filter((x) => x !== s)); }
  };

  const handleAddCustomHobby = () => {
    const clean = customHobby.trim().slice(0, 30);
    if (clean && !hobbies.includes(clean) && hobbies.length < 20) {
      setHobbies([...hobbies, clean]);
      setCustomHobby("");
    }
  };

  const handleSubmit = async () => {
    if (!dbUser?.firebaseUid || !profileType || loadingSubmit) return;
    setLoadingSubmit(true);
    setError(null);

    try {
      const learnerDetails = profileType === "school" 
        ? { schoolClass, medium, stream, subjects, targets, hobbies }
        : { competitiveExams: exams, subjects, strongSubjects, weakSubjects, targets, hobbies };

      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "learner", profileType, learnerDetails })
      });
      
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Save nahi hua. Dobara try karo.");
        return;
      }

      await refreshUser();
      router.replace("/"); 
    } catch (err) {
      setError("Network error. Dobara try karo.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loading || fetchingSettings || !dbUser || shouldLeave) {
    return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const submitDisabled =
    loadingSubmit ||
    (profileType === "school" && !schoolClass) ||
    (profileType === "competitive" && exams.length === 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 py-8">
      <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-6 sm:p-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href={isEdit ? "/" : "/onboarding"} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 transition">
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">{isEdit ? "Edit your profile" : "Set up your profile"}</h1>
            <p className="text-sm text-gray-500 mt-1">Step {step} of 2</p>
          </div>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <button onClick={() => { setProfileType("school"); setStep(2); }} className="group p-6 rounded-2xl border-2 border-gray-200 dark:border-zinc-800 hover:border-blue-500 transition-all flex items-start gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold dark:text-white mb-1">School Student</h3>
                <p className="text-sm text-gray-500">Study for class subjects & board exams.</p>
              </div>
            </button>
            <button onClick={() => { setProfileType("competitive"); setStep(2); }} className="group p-6 rounded-2xl border-2 border-gray-200 dark:border-zinc-800 hover:border-pink-500 transition-all flex items-start gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold dark:text-white mb-1">Competitive Aspirant</h3>
                <p className="text-sm text-gray-500">Prepare for JEE, NEET, NDA, UPSC, etc.</p>
              </div>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-8">
            {profileType === "school" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Class <span className="text-red-500">*</span></h3>
                  <div className="flex gap-2 flex-wrap">
                    {settings.classes.map((c: string) => <SelectChip key={c} label={c} isSelected={schoolClass === c} onClick={() => setSchoolClass(c)} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Medium</h3>
                  <div className="flex gap-2 flex-wrap">
                    {MEDIUMS.map(m => <SelectChip key={m} label={m} isSelected={medium === m} onClick={() => setMedium(m)} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Stream / Target (Multiple)</h3>
                  <div className="flex gap-2 flex-wrap">
                    {settings.streams.map((s: string) => <SelectChip key={s} label={s} isSelected={stream.includes(s)} onClick={() => toggleSelection(s, stream, setStream)} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-1">Your Subjects (Multiple)</h3>
                  <p className="text-xs text-gray-500 mb-3">Inse hi aapka feed aur dashboard personalize hota hai.</p>
                  <div className="flex gap-2 flex-wrap">
                    {settings.subjects.map((s: string) => <SelectChip key={s} label={s} isSelected={subjects.includes(s)} onClick={() => toggleSubject(s)} />)}
                  </div>
                </div>
              </>
            )}

            {profileType === "competitive" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Target Exams (Multiple) <span className="text-red-500">*</span></h3>
                  <div className="flex gap-2 flex-wrap">
                    {settings.exams.map((e: string) => <SelectChip key={e} label={e} isSelected={exams.includes(e)} onClick={() => toggleSelection(e, exams, setExams)} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Subjects</h3>
                  <div className="flex gap-2 flex-wrap">
                    {settings.subjects.map((s: string) => <SelectChip key={s} label={s} isSelected={subjects.includes(s)} onClick={() => toggleSubject(s)} />)}
                  </div>
                </div>
                {subjects.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-green-600 mb-3">Strong Subjects</h3>
                      <div className="flex gap-2 flex-wrap">
                        {subjects.map((s) => <SelectChip key={`strong-${s}`} label={s} isSelected={strongSubjects.includes(s)} onClick={() => toggleStrong(s)} />)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-red-500 mb-3">Weak Subjects</h3>
                      <div className="flex gap-2 flex-wrap">
                        {subjects.map((s) => <SelectChip key={`weak-${s}`} label={s} isSelected={weakSubjects.includes(s)} onClick={() => toggleWeak(s)} />)}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Future Goals / Targets</h3>
              <div className="flex gap-2 flex-wrap mb-6">
                {TARGETS_LIST.map((t: string) => <SelectChip key={t} label={t} isSelected={targets.includes(t)} onClick={() => toggleSelection(t, targets, setTargets)} />)}
              </div>

              <h3 className="text-sm font-semibold dark:text-gray-300 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500"/> Hobbies & Interests</h3>
              <div className="flex gap-2 flex-wrap mb-3">
                {Array.from(new Set([...settings.hobbies, ...hobbies])).map((h: string) => <SelectChip key={h} label={h} isSelected={hobbies.includes(h)} onClick={() => toggleSelection(h, hobbies, setHobbies)} />)}
              </div>
              
              <div className="flex gap-2">
                <input type="text" maxLength={30} placeholder="Add custom hobby..." value={customHobby} onChange={(e) => setCustomHobby(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomHobby()} className="flex-1 px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white outline-none" />
                <button type="button" onClick={handleAddCustomHobby} className="bg-zinc-800 dark:bg-zinc-700 text-white px-4 rounded-xl text-sm font-semibold">Add</button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <button onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-black dark:hover:text-white">Back</button>
            <button onClick={handleSubmit} disabled={submitDisabled} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition disabled:opacity-50">
              {loadingSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? "Save Changes" : "Finish Setup")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearnerOnboarding() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <LearnerOnboardingContent />
    </Suspense>
  );
}