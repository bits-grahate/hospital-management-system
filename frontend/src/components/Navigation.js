import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { canAccessRoute, getCurrentRole } from '../utils/roles';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRole = getCurrentRole();
  
  const allRoutes = [
    { path: '/', label: 'Dashboard' },
    { path: '/patients', label: 'Patients' },
    { path: '/doctors', label: 'Doctors' },
    { path: '/appointments', label: 'Appointments' },
    { path: '/billing', label: 'Billing' },
  ];
  
  // Filter routes based on role
  const routes = allRoutes.filter(route => canAccessRoute(route.path, currentRole));
  
  const currentTab = routes.findIndex(route => route.path === location.pathname);
  
  // Redirect if current route is not accessible
  React.useEffect(() => {
    if (!canAccessRoute(location.pathname, currentRole) && location.pathname !== '/') {
      navigate('/');
    }
  }, [currentRole, location.pathname, navigate]);
  
  return (
    <Tabs value={currentTab >= 0 ? currentTab : 0} aria-label="navigation tabs">
      {routes.map((route, index) => (
        <Tab
          key={route.path}
          label={route.label}
          component={Link}
          to={route.path}
          value={index}
        />
      ))}
    </Tabs>
  );
}

export default Navigation;


