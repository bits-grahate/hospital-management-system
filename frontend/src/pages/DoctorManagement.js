import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Typography,
  Pagination, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import axios from 'axios';

// Use environment variable or default to localhost for local dev
const API_BASE_URL = process.env.REACT_APP_DOCTOR_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8002' : '/api/doctor');

function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDepartments();
    fetchSpecializations();
    fetchDoctors();
  }, [department, specialization, page]);

  const fetchDepartments = async () => {
    try {
      // Always use /v1/departments - nginx will handle the rewrite correctly
      const baseUrl = API_BASE_URL.startsWith('/') 
        ? `${API_BASE_URL}/v1/departments` 
        : `${API_BASE_URL}/v1/departments`;
      const response = await axios.get(baseUrl);
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      // Always use /v1/specializations - nginx will handle the rewrite correctly
      const baseUrl = API_BASE_URL.startsWith('/') 
        ? `${API_BASE_URL}/v1/specializations` 
        : `${API_BASE_URL}/v1/specializations`;
      const response = await axios.get(baseUrl);
      setSpecializations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      if (department) params.append('department', department);
      if (specialization) params.append('specialization', specialization);
      params.append('page', page);
      params.append('limit', limit);
      
      // Always use /v1/doctors - nginx will handle the rewrite correctly
      const baseUrl = API_BASE_URL.startsWith('/') 
        ? `${API_BASE_URL}/v1/doctors` 
        : `${API_BASE_URL}/v1/doctors`;
      const response = await axios.get(`${baseUrl}?${params}`);
      
      console.log('Doctor API Request:', `${baseUrl}?${params}`); // Debug log
      console.log('Doctor API Response:', response.data); // Debug log
      
      // Handle Spring Page format
      const content = response.data.content || response.data.data || response.data || [];
      setDoctors(Array.isArray(content) ? content : []);
      setTotalDoctors(response.data.totalElements || response.data.total || content.length);
      setTotalPages(response.data.totalPages || response.data.pagination?.pages || Math.ceil((response.data.totalElements || content.length) / limit) || 1);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      console.error('Error details:', error.response?.data); // Debug log
      setDoctors([]);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Doctor Management
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Department</InputLabel>
          <Select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            label="Filter by Department"
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Specialization</InputLabel>
          <Select
            value={specialization}
            onChange={(e) => { setSpecialization(e.target.value); setPage(1); }}
            label="Filter by Specialization"
          >
            <MenuItem value="">All Specializations</MenuItem>
            {specializations.map((spec) => (
              <MenuItem key={spec} value={spec}>{spec}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Specialization</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No doctors found
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doctor) => (
                <TableRow key={doctor.doctorId}>
                  <TableCell>{doctor.doctorId}</TableCell>
                  <TableCell>{doctor.name}</TableCell>
                  <TableCell>{doctor.email}</TableCell>
                  <TableCell>{doctor.phone}</TableCell>
                  <TableCell>{doctor.department}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, gap: 2 }}>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        )}
        <Typography variant="body2" color="text.secondary">
          Showing {doctors.length} of {totalDoctors} doctors
          {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
        </Typography>
      </Box>
    </Box>
  );
}

export default DoctorManagement;


