import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Target, Users, Sparkles, ArrowRight, Compass } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen">
            <Header />

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
                        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
                        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
                    </div>

                    <div className="mx-auto max-w-4xl text-center">
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 border border-primary/20">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm text-primary">About PathGuide</span>
                        </div>

                        <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
                            Helping Candidates Discover Their
                            <br />
                            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                Ideal Career Path
                            </span>
                        </h1>

                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                            Through personalized guidance and real-world connections, we bridge the gap between academia and industry.
                        </p>
                    </div>
                </section>

                {/* Cards Section */}
                <section className="px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl space-y-8">
                        {/* Our Mission */}
                        <Card className="group relative overflow-hidden border-primary/10 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="relative flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                                        <Target className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-foreground">Our Mission</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    PathGuide was created to bridge the gap between university candidates and their career aspirations. We
                                    believe that every candidate deserves personalized guidance to discover their strengths and find
                                    opportunities that align with their unique personality and goals.
                                </p>
                            </div>
                        </Card>

                        {/* How It Works */}
                        <Card className="group relative overflow-hidden border-primary/10 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-secondary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="relative flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-secondary">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-foreground">How It Works</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Our platform uses your professional profile, skills, and career aspirations to provide personalized
                                    recommendations. Whether you have a clear path in mind or need guidance, we match you with courses and
                                    internships that align with your goals.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                                        Personalized career path recommendations
                                    </li>
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                                        Curated course suggestions to build relevant skills
                                    </li>
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                                        Internship opportunities matched to your profile
                                    </li>
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                                        Direct connections with course providers and recruiters
                                    </li>
                                </ul>
                            </div>
                        </Card>

                        {/* Our Community */}
                        <Card className="group relative overflow-hidden border-primary/10 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="relative flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-foreground">Our Community</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    PathGuide brings together candidates, course providers, and recruiters in one platform. We create
                                    meaningful connections that help candidates grow, educators reach motivated learners, and companies find
                                    talented candidates who are the right fit for their opportunities.
                                </p>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 p-12 text-center shadow-xl">
                            <h2 className="mb-4 text-3xl sm:text-4xl font-semibold">
                                Ready to Find Your Path?
                            </h2>
                            <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
                                Join PathGuide today and take the first step toward your ideal career.
                            </p>
                            <Button size="lg" className="bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-2xl hover:shadow-primary/30 transition-all text-lg px-8 h-14 group" asChild>
                                <Link to="/auth/signup">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t bg-gradient-to-br from-muted/20 to-background px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="relative flex h-10 w-10 items-center justify-center">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary via-accent to-secondary opacity-90" />
                            <Compass className="relative h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-semibold">
                            PathGuide
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} PathGuide. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
