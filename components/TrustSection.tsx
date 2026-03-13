"use client";

import { ShieldCheck, Truck, Clock, RefreshCw } from "lucide-react";

export default function TrustSection() {
  const trustItems = [
    {
      icon: <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-[#0071dc]" />,
      title: "Fast Local Delivery",
      description: "Get essentials delivered from nearby stores in minutes.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#0071dc]" />,
      title: "Trusted Vendors",
      description: "100% verified local businesses and authentic products.",
    },
    {
      icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-[#0071dc]" />,
      title: "24/7 Service",
      description: "Many stores operational round the clock for your needs.",
    },
    {
      icon: <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-[#0071dc]" />,
      title: "Easy Returns",
      description: "Hassle-free returns directly with your local shopkeeper.",
    },
  ];

  return (
    <div className="bg-[#f2f8fd] py-4 border-b border-gray-200 w-full">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="group flex flex-row sm:flex-col items-center sm:text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-300"
            >
              <div className="mr-3 sm:mr-0 sm:mb-2 p-2 bg-[#e3f2fd] rounded-full group-hover:bg-blue-100 transition-colors">
                {item.icon}
              </div>
              <div className="flex-1 text-left sm:text-center">
                <h3 className="text-sm font-bold text-[#041e42] mb-0.5">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
