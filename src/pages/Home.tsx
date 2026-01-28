import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Milk,
    TrendingUp,
    Beef,
    Bell,
    Receipt,
    Heart,
    LogOut,
    LayoutDashboard,
    ArrowRight,
    Sparkles
} from 'lucide-react';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, logout, isLoading } = useAuth();
    const { t } = useLanguage();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const features = [
        {
            icon: Milk,
            title: 'Milk Collection',
            description: 'Track daily milk production with automatic rate calculations',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Beef,
            title: 'Animal Management',
            description: 'Manage your cows and buffaloes with complete health records',
            color: 'from-emerald-500 to-green-500',
        },
        {
            icon: Heart,
            title: 'Breeding Tracker',
            description: 'Monitor breeding cycles and pregnancy with smart reminders',
            color: 'from-pink-500 to-rose-500',
        },
        {
            icon: Receipt,
            title: 'Expense Tracking',
            description: 'Keep track of all farm expenses by category',
            color: 'from-orange-500 to-amber-500',
        },
        {
            icon: TrendingUp,
            title: 'Profit Analysis',
            description: 'View detailed reports of income, expenses and profit trends',
            color: 'from-purple-500 to-violet-500',
        },
        {
            icon: Bell,
            title: 'Smart Notifications',
            description: 'Get timely reminders for vaccinations and checkups',
            color: 'from-red-500 to-pink-500',
        },
    ];

    if (isLoading) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                        <Milk className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-foreground hidden sm:block">{t('app_name')}</span>
                </div>

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/dashboard')}
                                className="gap-2 hover:bg-primary/10"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('nav_dashboard')}</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('logout')}</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/login')}
                                className="hover:bg-primary/10"
                            >
                                {t('login')}
                            </Button>
                            <Button
                                onClick={() => navigate('/signup')}
                                className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
                            >
                                <Sparkles className="h-4 w-4" />
                                {t('signup')}
                            </Button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 py-12 md:px-12 lg:px-20">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fadeIn">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                            <Sparkles className="h-4 w-4" />
                            Smart Dairy Farm Management
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                            Grow Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">Dairy Business</span> Efficiently
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-lg">
                            Track milk production, manage expenses, monitor breeding cycles, and make data-driven decisions to maximize your farm's profitability.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            {isAuthenticated ? (
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/dashboard')}
                                    className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/30 text-lg px-8"
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    Go to Dashboard
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/30 text-lg px-8"
                                    >
                                        Get Started Free
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/login')}
                                        className="gap-2 border-2 text-lg px-8"
                                    >
                                        {t('login')}
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
                            <div>
                                <p className="text-3xl font-bold text-foreground">100%</p>
                                <p className="text-sm text-muted-foreground">Digital Records</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">24/7</p>
                                <p className="text-sm text-muted-foreground">Access Anywhere</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-foreground">Easy</p>
                                <p className="text-sm text-muted-foreground">To Use</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Hero Image */}
                    <div className="relative lg:pl-8 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <div className="relative">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-2xl transform scale-105" />

                            {/* Image Container */}
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border border-white/10">
                                <img
                                    src="/farmer_cow_hero.png"
                                    alt="Farmer with cow in dairy farm"
                                    className="w-full h-auto object-cover animate-float"
                                />

                                {/* Glassmorphism Overlay Card */}
                                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">Smart Analytics</p>
                                            <p className="text-white/70 text-sm">Track your farm's performance</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 px-6 py-20 md:px-12 lg:px-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-fadeIn">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Everything You Need to Manage Your Farm
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Powerful features designed specifically for dairy farmers to streamline operations and boost productivity.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <Card
                                key={feature.title}
                                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                                style={{ animationDelay: `${0.1 * index}s` }}
                            >
                                <CardContent className="p-6">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                                </CardContent>

                                {/* Hover Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-6 py-20 md:px-12 lg:px-20">
                <div className="max-w-4xl mx-auto">
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/30">
                        <CardContent className="p-12 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                                Ready to Transform Your Dairy Farm?
                            </h2>
                            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
                                Join thousands of farmers who are already using our platform to manage their dairy operations more efficiently.
                            </p>
                            {isAuthenticated ? (
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-white text-primary hover:bg-white/90 gap-2 text-lg px-8 shadow-xl"
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    Go to Dashboard
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/signup')}
                                    className="bg-white text-primary hover:bg-white/90 gap-2 text-lg px-8 shadow-xl"
                                >
                                    <Sparkles className="h-5 w-5" />
                                    Start Free Today
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            )}
                        </CardContent>

                        {/* Decorative Elements */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-8 md:px-12 lg:px-20 border-t border-border/50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                            <Milk className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-foreground">{t('app_name')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2026 {t('app_name')}. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Custom Styles */}
            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default Home;
