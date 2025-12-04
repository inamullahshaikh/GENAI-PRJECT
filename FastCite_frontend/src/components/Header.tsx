import React from "react";
import { Search, Bell, User } from "lucide-react";
import Logo from "./Logo";

const Header = () => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
      {/* Left side - Logo */}
      <div className="flex items-center">
        <Logo />
        <span className="ml-3 text-2xl font-bold text-purple-600">Foresyte</span>
      </div>

      {/* Center - Search Bar */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search exams, students, reports..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right side - Notifications and User */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell className="h-6 w-6 text-gray-600" />
            {/* <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              3
            </span> */}
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <div className="font-semibold text-gray-900 text-sm">Demo User</div>
            <div className="text-gray-500 text-xs">Administrator</div>
          </div>
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;