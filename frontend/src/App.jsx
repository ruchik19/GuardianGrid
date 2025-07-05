import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { LoginPage } from './pages/LoginPage.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { SignUpPage } from './pages/SignUpPage.jsx'; 
import { Dashboard } from './pages/Dashboard.jsx';
import { CreateAlertPage } from './pages/CreateAlert.jsx';
import { useEffect } from 'react';
import authService from './authpage.js';
import { initializeSocket } from './socket.js';
import { ManageAlertsPage } from './pages/ManageAlert.jsx';
import { ManageContactsPage } from './pages/ManageContacts.jsx';
import { AlertsPage } from './pages/Allalert.jsx';
import { ContactsPage } from './pages/EmergencyContacts.jsx';
import { PastWarsPage } from './pages/PastWars.jsx';
import { GuidesPage } from './pages/Guides.jsx';
import { ManageSheltersPage } from './pages/ManageShelter.jsx';
import { SheltersPage } from './pages/Shelters.jsx';
import { ProfilePage } from './pages/ProfileUpdate.jsx';
function App() {
  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      initializeSocket(user);
    }
  }, []);
  return (
    <>
      
      <div className="app">
       <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path='/dashboard' element={<Dashboard/>} />
              <Route path='/alerts/create' element={<CreateAlertPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/alerts/manage" element={<ManageAlertsPage />} />
              <Route path="/contacts/manage" element={<ManageContactsPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/past-wars" element={<PastWarsPage />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/shelters/manage" element={<ManageSheltersPage />} />
              <Route path="/shelters" element={<SheltersPage />} />
              <Route path="/profile" element={<ProfilePage />} />


            </Routes>
       </Router>
     </div>
          
    </>

    
  )
}

export default App;