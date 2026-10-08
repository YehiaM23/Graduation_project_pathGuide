import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  Shield,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
  },
  {
    label: 'Internships',
    href: '/dashboard/admin/internships',
    icon: Briefcase,
  },
  {
    label: 'Applications',
    href: '/dashboard/admin/applications',
    icon: FileText,
  },
  {
    label: 'Reviews',
    href: '/dashboard/admin/reviews',
    icon: MessageSquare,
  },
  {
    label: 'Admin Mgmt',
    href: '/dashboard/admin/admins',
    icon: Shield,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex pt-20">
        {/* Sidebar */}
        <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-64 border-r bg-card p-4 overflow-y-auto">
          <div className="mb-4 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Shield className="h-4 w-4" />
              Admin Panel
            </div>
          </div>
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
