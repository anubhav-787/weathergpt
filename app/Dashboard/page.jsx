"use client"
import React, { useEffect } from 'react';
import { useState, useRef } from "react";
import Namesearch from "../../components/Namesearch";
import Assistant from '../../components/Assistant';
import Link from 'next/link';


const page = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLocationWeather = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
          const data = await res.json();

          if (data.error) {
            setError(data.error);
          } else {
            setWeather(data);
          }
        } catch (err) {
          setError("Failed to fetch data");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError("Location permission denied");
      }
    );
  };

  useEffect(() => {
    getLocationWeather();
  }, []);

  return (
    <div className='bg-green-100 h-[100vh] w-full'>
{/* greet component */}
     <div className="font-bold text-3xl w-full h-[8vh] flex items-center justify-center text-emerald-500 font-style: italic">
   <Namesearch /> 
</div>



<div>
  <Assistant/>

</div>


</div>
  )
}

export default page