import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import {
  Building2,
  Briefcase,
  Plus,
  Users,
  LayoutDashboard,
} from 'lucide-react';

interface RecruiterLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/recruiter',
    icon: LayoutDashboard,
  },
  {
    label: 'Edit Profile',
    href: '/dashboard/recruiter/profile',
    icon: Building2,
  },
  {
    label: 'My Internships',
    href: '/dashboard/recruiter/internships',
    icon: Briefcase,
  },
  {
    label: 'Post Internship',
    href: '/dashboard/recruiter/internships/new',
    icon: Plus,
  },
  {
    label: 'Applications',
    href: '/dashboard/recruiter/applications',
    icon: Users,
  },
];

export function RecruiterLayout({ children }: RecruiterLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex pt-20">
        {/* Sidebar */}
        <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-64 border-r bg-card p-4 overflow-y-auto">
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
