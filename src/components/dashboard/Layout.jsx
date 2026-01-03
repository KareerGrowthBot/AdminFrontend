import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, ChevronLeft, ChevronRight, Menu, Bell, Lock } from "lucide-react";
import { useSubscription } from "../../providers/SubscriptionProvider";

const Layout = ({ children, email, role, onLogout, menuItems = [] }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const location = useLocation();
    const navigate = useNavigate();

    // Subscription Logic
    const { isSubscriptionActive, creditsData, loading: creditsLoading } = useSubscription();

    const getAlertContent = () => {
        if (creditsLoading) return null;

        const remainingInterviewCredits = creditsData?.remainingInterviewCredits;
        const validTillDate = creditsData?.validTill;
        let daysRemainingUntilExpiry = null;

        if (validTillDate) {
            const expiryDate = new Date(validTillDate);
            const today = new Date();
            expiryDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const timeDiff = expiryDate.getTime() - today.getTime();
            daysRemainingUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }

        const isSubscriptionExpired = daysRemainingUntilExpiry !== null && daysRemainingUntilExpiry < 0;
        const areCreditsExhausted = remainingInterviewCredits !== undefined && remainingInterviewCredits <= 0;

        const showExpiredAlert = isSubscriptionExpired || areCreditsExhausted || !isSubscriptionActive;

        const showWarningAlert = !showExpiredAlert && (
            (remainingInterviewCredits !== undefined && remainingInterviewCredits <= 40) ||
            (daysRemainingUntilExpiry !== null && daysRemainingUntilExpiry <= 10)
        );

        if (showExpiredAlert) {
            return (
                <div
                    className="bg-red-50 border-b border-red-200 py-2 overflow-hidden cursor-pointer"
                    onClick={() => navigate('/dashboard/payment')}
                    role="alert"
                >
                    <div className="text-red-600 font-medium text-center animate-pulse">
                        ⚠️ Your Subscription is not Active or Credits Exhausted. Please click to renew! ⚠️
                    </div>
                </div>
            );
        }

        if (showWarningAlert) {
            return (
                <div
                    className="bg-yellow-50 border-b border-yellow-200 py-2 overflow-hidden cursor-pointer"
                    onClick={() => navigate('/dashboard/payment')}
                    role="alert"
                >
                    <div className="text-yellow-700 font-medium text-center">
                        ⚠️ Your Subscription is expiring soon or credits are low. Click to upgrade! ⚠️
                    </div>
                </div>
            );
        }

        return null;
    };

    const toggleExpand = (id) => {
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const isActive = (path) => {
        const currentPath = location.pathname;
        if (path === "/dashboard") {
            return currentPath === "/dashboard" || currentPath === "/";
        }
        return currentPath === path || currentPath.startsWith(path + "/");
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 transition-colors duration-300">
            {/* Top Header - Sticky */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-16 flex-none flex items-center justify-between px-6 shadow-sm text-slate-900">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
                        <img src="/KG-logo.png" alt="KG" className="h-5 w-5 brightness-0 invert" />
                    </div>
                    <div>
                        <span className="text-slate-900 font-bold text-sm tracking-tight leading-none block">KareerGrowth</span>
                        <span className="text-blue-500 text-[9px] font-bold uppercase tracking-widest mt-0.5 block">Admin Portal</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 relative group">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
                    </button>
                    <div className="h-8 w-[1px] bg-slate-100"></div>
                    <div className="relative">
                        <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-3 p-1 pr-2 hover:bg-slate-50 rounded-xl transition-all">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                                {email?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-[11px] font-bold text-slate-900 leading-none mb-1">{email?.split('@')[0] || "Admin"}</p>
                                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider leading-none">Super User</p>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isProfileDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="p-3 bg-slate-50 rounded-lg mb-1.5">
                                        <p className="text-xs font-bold text-slate-900 truncate mb-0.5">{email}</p>
                                        <p className="text-[10px] font-medium text-slate-500 truncate lowercase">{typeof role === 'object' ? role.name : role}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all text-xs font-semibold">
                                            <Lock size={14} /> Security Settings
                                        </button>
                                        <div className="h-[1px] bg-slate-100 my-1 mx-2"></div>
                                        <button onClick={() => { setIsProfileDropdownOpen(false); onLogout(); }} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs font-bold">
                                            <LogOut size={14} /> Log Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Layout Container - Flex Row for Sidebar and Content */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar */}
                <aside
                    className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-40 relative
                        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
                    `}
                >
                    <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const hasSubmenu = item.submenu && item.submenu.length > 0;
                            const isExpanded = expandedItems[item.id];
                            const path = item.id === 'dashboard' ? '/dashboard' : `/dashboard/${item.id}`;

                            // Check if any subitem is active
                            const isSubitemActive = hasSubmenu && item.submenu.some(sub => {
                                const subPath = sub.id === 'dashboard' ? '/dashboard' : `/dashboard/${sub.id}`;
                                return isActive(subPath);
                            });

                            const active = isActive(path) || isSubitemActive;

                            return (
                                <div key={item.id} className="space-y-1">
                                    {hasSubmenu ? (
                                        <button
                                            onClick={() => {
                                                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                                                toggleExpand(item.id);
                                            }}
                                            className={`w-full flex items-center rounded-lg transition-all duration-300 group py-3 px-4 relative ${active ? "bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600" : "text-black hover:bg-slate-50 hover:text-black"
                                                }`}
                                        >
                                            <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                                            {!isSidebarCollapsed && (
                                                <>
                                                    <span className="ml-3 text-sm whitespace-nowrap font-medium flex-1 text-left">{item.label}</span>
                                                    <ChevronDown size={12} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <Link
                                            to={path}
                                            onClick={() => { if (item.onClick) item.onClick(); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                                            className={`flex items-center rounded-lg transition-all duration-300 group py-3 px-4 relative ${active ? "bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600" : "text-black hover:bg-slate-50 hover:text-black"
                                                }`}
                                        >
                                            <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                                            {!isSidebarCollapsed && <span className="ml-3 text-sm whitespace-nowrap font-medium">{item.label}</span>}
                                        </Link>
                                    )}

                                    {/* Submenu Items */}
                                    {hasSubmenu && isExpanded && !isSidebarCollapsed && (
                                        <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                                            {item.submenu.map((subitem) => {
                                                const subPath = subitem.id === 'dashboard' ? '/dashboard' : `/dashboard/${subitem.id}`;
                                                const subActive = isActive(subPath);
                                                return (
                                                    <Link
                                                        key={subitem.id}
                                                        to={subPath}
                                                        onClick={() => { if (subitem.onClick) subitem.onClick(); if (window.innerWidth < 768) setIsSidebarCollapsed(true); }}
                                                        className={`flex items-center py-2 px-3 rounded-md text-xs font-medium transition-all ${subActive ? "text-blue-600 bg-blue-50/50" : "text-gray-600 hover:text-black hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        {subitem.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Sidebar Toggle Button - Absolute Positioned relative to Sidebar */}
                    <button
                        onClick={toggleSidebar}
                        className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-50 flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-slate-600 transition-all hover:scale-110"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                    {/* Alert Bar */}
                    {getAlertContent()}

                    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="max-w-[1600px] mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
