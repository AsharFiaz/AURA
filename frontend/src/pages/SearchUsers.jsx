import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { UserCardSkeleton } from '../components/common/LoadingSkeleton';
import {
  Search as SearchIcon,
  ArrowLeft,
  Home as HomeIcon,
  Bell,
  User as UserIcon,
  Users,
} from 'lucide-react';

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounce
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    // Cleanup timeout on unmount or query change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      setLoading(true);
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Top Navbar */}
      <motion.nav
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
          <motion.button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>

          {/* Search Input */}
          <div className="flex-1 relative max-w-2xl">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for people in AURA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
              autoFocus
            />
          </div>

          <motion.button
            onClick={() => navigate('/')}
            className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            AURA
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Search Results or Default State */}
        {!searchQuery.trim() ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SearchIcon className="w-20 h-20 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Search for people in AURA</h2>
            <p className="text-slate-400">Find and connect with amazing people</p>
          </motion.div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <UserCardSkeleton key={index} />
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">
              No users found for '<span className="text-white">{searchQuery}</span>'
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            {searchResults.map((result, index) => (
              <motion.div
                key={result.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 cursor-pointer group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}
                onClick={() => handleViewProfile(result.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {result.username?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg mb-1 truncate">
                      {result.username}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {result.followerCount} {result.followerCount === 1 ? 'follower' : 'followers'}
                    </p>
                  </div>

                  {/* View Profile Button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfile(result.id);
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-all flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Profile
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom Nav */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-white/10 px-4 py-3 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-around max-w-7xl mx-auto">
          <motion.button
            className="text-purple-400"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
          >
            <HomeIcon className="w-6 h-6" />
          </motion.button>
          <motion.button
            className="text-purple-400"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <SearchIcon className="w-6 h-6" />
          </motion.button>
          <motion.button
            className="text-slate-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-6 h-6" />
          </motion.button>
          <motion.button
            className="text-slate-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
          >
            <UserIcon className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.nav>
    </div>
  );
};

export default SearchUsers;

