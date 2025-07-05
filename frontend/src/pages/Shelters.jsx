
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Building, MapPin, Users, Loader2, CheckCircle, XCircle, PhoneCall, Stethoscope } from 'lucide-react'; 
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {icon, Icon} from 'leaflet'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import pin from "../assets/location.png";
import {NavbarDash} from '../components/NavbarDashboard.jsx';
import authService from '../authpage.js';
import { initializeSocket, getSocket } from '../socket.js';
const REGION_COORDINATES = {
  pune: [18.5204, 73.8567],
  mumbai: [19.0760, 72.8777],
  delhi: [28.7041, 77.1025],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  hyderabad: [17.3850, 78.4867],
  global: [20.5937, 78.9629], 
};
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DEFAULT_MAP_CENTER = REGION_COORDINATES.global;
const DEFAULT_ZOOM = 6;
const REGION_ZOOM = 12; 

const SheltersPage = () => {
  const customIcon = new Icon({
    iconUrl: pin,
    iconSize: [38,38]
  })
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shelters, setShelters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState(''); 
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);

      if (updatedUser) {
        initializeSocket(updatedUser);
        const userRegion = updatedUser.region ? updatedUser.region.toLowerCase() : 'global';
        fetchShelters(userRegion, updatedUser.accessToken); 
        const coords = REGION_COORDINATES[userRegion] || DEFAULT_MAP_CENTER;
        setMapCenter(coords);
        setMapZoom(userRegion !== 'global' ? REGION_ZOOM : DEFAULT_ZOOM);
      } else {
        setShelters([]);
        setErrorMessage(''); 
        navigate('/login');
      }
      setIsLoading(false); 
    });

    const initialUser = authService.getUser();
    setUser(initialUser);
    setIsAuthenticated(!!initialUser);
    if (initialUser) {
      initializeSocket(initialUser); 
      const userRegion = initialUser.region ? initialUser.region.toLowerCase() : 'global';
      fetchShelters(userRegion, initialUser.accessToken);
      const coords = REGION_COORDINATES[userRegion] || DEFAULT_MAP_CENTER;
      setMapCenter(coords);
      setMapZoom(userRegion !== 'global' ? REGION_ZOOM : DEFAULT_ZOOM);
    } else {
      setIsLoading(false); 
      navigate('/login');
    }

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const fetchShelters = async (region, token) => { 
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!token) {
        setErrorMessage('Authentication token missing. Please log in.');
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/v2/shelters/region/${encodeURIComponent(region)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setShelters(response.data.data);
    } catch (error) {
      console.error('Failed to fetch emergency shelters:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to load emergency shelters.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {

    const socket = getSocket();

    if (!socket || !isAuthenticated || !user) {
        console.log("SheltersPage: Socket not ready or user not authenticated. Skipping listener setup.");
        return;
    }
    console.log("SheltersPage: Setting up Socket.IO listeners.");

    socket.on('shelter_updated_in_region', (updatedShelter) => {
      console.log('Received shelter_updated_in_region:', updatedShelter);
      setShelters(prevShelters => {
        const userRegionLower = user.region ? user.region.toLowerCase() : '';

        const shelterRegionsLower = updatedShelter.region ? [updatedShelter.region.toLowerCase()] : updatedShelter.regions?.map(r => r.toLowerCase()) || [];

        if (!userRegionLower || (!shelterRegionsLower.includes(userRegionLower) && !shelterRegionsLower.includes('global'))) {
            return prevShelters;
        }

        const existingIndex = prevShelters.findIndex(s => s._id === updatedShelter._id);
        if (existingIndex > -1) {
          const newShelters = [...prevShelters];
          newShelters[existingIndex] = updatedShelter;
          setInfoMessage(`Shelter updated: ${updatedShelter.name}`);
          return newShelters;
        } else {
          setInfoMessage(`New shelter added: ${updatedShelter.name}`);
          return [updatedShelter, ...prevShelters];
        }
      });
      setTimeout(() => setInfoMessage(''), 3000);
    });
    socket.on('shelter_deleted_in_region', (data) => {
      console.log('Received shelter_deleted_in_region:', data);
      setShelters(prevShelters => {
          const userRegionLower = user.region ? user.region.toLowerCase() : '';
          const deletedShelterRegionLower = data.region ? data.region.toLowerCase() : '';

          if (userRegionLower && (deletedShelterRegionLower === userRegionLower || deletedShelterRegionLower === 'global')) {
              setInfoMessage(`Shelter deleted: ID ${data.shelterId}`);
              setTimeout(() => setInfoMessage(''), 3000);
              return prevShelters.filter(s => s._id !== data.shelterId);
          }
          return prevShelters;
      });
    });

    return () => {
      console.log('SheltersPage: Cleaning up Socket.IO listeners.');
      socket.off('shelter_updated_in_region');
      socket.off('shelter_deleted_in_region');
    };
  }, [user, isAuthenticated]); 


  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-400">Emergency Shelters</h1>

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {infoMessage && (
          <Alert className="mb-4 bg-teal-800 text-white border-green-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Update!</AlertTitle>
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-green-500" />
            <p className="ml-4 text-lg">Loading emergency shelters...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)]">

            <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg p-4 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-4 text-green-300 border-b border-gray-700 pb-3 sticky top-0 bg-gray-800 z-10">
                Shelters in {user?.region?.charAt(0).toUpperCase() + user?.region?.slice(1) || 'Your Region'}
              </h2>
              {shelters.length === 0 ? (
                <p className="text-center text-gray-400 text-lg mt-4">No emergency shelters available for your region yet.</p>
              ) : (
                <div className="space-y-4">
                  {shelters.map((shelter) => (
                    <Card key={shelter._id} className="bg-gray-700 text-white shadow-md rounded-lg p-4 border border-gray-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-semibold flex items-center text-green-200">
                          <Building size={20} className="mr-2" /> {shelter.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2 text-gray-200">
                        <p className="flex items-center mb-1">
                          <MapPin size={16} className="mr-2 text-blue-300" />
                          Address: {shelter.location?.address}
                        </p>
                        <p className="flex items-center mb-1">
                          <Users size={16} className="mr-2 text-purple-300" />
                          Occupancy: {shelter.occupancy} / {shelter.capacity}
                        </p>
                        <p className={`font-semibold ${shelter.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                          Status: {shelter.isAvailable ? 'Available' : 'Full'}
                        </p>
                        <p className="text-sm text-gray-400">
                            Type: {shelter.shelterType?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            {shelter.militaryOnly && <span className="ml-2 text-yellow-300">(Military Only)</span>}
                            {shelter.hasMedicalSupport && <span className="ml-2 text-cyan-300"><Stethoscope size={16} className="inline mr-1"/>Medical</span>}
                        </p>
                        <p className="text-sm text-gray-400">
                            For: {shelter.shelterfor?.charAt(0).toUpperCase() + shelter.shelterfor?.slice(1)}
                        </p>
                        {shelter.contactInfo && (
                            <p className="text-sm text-gray-400 flex items-center">
                            <PhoneCall size={16} className="mr-1 text-orange-300" />Contact: {shelter.contactInfo}
                            </p>
                        )}
                        <hr className="my-3 bg-gray-600" />
                        <p className="text-xs text-gray-500">
                          Last Updated: {new Date(shelter.updatedAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-green-700">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="w-full h-full rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {shelters.map((shelter) => (
                  <Marker
                    key={shelter._id}
                    position={shelter.location?.coordinates ? [shelter.location.coordinates[1], shelter.location.coordinates[0]] : DEFAULT_MAP_CENTER}
                    icon={customIcon}
                  >
                    <Popup>
                      <div className="text-gray-900 font-sans">
                        <h3 className="font-bold text-lg mb-1">{shelter.name}</h3>
                        <p><strong>Address:</strong> {shelter.location?.address}</p>
                        <p><strong>Status:</strong> {shelter.isAvailable ? 'Available' : 'Full'}</p>
                        <p><strong>Occupancy:</strong> {shelter.occupancy} / {shelter.capacity}</p>
                        <p><strong>Type:</strong> {shelter.shelterType?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                        {shelter.contactInfo && <p><strong>Contact:</strong> {shelter.contactInfo}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export {SheltersPage};
