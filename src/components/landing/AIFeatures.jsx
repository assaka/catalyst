import React from 'react';
import { motion } from 'framer-motion';
import { Wand2, Languages, Brain, TrendingUp, Sparkles, Zap } from 'lucide-react';

const aiFeatures = [
    {
        icon: Wand2,
        title: "Proven Framework Library",
        description: "Start with battle-tested templates built on years of e-commerce best practices. Fashion, electronics, food, services - optimized for conversions from day one.",
        color: "blue",
        badge: "Most Popular"
    },
    {
        icon: Brain,
        title: "AI Layout Customizer",
        description: "Describe your vision and watch AI customize your layout in seconds. Change colors, spacing, sections, and structure with simple prompts. No coding needed.",
        color: "blue"
    },
    {
        icon: Sparkles,
        title: "AI Plugin Generator",
        description: "Tell AI what functionality you need and it writes custom plugins for you. Product filters, wishlists, reviews, loyalty programs - AI builds it instantly.",
        color: "emerald",
        badge: "New"
    },
    {
        icon: Languages,
        title: "AI Translation System",
        description: "Automatically translate your entire store to 100+ languages. AI understands context, idioms, and cultural nuances for authentic localization.",
        color: "amber"
    },
    {
        icon: TrendingUp,
        title: "AI Content Generator",
        description: "Generate compelling product descriptions, SEO-optimized titles, and marketing copy that sells. Upload a product image and let AI write everything.",
        color: "slate"
    },
    {
        icon: Zap,
        title: "AI Store Optimizer",
        description: "AI continuously analyzes user behavior and automatically optimizes layouts, product placement, and pricing to maximize your conversions.",
        color: "blue"
    }
];

export default function AIFeatures() {
    return (
        <section className="py-32 bg-neutral-100 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-20"
                >
                    <div className="flex items-start justify-between flex-wrap gap-8">
                        <div>
                            <div className="inline-block bg-indigo-600 text-white px-4 py-2 font-bold text-sm mb-6 rounded-full">
                                THE COMPLETE TOOLKIT
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black mb-6 text-neutral-900">
                                Everything You Need.
                                <br />
                                <span className="text-neutral-400">Nothing You Don't.</span>
                            </h2>
                        </div>
                        <p className="text-xl text-neutral-600 max-w-lg">
                            Six powerful AI tools that work together to build, customize, and optimize your store.
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        const isLarge = index === 0 || index === 2;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`
                                    group relative bg-white text-neutral-900 p-8 rounded-2xl border border-neutral-200
                                    hover:border-slate-400 transition-all duration-300 shadow-sm hover:shadow-lg
                                    ${isLarge ? 'md:col-span-2' : ''}
                                `}
                            >
                                {feature.badge && (
                                    <div className="absolute -top-3 -right-3 bg-indigo-600 text-white px-3 py-1 text-xs font-bold rounded-full">
                                        {feature.badge}
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-slate-100 rounded-xl">
                                        <Icon className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div className="text-4xl font-black text-neutral-200">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* AI Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-32"
                >
                    <div className="bg-indigo-600 text-white p-12 rounded-2xl relative shadow-xl">
                        <div className="absolute -top-6 left-8 bg-indigo-100 text-indigo-900 px-6 py-2 font-bold text-lg rounded-full shadow-md">
                            BY THE NUMBERS
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                { stat: '10x', label: 'Faster Store Setup' },
                                { stat: '100+', label: 'Languages Supported' },
                                { stat: '40%', label: 'Higher Conversions' }
                            ].map((item, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-6xl md:text-7xl font-black mb-3">
                                        {item.stat}
                                    </div>
                                    <div className="text-xl font-bold uppercase tracking-wider">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}