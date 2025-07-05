
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, PhoneCall, PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';

import {NavbarDash} from '../components/NavbarDashboard.jsx';

import { getSocket, initializeSocket } from '../socket.js';
import authService from '../authpage.js';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


const ContactsPage = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [contacts, setcontacts] = useState([]); 
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(''); 

  useEffect(() => {
    
    const unsubscribe = authService.subscribe((updatedUser) => {
      console.log("ContactsPage: authService.subscribe callback received updatedUser:", updatedUser);
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
      setIsLoading(false); 

      if (!updatedUser) {
        console.log("ContactsPage: User logged out via authService, redirecting to login.");
        navigate('/login');
      }

    });

    const initialUser = authService.getUser();
    console.log("contactsPage: Initial user from authService.getUser():", initialUser);
    setUser(initialUser); 
    setIsAuthenticated(!!initialUser);
    setIsLoading(false);

    if (!initialUser) {
      console.log("ContactsPage: No initial user found, redirecting to login.");
    }

    return () => {
      console.log("ContactsPage: Unsubscribing from authService.");
      unsubscribe();
    };
  }, [navigate]); 

  useEffect(() => {
   
    if (!user || !isAuthenticated) {
      console.log("ContactsPage: Skipping data fetch/socket init. User:", user, "Authenticated:", isAuthenticated);
      setIsLoading(false); 
      return;
    }

    const regionToFetch = user.region ? user.region.toLowerCase() : 'global';
    console.log("ContactsPage: Determined regionToFetch:", regionToFetch, "for user:", user.name);

      fetchContacts(regionToFetch, user.accessToken);

    const socket = getSocket(); 
    if (!socket || typeof socket.id === 'undefined' || !socket.connected) {
        console.log("ContactsPage: Socket.IO instance not fully ready or connected, real-time listeners may not attach immediately.");

    } else {
        console.log("ContactsPage: Socket connected and authenticated, attaching listeners.");

        const userRegion = user.region?.toLowerCase(); 

        const handleContactCreated = (newContact) => {
            console.log('ManageContactsPage - RECEIVED emergency_contact_updated_in_region event:', newContact);
            if (newContact.creatorId === user._id) { 
                setcontacts(prevContacts => [newContact, ...prevContacts]);
                setSuccess('New contact added successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }   
        };

        const handleContactDeleted = (data) => {
            console.log('ManageContactsPage - RECEIVED emergency_contact_deleted_in_region event:', data);
            setcontacts(prevContacts => prevContacts.filter(contact => contact._id !== data.contactId));
            setSuccess('Contact deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);
        };

        socket.on('emergency_contact_updated_in_region', handleContactCreated);
        socket.on('emergency_contact_deleted_in_region', handleContactDeleted);

        return () => {
            console.log("ManageContactsPage: Cleaning up Socket.IO event listeners.");
            socket.off('emergency_contact_created_in_region', handleContactCreated);
            socket.off('emergency_contact_deleted_in_region', handleContactDeleted);
        };
    }
  }, [user, isAuthenticated]);

  const fetchContacts = async (region, token) => {
  
    if (!region || typeof region !== 'string' || region.trim() === '') {
        const errorMessage = "Cannot fetch contacts: Region parameter is invalid or missing.";
        console.error("fetchContacts: Error -", errorMessage, "Current region value:", region, "Type:", typeof region);
        setError(errorMessage);
        setIsLoading(false);
        return;
    }
    if (!token) {
        console.error("fetchContact: Error - Access token is missing.");
        setError("Authentication token missing. Please log in again.");
        setIsLoading(false);
        return;
    }

    console.log("fetchContacts: Attempting to fetch alerts for region:", region);
    setIsLoading(true);
    setError('');
    try {
     
      const response = await axios.get(`${BACKEND_URL}/api/v2/contacts/region/${region}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Raw response data from backend (fetchContacts):", response.data);
      if (Array.isArray(response.data.data)) { 
        setcontacts(response.data.data); 
        console.log("Successfully fetched and set contacts for region:", region, response.data.data);
      } else {
        console.log("API response for contacts did not contain an array in 'data' field (fetchAlerts):", response.data);
        setcontacts([]); 
        setError(response.data.message || 'Failed to retrieve contacts: Unexpected data format.');
      }

    } catch (err) {
      console.error('Error fetching alerts (fetchcontacts):', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load contacts.');
      setcontacts([]);
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
                <p className="text-gray-400">Please <Link to="/login" className="text-pink-600 hover:underline">log in</Link> to view contacts.</p>
            </div>
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-orange-400">All Emergency Contacts</h1>
          <p className="text-lg text-gray-300">
            Alerts relevant to {user?.region?.toUpperCase()  || 'your region'} or global updates.
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

        {contacts.length === 0 ? (
          <p className="text-gray-400">NO Emergency Contact found in your region or globally for Now..</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map(contact => (
              <Card key={contact._id} className="bg-gray-800 text-white shadow-lg rounded-lg p-5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex justify-between items-center">
                    <span className="flex items-center">
                      <PhoneCall size={20} className="mr-2 text-green-400" /> {contact.organization}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-gray-300 mb-2">Number: {contact.phoneNumber}</p>
                  <p className="text-xs text-gray-400">Category: {contact.category?.charAt(0)?.toUpperCase() + contact.category?.slice(1)}</p>
                  <p className="text-xs text-gray-400">Regions: {contact.regions?.join(', ') || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">Created: {new Date(contact.createdAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};


export {ContactsPage};
