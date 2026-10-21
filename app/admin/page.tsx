"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldAlert, CheckCircle, XCircle, Loader2, 
  Settings, LayoutDashboard, Users, FileText, Box, Trash2, Plus, Edit
} from "lucide-react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "chotastartup599@gmail.com";

export default function AdminDashboard() {
  const { dbUser, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"overview" | "creators" | "users" | "settings" | "blocks" | "content">("overview");
  
  const [creators, setCreators] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const [newSettingItem, setNewSettingItem] = useState("");
  const [selectedSettingKey, setSelectedSettingKey] = useState("classes");
  const [newBlock, setNewBlock] = useState({ title: "", type: "Notes", icon: "📚", url: "" });

  const isAdmin = dbUser?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchData();
    }
  }, [dbUser, loading, isAdmin]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [creatorRes, settingsRes, blocksRes, postsRes, usersRes] = await Promise.all([
        fetch("/api/admin/creators"),
        fetch("/api/admin/settings"),
        fetch("/api/admin/blocks"),
        fetch("/api/admin/posts"),
        fetch("/api/admin/users") // Naya API call
      ]);

      const cData = await creatorRes.json();
      const sData = await settingsRes.json();
      const bData = await blocksRes.json();
      const pData = await postsRes.json();
      const uData = await usersRes.json();

      if (cData.success) setCreators(cData.data);
      if (sData.success) setSettings(sData.data);
      if (bData.success) setBlocks(bData.data);
      if (pData.success) setPosts(pData.data);
      if (uData.success) setAllUsers(uData.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleCreatorAction = async (uid: string, status: string) => {
    await fetch("/api/admin/creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebaseUid: uid, status })
    });
    setCreators(creators.filter(c => c.firebaseUid !== uid));
    fetchData(); // Refresh all users
  };

  const handleUpdateRole = async (uid: string, newRole: string) => {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid, role: newRole })
    });
    fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    setAllUsers(allUsers.filter(u => u._id !== id));
  };

  const handleUpdateSettings = async (key: string, updatedArray: string[]) => {
    const updatedSettings = { ...settings, [key]: updatedArray };
    setSettings(updatedSettings);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings)
    });
  };

  const handleAddSettingItem = () => {
    if (!newSettingItem.trim()) return;
    const currentArray = settings[selectedSettingKey] || [];
    if (!currentArray.includes(newSettingItem.trim())) {
      handleUpdateSettings(selectedSettingKey, [...currentArray, newSettingItem.trim()]);
    }
    setNewSettingItem("");
  };

  const handleRemoveSettingItem = (item: string) => {
    const currentArray = settings[selectedSettingKey] || [];
    handleUpdateSettings(selectedSettingKey, currentArray.filter((i: string) => i !== item));
  };

  const handleAddBlock = async () => {
    if (!newBlock.title || !newBlock.url) return alert("Title and URL required");
    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBlock)
    });
    const data = await res.json();
    if (data.success) {
      setBlocks([data.data, ...blocks]);
      setNewBlock({ title: "", type: "Notes", icon: "📚", url: "" });
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm("Delete this block?")) return;
    await fetch(`/api/admin/blocks?id=${id}`, { method: "DELETE" });
    setBlocks(blocks.filter(b => b._id !== id));
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
    setPosts(posts.filter(p => p._id !== id));
  };

  if (loading || !dbUser || !isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold dark:text-white mb-2">Access Denied</h1>
        <button onClick={() => router.push("/")} className="bg-pink-500 text-white px-6 py-2 rounded-xl mt-4">Go to Home</button>
      </div>
    );
  }

  if (fetching) return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col md:flex-row pt-16 md:pt-0">
      
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 p-4 flex flex-col gap-2 shrink-0 md:h-screen fixed md:relative z-10 overflow-y-auto">
        <h2 className="text-xl font-bold dark:text-white mb-4 hidden md:block">Control Center</h2>
        <button onClick={() => setActiveTab("overview")} className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === "overview" ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"}`}><LayoutDashboard className="w-5 h-5"/> Overview</button>
        <button onClick={() => setActiveTab("creators")} className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === "creators" ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"}`}><Users className="w-5 h-5"/> Approvals</button>
        <button onClick={() => setActiveTab("users")} className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === "users" ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"}`}><Users className="w-5 h-5"/> All Users</button>
        <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === "settings" ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"}`}><Settings className="w-5 h-5"/> Settings</button>
        <button onClick={() => setActiveTab("blocks")} className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === "blocks" ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"}`}><Box className="w-5 h-5"/> Blocks</button>
        <button onClick={() => setActiveTab("content")} className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === "content" ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"}`}><FileText className="w-5 h-5"/> Content</button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 pb-20">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-gray-500 text-sm">Pending Creators</h3>
                <p className="text-3xl font-bold text-pink-500">{creators.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-gray-500 text-sm">Total Posts</h3>
                <p className="text-3xl font-bold text-blue-500">{posts.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-gray-500 text-sm">Total Users</h3>
                <p className="text-3xl font-bold text-green-500">{allUsers.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* CREATORS TAB */}
        {activeTab === "creators" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Pending Approvals</h1>
            {creators.length === 0 ? <p className="text-gray-500">No pending creators.</p> : (
              <div className="flex flex-col gap-4">
                {creators.map(creator => (
                  <div key={creator._id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{creator.name}</h3>
                      <p className="text-sm text-gray-500">{creator.email}</p>
                      <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">Subject: {creator.masterDetails?.subject} | Handle: {creator.masterDetails?.instagramHandle}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCreatorAction(creator.firebaseUid, 'approved')} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Approve</button>
                      <button onClick={() => handleCreatorAction(creator.firebaseUid, 'rejected')} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"><XCircle className="w-4 h-4"/> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALL USERS TAB (NEW) */}
        {activeTab === "users" && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Manage All Users</h1>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-sm text-gray-500">
                    <th className="p-4 font-medium">Name / Email</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u._id} className="border-b border-gray-100 dark:border-zinc-800/50 text-sm">
                      <td className="p-4">
                        <div className="font-semibold dark:text-white">{u.name}</div>
                        <div className="text-gray-500 text-xs">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleUpdateRole(u.firebaseUid, e.target.value)}
                          className="bg-gray-100 dark:bg-zinc-800 border-none rounded-lg p-2 text-xs font-semibold outline-none dark:text-white"
                        >
                          <option value="learner">Learner</option>
                          <option value="master">Master</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        {u.role === "master" ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.masterStatus === 'approved' ? 'bg-green-100 text-green-700' : u.masterStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {u.masterStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 text-xs"><Trash2 className="w-3 h-3"/> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && settings && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Manage App Settings</h1>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <select value={selectedSettingKey} onChange={(e) => setSelectedSettingKey(e.target.value)} className="p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white">
                  <option value="classes">Classes</option>
                  <option value="subjects">Subjects</option>
                  <option value="exams">Exams</option>
                  <option value="streams">Streams</option>
                  <option value="hobbies">Hobbies</option>
                </select>
                <input type="text" value={newSettingItem} onChange={(e) => setNewSettingItem(e.target.value)} placeholder="Add new item..." className="flex-1 p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" />
                <button onClick={handleAddSettingItem} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"><Plus className="w-4 h-4"/> Add</button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {(settings[selectedSettingKey] || []).map((item: string) => (
                  <span key={item} className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {item}
                    <button onClick={() => handleRemoveSettingItem(item)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3"/></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BLOCKS TAB */}
        {activeTab === "blocks" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Manage Content Blocks (Blogger Links)</h1>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 mb-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Title (e.g., Physics Notes)" value={newBlock.title} onChange={e => setNewBlock({...newBlock, title: e.target.value})} className="p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" />
                <input type="text" placeholder="Blogger URL (https://...)" value={newBlock.url} onChange={e => setNewBlock({...newBlock, url: e.target.value})} className="p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" />
                <input type="text" placeholder="Icon (e.g., 📚, 🎯)" value={newBlock.icon} onChange={e => setNewBlock({...newBlock, icon: e.target.value})} className="p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" />
                <select value={newBlock.type} onChange={e => setNewBlock({...newBlock, type: e.target.value})} className="p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white">
                  <option>Notes</option>
                  <option>Current Affairs</option>
                  <option>Test</option>
                </select>
              </div>
              <button onClick={handleAddBlock} className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 w-full md:w-auto self-end"><Plus className="w-4 h-4"/> Create Block</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blocks.map(block => (
                <div key={block._id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{block.icon}</div>
                    <div>
                      <h3 className="font-bold dark:text-white">{block.title}</h3>
                      <p className="text-xs text-blue-500 truncate max-w-[200px]">{block.url}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteBlock(block._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === "content" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">Manage Content</h1>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-sm text-gray-500">
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Creator</th>
                    <th className="p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post._id} className="border-b border-gray-100 dark:border-zinc-800/50 text-sm">
                      <td className="p-4 font-semibold dark:text-white truncate max-w-[150px]">{post.title}</td>
                      <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">{post.type}</span></td>
                      <td className="p-4 text-gray-500">{post.creatorName}</td>
                      <td className="p-4">
                        <button onClick={() => handleDeletePost(post._id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"><Trash2 className="w-4 h-4"/> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}