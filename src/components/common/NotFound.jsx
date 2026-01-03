import React from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Ghost } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />

      {/* Particle Overlay (CSS only) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
          {/* Subtle Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[40px] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

          <div className="relative flex flex-col items-center text-center">
            {/* Animated 404 Visual */}
            <div className="relative mb-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2, type: "spring" }}
                className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 select-none">
                  404
                </span>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-4 -right-8 w-20 h-20 bg-blue-500/20 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl"
              >
                <Ghost className="w-10 h-10 text-blue-400" />
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight"
            >
              Lost in Transition
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-slate-400 text-base md:text-lg font-medium max-w-md mb-12 leading-relaxed"
            >
              The requested resource could not be located within the current navigation registry. It may have been redirected or archived.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                className="py-4 px-8 bg-blue-600 text-white font-bold rounded-2xl transition-all hover:bg-blue-500 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 group"
              >
                <Home size={20} className="group-hover:rotate-12 transition-transform" />
                <span>Return Home</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(-1)}
                className="py-4 px-8 bg-white/5 text-white font-bold rounded-2xl border border-white/10 transition-all hover:bg-white/10 flex items-center justify-center gap-3 group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Go Back</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            <span>System Status: Optimal</span>
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span>Node: KG-ADMIN-01</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;

