import React, { useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

const Sidebar = ({ isOpen, onClose, isMinimized, onToggleMinimize, menuItems, email, role }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative h-screen bg-gradient-to-b from-navy-900 via-navy-800 to-navy-700 text-white shadow-lg transform transition-all duration-300 ease-in-out z-30 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } md:translate-x-0 ${isMinimized ? "w-[72px] md:w-[72px]" : "w-64 md:w-64"
          } relative overflow-visible`}
      >
        <div className={`${isMinimized ? "p-2" : "p-6"} flex flex-col h-full overflow-hidden`}>
          {/* Logo */}
          <div className="mb-8">
            {!isMinimized ? (
              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="KareerGrowth Logo" className="h-auto max-w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <img src="/KG-logo.png" alt="KG Logo" className="h-auto max-w-full" />
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.submenu) {
                      if (isMinimized) {
                        onToggleMinimize();
                      }
                      toggleExpand(item.id);
                    } else if (item.onClick) {
                      item.onClick();
                    }
                  }}
                  className={`w-full flex items-center ${isMinimized ? "justify-center" : "justify-between"
                    } px-4 py-3 rounded-lg hover:bg-navy-600 hover:border-l-4 hover:border-gold-500 transition-all text-gray-200 hover:text-gold-400 group`}
                  title={isMinimized ? item.label : ""}
                >
                  <span className={`flex items-center ${isMinimized ? "gap-0" : "gap-3"}`}>
                    <item.icon
                      size={20}
                      className="flex-shrink-0 group-hover:scale-110 transition-transform"
                    />
                    {!isMinimized && (
                      <span className="font-bold">{item.label}</span>
                    )}
                  </span>
                  {!isMinimized && item.submenu && (
                    <span>
                      {expandedItems[item.id] ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  )}
                </button>

                {/* Submenu - Only show when not minimized */}
                {!isMinimized && item.submenu && expandedItems[item.id] && (
                  <div className="pl-4 space-y-1">
                    {item.submenu.map((subitem) => (
                      <button
                        key={subitem.id}
                        onClick={() => subitem.onClick && subitem.onClick()}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-navy-600 transition-colors text-gray-300 hover:text-gold-400 text-bold"
                      >
                        {subitem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Collapse Button - Centered on Desktop, Overlapping Edge */}
        <button
          onClick={onToggleMinimize}
          className="hidden md:flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-10 h-10 rounded-full bg-navy-700 hover:bg-navy-600 border-2 border-gold-500 transition-colors shadow-lg z-[9999]"
          title={isMinimized ? "Expand" : "Collapse"}
          style={{ zIndex: 9999 }}
        >
          {isMinimized ? (
            <ChevronRight size={24} className="text-gold-500" />
          ) : (
            <ChevronLeft size={24} className="text-gold-500" />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;

