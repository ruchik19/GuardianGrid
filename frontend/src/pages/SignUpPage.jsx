import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, MapPin, Loader2 } from 'lucide-react'; 

import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

import {Navbar} from '../components/Navbar.jsx';


const SignUpPage = () => {
  const navigate = useNavigate();

 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [role, setRole] = useState('civilian');
  const [contact, setContact] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const getUserLocation = () => {
    setGettingLocation(true);
    setLocationError('');
    setLatitude(''); 
    setLongitude('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
                setLatitude(position.coords.latitude.toString());
                setLongitude(position.coords.longitude.toString());
                setGettingLocation(false);
            }else {
                setLocationError("Invalid location data received. Please try again or enter manually.");
                setLatitude('');
                setLongitude('');
            }
            setGettingLocation(false);   
        },
        (err) => {
            console.error("Error getting location:", err);
            setLocationError(`Error getting location: ${err.message}. Please allow location access or enter manually.`);
            setGettingLocation(false);
            setLatitude('');
            setLongitude('');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        setLocationError("Geolocation is not supported by your browser.");
        setGettingLocation(false);
        setLatitude('');
        setLongitude('');
    }
  };

  useEffect(() => {
    if (role === 'civilian') {
        getUserLocation();
    } else {
        setLatitude('');
        setLongitude('');
        setLocationError('');
    }
  }, [role]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (role === 'civilian') {
        const parsedLat = parseFloat(latitude);
        const parsedLon = parseFloat(longitude);

        if (isNaN(parsedLat) || isNaN(parsedLon)) {
            setError('Latitude and Longitude must be valid numbers for civilian users.');
            setLoading(false);
            return; 
        }
    }
    const userData = {
        name,
        email,
        password,
        region,
        role,
        contact,
    };

    if (role === 'civilian') {
        userData.latitude = parseFloat(latitude); 
        userData.longitude = parseFloat(longitude); 
    }

    try {
        const response = await axios.post(`${BACKEND_URL}/api/v2/users/register`, userData);

        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
            navigate('/login'); 
        }, 2000); 
    } catch (err) {
        console.error('Registration error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
        setLoading(false);
    }
}

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar /> 

      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="flex flex-col gap-6 p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full border-2 border-cyan-600">
          <h2 className="text-3xl font-bold text-cyan-600 text-center">
            Sign Up
          </h2>
          <p className="text-gray-400 text-center">Create your GuardianGrid account</p>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="bg-pink-800 text-white"> 
              <AlertTitle className="text-xl">Registered</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white pr-10 mt-3" 
                    required
                  />
                  <Button
                    type="button" 
                    variant="ghost"
                    size="sm"
                    className="absolute inset-y-0 right-0 h-full px-3 py-1 text-gray-400 hover:bg-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="e.g., +919876534568"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  type="text"
                  placeholder="e.g., Pune"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger id="role" className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="civilian" className="hover:bg-gray-700">Civilian</SelectItem>
                    <SelectItem value="armyofficial" className="hover:bg-gray-700">Army Official</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'civilian' && (
                <>
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 18.5204"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-2"
                      disabled={gettingLocation}
                      required={role === 'civilian'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 73.8567"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-2"
                      disabled={gettingLocation}
                      required={role === 'civilian'}
                    />
                  </div>

                  <Button
                    type="button" 
                    onClick={getUserLocation}
                    disabled={gettingLocation}
                    variant="outline"
                    className="w-full text-teal-400 border-teal-600 hover:bg-teal-600 hover:text-white"
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" /> Get Current Location
                      </>
                    )}
                  </Button>
                  {locationError && (
                    <p className="text-sm text-red-400">{locationError}</p>
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-800 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing Up...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </div>
          </form>

          <p className="text-gray-400 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export  {SignUpPage}