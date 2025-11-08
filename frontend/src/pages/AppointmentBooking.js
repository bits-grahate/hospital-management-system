import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, Typography,
  Alert, FormControl, InputLabel, Select, MenuItem,
  Grid, Chip, CircularProgress, Pagination, Card,
  CardContent, Divider
} from '@mui/material';
// Using native datetime-local input for simplicity (date-pickers requires additional dependencies)
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { hasPermission } from '../utils/roles';

// Use environment variables or detect if running locally vs in Docker
const getApiUrl = (port, path) => {
  return process.env[`REACT_APP_${path.toUpperCase()}_API_URL`] || 
    (window.location.hostname === 'localhost' 
      ? `http://localhost:${port}` 
      : `/api/${path}`);
};

const PATIENT_API = getApiUrl(8001, 'patient');
const DOCTOR_API = getApiUrl(8002, 'doctor');
const APPOINTMENT_API = getApiUrl(8003, 'appointment');

// Clinic hours: 9 AM to 6 PM
const CLINIC_HOURS = { start: 9, end: 18 };

function AppointmentBooking() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [openReschedule, setOpenReschedule] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    department: '',
    slotStart: null,
    slotEnd: null,
  });

  const [rescheduleFormData, setRescheduleFormData] = useState({
    newSlotStart: null,
    newSlotEnd: null,
  });

  const [errors, setErrors] = useState({});
  const [rescheduleErrors, setRescheduleErrors] = useState({});
  

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
    fetchDepartments();
  }, [page]);

  const fetchAppointments = async () => {
    try {
      const url = APPOINTMENT_API.startsWith('/') 
        ? `${APPOINTMENT_API}/v1/appointments?page=${page}&limit=${limit}` 
        : `${APPOINTMENT_API}/v1/appointments?page=${page}&limit=${limit}`;
      const response = await axios.get(url);
      
      // Handle Page response
      if (response.data.content) {
        setAppointments(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setAppointments(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setAppointments(response.data);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    }
  };

  const fetchPatients = async () => {
    try {
      const url = PATIENT_API.startsWith('/') 
        ? `${PATIENT_API}/v1/patients?page=1&limit=1000` 
        : `${PATIENT_API}/v1/patients?page=1&limit=1000`;
      const response = await axios.get(url);
      
      if (response.data.data) {
        setPatients(response.data.data || []);
      } else if (response.data.content) {
        setPatients(response.data.content || []);
      } else if (Array.isArray(response.data)) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const url = DOCTOR_API.startsWith('/') 
        ? `${DOCTOR_API}/v1/doctors?page=1&limit=1000` 
        : `${DOCTOR_API}/v1/doctors?page=1&limit=1000`;
      const response = await axios.get(url);
      
      if (response.data.content) {
        setDoctors(response.data.content || []);
      } else if (response.data.data) {
        setDoctors(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setDoctors(response.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const url = DOCTOR_API.startsWith('/') 
        ? `${DOCTOR_API}/v1/departments` 
        : `${DOCTOR_API}/v1/departments`;
      const response = await axios.get(url);
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }
    
    if (!formData.doctorId) {
      newErrors.doctorId = 'Doctor is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.slotStart) {
      newErrors.slotStart = 'Start time is required';
    }
    
    if (!formData.slotEnd) {
      newErrors.slotEnd = 'End time is required';
    }
    
    if (formData.slotStart && formData.slotEnd) {
      if (formData.slotEnd <= formData.slotStart) {
        newErrors.slotEnd = 'End time must be after start time';
      }
      
      // Check clinic hours
      const startHour = formData.slotStart.getHours();
      const endHour = formData.slotEnd.getHours();
      
      if (startHour < CLINIC_HOURS.start || startHour >= CLINIC_HOURS.end) {
        newErrors.slotStart = `Appointment must be within clinic hours: ${CLINIC_HOURS.start}:00 - ${CLINIC_HOURS.end}:00`;
      }
      
      if (endHour < CLINIC_HOURS.start || endHour > CLINIC_HOURS.end) {
        newErrors.slotEnd = `Appointment must be within clinic hours: ${CLINIC_HOURS.start}:00 - ${CLINIC_HOURS.end}:00`;
      }
      
      // Ensure end time is not at or after clinic closing (18:00 = 6 PM)
      if (endHour >= CLINIC_HOURS.end) {
        newErrors.slotEnd = `Appointment must end before ${CLINIC_HOURS.end}:00 (clinic closing time)`;
      }
      
      // Check lead time (at least 2 hours from now)
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      if (formData.slotStart < twoHoursLater) {
        newErrors.slotStart = 'Appointment must be at least 2 hours from now';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDoctorChange = (doctorId) => {
    const doctor = doctors.find(d => d.doctorId === parseInt(doctorId));
    setFormData({
      ...formData,
      doctorId: doctorId,
      department: doctor ? doctor.department : '',
    });
    
    // Clear doctor error
    if (errors.doctorId) {
      setErrors({ ...errors, doctorId: '' });
    }
  };

  // Format date as ISO format: "2025-01-14T01:44:23" (T separated, standard ISO format)
  const formatLocalDateTime = (date) => {
    if (!date) return null;
    
    // Ensure we have a Date object
    const d = date instanceof Date ? date : new Date(date);
    
    // Get local time components (not UTC)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    // Use ISO format: "2025-01-14T01:44:23" (T separator, standard)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setAlert({ type: 'error', message: 'Please fix the form errors before submitting' });
      return;
    }

    setLoading(true);
    try {
      // Format dates without timezone - ensure they are strings
      let slotStartStr = formatLocalDateTime(formData.slotStart);
      let slotEndStr = formatLocalDateTime(formData.slotEnd);
      
      // Double-check they are strings, not Date objects
      if (!slotStartStr || typeof slotStartStr !== 'string') {
        throw new Error('Invalid slotStart format');
      }
      if (!slotEndStr || typeof slotEndStr !== 'string') {
        throw new Error('Invalid slotEnd format');
      }
      
      const appointmentData = {
        patientId: parseInt(formData.patientId),
        doctorId: parseInt(formData.doctorId),
        department: formData.department,
        slotStart: slotStartStr,
        slotEnd: slotEndStr,
      };
      
      // Verify final data before sending
      console.log('Submitting appointment:', JSON.stringify(appointmentData));
      console.log('slotStart type:', typeof appointmentData.slotStart, 'value:', appointmentData.slotStart);
      console.log('slotEnd type:', typeof appointmentData.slotEnd, 'value:', appointmentData.slotEnd);
      
      const url = APPOINTMENT_API.startsWith('/') 
        ? `${APPOINTMENT_API}/v1/appointments` 
        : `${APPOINTMENT_API}/v1/appointments`;
      
      // Send as plain object - axios will serialize it
      await axios.post(url, appointmentData);
      setOpen(false);
      setFormData({ patientId: '', doctorId: '', department: '', slotStart: null, slotEnd: null });
      setErrors({});
      setAlert({ type: 'success', message: 'Appointment booked successfully!' });
      fetchAppointments();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      
      // Parse API error and map to form fields
      const fieldErrors = parseApiError(errorMessage);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        // Also show alert for general awareness
        setAlert({ type: 'error', message: errorMessage });
      } else {
        // If no field-specific error, just show alert
        setAlert({ type: 'error', message: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (appointmentId) => {
    setRescheduleAppointmentId(appointmentId);
    setRescheduleFormData({ newSlotStart: null, newSlotEnd: null });
    setRescheduleErrors({});
    setOpenReschedule(true);
  };

  const handleRescheduleSubmit = async () => {
    // Validate reschedule form
    const newErrors = {};
    if (!rescheduleFormData.newSlotStart) {
      newErrors.newSlotStart = 'Start time is required';
    }
    if (!rescheduleFormData.newSlotEnd) {
      newErrors.newSlotEnd = 'End time is required';
    }
    if (rescheduleFormData.newSlotStart && rescheduleFormData.newSlotEnd) {
      if (rescheduleFormData.newSlotEnd <= rescheduleFormData.newSlotStart) {
        newErrors.newSlotEnd = 'End time must be after start time';
      }
      // Check clinic hours
      const startHour = rescheduleFormData.newSlotStart.getHours();
      const endHour = rescheduleFormData.newSlotEnd.getHours();
      if (startHour < CLINIC_HOURS.start || startHour >= CLINIC_HOURS.end) {
        newErrors.newSlotStart = `Start time must be between ${CLINIC_HOURS.start}:00 and ${CLINIC_HOURS.end - 1}:59`;
      }
      if (endHour < CLINIC_HOURS.start || endHour >= CLINIC_HOURS.end) {
        newErrors.newSlotEnd = `End time must be between ${CLINIC_HOURS.start}:00 and ${CLINIC_HOURS.end - 1}:59`;
      }
      // Check minimum 2-hour lead time
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      if (rescheduleFormData.newSlotStart < twoHoursLater) {
        newErrors.newSlotStart = 'New slot must be at least 2 hours from now';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setRescheduleErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const url = APPOINTMENT_API.startsWith('/')
        ? `${APPOINTMENT_API}/v1/appointments/${rescheduleAppointmentId}/reschedule`
        : `${APPOINTMENT_API}/v1/appointments/${rescheduleAppointmentId}/reschedule`;
      
      const formattedStart = formatLocalDateTime(rescheduleFormData.newSlotStart);
      const formattedEnd = formatLocalDateTime(rescheduleFormData.newSlotEnd);
      
      await axios.put(url, {
        newSlotStart: formattedStart,
        newSlotEnd: formattedEnd
      });
      setAlert({ type: 'success', message: 'Appointment rescheduled successfully!' });
      setOpenReschedule(false);
      setRescheduleFormData({ newSlotStart: null, newSlotEnd: null });
      setRescheduleErrors({});
      fetchAppointments();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      
      // Parse API error and map to reschedule form fields
      const fieldErrors = parseApiError(errorMessage);
      
      // Map slotStart/slotEnd to newSlotStart/newSlotEnd for reschedule
      const rescheduleFieldErrors = {};
      if (fieldErrors.slotStart) {
        rescheduleFieldErrors.newSlotStart = fieldErrors.slotStart;
      }
      if (fieldErrors.slotEnd) {
        rescheduleFieldErrors.newSlotEnd = fieldErrors.slotEnd;
      }
      
      if (Object.keys(rescheduleFieldErrors).length > 0) {
        setRescheduleErrors(rescheduleFieldErrors);
        // Also show alert as warning for general awareness
        setAlert({ type: 'error', message: errorMessage });
      } else {
        // If no field-specific error, just show alert as warning
        setAlert({ type: 'error', message: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const url = APPOINTMENT_API.startsWith('/')
        ? `${APPOINTMENT_API}/v1/appointments/${appointmentId}/cancel`
        : `${APPOINTMENT_API}/v1/appointments/${appointmentId}/cancel`;
      await axios.put(url);
      setAlert({ type: 'success', message: 'Appointment cancelled successfully!' });
      fetchAppointments();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      const url = APPOINTMENT_API.startsWith('/')
        ? `${APPOINTMENT_API}/v1/appointments/${appointmentId}/complete`
        : `${APPOINTMENT_API}/v1/appointments/${appointmentId}/complete`;
      await axios.put(url);
      setAlert({ type: 'success', message: 'Appointment completed successfully!' });
      fetchAppointments();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  const handleNoShow = async (appointmentId) => {
    try {
      const url = APPOINTMENT_API.startsWith('/')
        ? `${APPOINTMENT_API}/v1/appointments/${appointmentId}/no-show`
        : `${APPOINTMENT_API}/v1/appointments/${appointmentId}/no-show`;
      await axios.put(url);
      setAlert({ type: 'success', message: 'Appointment marked as no-show!' });
      fetchAppointments();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  // Filter doctors by department if department is selected
  const filteredDoctors = formData.department 
    ? doctors.filter(d => d.department === formData.department)
    : doctors;

  // Parse API error message and map to form fields
  const parseApiError = (errorMessage) => {
    if (!errorMessage) return {};
    
    const fieldErrors = {};
    const lowerMessage = errorMessage.toLowerCase();
    
    // Slot overlap errors - apply to both start and end times
    if (lowerMessage.includes('overlap') || 
        lowerMessage.includes('slot not available') ||
        lowerMessage.includes('already has an appointment') ||
        lowerMessage.includes('slot overlaps')) {
      fieldErrors.slotStart = errorMessage;
      fieldErrors.slotEnd = errorMessage;
    }
    
    // Patient-related errors
    if (lowerMessage.includes('patient') && (lowerMessage.includes('not found') || lowerMessage.includes('does not exist') || lowerMessage.includes('inactive'))) {
      fieldErrors.patientId = errorMessage;
    }
    
    // Doctor-related errors
    if (lowerMessage.includes('doctor') && (lowerMessage.includes('not found') || lowerMessage.includes('does not exist') || lowerMessage.includes('inactive'))) {
      fieldErrors.doctorId = errorMessage;
    }
    
    // Department mismatch
    if (lowerMessage.includes('department')) {
      fieldErrors.department = errorMessage;
    }
    
    // Slot time errors (too soon, outside hours, etc.)
    if (lowerMessage.includes('lead time') || lowerMessage.includes('2 hour') || lowerMessage.includes('at least 2')) {
      fieldErrors.slotStart = errorMessage;
    }
    
    if (lowerMessage.includes('clinic hours') || lowerMessage.includes('9') || lowerMessage.includes('6')) {
      fieldErrors.slotStart = errorMessage;
      fieldErrors.slotEnd = errorMessage;
    }
    
    return fieldErrors;
  };

  // Format date for datetime-local input
  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };


  // Format time slot for display (HH:MM)
  const formatTimeSlot = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Generate time slots from 9 AM to 6 PM (30-minute intervals)
  const generateTimeSlots = (selectedDate) => {
    const slots = [];
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    // Determine minimum time based on selected date
    let minTime = CLINIC_HOURS.start * 60; // 9 AM in minutes
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const isToday = selected.toDateString() === now.toDateString();
      if (isToday) {
        const laterMinutes = twoHoursLater.getHours() * 60 + twoHoursLater.getMinutes();
        if (laterMinutes >= CLINIC_HOURS.start * 60 && laterMinutes < CLINIC_HOURS.end * 60) {
          minTime = Math.ceil(laterMinutes / 30) * 30; // Round up to nearest 30 minutes
        }
      }
    }
    
    // Generate slots from minTime to 6 PM (18:00)
    for (let minutes = minTime; minutes < CLINIC_HOURS.end * 60; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      const displayTime = formatTimeDisplay(hours, mins);
      slots.push({ value: timeStr, label: displayTime });
    }
    
    return slots;
  };

  // Generate end time slots (must be after start time, within clinic hours)
  const generateEndTimeSlots = (startDate) => {
    if (!startDate) return [];
    
    const slots = [];
    const start = new Date(startDate);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    
    // Minimum end time is 30 minutes after start
    const minEndMinutes = startMinutes + 30;
    
    // Generate slots from minEndMinutes to 6 PM (18:00)
    for (let minutes = minEndMinutes; minutes <= CLINIC_HOURS.end * 60; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      // Don't allow slots that go past 6 PM
      if (hours >= CLINIC_HOURS.end) break;
      
      const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      const displayTime = formatTimeDisplay(hours, mins);
      slots.push({ value: timeStr, label: displayTime });
    }
    
    return slots;
  };

  // Format time for display (e.g., "9:00 AM", "2:30 PM")
  const formatTimeDisplay = (hours, minutes) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  return (
    <Box>
        <Typography variant="h4" gutterBottom>
          Appointment Booking
        </Typography>
        
        {alert && (
          <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {hasPermission('canBookAppointments') && (
            <Button variant="contained" onClick={() => setOpen(true)}>
              Book New Appointment
            </Button>
          )}
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Slot Start</TableCell>
                <TableCell>Slot End</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No appointments found
                  </TableCell>
                </TableRow>
              )}
              {appointments.map((appointment) => {
                const patient = patients.find(p => p.patientId === appointment.patientId);
                const doctor = doctors.find(d => d.doctorId === appointment.doctorId);
                return (
                  <TableRow key={appointment.appointmentId}>
                    <TableCell>{appointment.appointmentId}</TableCell>
                    <TableCell>
                      {patient ? `${patient.name} (ID: ${patient.patientId})` : `ID: ${appointment.patientId}`}
                    </TableCell>
                    <TableCell>
                      {doctor ? `${doctor.name} (${doctor.specialization})` : `ID: ${appointment.doctorId}`}
                    </TableCell>
                    <TableCell>{appointment.department}</TableCell>
                    <TableCell>{new Date(appointment.slotStart).toLocaleString()}</TableCell>
                    <TableCell>{new Date(appointment.slotEnd).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.status} 
                        color={
                          appointment.status === 'COMPLETED' ? 'success' :
                          appointment.status === 'CANCELLED' ? 'error' :
                          appointment.status === 'NO_SHOW' ? 'warning' : 'primary'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {appointment.status === 'SCHEDULED' && hasPermission('canRescheduleAppointments') && (
                          <Button size="small" variant="outlined" color="warning" onClick={() => handleReschedule(appointment.appointmentId)}>
                            Reschedule
                          </Button>
                        )}
                        {appointment.status === 'SCHEDULED' && hasPermission('canCancelAppointments') && (
                          <Button size="small" variant="outlined" color="error" onClick={() => handleCancel(appointment.appointmentId)}>
                            Cancel
                          </Button>
                        )}
                        {appointment.status === 'SCHEDULED' && hasPermission('canCompleteAppointments') && (
                          <Button size="small" variant="outlined" color="success" onClick={() => handleComplete(appointment.appointmentId)}>
                            Complete
                          </Button>
                        )}
                        {appointment.status === 'SCHEDULED' && hasPermission('canMarkNoShow') && (
                          <Button size="small" variant="outlined" color="info" onClick={() => handleNoShow(appointment.appointmentId)}>
                            No-Show
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, gap: 2 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(e, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
            <Typography variant="body2" color="text.secondary">
              Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} 
              {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
            </Typography>
          </Box>
        )}

        <Dialog open={open} onClose={() => { setOpen(false); setErrors({}); }} maxWidth="md" fullWidth>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.patientId}>
                    <InputLabel>Select Patient</InputLabel>
                    <Select
                      value={formData.patientId}
                      onChange={(e) => {
                        setFormData({ ...formData, patientId: e.target.value });
                        if (errors.patientId) setErrors({ ...errors, patientId: '' });
                      }}
                      label="Select Patient"
                    >
                      {patients.map((patient) => (
                        <MenuItem key={patient.patientId} value={patient.patientId}>
                          {patient.name} - {patient.email}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.patientId && <Typography variant="caption" color="error">{errors.patientId}</Typography>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.department}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={formData.department}
                      onChange={(e) => {
                        setFormData({ ...formData, department: e.target.value, doctorId: '' });
                        if (errors.department) setErrors({ ...errors, department: '' });
                      }}
                      label="Department"
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                    {errors.department && <Typography variant="caption" color="error">{errors.department}</Typography>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.doctorId}>
                    <InputLabel>Select Doctor</InputLabel>
                    <Select
                      value={formData.doctorId}
                      onChange={(e) => handleDoctorChange(e.target.value)}
                      label="Select Doctor"
                      disabled={!formData.department}
                    >
                      {filteredDoctors.map((doctor) => (
                        <MenuItem key={doctor.doctorId} value={doctor.doctorId}>
                          {doctor.name} - {doctor.specialization}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.doctorId && <Typography variant="caption" color="error">{errors.doctorId}</Typography>}
                    {!formData.department && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        Select department first
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Date"
                    type="date"
                    value={formData.slotStart ? formatDateTimeLocal(formData.slotStart).split('T')[0] : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const now = new Date();
                        const selectedDate = new Date(dateValue);
                        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                        
                        // If selected date is today, ensure time is at least 2 hours from now
                        const isToday = selectedDate.toDateString() === now.toDateString();
                        let startTime = isToday && twoHoursLater.getHours() >= CLINIC_HOURS.start 
                          ? twoHoursLater.getHours() * 60 + twoHoursLater.getMinutes()
                          : CLINIC_HOURS.start * 60; // 9 AM
                        
                        // Round up to nearest 30 minutes
                        startTime = Math.ceil(startTime / 30) * 30;
                        if (startTime >= CLINIC_HOURS.end * 60) {
                          // If after clinic hours, use next day
                          selectedDate.setDate(selectedDate.getDate() + 1);
                          startTime = CLINIC_HOURS.start * 60;
                        }
                        
                        const hours = Math.floor(startTime / 60);
                        const minutes = startTime % 60;
                        const newSlotStart = new Date(selectedDate);
                        newSlotStart.setHours(hours, minutes, 0, 0);
                        
                        // Auto-set slot end (30 minutes later)
                        const newSlotEnd = new Date(newSlotStart);
                        newSlotEnd.setMinutes(newSlotEnd.getMinutes() + 30);
                        
                        setFormData({ 
                          ...formData, 
                          slotStart: newSlotStart, 
                          slotEnd: newSlotEnd 
                        });
                      if (errors.slotStart) setErrors({ ...errors, slotStart: '' });
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    inputProps={{ 
                      min: new Date().toISOString().split('T')[0]
                    }}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth error={!!errors.slotStart}>
                    <InputLabel>Start Time (9 AM - 6 PM)</InputLabel>
                    <Select
                      value={formData.slotStart ? formatTimeSlot(formData.slotStart) : ''}
                    onChange={(e) => {
                        const timeValue = e.target.value;
                        if (timeValue && formData.slotStart) {
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const newSlotStart = new Date(formData.slotStart);
                          newSlotStart.setHours(hours, minutes, 0, 0);
                          
                          // Auto-set slot end (30 minutes later)
                          const newSlotEnd = new Date(newSlotStart);
                          newSlotEnd.setMinutes(newSlotEnd.getMinutes() + 30);
                          
                          setFormData({ 
                            ...formData, 
                            slotStart: newSlotStart, 
                            slotEnd: newSlotEnd 
                          });
                          if (errors.slotStart) setErrors({ ...errors, slotStart: '' });
                        }
                      }}
                      label="Start Time (9 AM - 6 PM)"
                    >
                      {generateTimeSlots(formData.slotStart).map((slot) => (
                        <MenuItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.slotStart && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.slotStart}
                      </Typography>
                    )}
                    {!errors.slotStart && (
                      <Typography variant="caption" sx={{ mt: 0.5, ml: 1.75, color: 'text.secondary' }}>
                        Clinic hours: 9:00 AM - 6:00 PM (30-minute slots)
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.slotEnd}>
                    <InputLabel>End Time (9 AM - 6 PM)</InputLabel>
                    <Select
                      value={formData.slotEnd ? formatTimeSlot(formData.slotEnd) : ''}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        if (timeValue && formData.slotStart) {
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const newSlotEnd = new Date(formData.slotStart);
                          newSlotEnd.setHours(hours, minutes, 0, 0);
                          
                          setFormData({ ...formData, slotEnd: newSlotEnd });
                      if (errors.slotEnd) setErrors({ ...errors, slotEnd: '' });
                        }
                      }}
                      label="End Time (9 AM - 6 PM)"
                      disabled={!formData.slotStart}
                    >
                      {generateEndTimeSlots(formData.slotStart).map((slot) => (
                        <MenuItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.slotEnd && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.slotEnd}
                      </Typography>
                    )}
                    {!errors.slotEnd && (
                      <Typography variant="caption" sx={{ mt: 0.5, ml: 1.75, color: 'text.secondary' }}>
                        {formData.slotStart ? 'Must be after start time' : 'Select start time first'}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              {/* Bill Summary */}
              {(formData.patientId && formData.doctorId && formData.slotStart) && (
                <Box sx={{ mt: 2 }}>
                  <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Estimated Bill Summary
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Consultation Fee:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            ₹500.00
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body1" color="text.secondary">
                              Estimated Medication Fee:
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              (Will be added after prescription)
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight="medium">
                            ₹200.00*
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Subtotal:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            ₹700.00
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            Tax (5%):
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            ₹35.00
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            Total Estimated Amount:
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            ₹735.00
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                          *Final bill will be generated after appointment completion. Medication fee may vary based on prescription.
                        </Typography>
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            <strong>Note:</strong> The actual bill will be generated automatically when the appointment is completed. 
                            Cancellation fees may apply if cancelled less than 2 hours before the appointment.
                          </Typography>
                        </Alert>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpen(false); setErrors({}); }}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Book Appointment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reschedule Appointment Dialog */}
        <Dialog open={openReschedule} onClose={() => { setOpenReschedule(false); setRescheduleErrors({}); setAlert(null); }} maxWidth="md" fullWidth>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              {/* Show warning/error alert in dialog */}
              {alert && alert.type === 'error' && (
                <Alert severity="warning" onClose={() => setAlert(null)} sx={{ mb: 1 }}>
                  {alert.message}
                </Alert>
              )}
              {alert && alert.type === 'success' && (
                <Alert severity="success" onClose={() => setAlert(null)} sx={{ mb: 1 }}>
                  {alert.message}
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Date"
                    type="date"
                    value={rescheduleFormData.newSlotStart ? formatDateTimeLocal(rescheduleFormData.newSlotStart).split('T')[0] : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const now = new Date();
                        const selectedDate = new Date(dateValue);
                        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                        
                        // If selected date is today, ensure time is at least 2 hours from now
                        const isToday = selectedDate.toDateString() === now.toDateString();
                        let startTime = isToday && twoHoursLater.getHours() >= CLINIC_HOURS.start 
                          ? twoHoursLater.getHours() * 60 + twoHoursLater.getMinutes()
                          : CLINIC_HOURS.start * 60; // 9 AM
                        
                        // Round up to nearest 30 minutes
                        startTime = Math.ceil(startTime / 30) * 30;
                        if (startTime >= CLINIC_HOURS.end * 60) {
                          // If after clinic hours, use next day
                          selectedDate.setDate(selectedDate.getDate() + 1);
                          startTime = CLINIC_HOURS.start * 60;
                        }
                        
                        const hours = Math.floor(startTime / 60);
                        const minutes = startTime % 60;
                        const newSlotStart = new Date(selectedDate);
                        newSlotStart.setHours(hours, minutes, 0, 0);
                        
                        // Auto-set slot end (30 minutes later)
                        const newSlotEnd = new Date(newSlotStart);
                        newSlotEnd.setMinutes(newSlotEnd.getMinutes() + 30);
                        
                        setRescheduleFormData({ 
                          ...rescheduleFormData, 
                          newSlotStart: newSlotStart, 
                          newSlotEnd: newSlotEnd 
                        });
                      if (rescheduleErrors.newSlotStart) setRescheduleErrors({ ...rescheduleErrors, newSlotStart: '' });
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    inputProps={{ 
                      min: new Date().toISOString().split('T')[0]
                    }}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth error={!!rescheduleErrors.newSlotStart}>
                    <InputLabel>New Start Time (9 AM - 6 PM)</InputLabel>
                    <Select
                      value={rescheduleFormData.newSlotStart ? formatTimeSlot(rescheduleFormData.newSlotStart) : ''}
                    onChange={(e) => {
                        const timeValue = e.target.value;
                        if (timeValue && rescheduleFormData.newSlotStart) {
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const newSlotStart = new Date(rescheduleFormData.newSlotStart);
                          newSlotStart.setHours(hours, minutes, 0, 0);
                          
                          // Auto-set slot end (30 minutes later)
                          const newSlotEnd = new Date(newSlotStart);
                          newSlotEnd.setMinutes(newSlotEnd.getMinutes() + 30);
                          
                          setRescheduleFormData({ 
                            ...rescheduleFormData, 
                            newSlotStart: newSlotStart, 
                            newSlotEnd: newSlotEnd 
                          });
                          if (rescheduleErrors.newSlotStart) setRescheduleErrors({ ...rescheduleErrors, newSlotStart: '' });
                        }
                      }}
                      label="New Start Time (9 AM - 6 PM)"
                    >
                      {generateTimeSlots(rescheduleFormData.newSlotStart).map((slot) => (
                        <MenuItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {rescheduleErrors.newSlotStart && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {rescheduleErrors.newSlotStart}
                      </Typography>
                    )}
                    {!rescheduleErrors.newSlotStart && (
                      <Typography variant="caption" sx={{ mt: 0.5, ml: 1.75, color: 'text.secondary' }}>
                        Clinic hours: 9:00 AM - 6:00 PM (30-minute slots)
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!rescheduleErrors.newSlotEnd}>
                    <InputLabel>New End Time (9 AM - 6 PM)</InputLabel>
                    <Select
                      value={rescheduleFormData.newSlotEnd ? formatTimeSlot(rescheduleFormData.newSlotEnd) : ''}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        if (timeValue && rescheduleFormData.newSlotStart) {
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const newSlotEnd = new Date(rescheduleFormData.newSlotStart);
                          newSlotEnd.setHours(hours, minutes, 0, 0);
                          
                          setRescheduleFormData({ ...rescheduleFormData, newSlotEnd: newSlotEnd });
                      if (rescheduleErrors.newSlotEnd) setRescheduleErrors({ ...rescheduleErrors, newSlotEnd: '' });
                        }
                      }}
                      label="New End Time (9 AM - 6 PM)"
                      disabled={!rescheduleFormData.newSlotStart}
                    >
                      {generateEndTimeSlots(rescheduleFormData.newSlotStart).map((slot) => (
                        <MenuItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {rescheduleErrors.newSlotEnd && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {rescheduleErrors.newSlotEnd}
                      </Typography>
                    )}
                    {!rescheduleErrors.newSlotEnd && (
                      <Typography variant="caption" sx={{ mt: 0.5, ml: 1.75, color: 'text.secondary' }}>
                        {rescheduleFormData.newSlotStart ? 'Must be after start time' : 'Select start time first'}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpenReschedule(false); setRescheduleErrors({}); setAlert(null); }}>Cancel</Button>
            <Button onClick={handleRescheduleSubmit} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Reschedule Appointment'}
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}

export default AppointmentBooking;
