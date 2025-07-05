import React from "react";
import logo from "../assets/logo.jpg"
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
const Aboutus = () => {
    return(
        <>
            <div className="text-center mt-25">
                <span className="bg-neutral-900 text-cyan-300 rounded-full h-20 text-xl font-medium px-2 py-1 uppercase">
                    About Us
                </span>
            </div>
            <div className=" mt-20 ">
                <div className=" items-center  text-xl px-40 text-neutral-400">
                    <p>
                        GuardianGrid is a dedicated web application designed to empower individuals and 
                        communities with crucial information and resources for navigating uncertain times. 
                        We provide real-time alerts, essential disaster management tools like comprehensive 
                        shelter directories, and insightful historical data on global conflicts. 
                        Our mission is to foster resilience and ensure timely, reliable information is accessible 
                        to everyone, helping users stay informed, prepared, and safe.
                    </p>
                </div>
                

            </div>
            <div className="text-center mt-25">
                <span className="bg-neutral-900 text-cyan-300 rounded-full h-20 text-xl font-medium px-2 py-1 uppercase">
                    contact Us
                </span>
            </div>
            <div className="text-xl flex justify-center items-center text-center mt-15 text-neutral-400 ">
                <p>
                    Have a question, feedback, or need assistance? We're here to help! Reach out to the GuardianGrid team using the methods below.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-5 ">
                <div className="text-xl flex justify-center items-center text-center mt-15  ">
                    <img src={logo} className="w-65 h-65 rounded-2xl contrast-80" />
                </div>
                <div className="text-xl flex justify-center items-center text-center mt-15  ">
                    <div className="text-2xl  text-cyan-400">
                        Contact : +91 12345 XXXXX
                        <br />
                        <br />
                        Email : guardiangrid@gmail.com 
                        <br />
                        <br /> 
                        <div className="flex justify-around ">
                             <div className="rounded-4xl border-2 border-white w-15 text-center px-1">
                                <Facebook size={45} color="white" radius={12} />
                            </div>
                            <div className="rounded-4xl border-2 border-white w-15 text-center px-1 ">
                                <Instagram size={45} color="white" radius={12} />
                            </div>
                            <div className="rounded-4xl border-2 border-white w-15 text-center px-2 ">
                                <Linkedin size={42} color="white" radius={12} />
                            </div>
                            <div className="rounded-4xl border-2 border-white w-15 text-center px-2 ">
                                <Twitter size={42} color="white" radius={12} />
                            </div>
                        </div>
                    </div>
                    <br />
                </div>
                
            </div>
            <hr className="bg-neutral-600 mt-20"/>
        </>
    )
}

export {Aboutus}