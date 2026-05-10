import { ApprovalsPollerProvider } from './_approvals/ApprovalsPollerContext';
import { VendorTopBar } from './_approvals/VendorTopBar';
import { NewOrderToaster } from './_approvals/NewOrderToaster';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApprovalsPollerProvider>
      <VendorTopBar />
      {children}
      <NewOrderToaster />
    </ApprovalsPollerProvider>
  );
}
