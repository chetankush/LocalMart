const SubscriptionPage = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Subscription Plans</h1>
        <p className="text-center text-gray-600 mb-8">
          Choose a plan that works for you
        </p>
        {/* Add your custom pricing component here */}
        <div className="text-center text-gray-500">
          Pricing table coming soon
        </div>
      </div>
    </main>
  );
};

export default SubscriptionPage;
