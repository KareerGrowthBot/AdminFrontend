import React, { useState, useEffect } from "react";
import { Home, RotateCcw, RefreshCw, AlertTriangle, Cloud, Sun, FileQuestion } from "lucide-react";
import { motion } from "framer-motion";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return <ErrorView onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

const ErrorView = ({ onReset }) => {
  return (
    <div className="min-h-screen w-full bg-[#FFFBF5] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Abstract Background Shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -right-20 w-96 h-96 border-2 border-orange-200 rounded-full border-dashed opacity-40"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        className="absolute top-40 -left-20 w-64 h-64 border-2 border-blue-200 rounded-full border-dashed opacity-40"
      />

      {/* Random floating elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-1/4 text-orange-300"
      >
        <Sun size={48} />
      </motion.div>
      <motion.div
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-20 text-blue-200 opacity-50"
      >
        <Cloud size={64} />
      </motion.div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">

        {/* Animated Illustration Container */}
        <div className="relative h-80 w-full flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative"
          >
            {/* Main Pile of "Broken" UI Elements */}
            <div className="relative">
              {/* 1. Tilted Square */}
              <motion.div
                initial={{ rotate: -10, y: -50 }}
                animate={{ rotate: -5, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2
                }}
                className="w-32 h-32 bg-white border-4 border-slate-800 rounded-xl absolute -top-16 -left-12 rotate-[-10deg] z-10 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex items-center justify-center"
              >
                <FileQuestion size={40} className="text-slate-800" />
              </motion.div>

              {/* 2. Orange Circle */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 bg-[#FF6B6B] rounded-full border-4 border-slate-800 absolute -top-8 right-0 z-0 flex items-center justify-center"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full" />
              </motion.div>

              {/* 3. Main Character/Blob */}
              <motion.div
                className="w-48 h-32 bg-white border-4 border-slate-800 rounded-[40px] relative z-20 flex items-center justify-center gap-4 shadow-[12px_12px_0px_rgba(0,0,0,1)]"
              >
                {/* Eyes */}
                <motion.div
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1], delay: 1 }}
                  className="w-8 h-8 bg-slate-800 rounded-full relative"
                >
                  <div className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full" />
                </motion.div>
                <motion.div
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1], delay: 1.1 }}
                  className="w-8 h-8 bg-slate-800 rounded-full relative"
                >
                  <div className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full" />
                </motion.div>

                {/* Mouth */}
                <div className="absolute bottom-6 w-8 h-4 border-t-4 border-slate-800 rounded-full" />
              </motion.div>

              {/* 4. Triangle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-10 -right-8"
              >
                <AlertTriangle size={60} className="text-amber-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" fill="currentColor" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-black text-slate-800 mb-6 tracking-tight leading-tight"
          >
            Oops, <br />
            <span className="text-orange-500">Wrong Turn...</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-600 mb-10 font-medium leading-relaxed max-w-md"
          >
            Looks like you've wandered off the beaten path. Our team is working to get you back on track.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-[#FF6B6B] border-2 border-slate-900 text-white font-bold rounded-xl shadow-[4px_4px_0px_rgba(15,23,42,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(15,23,42,1)] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
            >
              <RefreshCw size={20} />
              <span>Retry Page</span>
            </button>

            <button
              onClick={onReset}
              className="px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-xl shadow-[4px_4px_0px_rgba(15,23,42,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(15,23,42,1)] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
            >
              <Home size={20} />
              <span>Back to Home</span>
            </button>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default ErrorBoundary;
