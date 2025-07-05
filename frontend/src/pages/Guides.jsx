
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, BookText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert.jsx';
import {NavbarDash} from '../components/NavbarDashboard.jsx';
import authService from '../authpage.js';

const GuidesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedGuideContent, setSelectedGuideContent] = useState(null); 
  const [error, setError] = useState('');
  const [isContentLoading, setIsContentLoading] = useState(false); 

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);
      setIsLoading(false); 
      if (!updatedUser) {
        console.log("GuidesPage: User logged out, redirecting to login.");
        navigate('/login');
      } else {

        fetchGuideList(updatedUser.accessToken);
      }
    });

    const initialUser = authService.getUser();
    setUser(initialUser);
    setIsAuthenticated(!!initialUser);
    setIsLoading(false);

    if (!initialUser) {
      console.log("GuidesPage: No initial user found, redirecting to login.");
    } else {
      fetchGuideList(initialUser.accessToken);
    }

    return () => unsubscribe();
  }, [navigate]);

  const fetchGuideList = async (token) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/v2/guides', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data.data)) {
        setGuides(response.data.data);
        console.log("Fetched guide list:", response.data.data);
      } else {
        console.warn("Guide list API response not an array:", response.data);
        setGuides([]);
        setError("Failed to load guides: Unexpected data format.");
      }
    } catch (err) {
      console.error('Error fetching guide list:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load guide list.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuideContent = async (guideId, token) => {
    setError('');
    setIsContentLoading(true);
    setSelectedGuideContent(null); 
    try {

      const response = await axios.get(`http://localhost:8000/api/v2/guides/${guideId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.data) {
        setSelectedGuideContent(response.data.data);
        console.log(`Fetched content for guide ${guideId}:`, response.data.data);
      } else {
        setError(`No content found for guide: ${guideId}`);
        setSelectedGuideContent(null);
      }
    } catch (err) {
      console.error(`Error fetching guide content for ${guideId}:`, err.response?.data || err.message);
      setError(err.response?.data?.message || `Failed to load content for guide: ${guideId}`);
      setSelectedGuideContent(null);
    } finally {
      setIsContentLoading(false);
    }
  };

  const handleGuideClick = (guide) => {
    setSelectedGuide(guide);
    if (user?.accessToken) {
      fetchGuideContent(guide.id, user.accessToken);
    } else {
      setError("Please log in to view guide content.");
    }
  };

  if (isLoading || user === null) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <NavbarDash />
        <div className="flex-1 flex items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="ml-4 text-lg">Loading guides and checking authentication...</p>
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
          <p className="text-gray-400">Please <Link to="/login" className="text-orange-400 hover:underline">log in</Link> to view essential guides.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash />

      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center text-cyan-400">
            <BookText size={36} className="mr-3" /> Essential Guides
          </h1>
          <p className="text-lg text-gray-300">
            Access vital information and protocols for various emergency situations.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-5 border border-gray-700">
              <CardHeader className="pb-4 border-b border-gray-700">
                <CardTitle className="text-xl font-bold text-cyan-300">Available Guides</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {guides.length === 0 ? (
                  <p className="text-gray-400">No guides found.</p>
                ) : (
                  <div className="space-y-2">
                    {guides.map((guide) => (
                      <Button
                        key={guide.id}
                        variant="ghost"
                        className={`w-full justify-start text-left text-lg py-3 px-4 rounded-md transition-colors duration-200
                                    ${selectedGuide?.id === guide.id ? 'bg-cyan-700 text-white' : 'hover:bg-gray-700 text-gray-200'}`}
                        onClick={() => handleGuideClick(guide)}
                      >
                        {guide.title}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="bg-gray-800 text-white shadow-lg rounded-lg p-5 border border-gray-700">
              <CardHeader className="pb-4 border-b border-gray-700">
                <CardTitle className="text-xl font-bold text-cyan-300">
                  {selectedGuide ? (selectedGuide.title ) : 'Select a Guide'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 min-h-[300px] overflow-y-auto custom-scrollbar">
                {isContentLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                    <p className="ml-4 text-lg text-gray-400">Loading guide content...</p>
                  </div>
                ) : selectedGuideContent ? (
                  <div className="prose prose-invert max-w-none text-gray-300">
                    {selectedGuideContent.introduction && (
                        <p className="text-lg leading-relaxed mb-6 text-gray-200 italic">
                            {selectedGuideContent.introduction}
                        </p>
                    )}

                    {selectedGuideContent.sections && selectedGuideContent.sections.map((section, index) => (
                      <div key={index} className="mb-6">
                        {section.heading && <h3 className="text-xl font-semibold text-cyan-200 mb-2">{section.heading}</h3>}
                        {section.content && <p className="text-lg leading-relaxed">{section.content}</p>}
                        {section.preparations && (
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {section.preparations.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <span className="font-medium">{item.title}</span> {item.info}
                              </li>
                            ))}
                          </ul>
                        )}
                        {section.todo && (
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {section.todo.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <span className="font-medium">{item.title}</span> {item.info}
                              </li>
                            ))}
                          </ul>
                        )}
                         {section.followthese && (
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {section.followthese.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <span className="font-medium">{item.title}</span> {item.info}
                              </li>
                            ))}
                          </ul>
                        )}
                        {section.calamity_types && (
                          <div className="mt-4 space-y-3">
                            {section.calamity_types.map((calamity, calamityIndex) => (
                              <div key={calamityIndex} className="bg-gray-700 p-3 rounded-md">
                                <h5 className="font-semibold text-base text-teal-200">{calamity.name}</h5>
                                <p className="text-sm text-gray-300">{calamity.procedure}</p>
                                {calamity.checklist && (
                                  <ul className="list-disc list-inside text-xs text-gray-400 mt-1">
                                    {calamity.checklist.map((item, checkIndex) => (
                                      <li key={checkIndex}>{item}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {section.war_scenarios && (
                          <div className="mt-4 space-y-3">
                            {section.war_scenarios.map((scenario, scenarioIndex) => (
                              <div key={scenarioIndex} className="bg-gray-700 p-3 rounded-md">
                                <h5 className="font-semibold text-base text-red-200">{scenario.name}</h5>
                                <p className="text-sm text-gray-300">{scenario.procedure}</p>
                                {scenario.checklist && (
                                  <ul className="list-disc list-inside text-xs text-gray-400 mt-1">
                                    {scenario.checklist.map((item, checkIndex) => (
                                      <li key={checkIndex}>{item}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {section["Tips for your safety and self defense "] && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-base text-yellow-200">Tips for your safety and self defense:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-300 mt-1">
                              {section["Tips for your safety and self defense "].map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {section.tips && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-base text-green-200">Tips:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-300 mt-1">
                              {section.tips.map((tip, tipIndex) => (
                                <li key={tipIndex}>
                                  {tip.title && <span className="font-medium">{tip.title}: </span>}
                                  {tip.details || tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {section.warnings && ( 
                          <div className="mt-4 text-orange-300">
                            <h5 className="font-semibold text-base">Warnings:</h5>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {section.warnings.map((warning, warnIndex) => (
                                <li key={warnIndex}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {section.food_types && (
                          <div className="mt-4 space-y-2">
                            {section.food_types.map((foodType, foodTypeIndex) => (
                              <div key={foodTypeIndex}>
                                <h5 className="font-semibold text-base text-indigo-200">{foodType.type}:</h5>
                                <ul className="list-disc list-inside text-sm text-gray-300 mt-1">
                                  {foodType.items.map((item, itemIndex) => (
                                    <li key={itemIndex}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                         {section.foraging_caution && ( 
                            <p className="text-sm text-yellow-300 mt-3 italic">{section.foraging_caution}</p>
                        )}
                        
                        {section.videos && (
                          <div className="mt-4 space-y-3">
                            {section.videos.map((videoUrl, videoIndex) => (
                              <div key={videoIndex}>
                                <h5 className="text-sm font-semibold text-purple-200 mb-1">Related Video {videoIndex + 1}:</h5>
                                <a
                                  href={videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline text-sm break-all"
                                >
                                  {videoUrl}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        {section.important_notes && (
                           <div className="mt-4">
                                <h5 className="font-semibold text-base text-orange-200">Important Notes:</h5>
                                <ul className="list-disc list-inside text-sm text-gray-300 mt-1">
                                {section.important_notes.map((note, noteIndex) => (
                                    <li key={noteIndex}>{note}</li>
                                ))}
                                </ul>
                           </div>
                        )}

                      </div>
                    ))}
                    {!selectedGuideContent.sections && ( 
                        <p className="text-lg text-gray-400">No structured content available, displaying raw JSON if any:</p>
                    )}
                    {(!selectedGuideContent.sections || (selectedGuideContent.sections && Object.keys(selectedGuideContent).length === 0)) && (
                         <pre className="mt-4 p-4 bg-gray-900 rounded-md text-sm overflow-x-auto text-gray-400">
                             {JSON.stringify(selectedGuideContent, null, 2)}
                         </pre>
                    )}

                    {selectedGuideContent.disclaimer && ( 
                      <p className="text-sm italic text-gray-500 mt-6">{selectedGuideContent.disclaimer}</p>
                    )}
                    {selectedGuideContent.storage_tips && ( 
                        <p className="text-sm text-blue-300 mt-6 font-medium">{selectedGuideContent.storage_tips}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-lg mt-10">
                    Select a guide from the left to view its detailed content here.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export {GuidesPage};
