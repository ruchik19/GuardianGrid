import React from "react";
import alertphoto from "../assets/alertphoto.jpeg";
import mapsphoto from "../assets/mapsphoto.jpeg";
import emergencycontact from "../assets/emergencycontact.jpeg";
import survivalkit from "../assets/survivalguide.jpeg";
import pastwars from "../assets/pastwars.jpeg";
import weather from "../assets/weather.jpeg";

const Features = () => {
    return(
        
        <div className="relative mt-20 border-b border-neutral-700 min-h-[800px]">
            <div className="text-center">
                <span className="bg-neutral-900 text-cyan-300 rounded-full h-20 text-xl font-medium px-2 py-1 uppercase">
                    Features
                </span>
            </div>
            <div className="flex gap-10">
                <figure class="md:flex mt-15 bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800 w-1/2 h-2/3">
                    <img class="lg:w-60 lg:rounded-xl lg:h-65 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src={alertphoto} alt="" />
                        <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
                            <figcaption class="font-medium">
                                <div class="text-blue-300 text-2xl">
                                    Real-time Alerts & Notifications
                                </div>
                            </figcaption>
                            <blockquote>
                                <p class="text-lg font-medium text-neutral-100">
                                    “Receive immediate, location-based alerts regarding local incidents, natural disasters, 
                                    and critical warnings..”
                                </p>
                            </blockquote>
                        </div>
                </figure>
                <figure class="md:flex mt-15 bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800 w-1/2 h-2/3">
                    <img class="lg:w-60 lg:rounded-xl lg:h-65 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src={mapsphoto} alt="" />
                        <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
                            <figcaption class="font-medium">
                                <div class="text-blue-300 text-2xl">
                                    Emergency Shelter Directory
                                </div>
                            </figcaption>
                            <blockquote>
                                <p class="text-lg font-medium text-neutral-100">
                                    “Instantly locate and navigate to nearby emergency shelters. Access essential details 
                                    like capacity, services offered, and real-time availability .”
                                </p>
                            </blockquote>
                        </div>
                </figure>
            </div>
            <div className="flex gap-10">
                <figure class="md:flex mt-15 bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800 w-1/2 h-2/3">
                    <img class="lg:w-60 lg:rounded-xl lg:h-65 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src={emergencycontact} alt="" />
                        <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
                            <figcaption class="font-medium">
                                <div class="text-blue-300 text-2xl">
                                    Emergency Contacts
                                </div>
                            </figcaption>
                            <blockquote>
                                <p class="text-lg font-medium text-neutral-100">
                                    “Securely store and quickly access your critical emergency contacts. In times of crisis, 
                                    this feature ensures immediate communication with your loved ones and essential services..”
                                </p>
                            </blockquote>
                        </div>
                </figure>
                <figure class="md:flex mt-15 bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800 w-1/2 h-2/3">
                    <img class="lg:w-55 lg:rounded-xl lg:h-65 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src={survivalkit} alt="" />
                        <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
                            <figcaption class="font-medium">
                                <div class="text-blue-300 text-2xl">
                                    Essential Preparedness Guides
                                </div>
                            </figcaption>
                            <blockquote>
                                <p class="text-lg font-medium text-neutral-100">
                                    “Access a curated library of vital first-aid, survival, and evacuation guides. These resources are designed
                                    to equip you with crucial knowledge..”
                                </p>
                            </blockquote>
                        </div>
                </figure>
            </div>
            <div className="flex gap-10">
                <figure class="md:flex mt-15 bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800 w-1/2 h-2/3">
                    <img class="lg:w-60 lg:rounded-xl lg:h-65 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src={pastwars} alt="" />
                        <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
                            <figcaption class="font-medium">
                                <div class="text-blue-300 text-2xl">
                                    Historical War & calamity Insights
                                </div>
                            </figcaption>
                            <blockquote>
                                <p class="text-lg font-medium text-neutral-100">
                                    “Explore historical context & deatils of past conflicts worldwide.
                                    This provides in-depth information for understanding global events..”
                                </p>
                            </blockquote>
                        </div>
                </figure>
                <figure class="md:flex mt-15 bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800 w-1/2 h-2/3">
                    <img class="lg:w-60 lg:rounded-xl lg:h-65 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto" src={weather} alt="" />
                        <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
                            <figcaption class="font-medium">
                                <div class="text-blue-300 text-2xl">
                                    Local Weather & Seismic Updates
                                </div>
                            </figcaption>
                            <blockquote>
                                <p class="text-lg font-medium text-neutral-100">
                                    “Stay updated with current weather conditions and recent earthquake activities in your specific area.
                                    ”
                                </p>
                            </blockquote>
                        </div>
                </figure>
            </div>

            
        </div>
        
    )
}

export {Features};