import toast from "react-hot-toast";

// Success toast with purple gradient theme
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "bottom-right",
    style: {
      background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
      color: "#ffffff",
      borderRadius: "12px",
      padding: "12px 16px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#7c3aed",
    },
  });
};

// Error toast with red theme
export const showError = (message) => {
  toast.error(message, {
    duration: 3000,
    position: "bottom-right",
    style: {
      background: "#1f2937",
      color: "#f87171",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: "12px",
      padding: "12px 16px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
    },
    iconTheme: {
      primary: "#f87171",
      secondary: "#1f2937",
    },
  });
};

// Info toast with blue theme
export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    position: "bottom-right",
    icon: "ℹ️",
    style: {
      background: "#1f2937",
      color: "#60a5fa",
      border: "1px solid rgba(96, 165, 250, 0.3)",
      borderRadius: "12px",
      padding: "12px 16px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(96, 165, 250, 0.2)",
    },
  });
};

// Warning toast with yellow theme
export const showWarning = (message) => {
  toast(message, {
    duration: 3000,
    position: "bottom-right",
    icon: "⚠️",
    style: {
      background: "#1f2937",
      color: "#fbbf24",
      border: "1px solid rgba(251, 191, 36, 0.3)",
      borderRadius: "12px",
      padding: "12px 16px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(251, 191, 36, 0.2)",
    },
  });
};

