import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_admin')({
  beforeLoad: ({ context }) => {
    const auth = context.auth;

    // Unauthenticated → /login
    if (!auth?.isAuthenticated) {
      throw redirect({ to: '/login' });
    }

    // Authenticated but not admin → /dashboard (silent redirect, no toast — app has no toast system)
    if (!auth.user?.roles?.includes('ADMIN')) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: () => <Outlet />,
});
