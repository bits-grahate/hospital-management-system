import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, Typography,
  Alert, CircularProgress, Pagination, Stack
} from '@mui/material';
import axios from 'axios';
import { hasPermission, getCurrentRole } from '../utils/roles';

// Always use proxy paths (nginx handles routing)
const PATIENT_API = '/api/patient';

function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
  });

  useEffect(() => {
    fetchPatients();
  }, [searchName, searchPhone, page]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (searchPhone) params.append('phone', searchPhone);
      params.append('page', page);
      params.append('limit', limit);
      
      const response = await axios.get(`${PATIENT_API}/patients?${params}`);
      
      // Handle pagination response format
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setPatients(response.data.data);
        if (response.data.pagination) {
          setTotalPatients(response.data.pagination.total || 0);
          setTotalPages(response.data.pagination.pages || response.data.pagination.totalPages || 1);
        } else {
          // Fallback: calculate from data
          setTotalPatients(response.data.data.length);
          setTotalPages(1);
        }
      } else if (Array.isArray(response.data)) {
        setPatients(response.data);
        setTotalPatients(response.data.length);
        setTotalPages(1);
      } else {
        setPatients([]);
        setTotalPatients(0);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (editMode && selectedPatient) {
        await axios.put(`${PATIENT_API}/patients/${selectedPatient.patientId}`, formData);
        setSuccess('Patient updated successfully');
      } else {
        await axios.post(`${PATIENT_API}/patients`, formData);
        setSuccess('Patient created successfully');
      }
      setOpen(false);
      setEditMode(false);
      setSelectedPatient(null);
      setFormData({ name: '', email: '', phone: '', dob: '' });
      fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving patient');
    }
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setEditMode(true);
    setFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dob: patient.dob,
    });
    setOpen(true);
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient? This will permanently remove the patient from the database.')) return;
    
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.delete(`${PATIENT_API}/patients/${patientId}`);
      // 204 No Content is a successful response
      if (response.status === 204 || response.status === 200) {
        setSuccess('Patient deleted successfully');
        fetchPatients();
      }
    } catch (err) {
      console.error('Delete patient error:', err);
      if (err.response) {
        // Error response from server
        setError(err.response?.data?.message || err.response?.data?.error || 'Error deleting patient');
      } else if (err.request) {
        // Request made but no response
        setError('Network error: Could not connect to server');
      } else {
        // Something else happened
        setError('Error deleting patient: ' + err.message);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedPatient(null);
    setFormData({ name: '', email: '', phone: '', dob: '' });
    setError(null);
    setSuccess(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Patient Management
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          size="small"
        />
        <TextField
          label="Search by Phone"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          size="small"
        />
        {hasPermission('canManagePatients') && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            Add Patient
          </Button>
        )}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.patientId}>
                <TableCell>{patient.patientId}</TableCell>
                <TableCell>{patient.name}</TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.dob}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {hasPermission('canManagePatients') && (
                      <>
                        <Button size="small" variant="outlined" onClick={() => handleEdit(patient)}>Edit</Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(patient.patientId)}>Delete</Button>
                      </>
                    )}
                    {!hasPermission('canManagePatients') && (
                      <Typography variant="body2" color="text.secondary">View Only</Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, gap: 2 }}>
        {totalPages > 1 && (
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(e, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        )}
        <Typography variant="body2" color="text.secondary">
          Showing {patients.length} of {totalPatients} patients
          {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
        </Typography>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editMode ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PatientManagement;


