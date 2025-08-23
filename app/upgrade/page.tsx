'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Star, Zap, Shield, Headphones } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'

export default function UpgradePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'business'>('pro')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = {
    free: {
      name: 'FREE',
      price: { monthly: 0, yearly: 0 },
      features: [
        '1 resume analysis per month',
        'Basic ATS score',
        '3 job suggestions',
        '2 free templates',
        'Basic export (PDF)',
        'Email support'
      ],
      limitations: [
        'Limited monthly usage',
        'Basic templates only',
        'No premium features'
      ]
    },
    pro: {
      name: 'PRO',
      price: { monthly: 19, yearly: 190 },
      popular: true,
      features: [
        'Unlimited resume analysis',
        'Advanced ATS optimization',
        '15 job suggestions daily',
        'All premium templates',
        'Cover letter generation',
        'LinkedIn profile optimization',
        'Multiple export formats',
        'Priority email support',
        'Resume builder with drag & drop',
        'Interview preparation tools'
      ],
      highlight: 'Most Popular'
    },
    business: {
      name: 'BUSINESS',
      price: { monthly: 49, yearly: 490 },
      features: [
        'Everything in Pro',
        'Multi-resume management',
        'Team collaboration (5 users)',
        'Custom branding',
        'Advanced analytics',
        'Bulk job applications',
        'Salary negotiation tools',
        'API access (1000 calls/month)',
        'Phone + email support',
        'Custom templates',
        'White-label options'
      ],
      highlight: 'Best for Teams'
    }
  }

  const handleUpgrade = (plan: 'pro' | 'business') => {
    // TODO: Implement Stripe checkout
    alert(`Upgrading to ${plan.toUpperCase()} plan (${billingCycle})`)
    // This will redirect to Stripe checkout when implemented
  }

  const yearlyDiscount = (plan: 'pro' | 'business') => {
    const monthly = plans[plan].price.monthly * 12
    const yearly = plans[plan].price.yearly
    return Math.round(((monthly - yearly) / monthly) * 100)
  }

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      
      <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
        {/* Header */}
        <div className="bg-[#000]/95 backdrop-blur-sm border-b border-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <span className="text-black font-bold text-lg">Ai</span>
                </div>
                <span className="text-white font-bold text-xl tracking-wider">Apply</span>
              </div>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium tracking-wide"
              >
                BACK TO DASHBOARD
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wider">
                UPGRADE TO <span className="text-yellow-500">PREMIUM</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Unlock the full power of AI-driven resume optimization and land your dream job faster
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  billingCycle === 'yearly' ? 'bg-yellow-500' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <span className="bg-green-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                  Save up to 17%
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative"
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plans.free.name}</h3>
                <div className="text-3xl font-bold mb-2">
                  $0<span className="text-lg text-gray-400">/month</span>
                </div>
                <p className="text-gray-400 text-sm">Perfect for trying out</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plans.free.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="w-full py-3 bg-gray-800 text-gray-400 rounded-lg font-medium cursor-not-allowed"
              >
                CURRENT PLAN
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-b from-blue-900/20 to-purple-900/20 border border-blue-500/50 rounded-xl p-6 relative scale-105"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  {plans.pro.name}
                </h3>
                <div className="text-3xl font-bold mb-2">
                  ${plans.pro.price[billingCycle]}
                  <span className="text-lg text-gray-400">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-green-400 text-sm">Save {yearlyDiscount('pro')}% annually</p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plans.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('pro')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-colors"
              >
                UPGRADE TO PRO
              </button>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-1 rounded-full text-xs font-bold">
                BEST FOR TEAMS
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  {plans.business.name}
                </h3>
                <div className="text-3xl font-bold mb-2">
                  ${plans.business.price[billingCycle]}
                  <span className="text-lg text-gray-400">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-green-400 text-sm">Save {yearlyDiscount('business')}% annually</p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plans.business.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('business')}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-colors"
              >
                UPGRADE TO BUSINESS
              </button>
            </motion.div>
          </div>

          {/* Features Comparison */}
          <div className="bg-gray-900 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Why Upgrade?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Premium Templates</h3>
                <p className="text-gray-400 text-sm">
                  Access to 50+ professionally designed templates crafted by industry experts
                </p>
              </div>
              
              <div className="text-center">
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced AI Analysis</h3>
                <p className="text-gray-400 text-sm">
                  Deep AI-powered optimization with industry-specific recommendations
                </p>
              </div>
              
              <div className="text-center">
                <Headphones className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
                <p className="text-gray-400 text-sm">
                  Get help when you need it with priority email and phone support
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Questions?</h2>
            <p className="text-gray-400 mb-6">
              Contact our support team at{' '}
              <a href="mailto:support@aiapply.com" className="text-blue-400 hover:underline">
                support@aiapply.com
              </a>
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>🔒 Secure payment with Stripe</span>
              <span>•</span>
              <span>💰 30-day money-back guarantee</span>
              <span>•</span>
              <span>❌ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
