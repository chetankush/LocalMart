import { getCurrentUser } from '@/src/shared/utils/auth';
import { redirect } from 'next/navigation';
import RoleSelectionClient from './RoleSelectionClient';

export default async function SelectRolePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // If user already has a role selected and is vendor with profile, redirect to dashboard
  if (user.role === 'VENDOR' && user.vendor) {
    redirect('/vendor/dashboard');
  }

  // If customer, redirect to home
  if (user.role === 'CUSTOMER') {
    redirect('/');
  }

  return <RoleSelectionClient userId={user.id} />;
}
