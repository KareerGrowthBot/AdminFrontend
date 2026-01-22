import React, { useEffect, useState, useRef } from 'react';
import {
    ArrowUpRight, TrendingUp, Users, CheckCircle, Clock, XCircle, AlertCircle,
    UserCheck, UserX, Wifi, WifiOff, FileText, PlayCircle, PauseCircle, Briefcase, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatExpiryDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    let suffix;
    if (day > 3 && day < 21) suffix = 'th';
    else if (day % 10 === 1) suffix = 'st';
    else if (day % 10 === 2) suffix = 'nd';
    else if (day % 10 === 3) suffix = 'rd';
    else suffix = 'th';
    return {
        day: day.toString(),
        suffix: suffix,
        month: month,
        year: year.toString(),
    };
};

// Helper function to calculate days remaining until expiry
const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const expiryDate = new Date(dateString);
    const today = new Date();
    // Ensure we're comparing dates without time components for accuracy
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (isNaN(expiryDate.getTime())) return null;

    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
};

const statsKeyToDisplayLabelMap = {
    "RECOMMENDED": "Recommended",
    "PENDING": "Pending",
    "INVITED": "Invited",
    "REINVITED": "Re Invited",
    "UNATTENDED": "Unattended",
    "CANCELED": "Cancelled",
    "IN_PROGRESS": "In Progress",
    "RESUME_REJECTED": "Rejected",
    "CAUTIOUSLY_RECOMMENDED": "Cautiously Recommended",
    "UNATTACHED": "Unattached",
    "NETWORK_DISCONNECTED": "Network Disconnected",
    "NOT_RECOMMENDED": "Not Recommended",
    "TEST_COMPLETED": "Test Completed",
    "TEST_STARTED": "Test Started",
    "MANUALLY_INVITED": "Manually Invited",
};

const statsDisplayOrder = [
    "Invited",
    "Manually Invited",
    "Rejected",
    "Recommended",
    "Not Recommended",
    "Cautiously Recommended",
    "Test Completed",
    "Test Started",
];

// Color scheme for different status types
const statusColors = {
    "Recommended": { primary: "#10B981", secondary: "#ECFDF5", icon: CheckCircle }, // Green
    "Pending": { primary: "#F59E0B", secondary: "#FEF3C7", icon: Clock },
    "Invited": { primary: "#8B5CF6", secondary: "#F5F3FF", icon: Users }, // Purple
    "Re Invited": { primary: "#A78BFA", secondary: "#F5F3FF", icon: UserCheck },
    "Unattended": { primary: "#EF4444", secondary: "#FEF2F2", icon: UserX },
    "Cancelled": { primary: "#6B7280", secondary: "#F3F4F6", icon: XCircle },
    "In Progress": { primary: "#06B6D4", secondary: "#CFFAFE", icon: PlayCircle },
    "Rejected": { primary: "#EF4444", secondary: "#FEF2F2", icon: FileText }, // Red
    "Cautiously Recommended": { primary: "#FDE047", secondary: "#FEFCE8", icon: AlertCircle }, // Light Yellow
    "Unattached": { primary: "#8B5CF6", secondary: "#F5F3FF", icon: UserX },
    "Network Disconnected": { primary: "#EF4444", secondary: "#FEF2F2", icon: WifiOff },
    "Not Recommended": { primary: "#DC2626", secondary: "#FEF2F2", icon: XCircle }, // Red (Darker)
    "Test Completed": { primary: "#F97316", secondary: "#FFF7ED", icon: CheckCircle }, // Orange
    "Test Started": { primary: "#EAB308", secondary: "#FEFCE8", icon: PlayCircle }, // Yellow
    "Manually Invited": { primary: "#3B82F6", secondary: "#EFF6FF", icon: Users }, // Blue
};

