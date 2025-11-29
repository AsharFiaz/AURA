// Memory Card Skeleton - For feed loading
export const MemoryCardSkeleton = () => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 animate-pulse">
      {/* User Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-700 to-slate-600"></div>
        <div className="flex-1">
          <div className="h-4 w-24 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-2"></div>
          <div className="h-3 w-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
        </div>
      </div>

      {/* Caption */}
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
        <div className="h-4 w-3/4 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
      </div>

      {/* Emotion Tags */}
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full"></div>
        <div className="h-6 w-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full"></div>
        <div className="h-6 w-24 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full"></div>
      </div>

      {/* Image Placeholder */}
      <div className="w-full h-64 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg mb-3"></div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-white/10">
        <div className="h-5 w-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
        <div className="h-5 w-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
        <div className="h-5 w-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
      </div>
    </div>
  );
};

// User Card Skeleton - For user lists
export const UserCardSkeleton = () => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-slate-700 to-slate-600"></div>
        
        {/* User Info */}
        <div className="flex-1">
          <div className="h-4 w-32 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-2"></div>
          <div className="h-3 w-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
        </div>

        {/* Button */}
        <div className="h-8 w-24 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg"></div>
      </div>
    </div>
  );
};

// Profile Skeleton - For profile page loading
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-slate-700 to-slate-600"></div>
          
          {/* User Info */}
          <div className="flex-1 w-full text-center md:text-left">
            <div className="h-8 w-48 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-3 mx-auto md:mx-0"></div>
            <div className="h-4 w-64 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-4 mx-auto md:mx-0"></div>
            
            {/* Stats */}
            <div className="flex gap-6 justify-center md:justify-start">
              <div className="text-center">
                <div className="h-6 w-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-1"></div>
                <div className="h-4 w-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
              </div>
              <div className="text-center">
                <div className="h-6 w-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-1"></div>
                <div className="h-4 w-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
              </div>
              <div className="text-center">
                <div className="h-6 w-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-1"></div>
                <div className="h-4 w-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <div className="h-12 w-32 bg-gradient-to-r from-slate-700 to-slate-600 rounded-t-lg"></div>
        <div className="h-12 w-32 bg-gradient-to-r from-slate-700 to-slate-600 rounded-t-lg"></div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4"
          >
            <div className="h-4 w-full bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gradient-to-r from-slate-700 to-slate-600 rounded mb-3"></div>
            <div className="flex gap-2 mb-2">
              <div className="h-5 w-16 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full"></div>
              <div className="h-5 w-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full"></div>
            </div>
            <div className="h-4 w-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

