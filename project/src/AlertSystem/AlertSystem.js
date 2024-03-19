import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { CircularProgress, List, ListItem, ListItemText, Paper, Typography, Snackbar, Alert as MuiAlert, ListItemIcon } from '@mui/material';
import styled from 'styled-components';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { green } from '@mui/material/colors';
import './AlertSystem.css'; 

// Socket connection from Back-End
const socket = io('http://localhost:3001');

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 72vh;
  padding: 20px;
`;

const StyledPaper = styled(Paper)`
  max-width: 600px;
  margin: auto;
  padding: 20px;
  background: linear-gradient(313deg, #181835, #326291); 
  color: #fff;
  border-radius: 8px; 
  text-align: center;
`;

const AlertTitle = styled(Typography)`
  color: gold; 
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
`;

// Icon component based on severity
const SeverityIcon = ({ severity }) => {
  if (severity === 'error') return <ErrorIcon style={{ color: green[500] }} />;
  if (severity === 'warning') return <WarningIcon color="warning" />;
  if (severity === 'info') return <InfoIcon color="info" />;
  return <InfoIcon color="disabled" />;
};

function AlertSystem() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/get-predictions')
      .then(response => {
        const { anomaly_data } = response.data;
        const message = `Network anomalies detected: ${anomaly_data.abnormal} counts`;
        setAlerts((prevAlerts) => [...prevAlerts, { message, severity: 'warning' }]);
        setIsLoading(false);
        setSnackbarMessage(message);
        setOpenSnackbar(true);
      })
      .catch(error => {
        console.error('Error fetching alerts:', error);
        setIsLoading(false);
      });

    socket.on('alert', (data) => {
      setAlerts((prevAlerts) => [...prevAlerts, data]);
      setSnackbarMessage(data.message);
      setOpenSnackbar(true);
    });

    return () => {
      socket.off('alert');
    };
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container>
      <StyledPaper elevation={3}>
      <AlertTitle variant="h4" gutterBottom>
          Alert System
        </AlertTitle>
        {isLoading ? (
          <LoadingContainer>
            <CircularProgress color="secondary" />
          </LoadingContainer>
        ) : (
          <List>
            {alerts.length === 0 ? "No alerts" : alerts.map((alert, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <SeverityIcon severity={alert.severity} />
                </ListItemIcon>
                <ListItemText primary={alert.message} />
              </ListItem>
            ))}
          </List>
        )}
      </StyledPaper>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <MuiAlert onClose={handleCloseSnackbar} severity="warning" sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
}

export default AlertSystem;
