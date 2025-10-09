"use client";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: any;
  totalPrice: any;
  product: {
    name: string;
    images: any;
  };
}

interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  statusHistory: any;
  subtotal: any;
  deliveryFee: any;
  taxAmount: any;
  discount: any;
  totalAmount: any;
  deliveryAddress: any;
  deliveryInstructions: string | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  customerNotes: string | null;
  vendorNotes: string | null;
  placedAt: Date;
  acceptedAt: Date | null;
  cancelledAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  customer: Customer;
  items: OrderItem[];
}

interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(date));
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Order Items */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Order Items
        </h4>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              {item.productImage && (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">
                  {item.productName}
                </h5>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
                <p className="text-sm text-gray-600">
                  Unit Price: {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(item.totalPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee:</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="text-green-600">
                  -{formatCurrency(order.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Delivery Information
          </h4>
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <p className="text-gray-600">
                {order.deliveryAddress?.street && (
                  <>
                    {order.deliveryAddress.street}
                    <br />
                  </>
                )}
                {order.deliveryAddress?.city && (
                  <>
                    {order.deliveryAddress.city}
                    <br />
                  </>
                )}
                {order.deliveryAddress?.state && (
                  <>
                    {order.deliveryAddress.state}
                    <br />
                  </>
                )}
                {order.deliveryAddress?.zipCode && (
                  <>{order.deliveryAddress.zipCode}</>
                )}
              </p>
            </div>
            {order.deliveryInstructions && (
              <div>
                <span className="font-medium text-gray-700">Instructions:</span>
                <p className="text-gray-600">{order.deliveryInstructions}</p>
              </div>
            )}
            {order.estimatedDeliveryTime && (
              <div>
                <span className="font-medium text-gray-700">
                  Estimated Delivery:
                </span>
                <p className="text-gray-600">
                  {formatDate(order.estimatedDeliveryTime)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Notes */}
      {order.customerNotes && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Customer Notes
          </h4>
          <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">
            {order.customerNotes}
          </p>
        </div>
      )}

      {/* Vendor Notes */}
      {order.vendorNotes && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Your Notes
          </h4>
          <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">
            {order.vendorNotes}
          </p>
        </div>
      )}

      {/* Status History */}
      {order.statusHistory &&
        Array.isArray(order.statusHistory) &&
        order.statusHistory.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Status History
            </h4>
            <div className="space-y-2">
              {order.statusHistory.map((entry: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{entry.status}</p>
                    <p className="text-sm text-gray-600">
                      {entry.timestamp && formatDate(new Date(entry.timestamp))}
                    </p>
                    {entry.note && (
                      <p className="text-sm text-gray-500 mt-1">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
