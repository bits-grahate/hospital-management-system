import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

// Use environment variable or default to localhost for local dev
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8001' : '/api/patient');

function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchStats();
    };
    loadData();
  }, []);

  useEffect(() => {
    // Fetch alerts after stats are loaded
    if (!loading) {
      fetchAlerts();
    }
  }, [stats, loading]);

  const fetchStats = async () => {
    try {
      // Always use proxy paths (nginx handles routing)
      // This works both in localhost and Docker environments
      const PATIENT_API = '/api/patient';
      const DOCTOR_API = '/api/doctor';
      const APPOINTMENT_API = '/api/appointment';

      // Fetch real stats from APIs
      const [patientsRes, doctorsRes, appointmentsRes] = await Promise.allSettled([
        axios.get(`${PATIENT_API}/v1/patients?page=1&limit=200`), // Get larger page to count active patients
        axios.get(`${DOCTOR_API}/v1/doctors?page=1&limit=100`),
        axios.get(`${APPOINTMENT_API}/v1/appointments?page=1&limit=1`) // Get first page to get total count
      ]);

      // Get patient count (count only active patients)
      let patientCount = 0;
      if (patientsRes.status === 'fulfilled') {
        const patientData = patientsRes.value.data;
        console.log('Patient API Response:', patientData); // Debug log
        
        // Patient service returns: { data: [], pagination: { total: 0 } }
        if (patientData && Array.isArray(patientData.data)) {
          // Count active patients - explicitly check for active === true or active === undefined (defaults to active)
          // Exclude only those with active === false
          const activeCount = patientData.data.filter(p => {
            // Include if active is true, undefined, or not explicitly false
            return p.active !== false;
          }).length;
          
          const totalInResponse = patientData.data.length;
          console.log(`Patient count - Total in response: ${totalInResponse}, Active count: ${activeCount}`);
          
          // Check if we got all patients (we requested 200, there are 121 total)
          if (patientData.pagination && patientData.pagination.total) {
            const totalInDB = patientData.pagination.total;
            
            // If we got all or most patients in response, count active ones directly
            if (totalInResponse >= totalInDB) {
              patientCount = activeCount;
              console.log(`Using active count directly: ${patientCount} (all patients in response)`);
            } else {
              // Estimate: use ratio of active in sample
              const activeRatio = totalInResponse > 0 ? activeCount / totalInResponse : 0;
              patientCount = Math.round(totalInDB * activeRatio);
              console.log(`Using estimated count: ${patientCount} (based on ratio: ${activeRatio.toFixed(2)})`);
            }
          } else {
            // No pagination info, use active count from response
            patientCount = activeCount;
            console.log(`Using active count (no pagination): ${patientCount}`);
          }
        } else {
          console.error('Unexpected patient data structure:', patientData);
          // Fallback: try to use pagination total if available
          if (patientData && patientData.pagination && patientData.pagination.total) {
            patientCount = patientData.pagination.total;
            console.warn('Using pagination total as fallback:', patientCount);
          }
        }
      } else {
        console.error('Failed to fetch patients:', patientsRes.reason);
      }
      
      // Get doctor count from Spring Page response
      let doctorCount = 0;
      if (doctorsRes.status === 'fulfilled') {
        const doctorData = doctorsRes.value.data;
        console.log('Doctor API Response:', doctorData); // Debug log
        
        // Doctor service returns Spring Page: { content: [], totalElements: 0 }
        if (doctorData && doctorData.totalElements !== undefined) {
          doctorCount = doctorData.totalElements;
          console.log(`Doctor count from totalElements: ${doctorCount}`);
        } else if (doctorData && doctorData.pagination && doctorData.pagination.totalElements !== undefined) {
          doctorCount = doctorData.pagination.totalElements;
          console.log(`Doctor count from pagination.totalElements: ${doctorCount}`);
        } else if (doctorData && Array.isArray(doctorData.content)) {
          doctorCount = doctorData.content.length;
          console.log(`Doctor count from content array length: ${doctorCount}`);
        } else if (doctorData && Array.isArray(doctorData)) {
          doctorCount = doctorData.length;
          console.log(`Doctor count from array length: ${doctorCount}`);
        } else {
          console.error('Unexpected doctor data structure:', doctorData);
          doctorCount = 0;
        }
      } else {
        console.error('Failed to fetch doctors:', doctorsRes.reason);
      }

      // Get appointment count from API response
      let appointmentCount = 0;
      if (appointmentsRes.status === 'fulfilled') {
        const appointmentData = appointmentsRes.value.data;
        console.log('Appointment API Response:', appointmentData); // Debug log
        
        // Appointment service returns: { content: [], totalElements: 0, ... }
        if (appointmentData.totalElements !== undefined) {
          appointmentCount = appointmentData.totalElements;
        } else if (appointmentData.pagination && appointmentData.pagination.total !== undefined) {
          appointmentCount = appointmentData.pagination.total;
        } else if (appointmentData.content && Array.isArray(appointmentData.content)) {
          // Fallback: count from content array (may be limited by pagination)
          appointmentCount = appointmentData.content.length;
        } else {
          console.error('Unexpected appointment data structure:', appointmentData);
          appointmentCount = 0;
        }
      } else {
        console.error('Failed to fetch appointments:', appointmentsRes.reason);
      }

      setStats({
        patients: patientCount,
        doctors: doctorCount,
        appointments: appointmentCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to defaults
      setStats({
        patients: 0,
        doctors: 0,
        appointments: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const alertsList = [];

      // Check for pending bills by trying to get bills for known patients
      // Since we don't have a direct "all pending bills" endpoint,
      // we'll generate alerts based on system stats and status
      
      // Generate dynamic alerts based on current stats
      if (stats.appointments > 0) {
        alertsList.push({
          type: 'success',
          message: `✅ System active: ${stats.appointments} appointment(s) in the system`
        });
      }

      if (stats.patients === 0 && stats.doctors === 0) {
        alertsList.push({
          type: 'info',
          message: '💡 Get started: Create patients and doctors to begin booking appointments'
        });
      } else if (stats.patients > 0 && stats.doctors > 0 && stats.appointments === 0) {
        alertsList.push({
          type: 'info',
          message: '📅 Ready to book: You can now create appointments for your patients'
        });
      }

      // Add general system status alerts
      if (stats.patients > 0 && stats.doctors > 0) {
        alertsList.push({
          type: 'info',
          message: `📊 System Status: ${stats.patients} patient(s) and ${stats.doctors} doctor(s) registered`
        });
      }

      // Add informational alerts about notification system
      alertsList.push({
        type: 'info',
        message: '🔔 Notification System: Alerts will appear here when appointments are booked, rescheduled, cancelled, or when bills are generated'
      });

      // If we have appointments, remind about checking bills
      if (stats.appointments > 0) {
        alertsList.push({
          type: 'warning',
          message: '💰 Remember: Check the Billing section to view pending bills for completed appointments'
        });
      }

      setAlerts(alertsList);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Fallback to default alerts
      setAlerts([
        { type: 'info', message: '💡 Notification system ready - Alerts will appear here as events occur' }
      ]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Total Patients</Typography>
            <Typography variant="h3">{stats.patients}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Total Doctors</Typography>
            <Typography variant="h3">{stats.doctors}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Total Appointments</Typography>
            <Typography variant="h3">{stats.appointments}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Alerts & Notifications
        </Typography>
        {alerts.map((alert, index) => (
          <Alert key={index} severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        ))}
      </Box>
    </Box>
  );
}

export default Dashboard;


