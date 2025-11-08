// Role-based permissions configuration
export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPTION: 'RECEPTION',
  DOCTOR: 'DOCTOR',
  BILLING: 'BILLING',
  PATIENT: 'PATIENT'
};

// Role permissions
export const PERMISSIONS = {
  ADMIN: {
    canManagePatients: true,
    canManageDoctors: true,
    canBookAppointments: true,
    canCancelAppointments: true,
    canCompleteAppointments: true,
    canMarkNoShow: true,
    canRescheduleAppointments: true,
    canManageBilling: true,
    canVoidBills: true,
    canCreatePrescriptions: true,
    canViewAllData: true,
  },
  RECEPTION: {
    canManagePatients: true,
    canManageDoctors: false,
    canBookAppointments: true,
    canCancelAppointments: true,
    canCompleteAppointments: false,
    canMarkNoShow: false,
    canRescheduleAppointments: true,
    canManageBilling: false,
    canVoidBills: false,
    canCreatePrescriptions: false,
    canViewAllData: true,
  },
  DOCTOR: {
    canManagePatients: false,
    canManageDoctors: false,
    canBookAppointments: false,
    canCancelAppointments: false,
    canCompleteAppointments: true,
    canMarkNoShow: true,
    canRescheduleAppointments: false,
    canManageBilling: false,
    canVoidBills: false,
    canCreatePrescriptions: true,
    canViewAllData: true,
  },
  BILLING: {
    canManagePatients: false,
    canManageDoctors: false,
    canBookAppointments: false,
    canCancelAppointments: false,
    canCompleteAppointments: false,
    canMarkNoShow: false,
    canRescheduleAppointments: false,
    canManageBilling: true,
    canVoidBills: true,
    canCreatePrescriptions: false,
    canViewAllData: true,
  },
  PATIENT: {
    canManagePatients: false,
    canManageDoctors: false,
    canBookAppointments: true,
    canCancelAppointments: true,
    canCompleteAppointments: false,
    canMarkNoShow: false,
    canRescheduleAppointments: false,
    canManageBilling: false,
    canVoidBills: false,
    canCreatePrescriptions: false,
    canViewAllData: false, // Only own data
  },
};

// Get current role from localStorage
export const getCurrentRole = () => {
  return localStorage.getItem('mockRole') || ROLES.ADMIN;
};

// Set role in localStorage
export const setRole = (role) => {
  localStorage.setItem('mockRole', role);
};

// Check if user has specific permission
export const hasPermission = (permission) => {
  const role = getCurrentRole();
  return PERMISSIONS[role]?.[permission] || false;
};

// Check if user has any of the given permissions
export const hasAnyPermission = (...permissions) => {
  return permissions.some(permission => hasPermission(permission));
};

// Check if user has all of the given permissions
export const hasAllPermissions = (...permissions) => {
  return permissions.every(permission => hasPermission(permission));
};

// Check if role can access route
export const canAccessRoute = (path, role = null) => {
  const currentRole = role || getCurrentRole();
  
  if (currentRole === ROLES.ADMIN) return true;
  
  // Temporarily check permissions using the role passed or current role
  const checkPerm = (perm) => {
    const r = role || getCurrentRole();
    return PERMISSIONS[r]?.[perm] || false;
  };
  
  const routePermissions = {
    '/': true, // Dashboard accessible to all
    '/patients': checkPerm('canManagePatients') || currentRole === ROLES.DOCTOR || currentRole === ROLES.RECEPTION,
    '/doctors': currentRole !== ROLES.PATIENT,
    '/appointments': true,
    '/billing': checkPerm('canManageBilling'),
  };
  
  return routePermissions[path] !== false;
};

