import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { adminService } from "../../services/adminService";
import { roleService } from "../../services/roleService";
import SnackbarAlert from "../common/SnackbarAlert";

const CreateAdmin = ({ adminInfo }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    roleId: ""
  });
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Load roles from organization (excluding ADMIN)
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        const organizationId = adminInfo?.organization?.organizationId;
        
        if (organizationId) {
          // Get roles from organization, filter out ADMIN
          const data = await roleService.getRolesByOrganizationId(organizationId);
          const filteredRoles = data.filter(role => role.name !== "ADMIN" && role.name !== "SUPERADMIN");
          setRoles(filteredRoles);
          
          // Set default role if available (use role ID)
          if (filteredRoles.length > 0 && !formData.roleId) {
            setFormData(prev => ({ ...prev, roleId: filteredRoles[0].id }));
          }
        }
      } catch (error) {
        console.error("Error loading roles:", error);
        showMessage("Failed to load roles", "error");
      } finally {
        setLoadingRoles(false);
      }
    };
    
    loadRoles();
  }, [adminInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Get organizationId from localStorage (stored on login)
      const organizationId = localStorage.getItem('organizationId') || adminInfo?.organization?.organizationId;
      
      if (!organizationId) {
        showMessage("Organization ID not found. Please log in again.", "error");
        setLoading(false);
        return;
      }
      
      // The roleId from the API is base64 encoded, but backend expects UUID string
      // Use role name instead of roleId (backend accepts role name as fallback)
      const selectedRole = roles.find(r => r.id === formData.roleId);
      if (!selectedRole || !selectedRole.name) {
        showMessage("Please select a valid role", "error");
        setLoading(false);
        return;
      }
      
      // Prepare payload - backend will use current admin's organization automatically
      // We use role name instead of roleId to avoid UUID format conversion issues
      const payload = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || null,
        role: selectedRole.name // Use role name instead of roleId
        // Note: organizationId is not needed - backend uses current admin's organization
      };
      
      await adminService.createAdmin(payload);
      showMessage("User created successfully", "success");
      setTimeout(() => {
        navigate("/dashboard/users");
      }, 1000);
    } catch (error) {
      console.error("Error creating admin:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to create user. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex-shrink-0">
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

      {/* Main Content - Grid Layout */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-3 overflow-hidden">
          {/* Left Column - Form */}
          <div className="col-span-12 lg:col-span-8 overflow-hidden">
            <div className="bg-white rounded-lg shadow-md h-full flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-sm font-semibold text-navy-900">User Information</h2>
                <p className="text-xs text-gray-600 mt-0.5">Fill in the details to create a new user</p>
              </div>
              
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-3 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                      placeholder="user@example.com"
                    />
                  </div>
                  
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                      placeholder="Enter password"
                      minLength={6}
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Minimum 6 characters</p>
                  </div>
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                      placeholder="10-digit phone number"
                      maxLength={10}
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Optional - 10 digits</p>
                  </div>
                  
                  {/* Role - Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      required
                      disabled={loadingRoles}
                      className="w-full px-2 py-1.5 text-xs border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {loadingRoles ? (
                        <option value="">Loading roles...</option>
                      ) : roles.length === 0 ? (
                        <option value="">No roles available</option>
                      ) : (
                        <>
                          <option value="">Select a role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {loadingRoles && (
                      <p className="text-[10px] text-gray-500 mt-0.5">Loading roles from your organization...</p>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 mt-auto border-t border-gray-200 flex-shrink-0">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-1.5 px-3 text-xs bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-3 py-1.5 text-xs border-2 border-gold-300 hover:border-gold-600 text-gold-700 hover:text-gold-600 font-medium rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="col-span-12 lg:col-span-4 overflow-hidden">
            <div className="bg-white rounded-lg shadow-md h-full p-3 overflow-y-auto">
              <h3 className="text-xs font-semibold text-navy-900 mb-2">Information</h3>
              
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-xs font-medium text-blue-900 mb-1">Required Fields</h4>
                  <ul className="text-[10px] text-blue-800 space-y-0.5">
                    <li>• Email</li>
                    <li>• Password (min 6 characters)</li>
                    <li>• Full Name</li>
                  </ul>
                </div>
                
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-xs font-medium text-purple-900 mb-1">Role Selection</h4>
                  <p className="text-[10px] text-purple-800">
                    Select a role from your organization. The user will automatically inherit your organization ({adminInfo?.organization?.organizationName || "Your Organization"}) and have access based on the selected role's permissions.
                  </p>
                </div>
                
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-900 mb-1">Optional Fields</h4>
                  <ul className="text-[10px] text-gray-700 space-y-0.5">
                    <li>• Phone Number</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default CreateAdmin;

