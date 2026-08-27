import Image from "next/image";
import {CloudSun} from 'lucide-react';
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Languages , Users , Handshake  } from 'lucide-react'
import {  Cloud , Bot, O, Info , HandHelping ,AlertTriangle  } from 'lucide-react'
export default function Home() {
  return (
    <div className="relative w-full overflow-x-hidden">
      <div className="relative min-h-[60vh] lg:min-h-screen flex items-center justify-center">
    <Image src="/BG IMAGE.svg" alt="Weather Background" fill priority className="object-cover -z-10" />

     <section className="text-center px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-7xl text-cyan-500 font-bold"><CloudSun size={100} className="mx-auto py-auto fill-amber-500"/>WeatherGPT
            </h1>
            <p className="mt-4 text-2xl  text-black">
              WeatherGPT is an Conversational AI for Weather Forecasting, Alerts, and Climate Information
            </p>
            <div className="mt-8 flex justify-center gap-8">
               <Show when="signed-out">
              <SignInButton />
              <SignUpButton>
                <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          

            </div>
          </div>
        </section>

   </div>









   {/*  */}


    <div className="bg-gray-700">
        <div className="flex flex-col items-center px-4 py-12">
          <Users  className="w-12 h-12 text-green-500 fill-green-500 mb-6" />
          <h2 className="text-3xl sm:text-4xl text-center text-white font-bold">
            Helping Citizens with Technology
          </h2>
          <p className="font-bold max-w-3xl w-full text-center py-6 text-white">
           WeatherGPT is an AI-powered platform for real-time weather forecasts and alerts.
Ask weather questions in natural language and get personalized, location-based insights.
Supports multilingual and voice-based weather assistance.
          </p>

          <h2 className="text-3xl sm:text-4xl text-white py-10">What We Offer</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl px-4">
            <div className="rounded bg-gray-300 text-black p-4">
              <Bot className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <h3 className="text-center font-bold">AI Weather Assistant</h3>
              <p className="text-gray-600 text-center mt-2">
                Citizens can ask questions about weather, forecasts, and alerts.
              </p>
            </div>
            <div className="rounded bg-gray-300 text-black p-4">
              <Cloud  className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <h3 className="text-center font-bold">Weather Forecasts</h3>
              <p className="text-gray-600 text-center mt-2">
                Citizens can access detailed weather forecasts for their location.
              </p>
            </div>
            <div className="rounded bg-gray-300 text-black p-4">
              <Info className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <h3 className="text-center font-bold">Weather Analysis</h3>
              <p className="text-gray-600 text-center mt-2">
                Citizens can analyse weather patterns and trends for better planing and preparedness
              </p>
            </div>
            <div className='rounded bg-gray-300 text-black p-4'>
              <AlertTriangle className='w-10 h-10 text-green-600 mx-auto mb-2' />
              <h3 className='text-center font-bold'>Weather Alerts</h3>
              <p className='text-gray-600 text-center mt-2'>
                Citizens can receive timely weather alerts and notifications for their location.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-500">
              How It Helps Citizens
            </h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-lg bg-gray-100 p-3 text-gray-700">
                <Handshake  />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-500">Better Decisions</h3>
                <p className="mt-1 text-pink-400">
                  AI Powered Chat bot Provides suggestion according to the occpation of the user. Like for Farmers can make informed decisions about planting, irrigation, and harvesting based on accurate weather forecasts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-lg bg-gray-100 p-3 text-gray-700">
                <Languages  />
              </div>
              <div>
                <h3 className="text-lg font-semibold  text-green-500">Multilingual Support</h3>
                <p className="mt-1 text-pink-400">
                  The platform supports multiple languages, making it accessible to a wider audience of citizens.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-lg bg-gray-100 p-3 text-gray-700">
                <Info  />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-500">Weather Insights</h3>
                <p className="mt-1 text-pink-400">
                  Citizens can access detailed weather insights, including temperature, precipitation, wind speed, and more, to plan their daily activities effectively.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="py-12 px-6 text-white mt-8 bg-green-500">
        <div className="max-w-4xl mx-auto text-center">
          <HandHelping  className="w-8 h-8 mx-auto mb-4 opacity-80" />
          <p className="text-lg mb-2 opacity-90 text-white">
            Built with the aim of supporting citizens through technology.
          </p>
          <p className="text-sm opacity-70">Made by Anubhav Dixit and Team</p>
          <p className="text-sm opacity-50 mt-4">
            © {new Date().getFullYear()} WeatherGPT. All rights reserved.
          </p>
        </div>
      </footer>



{/*  */}
    </div>

  );
}
