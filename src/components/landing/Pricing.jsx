import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from 'lucide-react';

const plans = [
    {
        name: "Free",
        price: "0",
        description: "Start for free, pay only when you customize",
        features: [
            "Full webshop functionality",
            "Proven templates library",
            "Complete store management",
            "Payment & shipping integrations",
            "Mobile responsive design",
            "Community support",
            "Pay-as-you-go AI features"
        ]
    },
    {
        name: "Credit Bundle",
        price: "49",
        description: "AI credits + exclusive features at a discount",
        features: [
            "Everything in Free",
            "$75 worth of AI credits",
            "20% discount on all AI features",
            "Priority AI processing",
            "Advanced analytics dashboard",
            "Priority support",
            "Early access to new features"
        ],
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Custom solutions for large operations",
        features: [
            "Everything in Credit Bundle",
            "Custom AI model training",
            "White-label options",
            "Dedicated account manager",
            "Custom integrations",
            "Volume discounts on credits",
            "24/7 dedicated support"
        ]
    }
];

export default function Pricing() {
    return (
        <section className="py-32 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-20"
                >
                    <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 font-bold text-sm mb-6 rounded-full">
                        PAY AS YOU GO
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black mb-6 text-neutral-900">
                        Start Free, Customize When You Need
                    </h2>
                    <p className="text-xl text-neutral-600 max-w-2xl">
                        Run your webshop completely free. Our basic features are extensive. Only pay for AI customizations when you want them.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`
                                relative rounded-2xl p-10 border transition-all duration-300 shadow-sm hover:shadow-lg
                                ${plan.popular
                                ? 'bg-indigo-900 text-white border-transparent scale-105 shadow-xl'
                                : 'bg-neutral-50 border-neutral-200 hover:border-slate-400'
                            }
                            `}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 -right-4 bg-white text-neutral-900 px-4 py-2 text-sm font-bold rounded-full shadow-md">
                                    ★ BEST VALUE
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-3xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                                    {plan.name}
                                </h3>
                                <p className={`mb-6 ${plan.popular ? 'text-white/80' : 'text-neutral-600'}`}>
                                    {plan.description}
                                </p>
                                <div className="flex items-end gap-2">
                                    {plan.price !== "Custom" && (
                                        <span className={`text-4xl font-black ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>$</span>
                                    )}
                                    <span className={`text-7xl font-black ${plan.popular ? 'text-white' : 'text-indigo-900'}`}>
                                        {plan.price}
                                    </span>
                                    {plan.price !== "Custom" && (
                                        <span className={`mb-3 ${plan.popular ? 'text-white/70' : 'text-neutral-500'}`}>/mo</span>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white/80' : 'text-indigo-900'}`} />
                                        <span className={plan.popular ? 'text-white/90' : 'text-neutral-700'}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`
                                    w-full py-6 text-lg rounded-full font-bold transition-all duration-300
                                    ${plan.popular
                                    ? 'bg-white hover:bg-neutral-100 text-neutral-900'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }
                                `}
                            >
                                {plan.price === "Custom" ? "LET'S TALK" : plan.name === "Free" ? "START FOR FREE" : "GET CREDITS"}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}