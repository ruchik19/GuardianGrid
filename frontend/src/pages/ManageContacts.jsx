
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, PhoneCall, PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import {NavbarDash} from '../components/NavbarDashboard.jsx';
import { getSocket, initializeSocket } from '../socket.js';
import authService from '../authpage.js';

const ManageContactsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newRegions, setNewRegions] = useState([]);
  const [newRegionInput, setNewRegionInput] = useState('');
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [createContactError, setCreateContactError] = useState('');

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
      setIsLoading(false);

      if (!updatedUser) {
        console.log("ManageContactsPage: Auth service reported logout, redirecting to login.");
        navigate('/login');
      } else if (updatedUser.role !== 'armyofficial') {
        console.log("ManageContactsPage: User is not an army official, redirecting to dashboard.");
        setError('Access Denied: Only Army Officials can manage emergency contacts.');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        console.log("ManageContactsPage: User is army official. Initializing socket and fetching contacts.");
        initializeSocket(updatedUser);
        fetchMyContacts(updatedUser.accessToken);
      }
    });

    const initialUser = authService.getUser();
    if (!initialUser) {
      setIsLoading(false);
      navigate('/login');
    } else if (initialUser.role !== 'armyofficial') {
      setIsLoading(false);
      setError('Access Denied: Only Army Officials can manage emergency contacts.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setUser(initialUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      initializeSocket(initialUser);
      fetchMyContacts(initialUser.accessToken);
    }

    return () => unsubscribe();
  }, [navigate]);

  const fetchMyContacts = async (token) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8000/api/v2/contacts/my-contacts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (Array.isArray(response.data.data)) {
        setContacts(response.data.data);
        console.log("Fetched my contacts:", response.data.data);
      } else {
        console.warn("API response for my-contacts did not contain an array in data.data:", response.data.data);
        setContacts([]); 
        setError(response.data.message || 'Failed to retrieve your contacts: Unexpected data format.');
      }
    } catch (err) {
      console.error('Error fetching my contacts:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to retrieve your contacts.');
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isAuthenticated || !socket.connected || typeof socket.id === 'undefined' || !user || user.role !== 'armyofficial') {
      console.log("ManageContactsPage: Socket not ready/authorized for listeners. Deferring setup.");
      return;
    }
    console.log("ManageContactsPage: Socket connected and authorized, attaching listeners.");

    const handleContactCreated = (newContact) => {
      console.log('ManageContactsPage - RECEIVED emergency_contact_updated_in_region event:', newContact);
      if (newContact.creatorId === user._id) { 
        setContacts(prevContacts => [newContact, ...prevContacts]);
        setSuccess('New contact added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    };

    const handleContactDeleted = (data) => {
      console.log('ManageContactsPage - RECEIVED emergency_contact_deleted_in_region event:', data);
      setContacts(prevContacts => prevContacts.filter(contact => contact._id !== data.contactId));
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
  }, [user, isAuthenticated]); 

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setNewOrganization('');
    setNewPhoneNumber('');
    setNewCategory('');
    setNewRegions([]);
    setNewRegionInput('');
    setCreateContactError('');
  };

  const handleAddRegion = () => {
    if (newRegionInput && !newRegions.includes(newRegionInput.toLowerCase())) {
      setNewRegions([...newRegions, newRegionInput.toLowerCase()]);
      setNewRegionInput('');
    }
  };

  const handleRemoveRegion = (regionToRemove) => {
    setNewRegions(newRegions.filter(region => region !== regionToRemove));
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    setIsCreatingContact(true);
    setCreateContactError('');

    if (newRegions.length === 0) {
      setCreateContactError('Please add at least one region.');
      setIsCreatingContact(false);
      return;
    }

    try {
      const contactData = {
        organization: newOrganization,
        phoneNumber: newPhoneNumber,
        category: newCategory,
        regions: newRegions,
      };

      const response = await axios.post('http://localhost:8000/api/v2/contacts/create', contactData, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`
        }
      });
      console.log('Contact created:', response.data.data);

      setSuccess('Emergency contact created successfully!');
      setTimeout(() => setSuccess(''), 4000);
      setIsCreateModalOpen(false); 
    } catch (err) {
      console.error('Error creating contact:', err.response?.data || err.message);
      setCreateContactError(err.response?.data?.message || 'Failed to create contact.');
    } finally {
      setIsCreatingContact(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact? This action cannot be undone.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.delete(`http://localhost:8000/api/v2/contacts/delete/${contactId}`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`
        }
      });
      setSuccess('Emergency contact deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting contact:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to delete contact.');
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
          <p className="text-gray-400">Only Army Officials can manage emergency contacts. Please <Link to="/login" className="text-orange-400 hover:underline">log in</Link> with an authorized account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Manage Emergency Contacts</h1>
          <p className="text-lg text-gray-300">Create and delete emergency contacts.</p>
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

        <Button onClick={openCreateModal} className="mb-6 bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Contact
        </Button>

        {contacts.length === 0 ? (
          <p className="text-gray-400">You haven't created any emergency contacts yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map(contact => (
              <Card key={contact._id} className="bg-gray-800 text-white shadow-lg rounded-lg p-5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex justify-between items-center">
                    <span className="flex items-center">
                      <PhoneCall size={20} className="mr-2 text-green-400" /> {contact.organization}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteContact(contact._id)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Add New Emergency Contact</DialogTitle>
            <DialogDescription className="text-gray-400">
              Fill in the details for the new emergency contact.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateContact} className="grid gap-4 py-4">
            {createContactError && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{createContactError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="organization" className="text-right text-gray-200">
                Organization
              </Label>
              <Input
                id="organization"
                value={newOrganization}
                onChange={(e) => setNewOrganization(e.target.value)}
                className="col-span-3 bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right text-gray-200">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                className="col-span-3 bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-gray-200">
                Category
              </Label>
              <Select onValueChange={setNewCategory} value={newCategory} required className="col-span-3">
                <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 text-white border-gray-600">
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="ambulance">Ambulance</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="disaster relief">Disaster Relief</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="regions" className="text-right text-gray-200 pt-2">
                Regions
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    type="text"
                    placeholder="Add region (e.g., Pune, Global)"
                    value={newRegionInput}
                    onChange={(e) => setNewRegionInput(e.target.value)}
                    className="flex-1 bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white"
                  />
                  <Button type="button" onClick={handleAddRegion} variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newRegions.map((region, index) => (
                    <span key={index} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full flex items-center gap-1">
                      {region.charAt(0).toUpperCase() + region.slice(1)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-red-400 hover:bg-gray-600"
                        onClick={() => handleRemoveRegion(region)}
                      >
                        X
                      </Button>
                    </span>
                  ))}
                </div>
                {newRegions.length === 0 && <p className="text-sm text-gray-500 mt-1">Add regions or "global".</p>}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingContact} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isCreatingContact ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  'Add Contact'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export {ManageContactsPage};
