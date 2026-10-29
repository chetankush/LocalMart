import { ApprovalsPollerProvider } from './_approvals/ApprovalsPollerContext';
import { VendorTopBar } from './_approvals/VendorTopBar';
import { NewOrderAlert, RingerOffBar } from './_approvals/NewOrderAlert';
import { PausedBar } from './_approvals/ShopBusy';
import { OrderAlertsPrompt } from './_approvals/OrderAlertsSetup';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApprovalsPollerProvider>
      <VendorTopBar />
      {/* "New orders paused" — on every seller page while it's true */}
      <PausedBar />
      {/* "Turn on order alerts on this phone" until it's done */}
      <OrderAlertsPrompt />
      {/* "Order ringer is off — tap anywhere" (phones; desktops show it in the tab strip) */}
      <RingerOffBar />
      {children}
      {/* Rings until answered + full-screen new-order card */}
      <NewOrderAlert />
    </ApprovalsPollerProvider>
  );
}
