import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Typography,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import axios from 'axios';
import { hasPermission } from '../utils/roles';

const PRESCRIPTION_API = process.env.REACT_APP_PRESCRIPTION_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8005' : '/api/prescription');
const APPOINTMENT_API = process.env.REACT_APP_APPOINTMENT_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8003' : '/api/appointment');

function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filterType, setFilterType] = useState('patient');
  const [filterId, setFilterId] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    appointmentId: '',
    patientId: '',
    doctorId: '',
    medication: '',
    dosage: '',
    days: ''
  });

  const fetchPrescriptions = async () => {
    if (!filterId) {
      setPrescriptions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let url;
      if (filterType === 'patient') {
        url = PRESCRIPTION_API.startsWith('/')
          ? `${PRESCRIPTION_API}/prescriptions/patient/${filterId}`
          : `${PRESCRIPTION_API}/v1/prescriptions/patient/${filterId}`;
      } else {
        url = PRESCRIPTION_API.startsWith('/')
          ? `${PRESCRIPTION_API}/prescriptions/appointment/${filterId}`
          : `${PRESCRIPTION_API}/v1/prescriptions/appointment/${filterId}`;
      }
      const response = await axios.get(url);
      setPrescriptions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterId) {
      fetchPrescriptions();
    }
  }, [filterType, filterId]);

  const handleCreatePrescription = async () => {
    try {
      const prescriptionData = {
        ...formData,
        appointmentId: parseInt(formData.appointmentId),
        patientId: parseInt(formData.patientId),
        doctorId: parseInt(formData.doctorId),
        days: parseInt(formData.days)
      };
      
      const url = PRESCRIPTION_API.startsWith('/')
        ? `${PRESCRIPTION_API}/prescriptions`
        : `${PRESCRIPTION_API}/v1/prescriptions`;
      await axios.post(url, prescriptionData);
      setOpen(false);
      setFormData({ appointmentId: '', patientId: '', doctorId: '', medication: '', dosage: '', days: '' });
      fetchPrescriptions();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating prescription');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Prescription Management
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter By</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Filter By"
          >
            <MenuItem value="patient">Patient ID</MenuItem>
            <MenuItem value="appointment">Appointment ID</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={filterType === 'patient' ? 'Patient ID' : 'Appointment ID'}
          type="number"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          size="small"
          placeholder={`Enter ${filterType === 'patient' ? 'Patient' : 'Appointment'} ID`}
        />
        <Button 
          variant="outlined" 
          onClick={() => fetchPrescriptions()}
          disabled={!filterId || loading}
        >
          {loading ? 'Loading...' : 'Search'}
        </Button>
        {hasPermission('canCreatePrescriptions') && (
          <Button 
            variant="contained" 
            onClick={() => setOpen(true)}
            sx={{ ml: 'auto' }}
          >
            Create Prescription
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Prescription ID</TableCell>
              <TableCell>Appointment ID</TableCell>
              <TableCell>Patient ID</TableCell>
              <TableCell>Doctor ID</TableCell>
              <TableCell>Medication</TableCell>
              <TableCell>Dosage</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Issued At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prescriptions.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {filterId ? 'No prescriptions found' : `Enter ${filterType === 'patient' ? 'Patient' : 'Appointment'} ID to search`}
                </TableCell>
              </TableRow>
            )}
            {prescriptions.map((prescription) => (
              <TableRow key={prescription.prescriptionId}>
                <TableCell>{prescription.prescriptionId}</TableCell>
                <TableCell>{prescription.appointmentId}</TableCell>
                <TableCell>{prescription.patientId}</TableCell>
                <TableCell>{prescription.doctorId}</TableCell>
                <TableCell>{prescription.medication}</TableCell>
                <TableCell>{prescription.dosage}</TableCell>
                <TableCell>{prescription.days}</TableCell>
                <TableCell>{prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Prescription</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Appointment ID"
              type="number"
              value={formData.appointmentId}
              onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Patient ID"
              type="number"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Doctor ID"
              type="number"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Medication"
              value={formData.medication}
              onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Days"
              type="number"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePrescription} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PrescriptionManagement;

