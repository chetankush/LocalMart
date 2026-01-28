"use client";

import { MapPin, Store, Truck, ChevronRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <MapPin className="w-6 h-6 text-orange-600" />,
      title: "Set Your Location",
      description: "Enter your pincode or use GPS to find the nearest stores delivering to your doorstep.",
    },
    {
      icon: <Store className="w-6 h-6 text-orange-600" />,
      title: "Choose a Store",
      description: "Browse products from your favorite local shops, compare prices, and check reviews.",
    },
    {
      icon: <Truck className="w-6 h-6 text-orange-600" />,
      title: "Fast Delivery",
      description: "Get your order delivered in minutes directly by the store owner or their staff.",
    },
  ];

  return (
    <div className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-orange-600 font-semibold tracking-wider uppercase text-sm">Simple Process</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">How NearStore Works</h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            Experience the convenience of local shopping with the speed of modern technology.
          </p>
        </div>
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="group flex flex-col sm:flex-row items-center sm:items-start p-6 rounded-2xl border border-gray-100 bg-white hover:border-orange-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              {/* Step Number Background Watermark */}
              <span className="absolute -right-4 -bottom-8 text-9xl font-bold text-gray-50 opacity-50 select-none pointer-events-none group-hover:text-orange-50 transition-colors">
                {index + 1}
              </span>

              <div className="shrink-0 mb-4 sm:mb-0 sm:mr-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold sm:hidden">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="hidden sm:flex items-center justify-center text-gray-300 ml-4 group-hover:text-orange-400 group-hover:translate-x-1 transition-all z-10">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
