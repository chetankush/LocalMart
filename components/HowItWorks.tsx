"use client";

import { MapPin, Store, Truck, ChevronRight } from "lucide-react";

interface HowItWorksProps {
  title?: string;
  subtitle?: string;
}

export default function HowItWorks({
  title = "How LocalMart Works",
  subtitle = "Experience the convenience of local shopping with the speed of modern technology.",
}: HowItWorksProps) {
  const steps = [
    {
      icon: <MapPin className="w-6 h-6 text-[#0071dc]" />,
      title: "Set Your Location",
      description: "Enter your pincode or use GPS to find the nearest stores delivering to your doorstep.",
    },
    {
      icon: <Store className="w-6 h-6 text-[#0071dc]" />,
      title: "Choose a Store",
      description: "Browse products from your favorite local shops, compare prices, and check reviews.",
    },
    {
      icon: <Truck className="w-6 h-6 text-[#0071dc]" />,
      title: "Fast Delivery",
      description: "Get your order delivered in minutes directly by the store owner or their staff.",
    },
  ];

  return (
    <div className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#0071dc] font-semibold tracking-wider uppercase text-sm">Simple Process</span>
          <h2 className="text-3xl font-bold text-[#041e42] mt-2">{title}</h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            {subtitle}
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group flex flex-col sm:flex-row items-center sm:items-start p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              <div className="shrink-0 mb-4 sm:mb-0 sm:mr-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#e3f2fd] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left relative z-10">
                <h3 className="text-xl font-bold text-[#041e42] mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0071dc] text-white text-xs font-bold sm:hidden">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="hidden sm:flex items-center justify-center text-gray-300 ml-4 group-hover:text-[#0071dc] group-hover:translate-x-1 transition-all z-10">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
