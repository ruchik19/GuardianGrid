
import { NavbarDash } from "@/components/NavbarDashboard.jsx";
import help from "../assets/help.png";
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Aboutus } from "@/components/Aboutus";
import protect from "../assets/protected.jpeg";
import smart from "../assets/smartsecurecity.jpeg";

import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import { Input } from "@/components/ui/input.jsx";
import { Search } from "lucide-react";

import {
  MapPin, BellRing, BookText, Archive, Users, Cloud, Zap, Siren, CheckCircle, XCircle,
  Megaphone, PlusCircle, Building2, PhoneCall
} from 'lucide-react';
import { getSocket, initializeSocket } from "../socket.js";
import authService from '../authpage.js';

if (typeof window !== 'undefined') {
    localStorage.debug = 'socket.io-client:*';
    console.log("DEBUG: localStorage.debug set for Socket.IO.");
}
console.log("DashboardPage component mounted");
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(true); 
  const [errorMessage, setErrorMessage] = useState('');

  const [weatherData, setWeatherData] = useState(null);
  const [isWeatherDataLoading, setIsWeatherDataLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  // const [earthquakeError, setEarthquakeError] = useState('');

  const [searchCity, setSearchCity] = useState('');
  const [currentWeatherCity, setCurrentWeatherCity] = useState('');
  const [newAlertNotification, setNewAlertNotification] = useState(null); 

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);         
      setIsAuthenticated(!!updatedUser); 
      setIsLoading(false);           

      if (!updatedUser) {
        
        console.log("DashboardPage: Auth service reported logout, redirecting to login.");
        navigate('/login');
      } else {
        
        console.log("DashboardPage: Auth service reported login/update. User:", updatedUser.name);
        initializeSocket(updatedUser);
      }
    });
    const initialUser = authService.getUser();
    if (initialUser) {
      setUser(initialUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      initializeSocket(initialUser);
      fetchWeatherData(initialUser.region, initialUser.accessToken);
      setCurrentWeatherCity(initialUser.region)
    } else {
      setIsLoading(false);
      navigate('/login');
    }


    return () => unsubscribe();

  }, [navigate]);

  useEffect(() => {
    const socket = getSocket(); 
    
    const handleNewAlert = (newAlert) => {
        console.log('Dashboard - RECEIVED new_alert_in_region event:', newAlert);
        const userRegion = user?.region?.toLowerCase(); 
        const alertRegions = newAlert.targetRegions?.map(r => r.toLowerCase()) || [];
        const isRelevant = userRegion && (alertRegions.includes(userRegion) || alertRegions.includes("global"));

        console.log(`Dashboard - Alert Relevance Check: userRegion=${userRegion}, alertRegions=${JSON.stringify(alertRegions)}, isRelevant=${isRelevant}`);

        if (isRelevant) {
            setNewAlertNotification({
                title: 'New Alert!',
                message: `A new alert has been issued.`,
                severity: 'High',
                path: '/alerts'
            });
            setTimeout(() => setNewAlertNotification(null), 60000);
            console.log("Dashboard - New Alert Notification SET.");
        } else {
            console.log("Dashboard - Alert not relevant to user's region or global. Not displaying notification.");
        }
    };

     
    const handleAlertDeactivated = (data) => {
        console.log('Dashboard - RECEIVED alert_deactivated_in_region event:', data);
        setNewAlertNotification({
            title: 'Alert Deactivated',
            message: `An alert has been deactivated.`,
            severity: 'info',
            path: '/alerts'
        });
        setTimeout(() => setNewAlertNotification(null), 5000);
    };

    
    const handleAlertDeleted = (data) => {
        console.log('Dashboard - RECEIVED alert_deleted_in_region event:', data);
        setNewAlertNotification({
            title: 'Alert Deleted',
            message: `An alert has been deleted.`,
            severity: 'info',
            path: '/alerts'
        });
        setTimeout(() => setNewAlertNotification(null), 5000);
    };
    
    const handleGlobalAlertUpdate = (data) => {
        console.log('Dashboard - RECEIVED global_alert_feed_update event:', data);
        setNewAlertNotification({
            title: 'Global Alert Update',
            message: `A global alert has been ${data.action}.`,
            severity: 'info',
            path: '/alerts'
        });
        setTimeout(() => setNewAlertNotification(null), 5000);
    };

    const handleShelterUpdated = (updatedShelter) => {
        console.log('Dashboard - RECEIVED shelter_updated_in_region event:', updatedShelter);
        const userRegion = user?.region?.toLowerCase();
        const shelterRegions = updatedShelter.regions?.map(r => r.toLowerCase()) || [];
        const isRelevant = userRegion && (shelterRegions.includes(userRegion) || shelterRegions.includes("global"));

        if (isRelevant) {
            setNewAlertNotification({
                title: 'Shelter Update',
                message: `Shelter "${updatedShelter.name}" was updated or added.`,
                severity: 'info',
                path: '/shelters'
            });
            setTimeout(() => setNewAlertNotification(null), 3000);
        }
    };
    const handleShelterDeleted = (data) => {
        console.log('Dashboard - RECEIVED shelter_deleted_in_region event:', data);
        setNewAlertNotification({
            title: 'Shelter Deleted',
            message: `A shelter was deleted.`,
            severity: 'info',
            path: '/shelters'
        });
        setTimeout(() => setNewAlertNotification(null), 3000);
    };
    

    const handleContactUpdated = (updatedContact) => {
        console.log('Dashboard - RECEIVED emergency_contact_updated_in_region event:', updatedContact);
        const userRegion = user?.region?.toLowerCase();
        const contactRegions = updatedContact.regions?.map(r => r.toLowerCase()) || [];
        const isRelevant = userRegion && (contactRegions.includes(userRegion) || contactRegions.includes("global"));

        if (isRelevant) {
            setNewAlertNotification({
                title: 'Contact Update',
                message: `Emergency contact "${updatedContact.organization}" was updated or added.`,
                severity: 'info',
                path: '/contacts'
            });
            setTimeout(() => setNewAlertNotification(null), 3000);
        }
    };

    const handleContactDeleted = (data) => {
        console.log('Dashboard - RECEIVED emergency_contact_deleted_in_region event:', data);
        setNewAlertNotification({
            title: 'Contact Deleted',
            message: `An emergency contact was deleted.`,
            severity: 'info',
            path: '/contacts'
        });
        setTimeout(() => setNewAlertNotification(null), 3000);
    };

    const attachListeners = () => {
  
        if (!socket) return;
        socket.off('new_alert_in_region', handleNewAlert);
        socket.off('alert_deactivated_in_region', handleAlertDeactivated);
        socket.off('alert_deleted_in_region', handleAlertDeleted);
        socket.off('global_alert_feed_update', handleGlobalAlertUpdate);
        socket.off('shelter_updated_in_region', handleShelterUpdated);
        socket.off('shelter_deleted_in_region', handleShelterDeleted);
        socket.off('emergency_contact_updated_in_region', handleContactUpdated);
        socket.off('emergency_contact_deleted_in_region', handleContactDeleted);

        console.log("DashboardPage: Socket is connected AND authenticated, attaching listeners.");

        socket.on('new_alert_in_region', handleNewAlert);
        socket.on('alert_deactivated_in_region', handleAlertDeactivated);
        socket.on('alert_deleted_in_region', handleAlertDeleted);
        socket.on('global_alert_feed_update', handleGlobalAlertUpdate);
        socket.on('shelter_updated_in_region', handleShelterUpdated);
        socket.on('shelter_deleted_in_region', handleShelterDeleted);
        socket.on('emergency_contact_updated_in_region', handleContactUpdated);
        socket.on('emergency_contact_deleted_in_region', handleContactDeleted);
        
    };
    if (socket?.connected) {
      attachListeners();
    } else {
      socket?.on('connect', attachListeners);
    }

    return () => {
        socket?.off('new_alert_in_region', handleNewAlert);
        socket?.off('alert_deactivated_in_region', handleAlertDeactivated);
        socket?.off('alert_deleted_in_region', handleAlertDeleted);
        socket?.off('global_alert_feed_update', handleGlobalAlertUpdate);
        socket?.off('shelter_updated_in_region', handleShelterUpdated);
        socket?.off('shelter_deleted_in_region', handleShelterDeleted);
        socket?.off('emergency_contact_updated_in_region', handleContactUpdated);
        socket?.off('emergency_contact_deleted_in_region', handleContactDeleted);
    };

  }, []);

  const fetchWeatherData = async (city = currentWeatherCity, token) => {
    setIsWeatherDataLoading(true);
    setWeatherError('');
    if (!city) {
      setWeatherError('Please enter a city to get weather data.');
      setIsWeatherDataLoading(false);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8000/api/v2/weatherdata/weather?region=${encodeURIComponent(city.trim())}`,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWeatherData(response.data.data);
      setCurrentWeatherCity(city.trim()); 
      console.log('Fetched Weather Data:', response.data.data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error.response?.data || error.message);
      setWeatherError(error.response?.data?.message || 'Failed to load weather data for ' + city + '.');
      setWeatherData(null);
    } finally {
      setIsWeatherDataLoading(false);
    }
  };

  const handleWeatherSearchSubmit = (e) => {
    e.preventDefault(); 
    const token = user.accessToken;
    if (token) {
        fetchWeatherData(searchCity, token);
    } else {
        setWeatherError("Please log in to search for weather data.");
    }
  };

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">Please <Link to="/login" className="text-pink-700 hover:underline">log in</Link> to view your dashboard.</p>
        </div>
       
      </div>
    );
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4 ">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 text-transparent bg-clip-text">Welcome,</span> <span className="bg-gradient-to-r from-teal-200 to-teal-700 text-transparent bg-clip-text">{user?.name.toUpperCase() || "User"} !</span>
          </h1>
          <p className="text-xl mt-4 text-slate-200">Your central hub for critical information and preparedness.</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {newAlertNotification && (
            <Alert className={`mb-4 ${newAlertNotification.severity === 'High' ? 'bg-red-700 border-red-700' : 'bg-blue-600 border-blue-700'} text-white`}>
                {newAlertNotification.severity === 'High' ? <Siren className="h-4 w-4 mr-2" /> : <BellRing className="h-4 w-4 mr-2" />}
                <AlertTitle>{newAlertNotification.title || 'New Update!'}</AlertTitle>
                <AlertDescription>{newAlertNotification.message || 'A new update has been issued.'}</AlertDescription>
                {newAlertNotification.path && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-white hover:bg-white/20"
                        onClick={() => {
                            navigate(newAlertNotification.path);
                            setNewAlertNotification(null); 
                        }}
                    >
                        View Details
                    </Button>
                )}
                {!newAlertNotification.path && (newAlertNotification.severity === 'High' || newAlertNotification.severity === 'info') && (
                    <Button variant="ghost" size="sm" className="ml-auto text-white hover:bg-white/20" onClick={() => setNewAlertNotification(null)}>Dismiss</Button>
                )}
            </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          
          {user?.role==="civilian" && (
          <Card className="lg:hidden bg-gray-800 text-white shadow-lg rounded-lg p-5 sm:col-span-1 hover:border-2 hover:border-amber-100 border-cyan-500">
            <CardHeader className="">
              <CardTitle className="text-xl font-semibold">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="grid-cols-2 gap-1">
                <Button asChild variant="ghost" className="justify-start text-lg text-green-400 hover:bg-gray-700 hover:text-green-300">
                  <Link to="/shelters" className="flex items-center"><MapPin size={20} className="mr-1" /> Emergency Shelters</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-orange-400 hover:bg-gray-700 hover:text-orange-300">
                  <Link to="/alerts" className="flex items-center"><BellRing size={20} className="mr-1" /> All Alerts</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-blue-400 hover:bg-gray-700 hover:text-blue-300">
                  <Link to="/contacts" className="flex items-center"><Users size={20} className="mr-1" /> Emergency Contacts</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-purple-400 hover:bg-gray-700 hover:text-purple-300">
                    <Link to="/guides" className="flex items-center"><BookText size={20} className="mr-1" /> Safety Guides</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-cyan-400 hover:bg-gray-700 hover:text-cyan-300">
                    <Link to="/past-wars" className="flex items-center"><Archive size={20} className="mr-1" /> Past War Insights</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role==="armyofficial" && (
          <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-5 lg:col-span-1 hover:border-2 hover:border-amber-100 border-cyan-500">
            <CardHeader className="">
              <CardTitle className="text-xl font-semibold">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="grid-cols-2 gap-1">
                <Button asChild variant="ghost" className="justify-start text-lg text-green-400 hover:bg-gray-700 hover:text-green-300">
                  <Link to="/shelters" className="flex items-center"><MapPin size={20} className="mr-1" /> Emergency Shelters</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-orange-400 hover:bg-gray-700 hover:text-orange-300">
                  <Link to="/alerts" className="flex items-center"><BellRing size={20} className="mr-1" /> All Alerts</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-blue-400 hover:bg-gray-700 hover:text-blue-300">
                  <Link to="/contacts" className="flex items-center"><Users size={20} className="mr-1" /> Emergency Contacts</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-purple-400 hover:bg-gray-700 hover:text-purple-300">
                    <Link to="/guides" className="flex items-center"><BookText size={20} className="mr-1" /> Safety Guides</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start text-lg text-cyan-400 hover:bg-gray-700 hover:text-cyan-300">
                    <Link to="/past-wars" className="flex items-center"><Archive size={20} className="mr-1" /> Past War Insights</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {user?.role === 'armyofficial' && (
            <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-5 md:col-span-full lg:col-span-2 hover:border-2 hover:border-amber-100 border-cyan-500"> {/* Spans across 2 columns on larger screens */}
                <CardHeader className="">
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <Megaphone size={20} className="text-teal-600 mr-2" /> Army Official Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4"> {/* Inner grid for buttons */}
                        <Button asChild variant="default" className="justify-center bg-orange-600 hover:bg-orange-700  text-white font-bold py-2 px-4 rounded-md shadow-md transition-all duration-200">
                            <Link to="/alerts/create" className="flex items-center"><PlusCircle size={20} className="mr-2" /> Create Alert</Link>
                        </Button>
                        <Button asChild variant="default" className="justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition-all duration-200">
                            <Link to="/alerts/manage" className="flex items-center"><BellRing size={20} className="mr-2" /> Manage Alerts</Link>
                        </Button>
                        <Button asChild variant="default" className="justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition-all duration-200">
                            <Link to="/shelters/manage" className="flex items-center"><Building2 size={20} className="mr-2" /> Manage Shelters</Link>
                        </Button>
                        <Button asChild variant="default" className="justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition-all duration-200">
                            <Link to="/contacts/manage" className="flex items-center"><PhoneCall size={20} className="mr-2" /> Manage Contacts</Link>
                        </Button>
                        
                    </div>
                </CardContent>
            </Card>
        )}
        

        </div> 
        <div className="flex mr-2 ml-2 mt-15 justify-center gap-3">
            <img src={help} alt="help" className="h-1/2 w-1/2 border-2 border-cyan-500" />
            <img src={smart} alt="help" className="h-1/2 w-1/2 border-2 border-cyan-500" />
        </div>
        <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-5 mt-20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Cloud size={20} className="text-gray-400 mr-2" /> Current Weather ({currentWeatherCity?.toUpperCase() || 'Your Region'})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleWeatherSearchSubmit} className="flex items-center gap-2 mb-4">
                <Label htmlFor="weather-city-input" className="sr-only">Search City for Weather</Label>
                <Input
                  id="weather-city-input"
                  type="text"
                  placeholder="e.g., London, Tokyo"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="flex-1 bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white"
                />
                <Button type="submit" size="sm" disabled={isWeatherDataLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isWeatherDataLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>

              {isWeatherDataLoading && (
                <div className="flex items-center text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading weather...
                </div>
              )}
              {weatherError && !isWeatherDataLoading && (
                <p className="text-sm text-red-400">{weatherError}</p>
              )}
              {weatherData && (
                <div>
                  <p className="font-bold text-3xl mb-1 flex items-center">
                    {weatherData.icon || '🌡️'} {weatherData.temperature}°C
                  </p>
                  <p className="text-lg text-gray-300">
                    {weatherData.description?.charAt(0).toUpperCase() + weatherData.description?.slice(1)}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-400 mt-2">
                    <p>Humidity: {weatherData.humidity}%</p>
                    <p>Wind: {weatherData.windSpeed} m/s</p> 
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Data for: {weatherData.city}
                  </p>
                </div>
              )}
              {!weatherData && !isWeatherDataLoading && !weatherError && (
                 <p className="text-gray-400">No weather data to display. Use the search above.</p>
              )}
               <div className="flex justify-end pt-4">
                  <Button variant="ghost" className="text-blue-400 hover:underline text-sm" onClick={() => fetchWeatherData(userRegion || 'global')}>
                    Refresh to My Region
                  </Button>
                </div>
            </CardContent>
          </Card>

      </div>
      <Aboutus />
    </div>
  );
};

export {Dashboard};


