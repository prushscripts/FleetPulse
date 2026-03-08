import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LandingThemeToggle from '@/components/LandingThemeToggle'
import FloatingLoginCard from '@/components/FloatingLoginCard'
import ScrollToTop from '@/components/ScrollToTop'
import ScrollReveal from '@/components/ScrollReveal'
import ScrollBlur from '@/components/ScrollBlur'
import ParallaxSection from '@/components/ParallaxSection'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Top Controls */}
        <div className="fixed top-4 left-4 z-50">
          {/* Theme Toggle moved left to avoid overlap with auth controls */}
          <LandingThemeToggle />
        </div>
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          {/* Floating Login Card - Desktop Only */}
          <div className="hidden lg:block">
            <FloatingLoginCard />
          </div>
        </div>

        {/* Scroll to Top Button */}
        <ScrollToTop />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-12 sm:py-16 pb-24 sm:pb-28">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/hero-background.png"
              alt=""
              fill
              className="object-cover"
              priority
              quality={90}
              unoptimized
            />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-indigo-800/90" />
          
          {/* Animated mesh gradient overlay for premium feel */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.3), transparent 50%)',
            }}></div>
          </div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            <div className="max-w-3xl lg:max-w-4xl">
              <ScrollReveal delay={0}>
                <div className="flex justify-center mb-6 sm:mb-8">
                  <Image
                    src="/images/banner1.png"
                    alt="FleetPulse"
                    width={520}
                    height={200}
                    className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-[400px] sm:max-w-[480px] md:max-w-[520px] object-contain drop-shadow-2xl select-none"
                    priority
                    unoptimized
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight drop-shadow-2xl select-none cursor-default">
                Modern Fleet Management
              </h1>
              </ScrollReveal>
              
              <ScrollReveal delay={200}>
              <p className="text-lg sm:text-xl text-indigo-100 mb-8 max-w-2xl leading-relaxed font-medium drop-shadow-lg select-none cursor-default">
                Track vehicles, manage maintenance, and keep your fleet running smoothly. All in one powerful platform.
              </p>
              </ScrollReveal>
              
              <ScrollReveal delay={300}>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <span>Start Free Trial</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/login"
                    className="px-5 py-2.5 bg-indigo-700/90 backdrop-blur-sm text-white rounded-lg font-medium text-sm hover:bg-indigo-800 transition-all border border-white/30 cursor-pointer inline-flex items-center justify-center lg:hidden"
                  >
                    Sign In
                  </Link>
                  <a
                    href="mailto:fleetpulse@fastmail.com"
                    className="px-5 py-2.5 bg-indigo-700/90 backdrop-blur-sm text-white rounded-lg font-medium text-sm hover:bg-indigo-800 transition-all border border-white/30 cursor-pointer inline-flex items-center justify-center hidden lg:inline-flex"
                  >
                    Contact Us
                  </a>
                </div>
              </ScrollReveal>
              
              {/* Trust Indicators */}
              <ScrollReveal delay={400}>
                <div className="flex flex-wrap items-center gap-5 text-sm text-indigo-200/90 select-none cursor-default">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>7-Day Free Trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Cancel Anytime</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Features Section with Scroll Blur - Seamless transition from hero */}
        <section className="relative overflow-hidden -mt-12 sm:-mt-16 pt-16 sm:pt-20 pb-10">
          {/* Seamless gradient overlay that blends from hero - ultra-smooth */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-800/40 via-purple-700/20 via-indigo-600/10 via-purple-500/5 to-transparent dark:from-indigo-800/50 dark:via-purple-800/30 dark:via-indigo-700/15 dark:to-transparent pointer-events-none" style={{ height: '200px' }}></div>
          <div className="relative bg-white dark:bg-gray-900">
            {/* Subtle decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            <ScrollBlur>
              <ParallaxSection speed={0.3}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                  <ScrollReveal delay={0}>
                    <div className="text-center mb-12">
                      <div className="inline-block px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold mb-4">
                        Powerful Features
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 select-none cursor-default">
                        Everything you need to manage your fleet
                      </h2>
                      <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto select-none cursor-default">
                        Powerful features at a fraction of the cost
                      </p>
                    </div>
                  </ScrollReveal>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        title: 'Vehicle Tracking',
                        description: 'Track mileage, oil changes, and maintenance schedules for all your vehicles.',
                        icon: '🚗',
                      },
                      {
                        title: 'Driver Management',
                        description: 'Assign drivers to vehicles and track driver assignments and performance.',
                        icon: '👤',
                      },
                      {
                        title: 'Digital Inspections',
                        description: 'Conduct pre-trip and post-trip inspections with photo documentation.',
                        icon: '📋',
                      },
                      {
                        title: 'Service Records',
                        description: 'Maintain complete service history with costs and provider information.',
                        icon: '🔧',
                      },
                      {
                        title: 'Issue Tracking',
                        description: 'Report and track vehicle issues with priority levels and status updates.',
                        icon: '⚠️',
                      },
                      {
                        title: 'Document Management',
                        description: 'Store and track important documents with expiration date reminders.',
                        icon: '📄',
                      },
                      {
                        title: 'Fleet Health Dashboard',
                        description: 'Monitor fleet health with oil change percentages and inspection statistics.',
                        icon: '📊',
                      },
                      {
                        title: 'CSV Import',
                        description: 'Bulk import vehicles from CSV files for quick setup.',
                        icon: '📥',
                      },
                      {
                        title: 'Mobile Friendly',
                        description: 'Access your fleet data anywhere with our responsive design.',
                        icon: '📱',
                      },
                    ].map((feature, idx) => (
                      <ScrollReveal key={idx} delay={idx * 50}>
                        <div className="group relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-default select-none overflow-hidden">
                          {/* Subtle background change on hover - no border change */}
                          <div className="absolute inset-0 bg-indigo-50/0 dark:bg-indigo-900/0 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 rounded-lg transition-colors duration-200"></div>
                          <div className="relative">
                            <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-200">{feature.icon}</div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed select-none cursor-default">{feature.description}</p>
                          </div>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </ParallaxSection>
            </ScrollBlur>
          </div>
        </section>

        {/* Pricing Section - Seamless transition from features */}
        <section className="relative overflow-hidden pt-6 pb-12 -mt-4">
          {/* Seamless gradient overlay - ultra-smooth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-gray-50 dark:from-transparent dark:via-gray-900 dark:to-gray-800 pointer-events-none" style={{ height: '150px' }}></div>
          <div className="relative bg-white dark:bg-gray-900">
            {/* Subtle decorative elements */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-100/20 dark:bg-purple-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-indigo-100/20 dark:bg-indigo-900/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            
            <ParallaxSection speed={0.2}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <ScrollReveal delay={0}>
                  <div className="text-center mb-12">
                    <div className="inline-block px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold mb-4">
                      Pricing Plans
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 select-none cursor-default">
                      Simple, transparent pricing
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto select-none cursor-default">
                      14-day free trial. Simple, scalable pricing. No credit card required.
                    </p>
                  </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {/* Starter Plan */}
                  <ScrollReveal delay={0}>
                    <div className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-xl hover:scale-105 hover:-translate-y-2 transition-all duration-300">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 select-none cursor-default">Starter</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 select-none cursor-default">For smaller fleets to organize vehicle inventory & manage inspections</p>
                      <div className="mb-2 select-none cursor-default">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">$3</span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">per vehicle, per month</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 select-none cursor-default">Billed annually or $4 billed monthly</p>
                      <ul className="space-y-2 mb-6 text-sm select-none cursor-default">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Basic vehicle tracking</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Service records</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Issue tracking</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Manual service reminders</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Email support</span>
                        </li>
                      </ul>
                      <Link
                        href="/signup"
                        className="block w-full text-center px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer text-sm"
                      >
                        Get Started
                      </Link>
                      <p className="text-center mt-3 text-sm">
                        <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer">
                          or Start a Free Trial
                        </Link>
                      </p>
                    </div>
                  </ScrollReveal>

                  {/* Professional Plan */}
                  <ScrollReveal delay={100}>
                    <div className="group bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 transform scale-105 shadow-xl relative border-2 border-indigo-500 hover:scale-110 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                      <div className="absolute -top-3 right-4 bg-yellow-400 text-indigo-900 px-3 py-1 rounded-full text-xs font-bold animate-float">
                        MOST POPULAR
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1 select-none cursor-default">Professional</h3>
                      <p className="text-sm text-indigo-200 mb-4 select-none cursor-default">For growing fleets to improve service tracking, communication & reporting</p>
                      <div className="mb-2 select-none cursor-default">
                        <span className="text-4xl font-bold text-white">$6</span>
                        <span className="text-indigo-200 text-sm ml-2">per vehicle, per month</span>
                      </div>
                      <p className="text-xs text-indigo-200 mb-4 select-none cursor-default">Billed annually only</p>
                      <ul className="space-y-2 mb-6 text-sm select-none cursor-default">
                        <li className="flex items-start">
                          <span className="text-white mr-2">✓</span>
                          <span className="text-indigo-100">Everything in Starter</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">✓</span>
                          <span className="text-indigo-100">Driver management</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">✓</span>
                          <span className="text-indigo-100">Digital inspections</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">✓</span>
                          <span className="text-indigo-100">Fleet health dashboard</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">✓</span>
                          <span className="text-indigo-100">CSV import/export</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">✓</span>
                          <span className="text-indigo-100">Advanced analytics dashboards</span>
                        </li>
                      </ul>
                      <Link
                        href="/signup"
                        className="block w-full text-center px-4 py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors cursor-pointer text-sm"
                      >
                        Get Started
                      </Link>
                      <p className="text-center mt-3 text-sm">
                        <Link href="/signup" className="text-white hover:underline font-medium cursor-pointer">
                          or Start a Free Trial
                        </Link>
                      </p>
                    </div>
                  </ScrollReveal>

                  {/* Premium Plan */}
                  <ScrollReveal delay={200}>
                    <div className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl hover:scale-105 hover:-translate-y-2 transition-all duration-300">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 select-none cursor-default">Premium</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 select-none cursor-default">For advanced fleets to integrate fleet systems & customize workflows</p>
                      <div className="mb-2 select-none cursor-default">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">$9</span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">per vehicle, per month</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 select-none cursor-default">Billed annually only</p>
                      <ul className="space-y-2 mb-6 text-sm select-none cursor-default">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Everything in Professional</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Advanced analytics</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">API access</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Custom integrations + roles</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Dedicated support</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-600 dark:text-gray-400">Priority support</span>
                        </li>
                      </ul>
                      <Link
                        href="/signup"
                        className="block w-full text-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer text-sm"
                      >
                        Contact Sales
                      </Link>
                    </div>
                  </ScrollReveal>
                </div>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8 max-w-2xl mx-auto select-none cursor-default">
                  *Subscriptions are priced per vehicle per month. Final pricing may vary by fleet size and contract term.
                </p>
              </div>
            </ParallaxSection>
          </div>
        </section>

        {/* CTA Section - Seamless transition from pricing */}
        <section className="relative overflow-hidden pt-20 pb-20 -mt-8">
          {/* Seamless gradient overlay that blends into CTA - ultra-smooth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 via-indigo-50/80 via-purple-100/70 via-indigo-200/80 via-purple-300/90 via-indigo-400/95 via-purple-500/95 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:via-indigo-900/80 dark:via-purple-900/80 dark:via-indigo-800/90 dark:via-purple-800/95 dark:to-indigo-800 pointer-events-none" style={{ height: '250px' }}></div>
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 pt-8">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <ScrollReveal delay={0}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-8">
                <div className="flex justify-center mb-6">
                  <Image
                    src="/images/banner1.png"
                    alt="FleetPulse"
                    width={380}
                    height={140}
                    className="h-16 sm:h-20 md:h-24 w-auto max-w-[340px] sm:max-w-[380px] object-contain mx-auto drop-shadow-xl select-none"
                    unoptimized
                  />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 drop-shadow-lg select-none cursor-default">
                  Ready to streamline your fleet management?
                </h2>
                <p className="text-base text-indigo-100 mb-10 max-w-2xl mx-auto font-medium select-none cursor-default">
                  Join thousands of fleet managers who trust FleetPulse
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/signup"
                    className="inline-block px-8 py-3.5 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300 cursor-pointer"
                  >
                    Start Your Free Trial
                  </Link>
                  <a
                    href="mailto:fleetpulse@fastmail.com"
                    className="inline-block px-8 py-3.5 bg-indigo-700/90 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-indigo-800 transition-all border-2 border-white/40 hover:border-white/60 shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300 cursor-pointer"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </>
  )
}
