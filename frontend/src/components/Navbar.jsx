import logo from "../assets/logo.jpg";
import { Menu, X } from "lucide-react";
import { use, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import { Button } from "./ui/button.jsx";

export const Navbar = () => {
    const navigate = useNavigate();
    const [mobileDrawer, setMobileDrawer]= useState(false);
        const toggleNavbar = () => {
            setMobileDrawer(!mobileDrawer)
        }
  return (
    <nav className="sticky top-0 z-50 py-3 backdrop-blur-lg border-b border-neutral-700/80">
        <div className="container px-4 mx-auto relative text-sm">
            <div className="flex justify-around items-center ">
                <div className="flex items-center flex-shrink-0">
                    <img src={logo} alt="logo" className="h-15 w-15 mr-2 " />
                    <span className="text-3xl tracking-tight text-shadow-indigo-50 font-bold">GuardianGrid</span>
                </div>
                <ul className="navbar hidden ml-8 lg:flex space-x-12 text-2xl gap-10" >
                    <li><a href="#"></a>Home</li>
                    <li><a href="#"></a>Features</li>
                    <li><a href="#"></a>About Us</li>
                    <li><a href="#"></a>Contact</li>  
                </ul>
                {/* <button className="lg-flex ml-10 space-x-12 rounded-2xl text-xl bg-amber-100 h-10 w-25 text-black "></button> */}
                <div className="navbar hidden lg:flex justify-center space-x-12 items-center rounded-2xl ">
                    <Button className="button py-6 px-3 bg-transparent text-white border-white border-2 rounded-2xl text-2xl"><Link to="/login" >Sign In</Link></Button>
                    <Button className="button bg-gradient-to-l from-cyan-500 to-cyan-900 py-6 px-3 rounded-2xl text-2xl "><Link to="/signup" >Create an Account</Link></Button>
                </div>
                
                <div className="lg:hidden md:flex flex-col justify-end">
                    <button onClick={toggleNavbar}>
                        {mobileDrawer? <X /> : <Menu />}
                    </button>
                </div>
            </div>
            {mobileDrawer && (
                <div className="fixed right-0 z-20 bg-neutral-900 w-full p-12 flex-col justify-center items-center lg:hidden">
                    <ul>
                        <li className="py-5 text-2xl"><a href="#"></a>Home</li>
                        <li className="py-5 text-2xl"><a href="#"></a>Features</li>
                        <li className="py-5 text-2xl"><a href="#"></a>About Us</li>
                        <li className="py-5 text-2xl"><a href="#"></a>Contact</li>
                    </ul>
                    <div className="flex space-x-10 ">
                        <Button><Link to="/login" className="mt-3 py-3 px-4 border-white border-2 rounded-md text-2xl">Sign In</Link></Button>

                        <Button><Link to="/signup" className="mt-3 bg-gradient-to-r from-slate-500 to-cyan-900 py-2 px-3 rounded-md te">Create an Account</Link></Button>
                    </div>
                </div>
            )}
        </div>
    </nav>
  )
}
