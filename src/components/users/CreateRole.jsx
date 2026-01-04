import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Shield } from 'lucide-react';
import { roleService } from '../../services/roleService';
import SnackbarAlert from '../common/SnackbarAlert';

const CreateRole = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [features, setFeatures] = useState([]);
    const [featuresLoading, setFeaturesLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
    });

    const [selectedFeatures, setSelectedFeatures] = useState(new Set());

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const data = await roleService.getAllFeatures();
            setFeatures(data);
        } catch (error) {
            console.error('Error fetching features:', error);
            showMessage('Failed to load permissions options', 'error');
        } finally {
            setFeaturesLoading(false);
        }
    };

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleFeature = (featureId) => {
        const newSelected = new Set(selectedFeatures);
        if (newSelected.has(featureId)) {
            newSelected.delete(featureId);
        } else {
            newSelected.add(featureId);
        }
        setSelectedFeatures(newSelected);
    };

    const toggleGroup = (featureIds) => {
        const allSelected = featureIds.every(id => selectedFeatures.has(id));
        const newSelected = new Set(selectedFeatures);

        if (allSelected) {
            featureIds.forEach(id => newSelected.delete(id));
        } else {
            featureIds.forEach(id => newSelected.add(id));
        }
        setSelectedFeatures(newSelected);
    };

    // Group features by Category (Module)
    const groupedFeatures = features.reduce((acc, feature) => {
        let category = feature.category || (feature.name ? feature.name.split('_')[0] : 'OTHER');
        if (!acc[category]) acc[category] = [];
        acc[category].push(feature);
        return acc;
    }, {});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const organizationId = localStorage.getItem('organizationId');

            // Construct permissions map: module -> permissionType -> [featureIds]
            const permissionsMap = {};

            selectedFeatures.forEach(featureId => {
                const feature = features.find(f => f.id === featureId);
                if (feature) {
                    let module = feature.category || (feature.name ? feature.name.split('_')[0] : 'OTHER');
                    let type = 'ACCESS'; // Default
                    if (feature.name && feature.name.includes('_')) {
                        const parts = feature.name.split('_');
                        if (parts.length > 1) type = parts[1]; // READ, CREATE, etc.
                    }

                    if (!permissionsMap[module]) permissionsMap[module] = {};
                    if (!permissionsMap[module][type]) permissionsMap[module][type] = [];

                    permissionsMap[module][type].push(featureId);
                }
            });

            const payload = {
                name: formData.name,
                permissions: permissionsMap
            };

            if (organizationId) {
                await roleService.createRoleForOrganization(organizationId, payload);
            } else {
                await roleService.createRole(payload);
            }

            showMessage('Role created successfully');
            setTimeout(() => {
                navigate(-1);
            }, 1500);
        } catch (error) {
            console.error('Error creating role:', error);
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to create role";
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-white flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft size={16} className="text-navy-900" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-navy-900">Create Role</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Define a new role and its permissions</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="h-full flex flex-col">
                    <div className="p-6 flex-1">

                        {/* Role Name */}
                        <div className="mb-6 max-w-md">
                            <label className="block text-xs font-medium text-navy-700 mb-1">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Hiring Manager"
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                            />
                        </div>

                        {/* Permissions Grid */}
                        <div>
                            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-widest pb-2 border-b border-gray-100 mb-4">
                                Permissions
                            </h3>

                            {featuresLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                                        <div key={category} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:border-blue-200 transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-xs font-bold text-navy-800">{category}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(categoryFeatures.map(f => f.id))}
                                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-medium uppercase tracking-wide"
                                                >
                                                    {categoryFeatures.every(f => selectedFeatures.has(f.id)) ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {categoryFeatures.map(feature => (
                                                    <label key={feature.id} className="flex items-start gap-2 p-1.5 -ml-1.5 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                                                        <div className="relative flex items-center h-4 mt-0.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedFeatures.has(feature.id)}
                                                                onChange={() => toggleFeature(feature.id)}
                                                                className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="font-medium text-gray-700 block">
                                                                {feature.name?.split('_').slice(1).join(' ') || feature.name}
                                                            </span>
                                                            {feature.description && (
                                                                <span className="text-gray-500 text-[10px] mt-0.5 block">{feature.description}</span>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 px-4 text-xs bg-gradient-to-r from-blue-600 to-qwikBlue hover:from-blue-700 hover:to-qwikBlueDark text-white font-semibold rounded-lg transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Create Role
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 text-xs border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            <SnackbarAlert
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleCloseSnackbar}
            />
        </div>
    );
};

export default CreateRole;
