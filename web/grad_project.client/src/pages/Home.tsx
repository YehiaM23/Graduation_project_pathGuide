import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Compass, Target, Sparkles, Briefcase, ArrowRight, TrendingUp,
    CheckCircle2, AlertCircle, Clock, TrendingDown, Award, Code,
    Database, Smartphone, Cloud, Brain, Layers, Twitter, Linkedin,
    Github, Youtube, Mail
} from 'lucide-react';

const problems = [
    { icon: AlertCircle, title: 'Skill Gap Crisis', description: '65% of CS graduates lack the practical skills employers need', color: 'from-primary to-accent' },
    { icon: Clock, title: 'Wasted Time', description: 'Average of 8 months spent job hunting after graduation', color: 'from-accent to-secondary' },
    { icon: TrendingDown, title: 'Missed Opportunities', description: 'Thousands of internships go unfilled due to poor matching', color: 'from-secondary to-primary' }
];

const features = [
    { icon: Target, title: 'Personalized Career Paths', description: 'Get customized learning roadmaps based on your interests and career goals.', iconBg: 'bg-blue-100', iconColor: 'text-primary' },
    { icon: Briefcase, title: 'Internship Matching', description: 'Find internships that align with your skills and career aspirations.', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: TrendingUp, title: 'Progress Tracking', description: 'Monitor your skill development and see how you compare to job requirements.', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { icon: Award, title: 'Certification Support', description: 'Earn recognized certifications to boost your resume and credibility.', iconBg: 'bg-blue-100', iconColor: 'text-primary' }
];

const careerPaths = [
    { icon: Code, title: 'Frontend Developer', description: 'Build beautiful, responsive user interfaces with modern frameworks', difficulty: 'High', difficultyColor: 'bg-secondary text-white', iconBg: 'bg-cyan-500', technologies: ['React', 'TypeScript', 'Tailwind CSS'] },
    { icon: Database, title: 'Backend Developer', description: 'Design and implement robust server-side applications and APIs', difficulty: 'High', difficultyColor: 'bg-secondary text-white', iconBg: 'bg-green-500', technologies: ['Node.js', 'Python', 'SQL'] },
    { icon: Smartphone, title: 'Mobile Developer', description: 'Create native and cross-platform mobile applications', difficulty: 'Medium', difficultyColor: 'bg-purple-500 text-white', iconBg: 'bg-pink-500', technologies: ['React Native', 'Swift', 'Kotlin'] },
    { icon: Cloud, title: 'DevOps Engineer', description: 'Automate infrastructure and streamline deployment processes', difficulty: 'High', difficultyColor: 'bg-secondary text-white', iconBg: 'bg-orange-500', technologies: ['Docker', 'Kubernetes', 'AWS'] },
    { icon: Brain, title: 'AI/ML Engineer', description: 'Build intelligent systems using machine learning and AI', difficulty: 'Very High', difficultyColor: 'bg-blue-600 text-white', iconBg: 'bg-purple-500', technologies: ['Python', 'TensorFlow', 'PyTorch'] },
    { icon: Layers, title: 'Full Stack Developer', description: 'Master both frontend and backend to build complete applications', difficulty: 'Very High', difficultyColor: 'bg-blue-600 text-white', iconBg: 'bg-pink-600', technologies: ['React', 'Node.js', 'MongoDB'] }
];

export default function Home() {
    return (
        <div className="min-h-screen">
            <Header />
            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden px-4 pt-32 pb-16 sm:px-6 lg:px-8">
                    {/* Animated background grid */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
                        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
                        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[120px]" />
                        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
                    </div>

                    <div className="mx-auto max-w-7xl">
                        <div className="text-center">
                            {/* Badge */}
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 border border-primary/20">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm text-primary">Transform Your CS Career</span>
                            </div>

                            {/* Main heading */}
                            <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
                                Your Journey from
                                <br />
                                <span className="relative inline-block">
                                    <span className="relative z-10 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                        Student to Professional
                                    </span>
                                    <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                                        <path d="M2 10C100 2 200 2 298 10" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#0066FF" />
                                                <stop offset="50%" stopColor="#00C9E0" />
                                                <stop offset="100%" stopColor="#00D9A5" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </span>
                                <br />
                                Starts Here
                            </h1>

                            <p className="mx-auto mb-10 max-w-3xl text-lg sm:text-xl text-muted-foreground">
                                Stop wasting time after graduation. PathGuide provides personalized learning paths,
                                real-world projects, and direct connections to internships — everything you need to
                                land your dream tech job.
                            </p>

                            {/* CTA Buttons */}
                            <div className="mb-16 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/30 transition-all text-lg px-8 h-14 group" asChild>
                                    <Link to="/auth/signup">
                                        Get Started
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>

                            {/* Feature highlights */}
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                                    <span className="text-muted-foreground">No credit card required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                                    <span className="text-muted-foreground">Free forever plan</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                                    <span className="text-muted-foreground">Cancel anytime</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Problem Section */}
                <section className="px-4 pt-16 pb-12 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2.5 border border-primary/20">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                <span className="text-sm text-primary">The Problem We're Solving</span>
                            </div>
                            <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl">
                                Don't Be Another
                                <br />
                                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                    Unprepared Graduate
                                </span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                                Computer science students graduate without being prepared with the skills needed for the job market.
                                This leads to wasted time, frustration, and missed opportunities.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {problems.map((problem, index) => {
                                const Icon = problem.icon;
                                return (
                                    <div
                                        key={index}
                                        className="group relative overflow-hidden rounded-2xl bg-white p-8 border border-primary/10 hover:border-primary/20 transition-all hover:shadow-xl"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${problem.color} opacity-0 transition-opacity group-hover:opacity-5`} />

                                        <div className="relative flex flex-col items-center text-center gap-4">
                                            <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${problem.color}`}>
                                                <Icon className="h-8 w-8 text-white" />
                                            </div>
                                            <h3 className="text-foreground">{problem.title}</h3>
                                            <p className="text-sm text-muted-foreground">{problem.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-16 rounded-2xl bg-white p-8 border-2 border-primary/20">
                            <p className="text-center text-lg">
                                <span className="text-primary font-semibold">Over 60%</span> of recent CS graduates report feeling unprepared for their first job.
                                <span className="ml-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-semibold">
                                    PathGuide changes that.
                                </span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-2.5 border border-accent/30 shadow-sm">
                                <span className="text-sm text-accent">
                                    Complete Career Platform
                                </span>
                            </div>
                            <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl">
                                Everything You Need to
                                <br />
                                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                    Launch Your Tech Career
                                </span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                                From skill assessment to job offers — we've got you covered at every step of your journey.
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <Card
                                        key={index}
                                        className="group relative overflow-hidden border-gray-200 bg-gray-50/50 p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20"
                                    >
                                        <div className="flex flex-col gap-6">
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${feature.iconBg}`}>
                                                <Icon className={`h-7 w-7 ${feature.iconColor}`} />
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <h3 className="text-foreground">{feature.title}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Career Paths Section */}
                <section className="px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/20">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="mb-4 text-4xl sm:text-5xl lg:text-6xl">
                                Explore <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Career Paths</span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                                Discover the perfect tech career path and get a customized learning roadmap
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {careerPaths.map((path, index) => {
                                const Icon = path.icon;
                                return (
                                    <Card
                                        key={index}
                                        className="group relative overflow-hidden border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-accent/30"
                                    >
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-start justify-between">
                                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${path.iconBg}`}>
                                                    <Icon className="h-7 w-7 text-white" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-foreground">{path.title}</h3>
                                                    <span className={`text-xs px-2.5 py-1 rounded-full ${path.difficultyColor}`}>
                                                        {path.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {path.description}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {path.technologies.map((tech, techIndex) => (
                                                    <span
                                                        key={techIndex}
                                                        className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                                                    >
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-5" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />

                    <div className="mx-auto max-w-5xl relative">
                        <div className="rounded-3xl border-2 border-primary/20 bg-white p-12 sm:p-16 lg:p-20 shadow-2xl">
                            <div className="text-center">
                                <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl">
                                    Ready to Start Your
                                    <br />
                                    <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                        Success Story?
                                    </span>
                                </h2>

                                <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
                                    Don't let another semester pass by. Start building the skills and connections
                                    you need to land your dream tech job today.
                                </p>

                                <div className="flex justify-center">
                                    <Button size="lg" className="bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-2xl hover:shadow-primary/30 transition-all text-lg px-8 h-14 group" asChild>
                                        <Link to="/auth/signup">
                                            Start Your Career
                                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-2xl" />
                        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-secondary to-accent opacity-20 blur-2xl" />
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t bg-gradient-to-br from-muted/20 to-background px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-6">
                        {/* Brand */}
                        <div className="flex flex-col gap-6 items-center text-center">
                            <div className="flex items-center gap-3">
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
                            </div>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Empowering computer science candidates to bridge the gap between academia and industry.
                                Join thousands of candidates who have successfully launched their tech careers.
                            </p>
                            <div className="flex items-center gap-3">
                                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 transition-all hover:bg-gradient-to-br hover:from-primary hover:to-accent hover:text-white hover:border-transparent">
                                    <Twitter className="h-4 w-4" />
                                </a>
                                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 transition-all hover:bg-gradient-to-br hover:from-primary hover:to-accent hover:text-white hover:border-transparent">
                                    <Linkedin className="h-4 w-4" />
                                </a>
                                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 transition-all hover:bg-gradient-to-br hover:from-primary hover:to-accent hover:text-white hover:border-transparent">
                                    <Github className="h-4 w-4" />
                                </a>
                                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 transition-all hover:bg-gradient-to-br hover:from-primary hover:to-accent hover:text-white hover:border-transparent">
                                    <Youtube className="h-4 w-4" />
                                </a>
                                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 transition-all hover:bg-gradient-to-br hover:from-primary hover:to-accent hover:text-white hover:border-transparent">
                                    <Mail className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 border-t pt-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <p className="text-sm text-muted-foreground">
                                © {new Date().getFullYear()} PathGuide. All rights reserved.
                            </p>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <a href="#" className="transition-colors hover:text-primary">
                                    Privacy Policy
                                </a>
                                <a href="#" className="transition-colors hover:text-primary">
                                    Terms of Service
                                </a>
                                <a href="#" className="transition-colors hover:text-primary">
                                    Cookie Policy
                                </a>
                            </div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-6">
                            Built with <span className="text-red-500">❤️</span> for CS students.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