const MainDashboard = ({ adminInfo }) => {
    const navigate = useNavigate();

    // Local state replacing Redux
    const [creditsData, setCreditsData] = useState(null);
    const [creditsLoading, setCreditsLoading] = useState(true);
    const [creditsError, setCreditsError] = useState(null);

    const [jobRoles, setJobRoles] = useState([]);
    const [jobRolesLoading, setJobRolesLoading] = useState(true);
    const [jobRolesError, setJobRolesError] = useState(null);


    const [dashboardStats, setDashboardStats] = useState(null);
    const [dashboardStatsLoading, setDashboardStatsLoading] = useState(true);
    const [dashboardStatsError, setDashboardStatsError] = useState(null);
    const [recommendationStatsData, setRecommendationStatsData] = useState(null);
    const [recommendationStatsLoading, setRecommendationStatsLoading] = useState(false);
    const [recommendationStatsError, setRecommendationStatsError] = useState(null);

    const [selectedPositionId, setSelectedPositionId] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Get organizationId from props or localStorage
    const organizationId = adminInfo?.organization?.organizationId || localStorage.getItem('organizationId');

    const handleRenewSubscription = () => {
        navigate('/dashboard/payment');
    };

    // Fetch Credits
    useEffect(() => {
        const loadCredits = async () => {
            setCreditsLoading(true);
            try {
                const data = await dashboardService.getCredits();
                setCreditsData(data);
                setCreditsError(null);
            } catch (err) {
                console.error("Error fetching credits:", err);
                setCreditsError(err);
            } finally {
                setCreditsLoading(false);
            }
        };

        const loadDashboardStats = async () => {
            setDashboardStatsLoading(true);
            try {
                const data = await dashboardService.getDashboardStats(organizationId);
                setDashboardStats(data);
                setDashboardStatsError(null);
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setDashboardStatsError(err);
            } finally {
                setDashboardStatsLoading(false);
            }
        };

        if (organizationId) {
            loadCredits();
            loadDashboardStats();
        }
    }, [organizationId]);

    // Fetch Job Roles
    useEffect(() => {
        const loadJobRoles = async () => {
            if (!organizationId) return;
            setJobRolesLoading(true);
            try {
                const data = await dashboardService.getJobRoles(organizationId);
                setJobRoles(data || []);
                setJobRolesError(null);
            } catch (err) {
                console.error("Error fetching job roles:", err);
                setJobRolesError(err);
            } finally {
                setJobRolesLoading(false);
            }
        };
        loadJobRoles();
    }, [organizationId]);

    // Handle default position selection
    useEffect(() => {
        if (!jobRolesLoading && !jobRolesError && jobRoles.length > 0 && selectedPositionId === null && jobRoles[0].id) {
            setSelectedPositionId(jobRoles[0].id);
        } else if (!jobRolesLoading && !jobRolesError && jobRoles.length > 0 && selectedPositionId && !jobRoles.find(role => role.id === selectedPositionId)) {
            // If selected position is no longer in the list, select the first one
            setSelectedPositionId(jobRoles[0].id);
        } else if (!jobRolesLoading && !jobRolesError && jobRoles.length === 0 && selectedPositionId !== null) {
            setSelectedPositionId(null);
        }
    }, [jobRoles, jobRolesLoading, jobRolesError, selectedPositionId]);
    // Fetch Recommendation Stats when selectedPositionId changes
    useEffect(() => {
        const loadRecommendationStats = async () => {
            if (!organizationId || !selectedPositionId) {
                setRecommendationStatsData(null);
                return;
            }
            setRecommendationStatsLoading(true);
            try {
                const data = await dashboardService.getPositionRecommendationStats(organizationId, selectedPositionId);
                if (data && data.labels && data.data) {
                    // Convert back to object format for existing prepareDetailedStatsData/formatChartData logic
                    const statsObject = {};
                    data.labels.forEach((label, index) => {
                        // Find the original API key for this label if possible, or use as is
                        let apiKey = label;
                        for (const key in statsKeyToDisplayLabelMap) {
                            if (statsKeyToDisplayLabelMap[key] === label) {
                                apiKey = key;
                                break;
                            }
                        }
                        statsObject[apiKey] = data.data[index];
                    });
                    setRecommendationStatsData(statsObject);
                } else {
                    setRecommendationStatsData(null);
                }
                setRecommendationStatsError(null);
            } catch (err) {
                console.error("Error fetching position recommendation stats:", err);
                setRecommendationStatsError(err);
                setRecommendationStatsData(null);
            } finally {
                setRecommendationStatsLoading(false);
            }
        };
        loadRecommendationStats();
    }, [organizationId, selectedPositionId]);



    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);


    const formattedExpiryDate = formatExpiryDate(dashboardStats?.validTill || creditsData?.validTill);

    const selectedPosition = jobRoles.find(role => role.id === selectedPositionId);

    const handleDownloadReport = () => {
        try {
            const workbook = XLSX.utils.book_new();
            const sheetData = [];
            sheetData.push(['Dashboard Report']);
            sheetData.push([]);
            sheetData.push(['Credit Summary']);
            sheetData.push(['Metric', 'Value', 'Valid Till']);
            if (creditsData) {
                sheetData.push(['Total Interview Credits', creditsData.totalInterviewCredits, '']);
                sheetData.push(['Utilized Interview Credits', creditsData.utilizedInterviewCredits, '']);
                sheetData.push(['Remaining Interview Credits', creditsData.remainingInterviewCredits, '']);
                sheetData.push(['Total Position Credits', creditsData.totalPositionCredits, '']);
                sheetData.push(['Utilized Position Credits', creditsData.utilizedPositionCredits, '']);
                sheetData.push(['Remaining Position Credits', creditsData.remainingPositionCredits, '']);
                const expiryDate = creditsData.validTill ? new Date(creditsData.validTill) : null;
                const expiryDateString = expiryDate && !isNaN(expiryDate.getTime())
                    ? expiryDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A';
                sheetData.push(['Credits Valid Till', '', expiryDateString]);
            } else {
                sheetData.push(['Credit data not available.', '', '']);
            }
            sheetData.push([]);
            sheetData.push([]);
            const positionTitle = selectedPosition ? selectedPosition.title : 'No Position Selected';
            sheetData.push(['Interview Status Stats for Position:', positionTitle]);
            sheetData.push(['Status', 'Count']);
            if (recommendationStatsData && Object.keys(recommendationStatsData).length > 0) {
                const orderedStats = prepareDetailedStatsData(recommendationStatsData);
                orderedStats.forEach(item => {
                    sheetData.push([item.label, item.value]);
                });
            } else if (selectedPositionId) {
                sheetData.push(['No interview data available for this position.', '']);
            } else {
                sheetData.push(['Select a position to view stats.', '']);
            }
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard Data');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const filename = `Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
            saveAs(blob, filename);
        } catch (error) {
            console.error("Error downloading report:", error);
        }
    };


    const toggleDropdown = () => {
        if (!jobRolesLoading && !jobRolesError) {
            setIsDropdownOpen(!isDropdownOpen);
        }
    };

    const handlePositionSelect = (role) => {
        if (role && role.id) {
            setSelectedPositionId(role.id);
        } else {
            setSelectedPositionId(null);
        }
        setIsDropdownOpen(false);
    };


    const dropdownButtonText = jobRolesLoading
        ? 'Loading Positions...'
        : jobRolesError
            ? 'No Position Data Found'
            : selectedPosition
                ? selectedPosition.title
                : (jobRoles.length > 0 ? 'Select Position' : 'No Positions Available');


    const formatChartData = (statsObject) => {
        if (!statsObject) {
            return [];
        }
        const chartDataArray = [];
        statsDisplayOrder.forEach(displayLabel => {
            let foundApiKey = null;
            for (const apiKey in statsKeyToDisplayLabelMap) {
                if (statsKeyToDisplayLabelMap[apiKey] === displayLabel) {
                    foundApiKey = apiKey;
                    break;
                }
            }
            const value = (foundApiKey && statsObject.hasOwnProperty(foundApiKey) && typeof statsObject[foundApiKey] === 'number')
                ? statsObject[foundApiKey]
                : 0;
            // Include ALL items regardless of value (including zero)
            const colors = statusColors[displayLabel] || { primary: "#6B7280", secondary: "#F3F4F6" };
            chartDataArray.push({
                name: displayLabel,
                value: value,
                color: colors.primary,
                secondaryColor: colors.secondary
            });
        });
        return chartDataArray;
    };

    // Chart data enabled
    const chartData = formatChartData(recommendationStatsData);
    const pieChartData = chartData.filter(d => d.value > 0);

    const prepareDetailedStatsData = (statsObject) => {
        if (!statsObject) {
            return [];
        }
        // Filter out unwanted statuses
        const unwantedStatuses = [
            "UNATTENDED", "CANCELED", "IN_PROGRESS", "UNATTACHED", "NETWORK_DISCONNECTED",
            "EXPIRED", "TECHNICAL_ISSUE", "RESUME_ANALYZING", "TEST_ABANDONED", "AWAITING_EVALUATION",
            "PENDING", "REINVITED"
        ];

        const detailedStatsArray = Object.keys(statsObject)
            .filter(apiKey => !unwantedStatuses.includes(apiKey))
            .map(apiKey => {
                const value = statsObject[apiKey] ?? 0;
                const label = (statsKeyToDisplayLabelMap[apiKey] || apiKey);
                const colors = statusColors[label] || { primary: "#6B7280", secondary: "#F3F4F6", icon: Users };
                return { apiKey, label, value, colors };
            });

        detailedStatsArray.sort((a, b) => {
            const orderMap = statsDisplayOrder.reduce((acc, current, index) => {
                acc[current] = index;
                return acc;
            }, {});

            const indexA = orderMap[a.label] !== undefined ? orderMap[a.label] : Infinity;
            const indexB = orderMap[b.label] !== undefined ? orderMap[b.label] : Infinity;

            if (indexA === Infinity && indexB === Infinity) return 0;
            if (indexA === Infinity) return 1;
            if (indexB === Infinity) return -1;
            return indexA - indexB;
        });
        return detailedStatsArray;
    };

    // Detailed stats enabled
    const detailedStatsData = prepareDetailedStatsData(recommendationStatsData);

    const simpleFormatYTick = (tick) => {
        if (Number.isInteger(tick) && tick >= 0) {
            return tick;
        }
        return '';
    };

    // Custom tooltip for bar chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
                        {payload[0].value} candidates
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for pie chart
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800">{payload[0].name}</p>
                    <p className="text-lg font-bold" style={{ color: payload[0].payload.fill }}>
                        {payload[0].value} candidates
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom tick for horizontal multi-line labels
    const CustomXAxisTick = ({ x, y, payload }) => {
        const words = payload.value.split(' ');
        return (
            <g transform={`translate(${x},${y})`}>
                {words.map((word, index) => (
                    <text
                        key={index}
                        x={0}
                        y={index * 12}
                        dy={12}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize={9}
                        fontWeight={500}
                    >
                        {word}
                    </text>
                ))}
            </g>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Analytics</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Monitor your interview performance and candidate recommendations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleDownloadReport}
                        disabled={
                            creditsLoading || creditsError || !creditsData
                        }
                    >
                        <span>Download Report</span>
                        <Users size={16} />
                    </button>
                </div>
            </div>

            {/* Credits Section - Always Visible */}
            {creditsLoading && !creditsData && (
                <div className="mb-4 text-sm text-gray-500 animate-pulse">Updating credits...</div>
            )}

            {creditsError && (
                <div className="mb-4 text-sm text-red-500">Error loading credits. Showing cached or default values.</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">TOTAL INTERVIEW CREDITS</p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.totalInterviewCredits ?? '-'}</h2>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">UTILIZED CREDITS</p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.utilizedInterviewCredits ?? '-'}</h2>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">REMAINING CREDITS</p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.remainingInterviewCredits ?? '-'}</h2>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>
                <div className="row-span-2 bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col relative">
                    <div className="absolute top-4 right-4">
                        <Calendar className="text-green-500" size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-600 mb-1">VALID TILL</p>

                    {formattedExpiryDate ? (
                        <div className="flex flex-col justify-center flex-grow">
                            <h2 className="text-4xl font-bold text-gray-900 leading-none">
                                {formattedExpiryDate.day}<sup className="text-lg align-super">{formattedExpiryDate.suffix}</sup>
                            </h2>
                            <p className="text-2xl font-bold text-gray-500 mt-2">{formattedExpiryDate.month} {formattedExpiryDate.year}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center flex-grow">
                            <p className="text-gray-500">Expiry date not available</p>
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">TOTAL POSITION CREDITS</p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.totalPositionCredits ?? '-'}</h2>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">UTILIZED CREDITS</p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.utilizedPositionCredits ?? '-'}</h2>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">REMAINING CREDITS</p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.remainingPositionCredits ?? '-'}</h2>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>
            </div>

            {/* General Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Candidates Stats */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">TOTAL CANDIDATES</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.totalCandidates || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">Across all jobs</p>
                        </div>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">ACTIVE CANDIDATES</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.activeCandidates || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">Currently active</p>
                        </div>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">INACTIVE CANDIDATES</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.inactiveCandidates || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">Inactive / Archived</p>
                        </div>
                        <ArrowUpRight className="text-gray-400" size={20} />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">ACTIVE USERS</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.activeUsers || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">Online recently</p>
                        </div>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">INACTIVE USERS</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.inactiveUsers || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">No recent activity</p>
                        </div>
                        <ArrowUpRight className="text-gray-400" size={20} />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">TOTAL ROLES</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.totalRoles || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">Defined roles</p>
                        </div>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>

                {/* Positions Stats */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">ACTIVE POSITIONS</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.activePositions || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">Open positions</p>
                        </div>
                        <ArrowUpRight className="text-green-500" size={20} />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-1">INACTIVE POSITIONS</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{dashboardStats?.inactivePositions || 0}</h2>
                            <p className="text-xs text-gray-500 mt-1">Closed positions</p>
                        </div>
                        <ArrowUpRight className="text-gray-400" size={20} />
                    </div>
                </div>
            </div>

            {/* Position Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Position Analytics</h3>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={toggleDropdown}
                            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
                        >
                            <span className="text-sm font-medium">
                                {selectedPositionId ? jobRoles.find(role => role.id === selectedPositionId)?.title : 'Select Position'}
                            </span>
                            <Users className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                    {jobRolesLoading && (
                                        <div className="block px-4 py-2 text-sm text-gray-700">Loading positions...</div>
                                    )}
                                    {jobRolesError && (
                                        <div className="block px-4 py-2 text-sm text-gray-700">Error loading positions.</div>
                                    )}
                                    {!jobRolesLoading && !jobRolesError && jobRoles.length === 0 && (
                                        <div className="block px-4 py-2 text-sm text-gray-700">No positions found.</div>
                                    )}
                                    {!jobRolesLoading && !jobRolesError && jobRoles.length > 0 && jobRoles.map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handlePositionSelect(role)}
                                            className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${selectedPositionId === role.id ? 'bg-blue-100 font-semibold' : ''}`}
                                            role="menuitem"
                                            disabled={!role.id}
                                        >
                                            {role.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Charts Section */}
                {recommendationStatsLoading ? (
                    <div className="flex justify-center items-center h-72">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : recommendationStatsError ? (
                    <div className="flex justify-center items-center h-72 text-red-500">
                        <p>Error loading analytics. Please try again later.</p>
                    </div>
                ) : !recommendationStatsData || Object.keys(recommendationStatsData).length === 0 ? (
                    <div className="flex justify-center items-center h-72 text-gray-500">
                        <div className="text-center">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p>No analytics data available for this position</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-80 lg:col-span-1">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">Distribution by Status</h4>
                                <ResponsiveContainer width="100%" height="90%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-80 lg:col-span-2">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">Recommendation Trend</h4>
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={<CustomXAxisTick />}
                                            interval={0}
                                            height={60}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#6b7280' }}
                                            tickFormatter={simpleFormatYTick}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {detailedStatsData.map((stat) => (
                                <div key={stat.apiKey} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: stat.colors.secondary }}>
                                            <stat.colors.icon size={16} style={{ color: stat.colors.primary }} />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">{stat.value}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainDashboard;
