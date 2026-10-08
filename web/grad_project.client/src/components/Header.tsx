import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Compass, User, LogOut, Menu, X, GraduationCap, Briefcase } from 'lucide-react';
import { useState } from 'react';

export function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Hide main navigation links when user is on dashboard
    const isDashboard = location.pathname.startsWith('/dashboard');

    const getDashboardLink = (): string => {
        if (!user) return '/auth/signin';
        switch (user.role) {
            case 'student':
                return '/dashboard/student';
            case 'recruiter':
                return '/dashboard/recruiter';
            case 'admin':
                return '/dashboard/admin';
            default:
                return '/dashboard';
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-primary/10 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative flex h-12 w-12 items-center justify-center">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary via-accent to-secondary opacity-90" />
                            <Compass className="relative h-7 w-7 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                PathGuide
                            </span>
                            <span className="text-xs text-muted-foreground">Your Career Compass</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation - Hidden on dashboard */}
                    {!isDashboard && (
                        <div className="hidden lg:flex items-center gap-10">
                            <a
                                href="/"
                                onClick={(e) => {
                                    if (location.pathname === '/') {
                                        e.preventDefault();
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className="relative text-sm text-foreground/70 transition-colors hover:text-foreground group"
                            >
                                Home
                                <span className="absolute -bottom-6 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
                            </a>
                            <Link
                                to="/internships"
                                className="relative text-sm text-foreground/70 transition-colors hover:text-foreground group"
                            >
                                Internships
                                <span className="absolute -bottom-6 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
                            </Link>
                            <Link
                                to="/about"
                                className="relative text-sm text-foreground/70 transition-colors hover:text-foreground group"
                            >
                                About
                                <span className="absolute -bottom-6 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
                            </Link>
                            <Link
                                to="/contact"
                                className="relative text-sm text-foreground/70 transition-colors hover:text-foreground group"
                            >
                                Contact
                                <span className="absolute -bottom-6 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
                            </Link>
                        </div>
                    )}

                    {/* Right side - Auth buttons */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r from-primary via-accent to-secondary text-white font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all"
                                >
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-primary/10 bg-white shadow-xl">
                                        <div className="p-3 border-b border-primary/10">
                                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <div className="p-1">
                                            <Link
                                                to={getDashboardLink()}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <User className="h-4 w-4" />
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-red-50 transition-colors text-destructive"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Log out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="text-sm border-primary/20 hover:bg-primary/5" asChild>
                                        <Link to="/auth/student/signin" className="flex items-center gap-1.5">
                                            <GraduationCap className="h-4 w-4" />
                                            Candidate
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-sm border-secondary/20 hover:bg-secondary/5" asChild>
                                        <Link to="/auth/recruiter/signin" className="flex items-center gap-1.5">
                                            <Briefcase className="h-4 w-4" />
                                            Recruiter
                                        </Link>
                                    </Button>
                                </div>
                                <Button className="bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all text-sm" asChild>
                                    <Link to="/auth/signup">Get Started</Link>
                                </Button>
                            </>
                        )}

                        {/* Mobile menu button - Hidden on dashboard */}
                        {!isDashboard && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation - Hidden on dashboard */}
                {isMobileMenuOpen && !isDashboard && (
                    <div className="lg:hidden border-t border-primary/10 py-4">
                        <nav className="flex flex-col gap-4">
                            <a
                                href="/"
                                onClick={(e) => {
                                    if (location.pathname === '/') {
                                        e.preventDefault();
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                    setIsMobileMenuOpen(false);
                                }}
                                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                            >
                                Home
                            </a>
                            <Link
                                to="/internships"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                            >
                                Internships
                            </Link>
                            <Link
                                to="/about"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                            >
                                About
                            </Link>
                            <Link
                                to="/contact"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                            >
                                Contact
                            </Link>
                            {!user && (
                                <div className="flex flex-col gap-2 pt-4 border-t border-primary/10">
                                    <Link
                                        to="/auth/student/signin"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                    >
                                        <GraduationCap className="h-4 w-4" />
                                        Candidate Login
                                    </Link>
                                    <Link
                                        to="/auth/recruiter/signin"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                    >
                                        <Briefcase className="h-4 w-4" />
                                        Recruiter Login
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </nav>
    );
}
