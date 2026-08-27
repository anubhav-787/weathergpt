"use client";
import React, { useState } from "react";
import { InfoIcon, ScanSearch, Store, Wheat, MessageCircleMore , Contact2,Receipt  } from "lucide-react";
import Link from "next/link";
import { CloudSun } from "lucide-react";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Show when="signed-in">
    <nav className="bg-orange-500 w-full px-6">
      
      <div className="flex justify-between items-center h-[9vh]">

        <div className="flex items-center gap-2">
          <CloudSun className="h-6 w-6 text-white" /> <h3 className="text-white font-bold text-lg">WeatherGPT</h3>
        </div>
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>


        <div className="hidden md:flex items-center gap-4">
          <Link href="/Dashboard" className="flex items-center text-sm hover:text-blue-500">
            <MessageCircleMore  className="h-4 w-4 mr-1" /> Dashboard
          </Link>
          <Link href="/contact" className="flex items-center text-sm hover:text-blue-500">
            <Contact2 className="h-4 w-4 mr-1" /> Contact Us
          </Link>




          
           
            <UserButton />
          
        </div>
      </div>
      


      {isOpen && (
        <div className="md:hidden flex flex-col gap-3 mt-3 text-white">
          <Show when="signed-in">
          <Link href="/Chat" className="flex items-center hover:text-blue-200">
            <MessageCircleMore className="h-4 w-4 mr-1" /> Chat
          </Link>
          <Link href="/contact" className="flex items-center hover:text-blue-200">
            <Contact2 className="h-4 w-4 mr-1" /> Contact
          </Link>


          

           
            <UserButton />
          </Show>
        </div>
      )}
    </nav>
    </Show>
  );
};

export default Navbar;
