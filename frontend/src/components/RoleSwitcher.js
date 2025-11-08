import React, { useState, useEffect } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box, Chip } from '@mui/material';
import { ROLES, getCurrentRole, setRole } from '../utils/roles';

function RoleSwitcher({ onRoleChange }) {
  const [currentRole, setCurrentRole] = useState(getCurrentRole());

  useEffect(() => {
    setCurrentRole(getCurrentRole());
  }, []);

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setCurrentRole(newRole);
    setRole(newRole);
    if (onRoleChange) {
      onRoleChange(newRole);
    }
    // Trigger page reload to update all components
    window.location.reload();
  };

  const getRoleLabel = (role) => {
    const labels = {
      [ROLES.ADMIN]: '👤 Admin',
      [ROLES.RECEPTION]: '🏥 Reception',
      [ROLES.DOCTOR]: '👨‍⚕️ Doctor',
      [ROLES.BILLING]: '💰 Billing',
      [ROLES.PATIENT]: '👤 Patient',
    };
    return labels[role] || role;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Chip 
        label={`Mock Role Mode`} 
        size="small" 
        color="info" 
        variant="outlined"
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Role</InputLabel>
        <Select
          value={currentRole}
          onChange={handleRoleChange}
          label="Role"
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.8)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 1)',
            },
            color: 'white',
            '& .MuiSelect-icon': {
              color: 'white',
            },
          }}
        >
          <MenuItem value={ROLES.ADMIN}>{getRoleLabel(ROLES.ADMIN)}</MenuItem>
          <MenuItem value={ROLES.RECEPTION}>{getRoleLabel(ROLES.RECEPTION)}</MenuItem>
          <MenuItem value={ROLES.DOCTOR}>{getRoleLabel(ROLES.DOCTOR)}</MenuItem>
          <MenuItem value={ROLES.BILLING}>{getRoleLabel(ROLES.BILLING)}</MenuItem>
          <MenuItem value={ROLES.PATIENT}>{getRoleLabel(ROLES.PATIENT)}</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default RoleSwitcher;


