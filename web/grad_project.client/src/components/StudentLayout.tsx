import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  GraduationCap,
  KeyRound,
  Compass,
} from 'lucide-react';

interface StudentLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/student',
    icon: LayoutDashboard,
  },
  {
    label: 'Profile',
    href: '/dashboard/student/profile',
    icon: User,
  },
  {
    label: 'Internships',
    href: '/internships',
    icon: Briefcase,
  },
  {
    label: 'Applications',
    href: '/dashboard/student/applications',
    icon: FileText,
  },
  {
    label: 'Career Path',
    href: '/dashboard/student/career-plan',
    icon: GraduationCap,
  },
  {
    label: 'Path Recommend',
    href: '/dashboard/student/path-recommend',
    icon: Compass,
  },
  {
    label: 'Change Password',
    href: '/dashboard/student/change-password',
    icon: KeyRound,
  },
];

export function StudentLayout({ children }: StudentLayoutProps) {
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
