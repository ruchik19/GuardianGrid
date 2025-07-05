import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import logo from "../assets/logo.jpg"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import { Sun, Moon, Home, BellRing, MapPin, BookText, Archive, Users, User2, LogOut} from 'lucide-react';
import  { getSocket, disconnectSocket, initializeSocket  } from '../socket.js';
import authService from "../authpage.js";


const NavbarDash = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {

      setUser(updatedUser);
      setIsAuthenticated(!!updatedUser);

      if (!updatedUser) {
        disconnectSocket();
        console.log("NavbarDashboard: User logged out, socket disconnected.");
        navigate('/login');
      } else {
        console.log("NavbarDashboard: User logged in or state restored:", updatedUser.name);
      }
    });

    const initialUser = authService.getUser();
    setUser(initialUser);
    setIsAuthenticated(!!initialUser);

    return () => unsubscribe();
  }, [navigate]); 

   const handleLogout = () => {
    authService.logout(); 
  };

  

  return (
    <nav className="sticky top-0 z-50 py-3 backdrop-blur-lg border-b border-neutral-700/80 flex">
            <div className='flex items-center shrink-0 mr-2'>
              <img src={logo} alt="logo" className='h-15 w-15 ml-4 mr-1'/>
              <Link to="/" className="text-3xl tracking-tight text-shadow-indigo-50 font-bold">GuardianGrid</Link>
            </div>
  
      {isAuthenticated && user.role == "civilian" &&(
        <div className="hidden lg:flex gap-6 ml-20">
          <Link to="/dashboard" className="flex items-center hover:underline hover:text-cyan-500 mr-10 text-xl">
            <Home size={25} className="mr-1 " /> Dashboard
          </Link>
          <Link to="/alerts" className="flex items-center hover:underline  hover:text-cyan-500 text-xl ">
            <BellRing size={25} className="mr-1" /> Alerts
          </Link>
          <Link to="/shelters" className="flex items-center hover:underline  hover:text-cyan-500 ml-10 text-xl">
            <MapPin size={25} className="mr-1" /> Shelters
          </Link>
          <Link to="/past-wars" className="flex items-center hover:underline  hover:text-cyan-500 ml-10 text-xl">
            <Archive size={25} className="mr-1" /> Past Wars
          </Link>
          <Link to="/guides" className="flex items-center hover:underline  hover:text-cyan-500 ml-10 text-xl">
            <BookText size={25} className="mr-1" /> Guides
          </Link>
          <Link to="/contacts" className="flex items-center hover:underline  hover:text-cyan-500 ml-10 text-xl">
            <Users size={25} className="mr-1" /> Contacts
          </Link>
        </div>
      )}

      <div className="flex items-center ml-auto"> 
       

        {isAuthenticated ? (
            
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-gray-300 hover:text-cyan-500 h-10 text-xl mr-10">
                <User2 size={30} className="mr-2" />
                {user?.name || "User"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-48 bg-gray-800 text-white border-gray-700 `}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className='bg-gray-700'  />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-gray-300 hover:text-cyan-500">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-neutral-500 hover:text-cyan-500">
                <LogOut size={16} className="mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
            <div className="navbar hidden lg:flex justify-center space-x-8 items-center rounded-2xl ">
                <Button className="button py-6 px-3 bg-transparent text-white border-white border-2 rounded-2xl text-2xl"><Link to="/login" >Sign In</Link></Button>
                <Button className="button bg-gradient-to-l from-cyan-500 to-cyan-900 py-6 px-3 rounded-2xl text-2xl mr-5"><Link to="/signup" >Create an Account</Link></Button>
            </div>
        )}
        </div>
    </nav>
  );
};

export {NavbarDash};
