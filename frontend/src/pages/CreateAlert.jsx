import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Eye, EyeOff, MapPin, CheckCircle, XCircle, BellRing, Flag, Globe, PlusCircle } from 'lucide-react'; 

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import { Badge } from '@/components/ui/badge.jsx';

import {NavbarDash} from '../components/NavbarDashboard.jsx';
import { getSocket, initializeSocket } from "../socket.js";
import authService from '../authpage.js';
const CreateAlertPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState(''); 
  const [severity, setSeverity] = useState(''); 
  const [targetRegionInput, setTargetRegionInput] = useState(''); 
  const [targetRegions, setTargetRegions] = useState([]); 

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
    setUser(updatedUser);

    if (!updatedUser || updatedUser.role !== 'armyofficial') {
      setErrorMessage('Access Denied: Only Army Officials can create alerts.');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  });

  const initialUser = authService.getUser();
  if (!initialUser || initialUser.role !== 'armyofficial') {
    setErrorMessage('Access Denied: Only Army Officials can create alerts.');
    setTimeout(() => navigate('/dashboard'), 2000);
  } else {
    setUser(initialUser);
  }

  return () => unsubscribe();

  }, [navigate]);

  const handleAddRegion = () => {
    const regionToAdd = targetRegionInput.trim().toLowerCase();
    if (regionToAdd && !targetRegions.includes(regionToAdd)) {
      setTargetRegions([...targetRegions, regionToAdd]);
      setTargetRegionInput('');
    }
  };

  const handleRemoveRegion = (regionToRemove) => {
    setTargetRegions(targetRegions.filter(region => region !== regionToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccess('');

    if (!user || user.role !== 'armyofficial') {
      setErrorMessage('You are not authorized to create alerts.');
      setIsLoading(false);
      return;
    }

    if (targetRegions.length === 0) {
      setErrorMessage('Please select at least one target region or "global".');
      setIsLoading(false);
      return;
    }

    if (!title || !message || !type || !severity ) {
      setErrorMessage('Please fill in all required fields ');
      setIsLoading(false);
      return;
    }

    const alertData = {
      title,
      message,
      type,
      severity,
      targetRegions,
      isActive: true,
    };

    try {
      
      
      const response = await axios.post('http://localhost:8000/api/v2/alerts/create', alertData,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`, 
          },
        }
      );

      const socket = getSocket(); 
      if (socket?.connected && socket.id) {
        socket.emit('new_alert_in_region', response.data.data);
      }

      setSuccess('Alert created successfully! Redirecting to dashboard...');
      setTitle('');
      setMessage('');
      setType('');
      setSeverity('');
      setTargetRegions([]);
      setTargetRegionInput('');
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (error) {
      console.error('Failed to create alert:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to create alert. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user === null || user.role !== 'armyofficial') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to create alerts. Please <Link to="/login" className="text-cyan-500 hover:underline">log in</Link> with an Army Official account.</p>
        </div>
      </div>
    );
  }

  if (!user || isLoading) { 
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="flex flex-col gap-6 p-8 bg-gray-800 rounded-lg shadow-lg max-w-lg w-full">
          <h2 className="text-3xl font-bold text-pink-700 text-center">
            Create New Alert
          </h2>
          <p className="text-gray-400 text-center">Issue critical alerts to affected regions.</p>

          {errorMessage && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="bg-teal-800 text-white border-green-800">
              <CheckCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Alert Title :</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Flash Flood Warning"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white focus-visible:ring-blue-500 mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Alert Type</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger id="type" className="bg-gray-700 border-gray-600 text-white focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="calamity" className="hover:bg-gray-700">Calamity</SelectItem>
                    <SelectItem value="war" className="hover:bg-gray-700">War</SelectItem>
                    <SelectItem value="drill" className="hover:bg-gray-700">Drill</SelectItem>
                    <SelectItem value="other" className="hover:bg-gray-700">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Alert Message</Label>
                <Textarea
                  id="message"
                  placeholder="Provide detailed information about the alert, safety instructions, etc."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white focus-visible:ring-blue-500 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={severity} onValueChange={setSeverity} required>
                  <SelectTrigger id="severity" className="bg-gray-700 border-gray-600 text-white focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="Low" className="hover:bg-gray-700 text-amber-100">Low</SelectItem>
                    <SelectItem value="Medium" className="hover:bg-gray-700 text-amber-400">Medium</SelectItem>
                    <SelectItem value="High" className="hover:bg-gray-700 text-orange-600">High</SelectItem>
                    <SelectItem value="Critical" className="hover:bg-gray-700 text-red-800">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetRegions">Target Regions</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="targetRegions"
                    type="text"
                    placeholder="Add region (e.g., Pune, Global)"
                    value={targetRegionInput}
                    onChange={(e) => setTargetRegionInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); 
                            handleAddRegion();
                        }
                    }}
                    className="bg-gray-700 border-gray-600 text-white focus-visible:ring-blue-500 flex-grow"
                  />
                  <Button type="button" onClick={handleAddRegion} variant="outline" className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500">
                    <PlusCircle size={18} className="mr-2"/> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {targetRegions.map((region, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                      {region.charAt(0).toUpperCase() + region.slice(1)}
                      <XCircle size={14} className="cursor-pointer hover:text-red-300" onClick={() => handleRemoveRegion(region)} />
                    </Badge>
                  ))}
                </div>
                {targetRegions.length === 0 && (
                    <p className="text-sm text-red-400 mt-1">At least one target region is required.</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Alert...
                  </>
                ) : (
                  'Issue Alert'
                )}
              </Button>
            </div>
          </form>

          <p className="text-gray-400 text-center">
            Go to{' '}
            <Link to="/alerts/manage" className="text-blue-400 hover:underline">
              Alerts Management
            </Link>
            {' '}or{' '}
            <Link to="/dashboard" className="text-blue-400 hover:underline">
              Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export {CreateAlertPage};