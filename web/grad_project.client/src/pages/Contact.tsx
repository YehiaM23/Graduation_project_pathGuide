import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter,
    Send, Users, ArrowRight, Compass
} from 'lucide-react';

const teamMembers = [
    'Abdullah Eissa',
    'Menna el Halawagy',
    'Yassin Mohsen',
    'Yehia Moataz',
];

export default function Contact() {
    return (
        <div className="min-h-screen">
            <Header />

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
                        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
                        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[120px]" />
                    </div>

                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
                            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                                Get in Touch
                            </span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>
                </section>

                {/* Contact Cards Section */}
                <section className="px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            {/* Contact Information */}
                            <Card className="group relative overflow-hidden border-primary/10 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
                                <div className="relative">
                                    <h2 className="text-2xl font-semibold text-foreground mb-2">Contact Information</h2>
                                    <p className="text-sm text-muted-foreground mb-6">Reach out to us through any of these channels</p>

                                    <div className="space-y-6">
                                        {/* Phone Numbers */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                    <Phone className="h-4 w-4 text-primary" />
                                                </div>
                                                Phone Numbers
                                            </h3>
                                            <div className="space-y-2 ml-10">
                                                <a href="tel:+1234567890" className="block text-muted-foreground hover:text-primary transition-colors">
                                                    +1 (234) 567-890
                                                </a>
                                                <a href="tel:+0987654321" className="block text-muted-foreground hover:text-primary transition-colors">
                                                    +0 (987) 654-321
                                                </a>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                    <Mail className="h-4 w-4 text-primary" />
                                                </div>
                                                Email Address
                                            </h3>
                                            <div className="ml-10">
                                                <a href="mailto:contact@pathguide.com" className="text-muted-foreground hover:text-primary transition-colors">
                                                    contact@pathguide.com
                                                </a>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                </div>
                                                Location
                                            </h3>
                                            <div className="ml-10 text-muted-foreground">
                                                <p>123 PathGuide Street</p>
                                                <p>Career City, CC 12345</p>
                                                <p>Egypt</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Social Media */}
                            <Card className="group relative overflow-hidden border-primary/10 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-secondary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                                <div className="relative">
                                    <h2 className="text-2xl font-semibold text-foreground mb-2">Follow Us</h2>
                                    <p className="text-sm text-muted-foreground mb-6">Connect with us on social media</p>

                                    <div className="space-y-4">
                                        {/* Facebook */}
                                        <a
                                            href="https://facebook.com/pathguide"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group/item"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
                                                <Facebook className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold group-hover/item:text-primary transition-colors">Facebook</h4>
                                                <p className="text-sm text-muted-foreground">@pathguide</p>
                                            </div>
                                            <Send className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </a>

                                        {/* Instagram */}
                                        <a
                                            href="https://instagram.com/pathguide"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group/item"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white">
                                                <Instagram className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold group-hover/item:text-primary transition-colors">Instagram</h4>
                                                <p className="text-sm text-muted-foreground">@pathguide</p>
                                            </div>
                                            <Send className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </a>

                                        {/* LinkedIn */}
                                        <a
                                            href="https://linkedin.com/company/pathguide"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group/item"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-[#0A66C2] flex items-center justify-center text-white">
                                                <Linkedin className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold group-hover/item:text-primary transition-colors">LinkedIn</h4>
                                                <p className="text-sm text-muted-foreground">@pathguide</p>
                                            </div>
                                            <Send className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </a>

                                        {/* Twitter/X */}
                                        <a
                                            href="https://twitter.com/pathguide"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group/item"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white">
                                                <Twitter className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold group-hover/item:text-primary transition-colors">Twitter / X</h4>
                                                <p className="text-sm text-muted-foreground">@pathguide</p>
                                            </div>
                                            <Send className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Team Section */}
                        <Card className="group relative overflow-hidden border-primary/10 bg-white p-8 mb-12 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="relative text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-foreground">Our Team</h2>
                                </div>
                                <p className="text-sm text-muted-foreground">Meet people behind PathGuide</p>
                                <p className="text-xs text-muted-foreground mb-8">Team member names are ordered alphabetically</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {teamMembers.map((member, index) => (
                                        <div
                                            key={index}
                                            className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all hover:shadow-lg"
                                        >
                                            <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-white font-bold text-xl">
                                                {member.split(' ').map((n) => n[0]).join('')}
                                            </div>
                                            <h4 className="font-semibold text-foreground">{member}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Team Member</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* CTA Card */}
                        <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 p-12 text-center shadow-xl">
                            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Career Journey?</h2>
                            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                Join thousands of candidates and professionals finding their perfect career path with PathGuide
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" className="bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-2xl hover:shadow-primary/30 transition-all group" asChild>
                                    <Link to="/auth/signup">
                                        Get Started
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5" asChild>
                                    <Link to="/about">Learn More</Link>
                                </Button>
                            </div>
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
