"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdminEmail } from "@/lib/constants";
import {
  ShieldAlert, CheckCircle, XCircle, Loader2, Settings, LayoutDashboard,
  Users, FileText, Box, Trash2, Plus, Eye, EyeOff, Search, Flag,
} from "lucide-react";

type Tab = "overview" | "creators" | "reports" | "users" | "settings" | "blocks" | "content";

const PAGE_SIZE = 20;
const POST_TYPES = ["", "feed", "reel", "story", "quiz"];
const SETTING_KEYS = [
  { key: "classes", label: "Classes" },
  { key: "subjects", label: "Subjects" },
  { key: "exams", label: "Exams" },
  { key: "streams", label: "Streams" },
  { key: "hobbies", label: "Hobbies" },
];
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "creators", label: "Approvals", icon: Users },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "users", label: "All Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "blocks", label: "Blocks", icon: Box },
  { id: "content", label: "Content", icon: FileText },
];
const REASON_LABELS: Record<string, string> = {
  spam: "Spam / scam",
  harassment: "Harassment",
  hate: "Hate",
  inappropriate: "Sexual / unsafe",
  unsafe: "Self-harm / dangerous",
  misinformation: "Misinformation",
  copyright: "Copyright",
  other: "Other",
};

// Token apne aap lag jaata hai (lib/authFetch). Error aaye to message throw hota hai.
async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
  return data;
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "-");

function Spinner() {
  return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
}

