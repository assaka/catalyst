import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from 'lucide-react';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-neutral-900 tracking-tight">DainoStore</span>
                    </div>

                    {/* Navigation - Centered */}
                    <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <a href="https://discord.gg/J3BCegpX" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                            Discord
                        </a>
                        <a href="#pricing" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                            Pricing
                        </a>
                        <a href="#resources" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                            Resources
                        </a>
                    </nav>

                    {/* Sign Up Button */}
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transition-all">
                        Sign Up
                    </Button>
                </div>
            </div>
        </header>
    );
}