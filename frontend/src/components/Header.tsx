import Image from 'next/image';
import React from 'react';
import banner from '../assets/banner.png';

function Header() {
  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-center mt-12 gap-8 md:gap-12">
        <div className="flex flex-col gap-5 md:w-2/5">
          <h1 className="font-extrabold text-[40px] text-gray-800">
            Empower Survivors with{' '}
            <span className="text-blue-700">SupportSafe</span>
          </h1>
          <p className="text-[20px] text-gray-600 leading-relaxed">
            SupportSafe is a discreet AI companion for women facing abuse.
            Get help, confidential guidance, private mental health support, and trusted
            legal advice, all without exposing your situation.
          </p>
          <p className="text-[20px] text-gray-600 leading-relaxed">
            Whether you need a safe way to ask for help, emotional support, or
            legal clarity, SupportSafe is here to guide you gently and securely.
          </p>

          <div className="flex items-center gap-4">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-lg text-white rounded-lg shadow-md transform hover:scale-105 duration-200 ease-in-out font-semibold">
              Register
            </button>
            <button className="px-6 py-3 text-lg text-blue-700 rounded-lg border border-blue-700 shadow-md transform hover:scale-105 hover:bg-blue-700 hover:text-white duration-200 ease-in-out font-semibold">
              Report Now
            </button>
          </div>
        </div>
        <div className="w-full md:w-3/5">
          <div className="relative w-full h-64 md:h-96 lg:h-[520px]">
            <Image
              src={banner}
              alt="banner"
              fill
              className="object-cover rounded-lg shadow-lg scale-x-[-1] filter brightness-95 dark:brightness-75"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;