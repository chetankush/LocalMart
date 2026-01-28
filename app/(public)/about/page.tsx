import { Store, Users, Truck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About NearStore</h1>
          <p className="text-xl text-blue-100">
            Connecting local businesses with their communities in Guna, Madhya
            Pradesh
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Our Story */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed">
            NearStore was born in the heart of Guna, Madhya Pradesh, with a
            simple vision: to strengthen local communities by connecting
            customers with their neighborhood businesses. We believe that when
            local businesses thrive, entire communities flourish.
          </p>
        </div>

        {/* Our Mission */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                For Customers
              </h3>
              <p className="text-gray-600">
                Provide easy access to quality products and services from
                trusted local businesses with fast delivery and personalized
                service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                For Businesses
              </h3>
              <p className="text-gray-600">
                Empower local entrepreneurs with digital tools to reach more
                customers and grow sustainably within their community.
              </p>
            </div>
          </div>
        </div>

        {/* What We Do */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What We Do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Store Discovery
              </h3>
              <p className="text-sm text-gray-600">
                Help customers find local businesses and products in their area
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🚚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Fast Delivery
              </h3>
              <p className="text-sm text-gray-600">
                Enable quick and reliable delivery from local stores
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💼</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Business Support
              </h3>
              <p className="text-sm text-gray-600">
                Provide tools for local businesses to manage their online
                presence
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
          <p className="text-blue-100 mb-6">
            Have questions? We'd love to hear from you.
          </p>
          <div className="space-y-2 text-blue-100">
            <p>📍 Guna, Madhya Pradesh, India</p>
            <p>📧 info@localmart.com | 📞 +91 98765 43210</p>
          </div>
        </div>
      </div>
    </div>
  );
}
