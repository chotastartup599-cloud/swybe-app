"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Trophy, Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LearnerOnboarding() {
  const { dbUser, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<"school" | "competitive" | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);

  // Settings State
  const [settings, setSettings] = useState<any>({
    classes: [], exams: [], subjects: [], streams: [], hobbies: []
  });

  // School State
  const [schoolClass, setSchoolClass] = useState("");
  const [medium, setMedium] = useState("");
  const [stream, setStream] = useState<string[]>([]);
  
  // Competitive State
  const [exams, setExams] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  
  // Common State
  const [targets, setTargets] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState("");

  // FIX: Agar user login nahi hai -> /auth bhejo.
  // Agar profile already complete hai -> dobara form mat dikhao, home bhej do.
  useEffect(() => {
    if (!loading && !dbUser) {
      router.push("/auth");
    } else if (!loading && dbUser?.isProfileComplete) {
      router.push("/");
    }
  }, [dbUser, loading, router]);

  // Fetch Settings from Admin API
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("Failed to load settings");
      } finally {
        setFetchingSettings(false);
      }
    }
    fetchSettings();
  }, []);

  const mediums = ["English", "Hindi", "Hinglish"];
  const targetsList = ["Business", "Coding/Tech", "Design", "Medical", "Defence", "Civil Services"];

  const toggleSelection = (item: string, state: string[], setState: (val: string[]) => void) => {
    setState(state.includes(item) ? state.filter((i) => i !== item) : [...state, item]);
  };

  const handleAddCustomHobby = () => {
    if (customHobby.trim() && !hobbies.includes(customHobby.trim())) {
      setHobbies([...hobbies, customHobby.trim()]);
      setCustomHobby("");
    }
  };

  const handleSubmit = async () => {
    if (!dbUser?.firebaseUid) return;
    setLoadingSubmit(true);

    try {
      const learnerDetails = profileType === "school" 
        ? { schoolClass, medium, stream, targets, hobbies }
        : { competitiveExams: exams, subjects, strongSubjects, weakSubjects, targets, hobbies };

      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: dbUser.firebaseUid,
          role: "learner",
          profileType,
          learnerDetails
        })
      });
      
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        router.push("/"); 
      }
    } catch (error) {
      alert("Failed to save. Try again.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const SelectChip = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2
        ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" 
                     : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}
    >
      {label} {isSelected && <Check className="w-4 h-4" />}
    </button>
  );

  if (loading || fetchingSettings || !dbUser || dbUser.isProfileComplete) return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 py-8">
      <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-6 sm:p-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/onboarding" className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 transition">
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">Set up your profile</h1>
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
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Class</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {settings.classes.map((c: string) => <SelectChip key={c} label={c} isSelected={schoolClass === c} onClick={() => setSchoolClass(c)} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Medium</h3>
                  <div className="flex gap-2 flex-wrap">
                    {mediums.map(m => <SelectChip key={m} label={m} isSelected={medium === m} onClick={() => setMedium(m)} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Stream / Target (Multiple)</h3>
                  <div className="flex gap-2 flex-wrap">
                    {settings.streams.map((s: string) => <SelectChip key={s} label={s} isSelected={stream.includes(s)} onClick={() => toggleSelection(s, stream, setStream)} />)}
                  </div>
                </div>
              </>
            )}

            {profileType === "competitive" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Target Exams (Multiple)</h3>
                  <div className="flex gap-2 flex-wrap">
                    {settings.exams.map((e: string) => <SelectChip key={e} label={e} isSelected={exams.includes(e)} onClick={() => toggleSelection(e, exams, setExams)} />)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Subjects</h3>
                  <div className="flex gap-2 flex-wrap">
                    {settings.subjects.map((s: string) => <SelectChip key={s} label={s} isSelected={subjects.includes(s)} onClick={() => toggleSelection(s, subjects, setSubjects)} />)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-green-600 mb-3">Strong Subjects</h3>
                    <div className="flex gap-2 flex-wrap">
                      {settings.subjects.map((s: string) => <SelectChip key={`strong-${s}`} label={s} isSelected={strongSubjects.includes(s)} onClick={() => toggleSelection(s, strongSubjects, setStrongSubjects)} />)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-500 mb-3">Weak Subjects</h3>
                    <div className="flex gap-2 flex-wrap">
                      {settings.subjects.map((s: string) => <SelectChip key={`weak-${s}`} label={s} isSelected={weakSubjects.includes(s)} onClick={() => toggleSelection(s, weakSubjects, setWeakSubjects)} />)}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold dark:text-gray-300 mb-3">Future Goals / Targets</h3>
              <div className="flex gap-2 flex-wrap mb-6">
                {targetsList.map((t: string) => <SelectChip key={t} label={t} isSelected={targets.includes(t)} onClick={() => toggleSelection(t, targets, setTargets)} />)}
              </div>

              <h3 className="text-sm font-semibold dark:text-gray-300 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500"/> Hobbies & Interests</h3>
              <div className="flex gap-2 flex-wrap mb-3">
                {settings.hobbies.map((h: string) => <SelectChip key={h} label={h} isSelected={hobbies.includes(h)} onClick={() => toggleSelection(h, hobbies, setHobbies)} />)}
              </div>
              
              <div className="flex gap-2">
                <input type="text" placeholder="Add custom hobby..." value={customHobby} onChange={(e) => setCustomHobby(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomHobby()} className="flex-1 px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white outline-none" />
                <button onClick={handleAddCustomHobby} className="bg-zinc-800 dark:bg-zinc-700 text-white px-4 rounded-xl text-sm font-semibold">Add</button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <button onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-black dark:hover:text-white">Back</button>
            <button onClick={handleSubmit} disabled={loadingSubmit || (!schoolClass && profileType === "school") || (!exams.length && profileType === "competitive")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition disabled:opacity-50">
              {loadingSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finish Setup"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}