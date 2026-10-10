'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { auth } from '@/lib/api';
import { useRouter } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Home & Beneficiary Portal', href: '/' },
  { label: 'Disability Assistance', href: '/disability-assistance' },
  { label: 'Elderly Care', href: '/elderly-care' },
  { label: 'Women Safety (SOS)', href: '/women-safety-sos' },
  { label: 'Volunteer Portal', href: '/volunteer-portal' },
  { label: 'My Profile', href: '/profile' },
  { label: 'Admin Console', href: '/admin' },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    try {
      await auth.logout();
    } finally {
      clearAuth();
      router.push('/');
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-7xl mx-auto px-gutter flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-lg">
          <Link
            className="flex items-center gap-space-sm focus:outline-none focus:ring-2 focus:ring-primary-container rounded-lg"
            href="/"
          >
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">HelpCorps</span>
          </Link>
          <nav className="hidden xl:flex items-center gap-space-xs">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? 'px-space-sm py-space-xs bg-primary-container text-on-primary font-bold rounded-lg shadow-sm'
                      : 'px-space-sm py-space-xs text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-label-md text-label-md rounded-lg transition-colors'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-space-md">
          <Link
            href="/women-safety-sos"
            className="min-h-[48px] px-space-md py-space-xs bg-error hover:bg-error-container text-on-error hover:text-on-error-container font-label-lg text-label-lg rounded-xl flex items-center gap-space-xs transition-colors shadow-[0_4px_12px_rgba(186,26,26,0.25)] focus:ring-4 focus:ring-error-container"
          >
            <span className="material-symbols-outlined text-[20px]">emergency_share</span>
            <span>SOS ALERT</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-space-sm">
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-full hover:bg-surface-container transition-colors"
                title="View Kindness Points & Economics"
              >
                <span className="material-symbols-outlined text-secondary text-[18px]">volunteer_activism</span>
                <span className="font-label-sm text-label-sm text-tertiary-container font-bold">
                  {user.kindnessScore ?? 140} PTS
                </span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-surface-container transition-colors"
                title="View My Profile"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm ring-2 ring-primary-fixed">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline font-label-md text-label-md font-semibold text-on-surface">
                  Profile
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:block px-space-sm py-1 text-on-surface-variant hover:text-error font-label-sm text-label-sm rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-space-xs sm:gap-space-sm">
              <Link
                href="/auth"
                className="min-h-[44px] px-space-md py-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1"
                title="Citizen & Beneficiary Sign In / Register"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Sign In</span>
              </Link>
              <Link
                href="/volunteer-portal"
                className="min-h-[44px] hidden sm:flex items-center gap-1 px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-label-md rounded-xl transition-colors border border-outline-variant/30"
                title="Responder & Volunteer Portal"
              >
                <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
                <span>Volunteer Portal</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