export default function AdminDashboard() {
  const { dbUser, loading } = useAuth();
  const router = useRouter();
  const isAdmin = isAdminEmail(dbUser?.email);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const noticeTimer = useRef<any>(null);

  const showNotice = useCallback((type: "error" | "success", text: string) => {
    setNotice({ type, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  }, []);

  // ---------- Overview ----------
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await api("/api/admin/stats");
      setStats(data.data);
    } catch (err: any) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ---------- Creators ----------
  const [creators, setCreators] = useState<any[] | null>(null);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadCreators = useCallback(async () => {
    setCreatorsLoading(true);
    try {
      const data = await api("/api/admin/creators");
      setCreators(data.data);
    } catch (err: any) {
      showNotice("error", err.message);
      setCreators([]);
    } finally {
      setCreatorsLoading(false);
    }
  }, [showNotice]);

  const handleCreatorAction = async (uid: string, status: "approved" | "rejected") => {
    if (busyId) return;
    setBusyId(uid);
    try {
      await api("/api/admin/creators", { method: "POST", body: JSON.stringify({ firebaseUid: uid, status }) });
      setCreators((prev) => (prev || []).filter((c) => c.firebaseUid !== uid));
      setStats(null); // overview ke numbers dobara aayenge
      showNotice("success", status === "approved" ? "Educator approve ho gaya." : "Application reject ho gayi.");
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Reports ----------
  const [reports, setReports] = useState<any[]>([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsOpenCount, setReportsOpenCount] = useState<number | null>(null);
  const [reportStatus, setReportStatus] = useState("open");
  const reportsReq = useRef(0);

  const loadReports = useCallback(async (reset: boolean, skip = 0) => {
    const reqId = ++reportsReq.current;
    setReportsLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip), status: reportStatus });
      const data = await api(`/api/admin/reports?${params.toString()}`);
      if (reqId !== reportsReq.current) return;
      setReports((prev) => (reset ? data.data : [...prev, ...data.data]));
      setReportsTotal(data.total);
      setReportsOpenCount(data.openCount);
    } catch (err: any) {
      if (reqId === reportsReq.current) showNotice("error", err.message);
    } finally {
      if (reqId === reportsReq.current) setReportsLoading(false);
    }
  }, [reportStatus, showNotice]);

  const handleReportAction = async (report: any, action: "dismiss" | "resolve" | "delete_content") => {
    if (busyId) return;
    if (action === "delete_content") {
      const what = report.targetType === "post" ? "post" : "comment";
      if (!confirm(`Ye ${what} hamesha ke liye delete karna hai? Uske owner ko batayenge ki Community Guidelines ki wajah se hataya gaya.`)) return;
    }
    setBusyId(report._id);
    try {
      await api("/api/admin/reports", { method: "PATCH", body: JSON.stringify({ id: report._id, action }) });
      showNotice(
        "success",
        action === "dismiss" ? "Report dismiss ho gayi." : action === "resolve" ? "Report resolved mark ho gayi." : "Content delete ho gaya."
      );
      setStats(null);
      await loadReports(true);
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Users ----------
  const [users, setUsers] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [debouncedUserQuery, setDebouncedUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const usersReq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [userQuery]);

  const loadUsers = useCallback(async (reset: boolean, skip = 0) => {
    const reqId = ++usersReq.current;
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip) });
      if (debouncedUserQuery) params.set("q", debouncedUserQuery);
      if (roleFilter) params.set("role", roleFilter);
      const data = await api(`/api/admin/users?${params.toString()}`);
      if (reqId !== usersReq.current) return;
      setUsers((prev) => (reset ? data.data : [...prev, ...data.data]));
      setUsersTotal(data.total);
    } catch (err: any) {
      if (reqId === usersReq.current) showNotice("error", err.message);
    } finally {
      if (reqId === usersReq.current) setUsersLoading(false);
    }
  }, [debouncedUserQuery, roleFilter, showNotice]);

  const handleUpdateRole = async (uid: string, role: string) => {
    try {
      const data = await api("/api/admin/users", { method: "POST", body: JSON.stringify({ userId: uid, role }) });
      setUsers((prev) => prev.map((u) => (u.firebaseUid === uid ? { ...u, ...data.data } : u)));
      setStats(null);
      showNotice("success", "Role update ho gaya.");
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`"${u.name}" ko delete karna hai? Uska account, posts, comments aur saara data hamesha ke liye hat jayega.`)) return;
    setBusyId(u._id);
    try {
      await api(`/api/admin/users?id=${u._id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
      setUsersTotal((t) => Math.max(0, t - 1));
      setStats(null);
      showNotice("success", "User delete ho gaya.");
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Settings ----------
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [selectedSettingKey, setSelectedSettingKey] = useState("classes");
  const [newSettingItem, setNewSettingItem] = useState("");

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await api("/api/admin/settings");
      setSettings(data.data);
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setSettingsLoading(false);
    }
  }, [showNotice]);

  const saveSetting = async (key: string, next: string[]) => {
    const previous = settings;
    setSettings({ ...settings, [key]: next });
    try {
      const data = await api("/api/admin/settings", { method: "POST", body: JSON.stringify({ [key]: next }) });
      setSettings(data.data);
    } catch (err: any) {
      setSettings(previous);
      showNotice("error", err.message);
    }
  };

  const handleAddSettingItem = () => {
    const item = newSettingItem.trim();
    if (!item || !settings) return;
    const current: string[] = settings[selectedSettingKey] || [];
    if (!current.includes(item)) saveSetting(selectedSettingKey, [...current, item]);
    setNewSettingItem("");
  };

  const handleRemoveSettingItem = (item: string) => {
    const current: string[] = settings[selectedSettingKey] || [];
    saveSetting(selectedSettingKey, current.filter((i) => i !== item));
  };

  // ---------- Blocks ----------
  const [blocks, setBlocks] = useState<any[] | null>(null);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: "", type: "Notes", icon: "📚", url: "" });

  const loadBlocks = useCallback(async () => {
    setBlocksLoading(true);
    try {
      const data = await api("/api/admin/blocks?all=1");
      setBlocks(data.data);
    } catch (err: any) {
      showNotice("error", err.message);
      setBlocks([]);
    } finally {
      setBlocksLoading(false);
    }
  }, [showNotice]);

  const handleAddBlock = async () => {
    if (!newBlock.title.trim() || !newBlock.url.trim()) return showNotice("error", "Title aur URL zaroori hain.");
    try {
      const data = await api("/api/admin/blocks", { method: "POST", body: JSON.stringify(newBlock) });
      setBlocks((prev) => [data.data, ...(prev || [])]);
      setNewBlock({ title: "", type: "Notes", icon: "📚", url: "" });
      showNotice("success", "Block ban gaya.");
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleToggleBlock = async (block: any) => {
    const next = block.isVisible === false;
    try {
      const data = await api("/api/admin/blocks", { method: "PATCH", body: JSON.stringify({ id: block._id, isVisible: next }) });
      setBlocks((prev) => (prev || []).map((b) => (b._id === block._id ? data.data : b)));
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm("Is block ko delete karna hai?")) return;
    try {
      await api(`/api/admin/blocks?id=${id}`, { method: "DELETE" });
      setBlocks((prev) => (prev || []).filter((b) => b._id !== id));
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  // ---------- Content ----------
  const [posts, setPosts] = useState<any[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postTypeFilter, setPostTypeFilter] = useState("");
  const [postQuery, setPostQuery] = useState("");
  const [debouncedPostQuery, setDebouncedPostQuery] = useState("");
  const postsReq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPostQuery(postQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [postQuery]);

  const loadPosts = useCallback(async (reset: boolean, skip = 0) => {
    const reqId = ++postsReq.current;
    setPostsLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip) });
      if (debouncedPostQuery) params.set("q", debouncedPostQuery);
      if (postTypeFilter) params.set("type", postTypeFilter);
      const data = await api(`/api/admin/posts?${params.toString()}`);
      if (reqId !== postsReq.current) return;
      setPosts((prev) => (reset ? data.data : [...prev, ...data.data]));
      setPostsTotal(data.total);
    } catch (err: any) {
      if (reqId === postsReq.current) showNotice("error", err.message);
    } finally {
      if (reqId === postsReq.current) setPostsLoading(false);
    }
  }, [debouncedPostQuery, postTypeFilter, showNotice]);

  const handleDeletePost = async (post: any) => {
    if (!confirm(`"${post.title}" ko delete karna hai? Uske comments aur likes bhi hat jayenge.`)) return;
    setBusyId(post._id);
    try {
      await api(`/api/admin/posts?id=${post._id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      setPostsTotal((t) => Math.max(0, t - 1));
      setStats(null);
      showNotice("success", "Post delete ho gayi.");
    } catch (err: any) {
      showNotice("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Page guard + tab ke hisaab se data ----------
  useEffect(() => {
    if (!loading && !dbUser) router.replace("/auth");
  }, [loading, dbUser, router]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "overview" && !stats && !statsLoading && !statsError) loadStats();
    if (activeTab === "creators" && creators === null && !creatorsLoading) loadCreators();
    if (activeTab === "settings" && !settings && !settingsLoading) loadSettings();
    if (activeTab === "blocks" && blocks === null && !blocksLoading) loadBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, stats, creators, settings, blocks]);

  useEffect(() => {
    if (isAdmin && activeTab === "users") loadUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, debouncedUserQuery, roleFilter]);

  useEffect(() => {
    if (isAdmin && activeTab === "content") loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, debouncedPostQuery, postTypeFilter]);

  useEffect(() => {
    if (isAdmin && activeTab === "reports") loadReports(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, reportStatus]);

  if (loading || !dbUser) {
    return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold dark:text-white mb-2">Access Denied</h1>
        <button onClick={() => router.push("/")} className="bg-pink-500 text-white px-6 py-2 rounded-xl mt-4">Go to Home</button>
      </div>
    );
  }

  const openReportsBadge = reportsOpenCount !== null ? reportsOpenCount : (stats?.openReports ?? 0);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.users, color: "text-green-500" },
        { label: "Learners", value: stats.learners },
        { label: "Approved Educators", value: stats.approvedMasters },
        { label: "Pending Applications", value: stats.pendingMasters, color: "text-pink-500" },
        { label: "Open Reports", value: stats.openReports, color: "text-red-500" },
        { label: "Guest Accounts", value: stats.guests },
        { label: "Active Today", value: stats.activeToday, color: "text-blue-500" },
        { label: "Active (7 days)", value: stats.active7d },
        { label: "New Users (7 days)", value: stats.newUsers7d },
        { label: "Posts & Quizzes", value: stats.posts },
        { label: "Reels", value: stats.reels },
        { label: "Live Stories", value: stats.liveStories },
        { label: "Comments", value: stats.comments },
      ]
    : [];

  const inputClass = "p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white text-sm";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col md:flex-row">
      
      {/* Tabs: mobile par upar ki scroll wali bar, desktop par left sidebar */}
      <div className="bg-white dark:bg-black border-b md:border-b-0 md:border-r border-gray-200 dark:border-zinc-800 p-3 md:p-4 flex md:flex-col gap-2 shrink-0 overflow-x-auto no-scrollbar sticky top-14 md:top-0 md:h-screen z-20 md:w-64">
        <h2 className="text-xl font-bold dark:text-white mb-2 hidden md:block">Control Center</h2>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 md:p-3 rounded-xl transition whitespace-nowrap text-sm font-medium ${activeTab === tab.id ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"}`}
            >
              <Icon className="w-5 h-5" /> {tab.label}
              {tab.id === "creators" && stats?.pendingMasters > 0 && (
                <span className="ml-1 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.pendingMasters}</span>
              )}
              {tab.id === "reports" && openReportsBadge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openReportsBadge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-w-0 p-4 md:p-8 pb-20">

        {notice && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${notice.type === "error" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20" : "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20"}`}>
            {notice.text}
          </div>
        )}
        
        {/* ---------- OVERVIEW ---------- */}
        {activeTab === "overview" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Dashboard Overview</h1>
            {statsError ? (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                {statsError}
                <button onClick={loadStats} className="block mt-2 font-semibold underline">Retry</button>
              </div>
            ) : statsLoading || !stats ? (
              <Spinner />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card) => (
                  <div key={card.label} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-gray-500 text-xs mb-1">{card.label}</h3>
                    <p className={`text-3xl font-bold ${card.color || "dark:text-white"}`}>{card.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- CREATOR APPROVALS ---------- */}
        {activeTab === "creators" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Pending Approvals</h1>
            {creatorsLoading || creators === null ? <Spinner /> : creators.length === 0 ? (
              <p className="text-gray-500">No pending creators.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {creators.map((creator) => (
                  <div key={creator.firebaseUid} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg dark:text-white">{creator.name}</h3>
                      <p className="text-sm text-gray-500 break-all">{creator.email}</p>
                      <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                        Subject: {creator.masterDetails?.subject || "-"} | Handle: {creator.masterDetails?.instagramHandle || "-"} | Experience: {creator.masterDetails?.experience || "-"}
                      </p>
                      {creator.masterDetails?.bio && <p className="text-sm mt-1 text-gray-500">{creator.masterDetails.bio}</p>}
                      <p className="text-xs mt-2 text-gray-400">Applied: {fmtDate(creator.createdAt)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button disabled={busyId === creator.firebaseUid} onClick={() => handleCreatorAction(creator.firebaseUid, "approved")} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-50"><CheckCircle className="w-4 h-4" /> Approve</button>
                      <button disabled={busyId === creator.firebaseUid} onClick={() => handleCreatorAction(creator.firebaseUid, "rejected")} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-50"><XCircle className="w-4 h-4" /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- REPORTS ---------- */}
        {activeTab === "reports" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-1">Reports</h1>
            <p className="text-sm text-gray-500 mb-4">{reportsTotal} reports</p>

            <div className="flex gap-3 mb-4">
              <select value={reportStatus} onChange={(e) => setReportStatus(e.target.value)} className={inputClass}>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All</option>
              </select>
            </div>

            {reportsLoading && reports.length === 0 ? <Spinner /> : reports.length === 0 ? (
              <p className="text-gray-500">{reportStatus === "open" ? "Koi open report nahi hai. Sab theek chal raha hai! 🎉" : "Koi report nahi mili."}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {reports.map((report) => {
                  const isOpen = report.status === "open";
                  const busy = busyId === report._id;
                  const typeLabel = report.snapshot?.kind && report.snapshot.kind !== report.targetType
                    ? `${report.targetType} (${report.snapshot.kind})`
                    : report.targetType;

                  return (
                    <div key={report._id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">{REASON_LABELS[report.reason] || report.reason}</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">{typeLabel}</span>
                        {isOpen && report.openReportsOnTarget > 1 && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">{report.openReportsOnTarget} reports on this</span>
                        )}
                        {!isOpen && (
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${report.status === "resolved" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>{report.status}</span>
                        )}
                        {!report.targetExists && <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold">Already removed</span>}
                      </div>

                      {report.snapshot?.title && <p className="font-bold dark:text-white">{report.snapshot.title}</p>}
                      {report.snapshot?.text && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">{report.snapshot.text}</p>}
                      <p className="text-xs text-gray-500 mt-2">By: {report.snapshot?.ownerName || "Unknown"}</p>

                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 text-xs text-gray-500">
                        Reported by {report.reporterName || "a user"} on {fmtDate(report.createdAt)}
                        {report.details && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">&quot;{report.details}&quot;</p>}
                        {!isOpen && report.resolution && <p className="mt-1">Resolution: {report.resolution}</p>}
                      </div>

                      {isOpen && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {report.targetType !== "user" && report.targetExists && (
                            <button disabled={busy} onClick={() => handleReportAction(report, "delete_content")} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Delete content</button>
                          )}
                          {report.targetType === "user" && report.targetExists && (
                            <button onClick={() => { setUserQuery(report.snapshot?.ownerName || ""); setRoleFilter(""); setActiveTab("users"); }} className="bg-gray-800 dark:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Open in Users tab</button>
                          )}
                          <button disabled={busy} onClick={() => handleReportAction(report, "resolve")} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-50"><CheckCircle className="w-4 h-4" /> Mark resolved</button>
                          <button disabled={busy} onClick={() => handleReportAction(report, "dismiss")} className="bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">Dismiss</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {reportsLoading && reports.length > 0 && <Spinner />}

            {reports.length < reportsTotal && !reportsLoading && (
              <div className="flex justify-center mt-4">
                <button onClick={() => loadReports(false, reports.length)} className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-zinc-800 text-sm font-semibold dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700 transition">Load more</button>
              </div>
            )}
          </div>
        )}

        {/* ---------- USERS ---------- */}
        {activeTab === "users" && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-1">Manage All Users</h1>
            <p className="text-sm text-gray-500 mb-4">{usersTotal} users</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Name ya email se search..." className={`${inputClass} w-full pl-9`} />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputClass}>
                <option value="">All roles</option>
                <option value="learner">Learner</option>
                <option value="master">Master</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-sm text-gray-500">
                    <th className="p-4 font-medium">Name / Email</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">XP</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.firebaseUid === dbUser.firebaseUid;
                    return (
                      <tr key={u._id} className="border-b border-gray-100 dark:border-zinc-800/50 text-sm">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                              {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0) || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold dark:text-white">{u.name}{isSelf && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">You</span>}</div>
                              <div className="text-gray-500 text-xs break-all">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => handleUpdateRole(u.firebaseUid, e.target.value)}
                            className="bg-gray-100 dark:bg-zinc-800 border-none rounded-lg p-2 text-xs font-semibold outline-none dark:text-white disabled:opacity-50"
                          >
                            <option value="learner">Learner</option>
                            <option value="master">Master</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {u.role === "master" ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.masterStatus === "approved" ? "bg-green-100 text-green-700" : u.masterStatus === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {u.masterStatus}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4 dark:text-white">{u.xp || 0}</td>
                        <td className="p-4 text-gray-500 text-xs">{fmtDate(u.createdAt)}</td>
                        <td className="p-4">
                          <button disabled={isSelf || busyId === u._id} onClick={() => handleDeleteUser(u)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 text-xs disabled:opacity-40"><Trash2 className="w-3 h-3" /> Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {usersLoading && <Spinner />}
              {!usersLoading && users.length === 0 && <p className="p-6 text-center text-sm text-gray-500">Koi user nahi mila.</p>}
            </div>

            {users.length < usersTotal && !usersLoading && (
              <div className="flex justify-center mt-4">
                <button onClick={() => loadUsers(false, users.length)} className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-zinc-800 text-sm font-semibold dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700 transition">Load more</button>
              </div>
            )}
          </div>
        )}

        {/* ---------- SETTINGS ---------- */}
        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Manage App Settings</h1>
            {settingsLoading || !settings ? <Spinner /> : (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <select value={selectedSettingKey} onChange={(e) => setSelectedSettingKey(e.target.value)} className={inputClass}>
                    {SETTING_KEYS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
                  </select>
                  <input type="text" maxLength={40} value={newSettingItem} onChange={(e) => setNewSettingItem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddSettingItem(); }} placeholder="Add new item..." className={`${inputClass} flex-1`} />
                  <button onClick={handleAddSettingItem} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {(settings[selectedSettingKey] || []).map((item: string) => (
                    <span key={item} className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {item}
                      <button onClick={() => handleRemoveSettingItem(item)} aria-label={`Remove ${item}`} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {(settings[selectedSettingKey] || []).length === 0 && <p className="text-sm text-gray-500">Is list me abhi kuch nahi hai.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- BLOCKS ---------- */}
        {activeTab === "blocks" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Manage Content Blocks (Blogger Links)</h1>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 mb-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" maxLength={60} placeholder="Title (e.g., Physics Notes)" value={newBlock.title} onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })} className={inputClass} />
                <input type="url" placeholder="Blogger URL (https://...)" value={newBlock.url} onChange={(e) => setNewBlock({ ...newBlock, url: e.target.value })} className={inputClass} />
                <input type="text" maxLength={8} placeholder="Icon (e.g., 📚, 🎯)" value={newBlock.icon} onChange={(e) => setNewBlock({ ...newBlock, icon: e.target.value })} className={inputClass} />
                <select value={newBlock.type} onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })} className={inputClass}>
                  <option>Notes</option>
                  <option>Current Affairs</option>
                  <option>Test</option>
                </select>
              </div>
              <button onClick={handleAddBlock} className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 w-full md:w-auto self-end"><Plus className="w-4 h-4" /> Create Block</button>
            </div>

            {blocksLoading || blocks === null ? <Spinner /> : blocks.length === 0 ? (
              <p className="text-gray-500">Abhi koi block nahi hai.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blocks.map((block) => {
                  const hidden = block.isVisible === false;
                  return (
                    <div key={block._id} className={`bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 flex justify-between items-center gap-2 ${hidden ? "opacity-60" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-2xl">{block.icon}</div>
                        <div className="min-w-0">
                          <h3 className="font-bold dark:text-white truncate">{block.title} {hidden && <span className="text-[10px] bg-gray-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded ml-1">Hidden</span>}</h3>
                          <p className="text-xs text-blue-500 truncate max-w-[200px]">{block.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleBlock(block)} aria-label={hidden ? "Show block" : "Hide block"} title={hidden ? "Dikhao" : "Chhupao"} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded-lg">
                          {hidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleDeleteBlock(block._id)} aria-label="Delete block" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------- CONTENT ---------- */}
        {activeTab === "content" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-1">Manage Content</h1>
            <p className="text-sm text-gray-500 mb-4">{postsTotal} items</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input value={postQuery} onChange={(e) => setPostQuery(e.target.value)} placeholder="Title ya creator se search..." className={`${inputClass} w-full pl-9`} />
              </div>
              <select value={postTypeFilter} onChange={(e) => setPostTypeFilter(e.target.value)} className={inputClass}>
                {POST_TYPES.map((t) => <option key={t} value={t}>{t ? t.toUpperCase() : "All types"}</option>)}
              </select>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-sm text-gray-500">
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Creator</th>
                    <th className="p-4 font-medium">Likes / Views</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post._id} className="border-b border-gray-100 dark:border-zinc-800/50 text-sm">
                      <td className="p-4 font-semibold dark:text-white truncate max-w-[180px]">{post.title}</td>
                      <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">{post.type}</span></td>
                      <td className="p-4 text-gray-500">{post.creatorName}</td>
                      <td className="p-4 text-gray-500">{post.likes || 0} / {post.views || 0}</td>
                      <td className="p-4 text-gray-500 text-xs">{fmtDate(post.createdAt)}</td>
                      <td className="p-4">
                        <button disabled={busyId === post._id} onClick={() => handleDeletePost(post)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 text-xs disabled:opacity-40"><Trash2 className="w-3 h-3" /> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {postsLoading && <Spinner />}
              {!postsLoading && posts.length === 0 && <p className="p-6 text-center text-sm text-gray-500">Koi content nahi mila.</p>}
            </div>

            {posts.length < postsTotal && !postsLoading && (
              <div className="flex justify-center mt-4">
                <button onClick={() => loadPosts(false, posts.length)} className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-zinc-800 text-sm font-semibold dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700 transition">Load more</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}