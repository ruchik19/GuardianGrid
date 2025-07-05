
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, PlusCircle, Building2, Edit, Trash2, CheckCircle, XCircle, MapPin, Users, PhoneCall, Stethoscope , LayoutList} from 'lucide-react'; 
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx';
import {NavbarDash} from '../components/NavbarDashboard.jsx';
import authService from '../authpage.js'; 

const ManageSheltersPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shelters, setShelters] = useState([]); 
  const [shelterFormData, setShelterFormData] = useState({
    name: '',
    description: '',
    shelterType: '',
    shelterfor: 'calamity', 
    calamityTypes: [], 
    location: { latitude: '', longitude: '', address: '' }, 
    capacity: '',
    occupancy: 0,
    isAvailable: true,
    militaryOnly: false,
    hasMedicalSupport: false,
    contactInfo: '',
    region: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [currentEditingShelterId, setCurrentEditingShelterId] = useState(null);
  const predefinedCalamityTypes = [
    'flood', 'earthquake', 'cyclone', 'wildfire', 'tsunami', 'drought', 'volcanic_eruption',
    'landslide', 'pandemic', 'hailstorm', 'heatwave', 'coldwave'
  ];
-
  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);

      if (updatedUser && updatedUser.role === 'armyofficial') {
        setIsAuthorized(true);
        if (!isEditing && updatedUser.region) {
            setShelterFormData(prev => ({ ...prev, region: updatedUser.region }));
        }
        fetchMyShelters(updatedUser.accessToken);
      } else {
        setIsAuthorized(false);
        setShelters([]);
        setErrorMessage('You are not authorized to manage shelters.');
      }
      setIsLoading(false);
    });

    const initialUser = authService.getUser();
    setUser(initialUser);
    setIsAuthenticated(!!initialUser);
    if (initialUser && initialUser.role === 'armyofficial') {
        setIsAuthorized(true);
        if (!isEditing && initialUser.region) {
            setShelterFormData(prev => ({ ...prev, region: initialUser.region }));
        }
        fetchMyShelters(initialUser.accessToken);
    } else {
        setIsAuthorized(false);
        setErrorMessage('You are not authorized to manage shelters.');
        setIsLoading(false);
    }

    if (!initialUser) {
        navigate('/login');
    }

    return () => unsubscribe();
  }, [navigate, isEditing]); 

  const fetchMyShelters = async (token) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await axios.get('http://localhost:8000/api/v2/shelters/my-shelter', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShelters(response.data.data);
      console.log("My Shelters:", response.data.data);
    } catch (error) {
      console.error('Error fetching my shelters:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to load your shelters.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (['latitude', 'longitude', 'address'].includes(id)) {
      setShelterFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [id]: value
        }
      }));
    } else if (type === 'checkbox') {
      setShelterFormData(prev => ({
        ...prev,
        [id]: checked
      }));
    } else {
      setShelterFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSelectChange = (id, value) => {
    setShelterFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCalamityTypeChange = (type) => {
    setShelterFormData(prev => {
      const currentTypes = prev.calamityTypes;
      if (currentTypes.includes(type)) {
        return { ...prev, calamityTypes: currentTypes.filter(t => t !== type) };
      } else {
        return { ...prev, calamityTypes: [...currentTypes, type] };
      }
    });
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

    const { name, location, capacity, region, shelterType, shelterfor } = shelterFormData;

    if (!name || !location.address || !shelterType || !shelterfor || !capacity || !region || !location.latitude || !location.longitude) {
      setErrorMessage('Please fill in all required fields: Name, Address, Shelter Type, Shelter For, Capacity, Region, Latitude, and Longitude.');
      setIsSubmitting(false);
      return;
    }

    const parsedLatitude = parseFloat(location.latitude);
    const parsedLongitude = parseFloat(location.longitude);
    const parsedCapacity = Number(capacity);
    const parsedOccupancy = Number(shelterFormData.occupancy);

    if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
        setErrorMessage('Latitude and Longitude must be valid numbers.');
        setIsSubmitting(false);
        return;
    }
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        setErrorMessage('Capacity must be a positive number.');
        setIsSubmitting(false);
        return;
    }
    if (isNaN(parsedOccupancy) || parsedOccupancy < 0) {
        setErrorMessage('Occupancy cannot be a negative number.');
        setIsSubmitting(false);
        return;
    }
    if (parsedOccupancy > parsedCapacity) {
        setErrorMessage('Occupancy cannot exceed capacity.');
        setIsSubmitting(false);
        return;
    }


    try {
      let response;
      const payload = {
        ...shelterFormData,
        capacity: parsedCapacity,
        occupancy: parsedOccupancy,
        location: {
          latitude: parsedLatitude, 
          longitude: parsedLongitude, 
          address: shelterFormData.location.address, 
        },
        region: shelterFormData.region.toLowerCase(),
        calamityTypes: shelterFormData.calamityTypes.map(t => t.toLowerCase())
      };

      if (isEditing) {
        response = await axios.patch(`http://localhost:8000/api/v2/shelters/update/${currentEditingShelterId}`, payload, {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        setSuccessMessage('Shelter updated successfully!');
      } else {
        response = await axios.post('http://localhost:8000/api/v2/shelters/create', payload, {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        setSuccessMessage('Shelter added successfully!');
      }
      console.log('Server response:', response.data);

      resetForm();

      fetchMyShelters(user.accessToken);

    } catch (error) {
      console.error('Error submitting shelter:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} shelter. Please check all fields.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (shelter) => {
    setIsEditing(true);
    setCurrentEditingShelterId(shelter._id);
    setSuccessMessage('');
    setErrorMessage('');
    setShelterFormData({
      name: shelter.name || '',
      description: shelter.description || '',
      shelterType: shelter.shelterType || '',
      shelterfor: shelter.shelterfor || 'calamity',
      calamityTypes: shelter.calamityTypes || [],
      location: {
        latitude: shelter.location?.coordinates?.[1]?.toString() || '',
        longitude: shelter.location?.coordinates?.[0]?.toString() || '',
        address: shelter.location?.address || ''
      },
      capacity: shelter.capacity?.toString() || '', 
      occupancy: shelter.occupancy || 0,
      isAvailable: shelter.isAvailable,
      militaryOnly: shelter.militaryOnly,
      hasMedicalSupport: shelter.hasMedicalSupport,
      contactInfo: shelter.contactInfo || '',
      region: shelter.region || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentEditingShelterId(null);
    setShelterFormData({
      name: '',
      description: '',
      shelterType: '',
      shelterfor: 'calamity',
      calamityTypes: [],
      location: { latitude: '', longitude: '', address: '' },
      capacity: '',
      occupancy: 0,
      isAvailable: true,
      militaryOnly: false,
      hasMedicalSupport: false,
      contactInfo: '',
      region: user?.region || '', 
    });
  };

  const handleDeleteShelter = async (shelterId) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!user || !user.accessToken) {
      setErrorMessage('Authentication required to delete a shelter.');
      return;
    }
    try {
      await axios.delete(`http://localhost:8000/api/v2/shelters/delete/${shelterId}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
      setSuccessMessage('Shelter deleted successfully!');
      fetchMyShelters(user.accessToken); 
    } catch (error) {
      console.error('Error deleting shelter:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to delete shelter.');
    }
  };

  if (isLoading || isAuthenticated === undefined) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-4 text-lg">Loading and checking authorization...</p>
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
          <p className="text-gray-400">Please <Link to="/login" className="text-orange-400 hover:underline">log in</Link> to manage shelters.</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Authorization Required</h2>
          <p className="text-gray-400">{errorMessage || 'You do not have the necessary permissions to access this page.'}</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-purple-600 hover:bg-purple-700">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center text-green-400">
            <Building2 size={36} className="mr-3" /> Manage Shelters
          </h1>
          <p className="text-lg text-gray-300">
            {isEditing ? `Editing Shelter: ${shelterFormData.name}` : 'Add a new emergency shelter or manage existing ones.'}
          </p>
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

        <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-6 mb-8 border border-green-700">
          <CardHeader className="pb-4 border-b border-gray-700">
            <CardTitle className="text-2xl font-bold text-green-300">
              {isEditing ? 'Edit Shelter Details' : 'Add New Shelter'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300 mb-1 block">Shelter Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={shelterFormData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Community Hall, School Gym"
                    className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="region" className="text-gray-300 mb-1 block">Region (City/Area)</Label>
                  <Input
                    id="region"
                    type="text"
                    value={shelterFormData.region}
                    onChange={handleInputChange}
                    placeholder="e.g., Pune, Mumbai"
                    className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-gray-300 mb-1 block">Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={shelterFormData.location.address}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Main St, Central City"
                  className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300 mb-1 block">Description</Label>
                <Textarea
                  id="description"
                  value={shelterFormData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a brief description of the shelter and its facilities."
                  className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shelterType" className="text-gray-300 mb-1 block">Shelter Type</Label>
                  <Select value={shelterFormData.shelterType} onValueChange={(val) => handleSelectChange('shelterType', val)} required>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white focus-visible:ring-green-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 text-white border-gray-600">
                      <SelectItem value="community_hall">Community Hall</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="tent_camp">Tent Camp</SelectItem>
                      <SelectItem value="religious_place">Religious Place</SelectItem>
                      <SelectItem value="bunker">Bunker</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shelterfor" className="text-gray-300 mb-1 block">Shelter For</Label>
                  <Select value={shelterFormData.shelterfor} onValueChange={(val) => handleSelectChange('shelterfor', val)} required>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white focus-visible:ring-green-500">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 text-white border-gray-600">
                      <SelectItem value="war">War</SelectItem>
                      <SelectItem value="calamity">Calamity</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity" className="text-gray-300 mb-1 block">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={shelterFormData.capacity}
                    onChange={handleInputChange}
                    placeholder="Total capacity"
                    className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="occupancy" className="text-gray-300 mb-1 block">Current Occupancy</Label>
                  <Input
                    id="occupancy"
                    type="number"
                    value={shelterFormData.occupancy}
                    onChange={handleInputChange}
                    placeholder="Current number of occupants"
                    className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude" className="text-gray-300 mb-1 block">Latitude</Label>
                  <Input
                    id="latitude"
                    type="text" 
                    value={shelterFormData.location.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 18.5204"
                    className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-gray-300 mb-1 block">Longitude</Label>
                  <Input
                    id="longitude"
                    type="text" 
                    value={shelterFormData.location.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 73.8567"
                    className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAvailable"
                    checked={shelterFormData.isAvailable}
                    onCheckedChange={(checked) => handleInputChange({ target: { id: 'isAvailable', type: 'checkbox', checked }})}
                  />
                  <Label htmlFor="isAvailable" className="text-gray-300">Is Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="militaryOnly"
                    checked={shelterFormData.militaryOnly}
                    onCheckedChange={(checked) => handleInputChange({ target: { id: 'militaryOnly', type: 'checkbox', checked }})}
                  />
                  <Label htmlFor="militaryOnly" className="text-gray-300">Military Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasMedicalSupport"
                    checked={shelterFormData.hasMedicalSupport}
                    onCheckedChange={(checked) => handleInputChange({ target: { id: 'hasMedicalSupport', type: 'checkbox', checked }})}
                  />
                  <Label htmlFor="hasMedicalSupport" className="text-gray-300">Has Medical Support</Label>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Calamity Types (Select all that apply)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {predefinedCalamityTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`calamity-${type}`}
                        checked={shelterFormData.calamityTypes.includes(type)}
                        onCheckedChange={() => handleCalamityTypeChange(type)}
                      />
                      <Label htmlFor={`calamity-${type}`} className="text-gray-300 capitalize">{type.replace(/_/g, ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="contactInfo" className="text-gray-300 mb-1 block">Contact Information</Label>
                <Input
                  id="contactInfo"
                  type="text"
                  value={shelterFormData.contactInfo}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe, +91-1234567890"
                  className="bg-gray-700 border-gray-600 focus-visible:ring-green-500 text-white"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                  disabled={isSubmitting}
                >
                  {isEditing ? 'Cancel Edit' : 'Clear Form'}
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />} {isEditing ? 'Update Shelter' : 'Add Shelter'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <hr className="my-8 bg-gray-700" />

        <h2 className="text-3xl font-bold mb-6 flex items-center text-green-400">
          <LayoutList size={30} className="mr-2" /> My Created Shelters
        </h2>
        {isLoading ? ( 
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-green-500" />
                <p className="ml-4 text-lg">Loading your shelters...</p>
            </div>
        ) : shelters.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">You haven't created any shelters yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shelters.map((shelter) => (
              <Card key={shelter._id} className="bg-gray-800 text-white shadow-lg rounded-lg p-5 border border-gray-700 hover:border-green-500 transition-colors duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center text-green-300">
                    <Building2 size={20} className="mr-2" /> {shelter.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 text-gray-300">
                  <p className="flex items-center mb-1">
                    <MapPin size={16} className="mr-2 text-blue-400" />
                    Address: {shelter.location?.address} 
                  </p>
                  <p className="flex items-center mb-1">
                    <Users size={16} className="mr-2 text-purple-400" />
                    Occupancy: {shelter.occupancy} / {shelter.capacity}
                  </p>
                  <p className={`font-semibold ${shelter.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    Status: {shelter.isAvailable ? 'Available' : 'Full'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Type: {shelter.shelterType?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    {shelter.militaryOnly && <span className="ml-2 text-yellow-400">(Military Only)</span>}
                    {shelter.hasMedicalSupport && <span className="ml-2 text-cyan-400"><Stethoscope size={16} className="inline mr-1"/>Medical</span>}
                  </p>
                  <p className="text-sm text-gray-500">
                    For: {shelter.shelterfor?.charAt(0).toUpperCase() + shelter.shelterfor?.slice(1)}
                  </p>
                  {shelter.calamityTypes && shelter.calamityTypes.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Calamities: {shelter.calamityTypes.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                    </p>
                  )}
                  {shelter.contactInfo && (
                    <p className="text-sm text-gray-500 flex items-center">
                      <PhoneCall size={16} className="mr-1 text-orange-400" />Contact: {shelter.contactInfo}
                    </p>
                  )}

                  <hr className="my-3 bg-gray-700" />
                  <p className="text-xs text-gray-500">
                    Created: {new Date(shelter.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last Updated: {new Date(shelter.updatedAt).toLocaleString()}
                  </p>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-600 hover:bg-blue-900 hover:text-white"
                      onClick={() => handleEditClick(shelter)}
                    >
                      <Edit size={16} className="mr-1" /> Edit
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                          <Trash2 size={16} className="mr-1" /> Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 text-white border-gray-700 rounded-lg">
                        <DialogHeader>
                          <DialogTitle className="text-red-400">Confirm Deletion</DialogTitle>
                          <DialogDescription className="text-gray-300">
                            Are you sure you want to delete the shelter "{shelter.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700" onClick={() => document.getElementById('close-delete-dialog').click()}>
                            Cancel
                          </Button>
                          <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteShelter(shelter._id)}>
                            Delete
                          </Button>
                          <button id="close-delete-dialog" style={{ display: 'none' }} />
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export {ManageSheltersPage};
