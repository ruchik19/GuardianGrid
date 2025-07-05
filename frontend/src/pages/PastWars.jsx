
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Search, BookOpen, ExternalLink, History } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert.jsx';
import {NavbarDash} from '../components/NavbarDashboard.jsx';
import authService from '../authpage.js';

const PastWarsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [isSearching, setIsSearching] = useState(false);
  const [warName, setWarName] = useState('');
  const [warDetails, setWarDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
      setIsLoading(false); 

      if (!updatedUser) {
        console.log("PastWarsPage: User logged out, redirecting to login.");
        navigate('/login');
      }
    });

    const initialUser = authService.getUser();
    setUser(initialUser);
    setIsAuthenticated(!!initialUser);
    setIsLoading(false);

    if (!initialUser) {
      console.log("PastWarsPage: No initial user found, redirecting to login.");
    }

    return () => unsubscribe();
  }, [navigate]);
  
  const handleSearch = async (e) => {
    e.preventDefault(); 
    setIsSearching(true);
    setWarDetails(null); 
    setError('');        

    if (!warName.trim()) {
      setError('Please enter a war name to search.');
      setIsSearching(false);
      return;
    }

    if (!user || !user.accessToken) {
        setError('Authentication required to search for war details. Please log in.');
        setIsSearching(false);
        return;
    }

    try {

      const response = await axios.get(`http://localhost:8000/api/v2/pastwars/getwar?warName=${encodeURIComponent(warName.trim())}`,

        {
          headers: {
            Authorization: `Bearer ${user.accessToken}` 
          }
        }
      );

      if (response.data && response.data.data) {
        setWarDetails(response.data.data);
        console.log("War details fetched:", response.data.data);
      } else {
        setError(response.data.message || 'No details found for that war name.');
      }
    } catch (err) {
      console.error('Error fetching war details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to retrieve war details. Please try another name.');
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading || user === null) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-4 text-lg">Loading and checking authentication...</p>
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
          <p className="text-gray-400">Please <Link to="/login" className="text-orange-400 hover:underline">log in</Link> to view past war insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center text-purple-400">
            <History size={36} className="mr-3" /> Past War Insights
          </h1>
          <p className="text-lg text-gray-300">
            Search for historical war events and retrieve summaries from Wikipedia.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-4 mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
          <Label htmlFor="warName" className="sr-only">War Name</Label>
          <Input
            id="warName"
            type="text"
            placeholder="e.g., World War II, Vietnam War"
            value={warName}
            onChange={(e) => setWarName(e.target.value)}
            className="flex-1 bg-gray-700 border-gray-600 focus-visible:ring-purple-500 text-white"
            required
          />
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" /> Search
              </>
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {warDetails && (
          <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-5 border border-purple-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold flex items-center text-purple-300">
                <BookOpen size={24} className="mr-3" /> {warDetails.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex gap-10">
                {warDetails.imageUrl && (
                  <img
                      src={warDetails.imageUrl}
                      alt={warDetails.title}
                      className="w-full h-auto rounded-lg mb-4 object-cover max-h-60"
                      onError={(e) => { 
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/300x200/000000/FFFFFF?text=Image+Not+Found';
                          console.warn("Failed to load image for", warDetails.title, ". Using placeholder.");
                      }}
                  />
                )}
              <p className="text-gray-300 mb-4 leading-relaxed ">
                {warDetails.summary || 'No summary available.'}
                <br />
                {warDetails.wikipediaUrl && (
                <Button asChild variant="link" className="text-blue-400 hover:text-blue-300 px-0 mt-10">
                  <a href={warDetails.wikipediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    Read more on Wikipedia <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
              </p>
              
            </CardContent>
          </Card>
        )}

        {!isSearching && !error && !warDetails && (
            <p className="text-center text-gray-400 text-lg mt-10">
                Enter a war name above to learn about its history.
            </p>
        )}
      </div>
    </div>
  );
};

export {PastWarsPage};
