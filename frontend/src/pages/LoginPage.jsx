import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; 

import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert.jsx';
import { initializeSocket } from '../socket.js';
import authService from '../authpage.js';
import { NavbarDash } from '@/components/NavbarDashboard';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LoginPage = () => {
  const navigate = useNavigate();
  const [emailOrContact, setEmailOrContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {

      const isEmail = emailOrContact.includes('@');

      const loginData = {
        password,
      };

      if (isEmail) {
        loginData.email = emailOrContact.toLowerCase();
      } else {
        loginData.contact = emailOrContact;
      }

      const response = await axios.post(`${BACKEND_URL}/api/v2/users/login`, loginData);
      const userData = response.data.data.user;
      const accessToken = response.data.data.accessToken;

      userData.accessToken = accessToken;
      authService.setUser(userData);
      console.log('Login successful. User data from backend:', userData);

      initializeSocket(userData);
      console.log("LoginPage: Socket initialized via service.");
      setSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000); 

    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <NavbarDash/>

      <div className="flex-1 flex items-center justify-center py-8 px-4 ">
        <div className="flex flex-col gap-6 p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full border-2 border-teal-600 drop-shadow-lg drop-shadow-cyan-600">
          <h2 className="text-3xl font-bold text-teal-500 text-center">
            Login
          </h2>
          <p className="text-gray-400 text-center">Access your GuardianGrid account</p>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="bg-pink-800 text-white">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="emailOrContact">Email or Phone Number :</Label>
                <Input
                  id="emailOrContact"
                  type="text"
                  placeholder="you@example.com or +919876543210"
                  value={emailOrContact}
                  onChange={(e) => setEmailOrContact(e.target.value)}
                  className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white mt-4"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="mt-3">Password :</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 focus-visible:ring-blue-500 text-white pr-10 mt-4"
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

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging In...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>

          <p className="text-gray-400 text-center">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export {LoginPage};
