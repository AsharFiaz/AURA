import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const CommentModal = memo(
  ({ isOpen, memory, onClose, onCommentAdded, formatTime }) => {
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async () => {
      if (!commentText.trim() || !memory) return;

      setSubmittingComment(true);
      try {
        const response = await api.post(`/memories/${memory._id}/comment`, {
          text: commentText.trim(),
        });

        if (response.data.success) {
          setCommentText("");
          onCommentAdded(response.data.memory);
        }
      } catch (error) {
        console.error("Error submitting comment:", error);
      } finally {
        setSubmittingComment(false);
      }
    };

    const handleClose = () => {
      setCommentText("");
      onClose();
    };

    if (!isOpen || !memory) return null;

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Memory Caption */}
            <div className="mb-4">
              <h3 className="text-white font-bold mb-2">
                {memory.user?.username || "Unknown"}
              </h3>
              <p className="text-slate-300 text-sm">{memory.caption}</p>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[300px] pr-2">
              {memory.comments && memory.comments.length > 0 ? (
                memory.comments.map((comment, idx) => (
                  <motion.div
                    key={idx}
                    className="flex gap-3 p-3 bg-white/5 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <motion.p
                        onClick={(e) => {
                          e.stopPropagation();
                          const commentUserId =
                            comment.user?._id || comment.user?.id;
                          if (commentUserId) {
                            handleClose();
                            navigate(`/user/${commentUserId}`);
                          }
                        }}
                        className="text-white font-medium text-sm cursor-pointer hover:text-purple-400 transition-colors"
                        whileHover={{ scale: 1.02 }}
                      >
                        {comment.user?.username || "Unknown"}
                      </motion.p>
                      <p className="text-slate-300 text-sm">{comment.text}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {formatTime(comment.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8 text-sm">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-white/10 pt-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none mb-3"
                rows={3}
              />
              <div className="flex gap-3">
                <motion.button
                  onClick={handleClose}
                  className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={!commentText.trim() || submittingComment}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={
                    !submittingComment && commentText.trim()
                      ? { scale: 1.02 }
                      : {}
                  }
                  whileTap={
                    !submittingComment && commentText.trim()
                      ? { scale: 0.98 }
                      : {}
                  }
                >
                  {submittingComment ? "Posting..." : "Post"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

CommentModal.displayName = "CommentModal";

export default CommentModal;
