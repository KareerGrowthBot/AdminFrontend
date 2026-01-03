import React, { useEffect } from "react";
import { X } from "lucide-react";

const SnackbarAlert = ({ open, message, severity = "success", onClose }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
  }[severity];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] max-w-md`}>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="hover:bg-black/20 rounded p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default SnackbarAlert;

