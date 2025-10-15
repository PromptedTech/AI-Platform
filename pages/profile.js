import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';
import { getUserCredits } from '../lib/credits';
import { motion } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, Coins, Edit3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function Profile() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [totalChats, setTotalChats] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [credits, setCredits] = useState(null);
  const [usageSeries, setUsageSeries] = useState([]);
  
  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push('/');
        return;
      }
      
      setUser(currentUser);
      
      // Fetch or create profile
      try {
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setDisplayName(data.displayName || currentUser.email);
          setBio(data.bio || '');
          setProfilePic(data.profilePic || '');
        } else {
          // Create default profile
          const defaultProfile = {
            displayName: currentUser.email,
            bio: '',
            profilePic: '',
            credits: 50,
            createdAt: new Date().toISOString(),
          };
          await setDoc(profileRef, defaultProfile);
          setDisplayName(defaultProfile.displayName);
          setBio(defaultProfile.bio);
          setProfilePic(defaultProfile.profilePic);
        }
        // Load stats and credits
        await loadStats(currentUser.uid);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage('Error loading profile. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadStats = async (uid) => {
    try {
      const balance = await getUserCredits(uid);
      setCredits(balance);

      // Build last 30-day buckets
      const days = 30;
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - (days - 1));
      const startISO = start.toISOString();

      const kf = (d) => {
        const dt = new Date(d);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const disp = (k) => {
        const [y, m, d] = k.split('-');
        return `${m}/${d}`;
      };

      const keys = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        keys.push(kf(d));
      }
      const chatMap = Object.fromEntries(keys.map((k) => [k, 0]));
      const imgMap = Object.fromEntries(keys.map((k) => [k, 0]));

      // Fetch chats
      const chatsQ = query(collection(db, 'chats'), where('userId', '==', uid));
      const chatsSnap = await getDocs(chatsQ);
      let chatTotal = 0;
      chatsSnap.forEach((d) => {
        const t = d.data()?.timestamp;
        if (t) {
          chatTotal += 1;
          if (t >= startISO) {
            const key = kf(t);
            if (key in chatMap) chatMap[key] += 1;
          }
        }
      });

      // Fetch images
      const imagesQ = query(collection(db, 'images'), where('userId', '==', uid));
      const imagesSnap = await getDocs(imagesQ);
      let imgTotal = 0;
      imagesSnap.forEach((d) => {
        const t = d.data()?.timestamp;
        if (t) {
          imgTotal += 1;
          if (t >= startISO) {
            const key = kf(t);
            if (key in imgMap) imgMap[key] += 1;
          }
        }
      });

      setTotalChats(chatTotal);
      setTotalImages(imgTotal);
      setUsageSeries(keys.map((k) => ({ date: disp(k), chats: chatMap[k], images: imgMap[k] })));
    } catch (e) {
      console.error('loadStats error:', e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        displayName: displayName.trim() || user.email,
        bio: bio.trim(),
        profilePic: profilePic.trim(),
        updatedAt: new Date().toISOString(),
      });
      
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Chats</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{totalChats}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Images</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{totalImages}</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Remaining Credits</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{credits ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage (Last 30 days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageSeries} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip cursor={{ stroke: '#9CA3AF', strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="chats" stroke="#2563eb" fill="url(#colorChats)" name="Chats" />
                <Area type="monotone" dataKey="images" stroke="#9333ea" fill="url(#colorImages)" name="Images" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowEdit((v) => !v)} className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> {showEdit ? 'Close Edit' : 'Edit Profile'}
            </motion.button>
          </div>
          {showEdit && (
            <form onSubmit={handleSave} className="space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Picture URL
              </label>
              <input
                type="url"
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {profilePic && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={profilePic}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=Avatar';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('successfully') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
            </form>
          )}
        </div>

        {/* Profile Info Card */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{user?.uid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Account created:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

