import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { BlogCard } from './components/BlogCard';
import { PollsSidebar } from './components/PollsSidebar';
import { PollDetailModal } from './components/PollDetailModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CreatePollModal } from './components/CreatePollModal';
import { LoginPage } from './components/LoginPage';
import { ProfileModal } from './components/ProfileModal';
import { ManageClientsModal } from './components/ManageClientsModal';
import { MembershipModal } from './components/MembershipModal';
import { Footer } from './components/Footer';
import { 
  Sparkles, 
  Search, 
  Film, 
  BarChart2, 
  Layers, 
  PlusCircle, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export function App() {
  const { user, isAdmin, isClient, token } = useAuth();

  // Navigation views: 'home' | 'feed' | 'login'
  const [currentView, setCurrentView] = useState('home');
  const [posts, setPosts] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'video', 'poll'

  // Modals state
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isManageClientsModalOpen, setIsManageClientsModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [pendingClientsCount, setPendingClientsCount] = useState(0);
  const [activePollModal, setActivePollModal] = useState(null);
  const [notification, setNotification] = useState('');

  // Fetch posts and polls
  const fetchData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const postsUrl = token ? '/api/posts' : '/api/posts?featured=true';
      
      const [postsRes, pollsRes] = await Promise.all([
        fetch(postsUrl, { headers }),
        fetch('/api/polls', { headers })
      ]);

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      } else if (postsRes.status === 402) {
        setPosts([]);
        if (currentView === 'feed') {
          setIsMembershipModalOpen(true);
        }
      }

      if (pollsRes.ok) {
        const pollsData = await pollsRes.json();
        setPolls(pollsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check pending client registrations for Admin
  const checkPendingClients = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await fetch('/api/admin/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const pending = data.filter((c) => (c.membership_status || 'unpaid') === 'pending').length;
        setPendingClientsCount(pending);
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
    if (isAdmin && token) {
      checkPendingClients();
    }
  }, [token, isAdmin]);

  // Protect feed view: only logged-in users with active membership can access the feed
  useEffect(() => {
    if (currentView === 'feed') {
      if (!user) {
        setCurrentView('home');
      } else if (!isAdmin && user.membership_status !== 'active') {
        setIsMembershipModalOpen(true);
      }
    }
  }, [user, currentView, isAdmin]);

  // Protected navigation handler to feed
  const handleNavigateToFeed = () => {
    if (!user) {
      showToast('Members Only: Please sign in to access the single scroll research feed.');
      setCurrentView('login');
    } else if (!isAdmin && user.membership_status !== 'active') {
      setIsMembershipModalOpen(true);
      showToast('₹149 Monthly Membership required to view the single scroll feed.');
    } else {
      setCurrentView('feed');
    }
  };

  // Toast feedback
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Toggle Featured status for Home Page spotlight (Admin only)
  const handleToggleFeatured = async (postId) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${postId}/toggle-featured`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => p.id === postId ? updated : p));
        showToast(
          updated.is_featured 
            ? 'Pinned to Home Page spotlight' 
            : 'Removed from Home Page spotlight'
        );
      }
    } catch (err) {
      console.error('Toggle featured error:', err);
    }
  };

  // Callback when new post created
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    if (newPost.poll) {
      setPolls((prev) => [newPost.poll, ...prev]);
    }
    showToast('New blog post with media published!');
  };

  // Callback when standalone poll created
  const handlePollCreated = (newPoll) => {
    setPolls((prev) => [newPoll, ...prev]);
    showToast('New community poll created!');
  };

  // Callback when post deleted
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setPolls((prev) => prev.filter((pl) => pl.post_id !== postId));
        showToast('Blog post deleted.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Synchronize vote updates across sidebar, modal, and blog cards
  const handleVoteSuccess = (updatedPoll) => {
    setActivePollModal(updatedPoll);
    setPolls((prev) =>
      prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p))
    );
    setPosts((prev) =>
      prev.map((post) => {
        if (post.poll && post.poll.id === updatedPoll.id) {
          return { ...post, poll: updatedPoll };
        }
        return post;
      })
    );
    showToast('Your vote has been counted!');
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'video') return post.media_type === 'video' || post.media_type === 'mixed';
    if (activeFilter === 'poll') return Boolean(post.poll);
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Constant Top Navbar (Header) */}
      <Navbar
        currentView={currentView}
        onNavigateToHome={() => setCurrentView('home')}
        onNavigateToFeed={handleNavigateToFeed}
        onNavigateToLogin={() => setCurrentView('login')}
        onOpenCreatePost={() => setIsCreatePostModalOpen(true)}
        onOpenManageClients={() => setIsManageClientsModalOpen(true)}
        onOpenMembership={() => setIsMembershipModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        pendingClientsCount={pendingClientsCount}
      />

      {/* Main Page View Container */}
      <div className="flex-1 flex flex-col">
        {currentView === 'login' ? (
          <LoginPage
            onNavigateToFeed={() => setCurrentView('feed')}
            onNavigateToHome={() => setCurrentView('home')}
          />
        ) : currentView === 'home' ? (
          <HomePage
            posts={posts}
            polls={polls}
            onNavigateToFeed={handleNavigateToFeed}
            onNavigateToLogin={() => setCurrentView('login')}
            onOpenPollModal={(poll) => setActivePollModal(poll)}
            onToggleFeatured={handleToggleFeatured}
            onOpenManageClients={() => setIsManageClientsModalOpen(true)}
          />
        ) : (
          /* SINGLE SCROLL FEED VIEW */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-24 w-full flex-1">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Left Column: List of Polls Sidebar */}
              <PollsSidebar
                polls={polls}
                onSelectPoll={(poll) => setActivePollModal(poll)}
                onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                onOpenManageClients={() => setIsManageClientsModalOpen(true)}
              />

              {/* Right Column: Single Continuous Vertical Scroll Feed */}
              <main className="flex-1 w-full space-y-6">
                
                {/* Search & Filter Toolbar */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search single scroll feed..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>

                  {/* Feed Filters */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Blogs ({posts.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('video')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeFilter === 'video'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>With Videos</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('poll')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeFilter === 'poll'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>With Polls</span>
                    </button>
                  </div>
                </div>

                {/* Single Scroll Feed */}
                {loading ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-12">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-600">Loading blog feed...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No blog posts found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                      {searchQuery
                        ? 'Try adjusting your search query or clear the filter.'
                        : 'No stories have been posted yet.'}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => setIsCreatePostModalOpen(true)}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Create the First Blog Post</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {filteredPosts.map((post) => (
                      <BlogCard
                        key={post.id}
                        post={post}
                        onDeletePost={handleDeletePost}
                        onOpenPollModal={(poll) => setActivePollModal(poll)}
                        onToggleFeatured={handleToggleFeatured}
                      />
                    ))}
                  </div>
                )}

              </main>

            </div>
          </div>
        )}
      </div>

      {/* Constant Footer visible in every page */}
      <Footer
        onNavigateToHome={() => setCurrentView('home')}
        onNavigateToFeed={handleNavigateToFeed}
        onNavigateToLogin={() => setCurrentView('login')}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Pop-up Modal for Polls with full description & options */}
      <PollDetailModal
        poll={activePollModal}
        isOpen={Boolean(activePollModal)}
        onClose={() => setActivePollModal(null)}
        onVoteSuccess={handleVoteSuccess}
      />

      {/* Admin Post Creation Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Admin Standalone Poll Creation Modal */}
      <CreatePollModal
        isOpen={isCreatePollModalOpen}
        onClose={() => setIsCreatePollModalOpen(false)}
        onPollCreated={handlePollCreated}
      />

      {/* User Profile & DP Upload Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Admin Client Management Modal */}
      <ManageClientsModal
        isOpen={isManageClientsModalOpen}
        onClose={() => setIsManageClientsModalOpen(false)}
        onClientDeleted={() => {
          fetchData();
          checkPendingClients();
          showToast('Client account permanently deleted.');
        }}
        onClientUpdated={() => {
          fetchData();
          checkPendingClients();
        }}
      />

      {/* Client ₹149 Monthly Membership & UPI Payment Modal */}
      <MembershipModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
        onSuccess={() => {
          fetchData();
          showToast('Payment submitted! Awaiting administrator verification.');
        }}
      />

    </div>
  );
}

export default App;
