import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Typography,
  Chip, Button, Alert, Pagination
} from '@mui/material';
import axios from 'axios';
import { hasPermission } from '../utils/roles';

const BILLING_API = process.env.REACT_APP_BILLING_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8004' : '/api/billing');
const PATIENT_API = process.env.REACT_APP_PATIENT_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8001' : '/api/patient');

function BillingManagement() {
  const [bills, setBills] = useState([]);
  const [patientNames, setPatientNames] = useState({}); // Map of patientId -> name
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  // Fetch patient names for all bills
  const fetchPatientNames = async (billList) => {
    const uniquePatientIds = [...new Set(billList.map(bill => bill.patientId))];
    const patientIdToName = {};
    
    // Fetch patient details for each unique patient ID
    const patientPromises = uniquePatientIds.map(async (patientId) => {
      try {
        const url = PATIENT_API.startsWith('/') 
          ? `${PATIENT_API}/v1/patients/${patientId}`
          : `${PATIENT_API}/v1/patients/${patientId}`;
        const response = await axios.get(url);
        if (response.data && response.data.patientId) {
          patientIdToName[patientId] = response.data.name || `Patient ${patientId}`;
        }
      } catch (err) {
        console.warn(`Could not fetch patient ${patientId}:`, err);
        patientIdToName[patientId] = `Patient ${patientId}`;
      }
    });
    
    await Promise.all(patientPromises);
    setPatientNames(patientIdToName);
  };

  const fetchAllBills = async (pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const url = BILLING_API.startsWith('/') 
        ? `${BILLING_API}/bills?page=${pageNum}&limit=${limit}`
        : `${BILLING_API}/v1/bills?page=${pageNum}&limit=${limit}`;
      const response = await axios.get(url);
      
      // Handle Page response
      if (response.data.content) {
        setBills(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
        await fetchPatientNames(response.data.content || []);
      } else if (Array.isArray(response.data)) {
        // Fallback for non-paginated response
        setBills(response.data);
        setTotalPages(1);
        await fetchPatientNames(response.data);
      } else {
        setBills([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching bills');
      setBills([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Search bills by patient name
  const searchBillsByName = async () => {
    if (!searchName || searchName.trim() === '') {
      fetchAllBills();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // First, search for patients by name
      const patientSearchUrl = PATIENT_API.startsWith('/') 
        ? `${PATIENT_API}/v1/patients?name=${encodeURIComponent(searchName.trim())}&page=1&limit=100`
        : `${PATIENT_API}/v1/patients?name=${encodeURIComponent(searchName.trim())}&page=1&limit=100`;
      const patientResponse = await axios.get(patientSearchUrl);
      
      const patients = patientResponse.data?.data || patientResponse.data || [];
      if (patients.length === 0) {
        setBills([]);
        setPatientNames({});
        setLoading(false);
        return;
      }

      // Get patient IDs from search results
      const patientIds = patients.map(p => p.patientId);
      
      // Fetch bills for all matching patients
      const billPromises = patientIds.map(async (patientId) => {
        try {
          const url = BILLING_API.startsWith('/') 
            ? `${BILLING_API}/bills/patient/${patientId}`
            : `${BILLING_API}/v1/bills/patient/${patientId}`;
          const response = await axios.get(url);
          return Array.isArray(response.data) ? response.data : [];
        } catch (err) {
          console.warn(`Could not fetch bills for patient ${patientId}:`, err);
          return [];
        }
      });

      const billResults = await Promise.all(billPromises);
      const allBills = billResults.flat();
      setBills(allBills);
      
      // Create patient name map
      const nameMap = {};
      patients.forEach(p => {
        nameMap[p.patientId] = p.name || `Patient ${p.patientId}`;
      });
      setPatientNames(nameMap);
    } catch (err) {
      setError(err.response?.data?.message || 'Error searching bills');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBills(page);
  }, [page]);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'OPEN':
        return 'warning';
      case 'PENDING':
        return 'warning';
      case 'VOID':
        return 'error';
      case 'REFUNDED':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleVoidBill = async (billId) => {
    if (!window.confirm('Are you sure you want to void this bill?')) return;
    
    try {
      const url = BILLING_API.startsWith('/')
        ? `${BILLING_API}/bills/${billId}/void`
        : `${BILLING_API}/v1/bills/${billId}/void`;
      await axios.put(url);
      if (searchName) {
        searchBillsByName();
      } else {
        fetchAllBills();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error voiding bill');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Billing Management
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search by Patient Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          size="small"
          placeholder="Enter patient name to search"
          sx={{ minWidth: 250 }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              searchBillsByName();
            }
          }}
        />
        <Button 
          variant="contained" 
          onClick={searchBillsByName}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Search'}
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => {
            setPage(1);
            setSearchName('');
            fetchAllBills(1);
          }}
          disabled={loading}
        >
          Show All Bills
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill ID</TableCell>
              <TableCell>Patient Name</TableCell>
              <TableCell>Patient ID</TableCell>
              <TableCell>Appointment ID</TableCell>
              <TableCell>Consultation Fee</TableCell>
              <TableCell>Medication Fee</TableCell>
              <TableCell>Tax Amount</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {searchName ? `No bills found for patients matching "${searchName}"` : 'No bills found. Bills will appear here once appointments are completed.'}
                </TableCell>
              </TableRow>
            )}
            {bills.map((bill) => (
              <TableRow key={bill.billId}>
                <TableCell>{bill.billId}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {patientNames[bill.patientId] || `Loading...`}
                  </Typography>
                </TableCell>
                <TableCell>{bill.patientId}</TableCell>
                <TableCell>{bill.appointmentId}</TableCell>
                <TableCell>₹{bill.consultationFee?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>₹{bill.medicationFee?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>₹{bill.taxAmount?.toFixed(2) || '0.00'}</TableCell>
                <TableCell><strong>₹{bill.totalAmount?.toFixed(2) || '0.00'}</strong></TableCell>
                <TableCell>
                  <Chip 
                    label={bill.status || 'PENDING'} 
                    color={getStatusColor(bill.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {bill.status !== 'VOID' && hasPermission('canVoidBills') && (
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleVoidBill(bill.billId)}
                    >
                      Void
                    </Button>
                  )}
                  {bill.status !== 'VOID' && !hasPermission('canVoidBills') && (
                    <Typography variant="body2" color="text.secondary">View Only</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {!searchName && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(e, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}

export default BillingManagement;

