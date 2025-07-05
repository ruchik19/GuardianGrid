
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, BellRing, PlusCircle, Edit, Trash2, Zap, ToggleRight, ToggleLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert.jsx';
import {NavbarDash} from '../components/NavbarDashboard.jsx';
import { getSocket, initializeSocket } from '../socket.js';
import authService from '../authpage.js';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ManageAlertsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState([]); 
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(''); 

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
      setIsLoading(false);

      if (!updatedUser) {
        console.log("ManageAlertsPage: Auth service reported logout, redirecting to login.");
        navigate('/login');
      } else if (updatedUser.role !== 'armyofficial') {
        console.log("ManageAlertsPage: User is not an army official, redirecting to dashboard.");
        setError('Access Denied: Only Army Officials can manage alerts.');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        console.log("ManageAlertsPage: User is army official. Initializing socket and fetching alerts.");
        initializeSocket(updatedUser);
        fetchMyAlerts(updatedUser.accessToken); 
      }
    });

    
    const initialUser = authService.getUser();
    if (!initialUser) {
      setIsLoading(false); 
      navigate('/login'); 
    } else if (initialUser.role !== 'armyofficial') {
      setIsLoading(false); 
      setError('Access Denied: Only Army Officials can manage alerts.');
      setTimeout(() => navigate('/dashboard'), 3000);
    } else {
      
      setUser(initialUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      initializeSocket(initialUser);
      fetchMyAlerts(initialUser.accessToken);
    }
    return () => unsubscribe();
  }, [navigate]); 

  const fetchMyAlerts = async (token) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v2/alerts/my-alerts`, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });
      setAlerts(response.data.data);
      console.log("Fetched my alerts:", response.data.data);
    } catch (err) {
      console.error('Error fetching my alerts:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to retrieve your alerts.');
      setAlerts([]);
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    const socket = getSocket(); 
    if (!socket || !isAuthenticated || !socket.connected || typeof socket.id === 'undefined' || !user || user.role !== 'armyofficial') {
      console.log("ManageAlertsPage: Socket not ready/authorized for listeners. Deferring setup.");
      return;
    }
    console.log("ManageAlertsPage: Socket connected and authorized, attaching listeners.");
    const handleNewAlert = (newAlert) => {
      console.log('ManageAlertsPage - RECEIVED new_alert_in_region event:', newAlert);
      if (newAlert.creatorId === user._id) {
        setAlerts(prevAlerts => [newAlert, ...prevAlerts]); 
        setSuccess('New alert created and updated on dashboard!');
        setTimeout(() => setSuccess(''), 3000); 
      }
    };

    const handleAlertDeactivated = (data) => {
      console.log('ManageAlertsPage - RECEIVED alert_deactivated_in_region event:', data);
      setAlerts(prevAlerts => prevAlerts.map(alert =>
        alert._id === data.alertId ? { ...alert, isActive: data.isActive } : alert 
      ));
      setSuccess(`Alert ${data.isActive ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    };

    const handleAlertDeleted = (data) => {
      console.log('ManageAlertsPage - RECEIVED alert_deleted_in_region event:', data);
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== data.alertId)); 
      setSuccess('Alert deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    };

    const handleAlertUpdated = (updatedAlert) => {
      console.log('ManageAlertsPage - RECEIVED alert_updated_in_region event:', updatedAlert);
      setAlerts(prevAlerts => prevAlerts.map(alert =>
        alert._id === updatedAlert._id ? updatedAlert : alert
      ));
      setSuccess('Alert updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    };

    socket.on('new_alert_in_region', handleNewAlert);
    socket.on('alert_deactivated_in_region', handleAlertDeactivated);
    socket.on('alert_deleted_in_region', handleAlertDeleted);
    socket.on('alert_updated_in_region', handleAlertUpdated);

    return () => {
      console.log("ManageAlertsPage: Cleaning up Socket.IO event listeners.");
      socket.off('new_alert_in_region', handleNewAlert);
      socket.off('alert_deactivated_in_region', handleAlertDeactivated);
      socket.off('alert_deleted_in_region', handleAlertDeleted);
      socket.off('alert_updated_in_region', handleAlertUpdated);
    };
  }, [user, isAuthenticated]);

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert? This action cannot be undone.')) {
      return; 
    }
    setError(''); 
    setSuccess(''); 
    try {
      await axios.delete(`${BACKEND_URL}/api/v2/alerts/delete/${alertId}`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}` 
        }
      });
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== alertId));
      setSuccess('Alert deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting alert:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to delete alert.');
    }
  };

  const handleDeactivateAlert = async (alertId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate'; 
    if (!window.confirm(`Are you sure you want to ${action} this alert?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(`${BACKEND_URL}/api/v2/alerts/deactivate/${alertId}`, { isActive: !currentStatus }, {
        headers: {
          Authorization: `Bearer ${user.accessToken}` 
        }
      });
      setAlerts(prevAlerts => prevAlerts.map(alert =>
        alert._id === alertId ? { ...alert, isActive: response.data.data.isActive } : alert
      ));
      setSuccess(`Alert ${action}d successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(`Error ${action}ing alert:`, err.response?.data || err.message);
      setError(err.response?.data?.message || `Failed to ${action} alert.`);
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-4 text-lg">Loading or checking authorization...</p>
        </div>
 
      </div>
    );
  }

  if (user?.role !== 'armyofficial') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">Only Army Officials can manage alerts. Please <Link to="/login" className="text-orange-400 hover:underline">log in</Link> with an authorized account.</p>
        </div>
  
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Manage Alerts</h1>
          <p className="text-lg text-gray-300">View and manage alerts you have created.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="bg-teal-800 text-white mb-4">
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button asChild className="mb-6 bg-orange-600 hover:bg-orange-700 text-white">
          <Link to="/alerts/create"><PlusCircle className="h-4 w-4 mr-2" /> Create New Alert</Link>
        </Button>

        {alerts.length === 0 ? (
          <p className="text-gray-400">You haven't created any alerts yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {alerts.map(alert => (
              <Card key={alert._id} className="bg-gray-800 text-white shadow-lg rounded-lg p-5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex justify-between items-center">
                    <span className="flex items-center">
                      {alert.type === 'war' ? <Zap size={20} className="mr-2 text-red-400" /> : <BellRing size={20} className="mr-2 text-orange-400" />}
                      {alert.title}
                    </span>

                    <div className="flex gap-2">
                      <Button
                        variant={alert.isActive ? "secondary" : "default"} 
                        size="sm"
                        onClick={() => handleDeactivateAlert(alert._id, alert.isActive)}
                        className={`${alert.isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                      >
                        {alert.isActive ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                        {alert.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteAlert(alert._id)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                  <p className="text-xs text-gray-400">Severity: <span className={alert.severity === 'High' ? 'text-red-300' : alert.severity === 'Medium' ? 'text-yellow-300' : 'text-green-300'}>{alert.severity}</span></p>
                  <p className="text-xs text-gray-400">Type: {alert.type}</p>
                  <p className="text-xs text-gray-400">Regions: {alert.targetRegions?.join(', ') || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-2">Status: {alert.isActive ? 'Active' : 'Deactivated'}</p>
                  <p className="text-xs text-gray-500 mt-1">Issued: {new Date(alert.createdAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export  {ManageAlertsPage};
