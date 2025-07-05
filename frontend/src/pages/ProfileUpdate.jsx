
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, User, MapPin, Phone, Edit, Save, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import {NavbarDash} from '../components/NavbarDashboard.jsx';
import authService from '../authpage.js'; 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    contact: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
      setIsLoading(false);

      if (updatedUser) {
        fetchUserDetails(updatedUser.accessToken);
      } else {
        navigate('/login');
      }
    });

    const initialUser = authService.getUser();
    setUser(initialUser);
    setIsAuthenticated(!!initialUser);
    if (initialUser) {
      fetchUserDetails(initialUser.accessToken);
    } else {
      setIsLoading(false);
      navigate('/login');
    }

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserDetails = async (token) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!token) {
        setErrorMessage('Authentication token missing. Please log in.');
        setIsLoading(false);
        return;
      }
      const response = await axios.get(`${BACKEND_URL}/api/v2/users/current-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.data;
      setFormData({
        name: userData.name || '',
        region: userData.region || '',
        contact: userData.contact || '',
        latitude: userData.location?.coordinates?.[1]?.toString() || '',
        longitude: userData.location?.coordinates?.[0]?.toString() || '',
      });
      console.log("Fetched user details:", userData);
    } catch (error) {
      console.error('Error fetching user details:', error.response?.data || error.message);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setErrorMessage(error.response?.data?.message || 'Failed to load user details.');
      }else {
        console.log("Authentication issue during fetchUserDetails");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!user || !user.accessToken) {
      setErrorMessage('Authentication required. Please log in.');
      setIsSubmitting(false);
      return;
    }

    const { name, region, contact, latitude, longitude } = formData;
    const updateData = {};
    if (name.trim() !== '') updateData.name = name.trim();
    if (region.trim() !== '') updateData.region = region.trim();
    if (contact.trim() !== '') updateData.contact = contact.trim();

    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    const isLatLonProvided = latitude.trim() !== '' || longitude.trim() !== '';
    const isLatLonValid = !isNaN(parsedLatitude) && !isNaN(parsedLongitude);

    if (isLatLonProvided) {
      if (!isLatLonValid) {
        setErrorMessage('Both Latitude and Longitude must be valid numbers if provided.');
        setIsSubmitting(false);
        return;
      }
      updateData.latitude = parsedLatitude;
      updateData.longitude = parsedLongitude;
    }

    if (Object.keys(updateData).length === 0) {
      setErrorMessage('At least one field (Name, Region, Contact, Latitude, or Longitude) is required for update.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.patch(`${BACKEND_URL}/api/v2/users/update-account`, updateData, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
      setSuccessMessage('Account details updated successfully!');
      console.log('Update response:', response.data);

      await authService.refreshUser();
      
      setErrorMessage('');
    } catch (error) {
      console.error('Error updating account details:', error.response?.data || error.message);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setErrorMessage(error.response?.data?.message || 'Failed to update account details.');
      } else {
         console.log("Authentication issue during updateAccountDetails, likely handled by authService.logout() via refreshUser.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated === undefined) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-4 text-lg">Loading profile...</p>
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
          <p className="text-gray-400">Please log in to view your profile.</p>
          <Button onClick={() => navigate('/login')} className="mt-4 bg-blue-600 hover:bg-blue-700">Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-purple-400">
            <User size={40} className="inline-block mr-3" /> My Profile
          </h1>
          <p className="text-lg text-gray-300">Update your account information.</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-4 bg-teal-800 text-white border-green-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto border border-purple-700">
          <CardHeader className="pb-4 border-b border-gray-700">
            <CardTitle className="text-2xl font-bold text-purple-300">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-gray-300 mb-1 block">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  className="bg-gray-700 border-gray-600 focus-visible:ring-purple-500 text-white"
                />
              </div>
              <div>
                <Label htmlFor="region" className="text-gray-300 mb-1 block">Region (City/Area)</Label>
                <Input
                  id="region"
                  type="text"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="e.g., Pune, Mumbai"
                  className="bg-gray-700 border-gray-600 focus-visible:ring-purple-500 text-white"
                />
              </div>
              <div>
                <Label htmlFor="contact" className="text-gray-300 mb-1 block">Contact Information</Label>
                <Input
                  id="contact"
                  type="text"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="e.g., +91-1234567890"
                  className="bg-gray-700 border-gray-600 focus-visible:ring-purple-500 text-white"
                />
              </div>

              <hr className="my-6 bg-gray-700" />

              <h3 className="text-xl font-semibold text-purple-300 flex items-center mb-4">
                <MapPin size={20} className="mr-2" /> Update Location (Optional)
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                If you update your location, please provide both Latitude and Longitude.
              </p>

              <div>
                <Label htmlFor="latitude" className="text-gray-300 mb-1 block">Latitude</Label>
                <Input
                  id="latitude"
                  type="text" 
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 18.5204"
                  className="bg-gray-700 border-gray-600 focus-visible:ring-purple-500 text-white"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-gray-300 mb-1 block">Longitude</Label>
                <Input
                  id="longitude"
                  type="text" 
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 73.8567"
                  className="bg-gray-700 border-gray-600 focus-visible:ring-purple-500 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export {ProfilePage};
