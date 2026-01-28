import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    X,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    PawPrint,
    Milk,
    Receipt,
    Baby,
    FileSpreadsheet,
    Sparkles,
    Check
} from 'lucide-react';

interface TourStep {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
}

const tourSteps: TourStep[] = [
    {
        title: 'Welcome to DairyFarm! 🎉',
        description: 'Your complete dairy farm management solution. Let us show you around and help you get started with managing your farm efficiently.',
        icon: Sparkles,
        color: 'from-primary to-primary/80'
    },
    {
        title: 'Dashboard Overview 📊',
        description: 'View all your important stats at a glance - total income, expenses, profit/loss, and animal counts. Charts show your trends over time.',
        icon: LayoutDashboard,
        color: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Manage Your Animals 🐄',
        description: 'Add and track all your cows and buffaloes. Record their details, health status, purchase info, and keep complete records.',
        icon: PawPrint,
        color: 'from-emerald-500 to-green-500'
    },
    {
        title: 'Milk Collection 🥛',
        description: 'Record daily milk production for each animal. Track morning and evening collections with automatic price calculations.',
        icon: Milk,
        color: 'from-amber-500 to-orange-500'
    },
    {
        title: 'Track Expenses 💸',
        description: 'Keep track of all farm expenses - feed, medicine, doctor visits, maintenance, and more. Categorize and analyze your spending.',
        icon: Receipt,
        color: 'from-red-500 to-pink-500'
    },
    {
        title: 'Breeding Tracker 🍼',
        description: 'Monitor breeding cycles, insemination dates, and pregnancy status. Get reminders for checkups and expected delivery dates.',
        icon: Baby,
        color: 'from-pink-500 to-rose-500'
    },
    {
        title: 'Reports & Analytics 📈',
        description: 'Generate detailed reports for any period. View profit/loss statements, milk production summaries, and export data.',
        icon: FileSpreadsheet,
        color: 'from-purple-500 to-violet-500'
    },
    {
        title: "You're All Set! ✅",
        description: 'You are ready to start managing your dairy farm. Add your first animal to begin tracking everything in one place!',
        icon: Check,
        color: 'from-green-500 to-emerald-500'
    }
];

const TOUR_STORAGE_KEY = 'dairyfarm_tour_completed';

export const OnboardingTour: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user has already completed the tour
        const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!hasCompletedTour) {
            // Small delay to let the page load first
            const timer = setTimeout(() => setIsVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const completeTour = () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        setIsVisible(false);
    };

    const handleSkip = () => {
        completeTour();
    };

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
            // Navigate to animals page to add first animal
            navigate('/animals');
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!isVisible) return null;

    const step = tourSteps[currentStep];
    const isLastStep = currentStep === tourSteps.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={handleSkip}
            />

            {/* Tour Card */}
            <Card className="relative z-10 w-full max-w-md bg-card border-border shadow-2xl animate-scaleIn overflow-hidden">
                {/* Skip Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
                    onClick={handleSkip}
                >
                    <X className="h-5 w-5" />
                </Button>

                {/* Icon Header */}
                <div className={`p-8 bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce-slow">
                        <step.icon className="h-10 w-10 text-white" />
                    </div>
                </div>

                <CardContent className="p-6">
                    {/* Step Content */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-foreground mb-3">
                            {step.title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {tourSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'w-6 bg-primary'
                                        : index < currentStep
                                            ? 'w-2 bg-primary/50'
                                            : 'w-2 bg-muted'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={isFirstStep}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </Button>

                        <span className="text-sm text-muted-foreground">
                            {currentStep + 1} / {tourSteps.length}
                        </span>

                        <Button
                            onClick={handleNext}
                            className={`gap-2 ${isLastStep ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            {isLastStep ? "Let's Go!" : 'Next'}
                            {!isLastStep && <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Skip Link */}
                    {!isLastStep && (
                        <button
                            onClick={handleSkip}
                            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip tour
                        </button>
                    )}
                </CardContent>
            </Card>

            {/* Custom Animations */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default OnboardingTour;
