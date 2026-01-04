import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { roleService } from '../../services/roleService';
import SnackbarAlert from '../common/SnackbarAlert';

const CreateUser = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        roleId: '',
        password: '',
        confirmPassword: ''
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const organizationId = localStorage.getItem('organizationId');
            let data;
            if (organizationId) {
                data = await roleService.getRolesByOrganizationId(organizationId);
            } else {
                data = await roleService.getAllRoles();
            }

            // Handle wrapper
            let rolesList = [];
            if (Array.isArray(data)) {
                rolesList = data;
            } else if (data?.data && Array.isArray(data.data)) {
                rolesList = data.data;
            } else if (data?.content && Array.isArray(data.content)) {
                rolesList = data.content;
            }

            setRoles(rolesList);
        } catch (error) {
            console.error('Error fetching roles:', error);
            showMessage('Failed to load roles', 'error');
        } finally {
            setRolesLoading(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showMessage("Passwords don't match", "error");
            return;
        }

        if (!formData.roleId) {
            showMessage("Please select a role", "error");
            return;
        }

        setLoading(true);
        try {
            const organizationId = localStorage.getItem('organizationId');

            const payload = {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                roleId: formData.roleId,
                password: formData.password
            };

            if (organizationId) {
                await adminService.createUserForOrganization(organizationId, payload);
            } else {
                // Fallback or superadmin creating global admin (not specific to org)
                await adminService.createAdmin(payload);
            }

            showMessage('User created successfully');
            setTimeout(() => {
                navigate(-1);
            }, 1500);
        } catch (error) {
            console.error('Error creating user:', error);
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to create user";
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
                        <h1 className="text-lg font-bold text-navy-900">Create User</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Add a new user to your organization</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="h-full flex flex-col">
                    <div className="p-6 flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter full name"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter email address"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="roleId"
                                    value={formData.roleId}
                                    onChange={handleChange}
                                    required
                                    disabled={rolesLoading}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                >
                                    <option value="">Select a Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Create a password"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-medium text-navy-700 mb-1">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Confirm password"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                />
                            </div>

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
                                    Create User
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

export default CreateUser;
