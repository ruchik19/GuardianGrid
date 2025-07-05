
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, BellRing, Siren, XCircle, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';

import {NavbarDash} from '../components/NavbarDashboard.jsx';

import { getSocket, initializeSocket } from '../socket.js';
import authService from '../authpage.js';

const AlertsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(''); 

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      console.log("AlertsPage: authService.subscribe callback received updatedUser:", updatedUser);
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
      setIsLoading(false);

      if (!updatedUser) {
        console.log("AlertsPage: User logged out via authService, redirecting to login.");
        navigate('/login');
      }
    });

    const initialUser = authService.getUser();
    console.log("AlertsPage: Initial user from authService.getUser():", initialUser);
    setUser(initialUser); 
    setIsAuthenticated(!!initialUser);
    setIsLoading(false);
    if (!initialUser) {
      console.log("AlertsPage: No initial user found, redirecting to login.");
    }

    return () => {
      console.log("AlertsPage: Unsubscribing from authService.");
      unsubscribe();
    };
  }, [navigate]); 

  useEffect(() => {
    if (!user || !isAuthenticated) {
      console.log("AlertsPage: Skipping data fetch/socket init. User:", user, "Authenticated:", isAuthenticated);
      setIsLoading(false);
      return;
    }

    const regionToFetch = user.region ? user.region.toLowerCase() : 'global';
    console.log("AlertsPage: Determined regionToFetch:", regionToFetch, "for user:", user.name);

      fetchAlerts(regionToFetch, user.accessToken);

    const socket = getSocket(); 
    if (!socket || typeof socket.id === 'undefined' || !socket.connected) {
        console.log("AlertsPage: Socket.IO instance not fully ready or connected, real-time listeners may not attach immediately.");
    } else {
        console.log("AlertsPage: Socket connected and authenticated, attaching listeners.");

        const userRegion = user.region?.toLowerCase(); 

        const handleNewAlert = (newAlert) => {
          console.log('AlertsPage - RECEIVED new_alert_in_region event:', newAlert);
          const alertRegions = newAlert.targetRegions?.map(r => r.toLowerCase()) || [];
          const isRelevant = userRegion && (alertRegions.includes(userRegion) || alertRegions.includes("global"));

          if (isRelevant && newAlert.isActive) {
            setAlerts(prevAlerts => {
                const updatedAlerts = [newAlert, ...prevAlerts];
                const uniqueAlerts = Array.from(new Map(updatedAlerts.map(item => [item['_id'], item])).values());
                return uniqueAlerts.filter(alert => alert.isActive);
            });
            setSuccess(`New Alert: ${newAlert.title}!`);
            setTimeout(() => setSuccess(''), 3000);
          }
        };

        const handleAlertDeactivated = (data) => {
          console.log('AlertsPage - RECEIVED alert_deactivated_in_region event:', data);
          setAlerts(prevAlerts => prevAlerts.map(alert =>
            alert._id === data.alertId ? { ...alert, isActive: data.isActive } : alert
          ).filter(alert => alert.isActive)); 
          setSuccess(`An alert has been ${data.isActive ? 'activated' : 'deactivated'}.`);
          setTimeout(() => setSuccess(''), 3000);
        };

        const handleAlertDeleted = (data) => {
          console.log('AlertsPage - RECEIVED alert_deleted_in_region event:', data);
          setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== data.alertId));
          setSuccess('An alert has been deleted.');
          setTimeout(() => setSuccess(''), 3000);
        };

        socket.on('new_alert_in_region', handleNewAlert);
        socket.on('alert_deactivated_in_region', handleAlertDeactivated);
        socket.on('alert_deleted_in_region', handleAlertDeleted);

        return () => {
          console.log("AlertsPage: Cleaning up Socket.IO event listeners.");
          socket.off('new_alert_in_region', handleNewAlert);
          socket.off('alert_deactivated_in_region', handleAlertDeactivated);
          socket.off('alert_deleted_in_region', handleAlertDeleted);

        };
    }
  }, [user, isAuthenticated]); 

  const fetchAlerts = async (region, token) => {
    if (!region || typeof region !== 'string' || region.trim() === '') {
        const errorMessage = "Cannot fetch alerts: Region parameter is invalid or missing.";
        console.error("fetchAlerts: Error -", errorMessage, "Current region value:", region, "Type:", typeof region);
        setError(errorMessage);
        setIsLoading(false);
        return;
    }
    if (!token) {
        console.error("fetchAlerts: Error - Access token is missing.");
        setError("Authentication token missing. Please log in again.");
        setIsLoading(false);
        return;
    }

    console.log("fetchAlerts: Attempting to fetch alerts for region:", region);
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:8000/api/v2/alerts/region/${region}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Raw response data from backend (fetchAlerts):", response.data);
      if (Array.isArray(response.data.data)) { 
        setAlerts(response.data.data); 
        console.log("Successfully fetched and set alerts for region:", region, response.data.data);
      } else {
        console.log("API response for alerts did not contain an array in 'data' field (fetchAlerts):", response.data);
        setAlerts([]); 
        setError(response.data.message || 'Failed to retrieve alerts: Unexpected data format.');
      }

    } catch (err) {
      console.error('Error fetching alerts (fetchAlerts):', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load alerts.');
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  
  if (isLoading || user === null) { 
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-4 text-lg">Loading alerts and checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <NavbarDash />
            <div className="flex-1 flex items-center justify-center py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p className="text-gray-400">Please <Link to="/login" className="text-pink-800 hover:underline">log in</Link> to view alerts.</p>
            </div>
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-orange-400">All Active Alerts</h1>
          <p className="text-lg text-gray-300">
            Alerts relevant to {user?.region?.toUpperCase() || 'your region'} or global updates.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="bg-teal-800 text-white mb-4">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Update!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {alerts.length === 0 ? (
          <p className="text-gray-400 text-center text-lg">No active alerts found for your region or globally at this time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map(alert => (
              <Card key={alert._id} className="bg-gray-800 text-white shadow-lg rounded-lg p-5 border border-gray-700 hover:border-orange-500 transition-colors duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center text-orange-300">
                    {alert.type === 'war' ? <Siren size={20} className="mr-2 text-red-400" /> : <BellRing size={20} className="mr-2 text-orange-400" />}
                    {alert.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 text-gray-300">
                  <p className="mb-2">{alert.message}</p>
                  <p className="text-sm text-gray-400">
                    Severity: <span className={
                      alert.severity === 'high' || alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'medium' ? 'text-yellow-300' : 'text-green-600'
                    }>
                      {alert.severity?.charAt(0)?.toUpperCase() + alert.severity?.slice(1) || 'N/A'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Type: {alert.type?.charAt(0)?.toUpperCase() + alert.type?.slice(1) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-400">Regions: {alert.targetRegions?.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ') || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-2">Issued: {new Date(alert.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Last Updated: {new Date(alert.updatedAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export {AlertsPage};
