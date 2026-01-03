import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { roleService } from "../../services/roleService";
import { featureService } from "../../services/featureService";
import { permissionService } from "../../services/permissionService";
import SnackbarAlert from "../common/SnackbarAlert";

const CreateRole = ({ adminInfo }) => {
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState("");
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Permission matrix: module -> permission type -> feature IDs
  const [permissionMatrix, setPermissionMatrix] = useState({});

  const showMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        setLoadingFeatures(true);
        const data = await featureService.getAllFeatures();
        // Only include CANDIDATE and POSITION features - filter out USER, ROLE, QUESTION
        const activeFeatures = data.filter(f => {
          if (!f.active) return false;
          const category = f.category?.toUpperCase() || f.name?.split('_')[0]?.toUpperCase() || '';
          // Only include CANDIDATE and POSITION features
          return category === 'CANDIDATE' || category === 'POSITION';
        });
        setFeatures(activeFeatures);
        
        console.log("Loaded features:", activeFeatures.map(f => f.name));
        
        // Group features by module - initialize structure but don't populate arrays
        // Arrays will remain empty until user selects checkboxes
        const matrix = {};
        activeFeatures.forEach(feature => {
          // Extract module name from feature name (e.g., "USER_READ" -> "USER", "CANDIDATE_WRITE" -> "CANDIDATE")
          // New naming: MODULE_ACTION (USER_READ, USER_WRITE, USER_UPDATE, USER_DELETE)
          const moduleMatch = feature.name.match(/^([A-Z]+)_(READ|WRITE|UPDATE|DELETE)$/);
          if (!moduleMatch) {
            console.warn("Feature name doesn't match pattern:", feature.name);
            return;
          }
          
          const module = moduleMatch[1];
          const action = moduleMatch[2];
          
          if (!matrix[module]) {
            // Initialize with empty arrays - no checkboxes selected by default
            matrix[module] = {
              READ: [],
              WRITE: [],
              UPDATE: [],
              DELETE: []
            };
          }
          // Don't populate arrays here - let user select via checkboxes
        });
        
        console.log("Permission matrix initialized:", Object.keys(matrix));
        setPermissionMatrix(matrix);
      } catch (error) {
        console.error("Error loading features:", error);
        showMessage("Failed to load features", "error");
      } finally {
        setLoadingFeatures(false);
      }
    };
    loadFeatures();
  }, []);

  const handlePermissionToggle = (module, permissionType) => {
    if (!features || features.length === 0) {
      console.warn("Features not loaded yet");
      return;
    }
    
    setPermissionMatrix(prev => {
      const newMatrix = { ...prev };
      if (!newMatrix[module]) {
        newMatrix[module] = {
          READ: [],
          WRITE: [],
          UPDATE: [],
          DELETE: []
        };
      }
      
      const featureIds = newMatrix[module][permissionType] || [];
      const isSelected = featureIds.length > 0;
      
      if (isSelected) {
        // Deselect: Clear all features for this permission type
        newMatrix[module][permissionType] = [];
      } else {
        // Select: Add all features for this permission type
        // Get features for this module and permission type
        // New naming: MODULE_ACTION (USER_READ, USER_WRITE, USER_UPDATE, USER_DELETE)
        const moduleFeatures = features.filter(f => {
          const nameUpper = f.name.toUpperCase();
          // Match pattern: MODULE_ACTION
          const match = nameUpper.match(/^([A-Z]+)_(READ|WRITE|UPDATE|DELETE)$/);
          if (!match) return false;
          
          const featureModule = match[1];
          const featureAction = match[2];
          
          // Check if module matches and action matches permission type
          if (featureModule !== module) return false;
          
          // Map WRITE to CREATE for backward compatibility, but we use WRITE in feature names
          if (permissionType === "WRITE" && featureAction === "WRITE") return true;
          if (permissionType === "READ" && featureAction === "READ") return true;
          if (permissionType === "UPDATE" && featureAction === "UPDATE") return true;
          if (permissionType === "DELETE" && featureAction === "DELETE") return true;
          
          return false;
        });
        
        newMatrix[module][permissionType] = moduleFeatures.map(f => f.id);
      }
      
      return newMatrix;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roleName.trim()) {
      showMessage("Role name is required", "error");
      return;
    }
    
    try {
      setLoading(true);
      
      // Get organizationId from adminInfo
      const organizationId = adminInfo?.organization?.organizationId;
      
      if (!organizationId) {
        throw new Error("Organization ID not found. Please ensure you are logged in as an admin.");
      }
      
      // Collect selected permissions from permissionMatrix
      // Format: { "MODULE": { "READ": [featureId1, featureId2], "WRITE": [featureId3], ... } }
      const selectedPermissions = {};
      Object.keys(permissionMatrix).forEach(module => {
        const modulePermissions = permissionMatrix[module];
        if (modulePermissions) {
          Object.keys(modulePermissions).forEach(permissionType => {
            const featureIds = modulePermissions[permissionType] || [];
            if (featureIds.length > 0) {
              if (!selectedPermissions[module]) {
                selectedPermissions[module] = {};
              }
              selectedPermissions[module][permissionType] = featureIds;
            }
          });
        }
      });
      
      // Create the role with organizationId as path variable and selected permissions
      const response = await roleService.createRoleForOrganization(organizationId, { 
        name: roleName.trim(),
        permissions: Object.keys(selectedPermissions).length > 0 ? selectedPermissions : null
      });
      const createdRole = response.role || response;
      
      if (!createdRole.id) {
        throw new Error("Role created but ID not returned");
      }
      
      // Show success message with permission count
      const permissionCount = Object.keys(selectedPermissions).length;
      if (permissionCount > 0) {
        showMessage(`Role created successfully with ${permissionCount} permission module(s)`, "success");
      } else {
        showMessage("Role created successfully with all permissions", "success");
      }
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error creating role:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to create role. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Only show these modules: CANDIDATE, POSITION (QUESTION, USER, ROLE are accessible to all users)
  const allowedModules = ["CANDIDATE", "POSITION"];
  const modules = Object.keys(permissionMatrix).filter(module => allowedModules.includes(module)).sort();
  const permissionTypes = ["READ", "WRITE", "UPDATE", "DELETE"];

  const isPermissionSelected = (module, permissionType) => {
    return permissionMatrix[module]?.[permissionType]?.length > 0;
  };

  // Get count of available features for each permission type per module
  const getFeatureCount = (module, permissionType) => {
    const moduleFeatures = features.filter(f => {
      const nameUpper = f.name.toUpperCase();
      // Match pattern: MODULE_ACTION (USER_READ, USER_WRITE, USER_UPDATE, USER_DELETE)
      const match = nameUpper.match(/^([A-Z]+)_(READ|WRITE|UPDATE|DELETE)$/);
      if (!match) return false;
      
      const featureModule = match[1];
      const featureAction = match[2];
      
      // Check if module matches and action matches permission type
      if (featureModule !== module.toUpperCase()) return false;
      
      // Map permission type to feature action (exact match)
      return featureAction === permissionType;
    });
    
    return moduleFeatures.length;
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
            <h1 className="text-sm font-bold text-navy-900">Create Role</h1>
            <p className="text-xs text-gray-600 mt-0.5">Add a new role with permissions</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Role Name Input */}
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
              <label className="block text-xs font-medium text-navy-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value.toUpperCase())}
                className="w-full px-2 py-1.5 text-xs border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
                placeholder="e.g., HR_MANAGER, RECRUITER"
              />
            </div>

            {/* Permissions Table */}
            <div className="flex-1 overflow-auto p-3">
              {loadingFeatures ? (
                <div className="text-xs text-gray-500 py-4 text-center">Loading features...</div>
              ) : modules.length === 0 ? (
                <div className="text-xs text-gray-500 py-4 text-center">No modules available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-navy-900 text-white sticky top-0">
                      <tr>
                        <th className="border border-gray-300 px-2 py-1.5 text-xs font-semibold text-left">Module</th>
                        {permissionTypes.map((type) => (
                          <th key={type} className="border border-gray-300 px-2 py-1.5 text-xs font-semibold text-center">
                            {type}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((module) => (
                        <tr key={module} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1.5 text-xs font-medium text-navy-900">
                            {module.replace(/_/g, " ")}
                          </td>
                          {permissionTypes.map((permissionType) => {
                            const isSelected = isPermissionSelected(module, permissionType);
                            const availableCount = getFeatureCount(module, permissionType);
                            return (
                              <td key={permissionType} className="border border-gray-300 px-2 py-1.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handlePermissionToggle(module, permissionType);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-3 h-3 text-gold-600 border-gray-300 rounded focus:ring-gold-500 cursor-pointer"
                                    disabled={availableCount === 0}
                                  />
                                  {availableCount > 0 && (
                                    <span className="text-[9px] text-gray-500">
                                      {availableCount}
                                    </span>
                                  )}
                                  {availableCount === 0 && (
                                    <span className="text-[9px] text-gray-400">-</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-3 border-t border-gray-200 flex-shrink-0 flex gap-2">
              <button
                type="submit"
                disabled={loading || !roleName.trim()}
                className="flex-1 py-1.5 px-3 text-xs bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-semibold rounded-lg transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Role"}
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

