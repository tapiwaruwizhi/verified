import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, Eye, TrendingUp, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(currentUser => {
        setUser(currentUser);
        // Redirect authenticated users to their respective dashboard
        if (currentUser.role === 'admin') {
          navigate(createPageUrl('TeacherDashboard'));
        } else {
          navigate(createPageUrl('StudentEditor'));
        }
      })
      .catch(() => {
        // User not authenticated, stay on home page
      });
  }, []);

  const features = [
    {
      icon: Eye,
      title: 'Keystroke Tracking',
      description: 'Record every edit, pause, and revision in real-time',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Typing Pattern Analysis',
      description: 'Detect bot/AI through WPM variance and consistency metrics',
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      icon: FileText,
      title: 'Citation Verification',
      description: 'Automatically flag uncited paste events and external content',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      icon: CheckCircle,
      title: 'Integrity Scoring',
      description: 'Generate comprehensive authenticity reports for IB compliance',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  if (user) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Dubai Private Schools • IB Curriculum</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Don't Grade the Paper.
              <br />
              <span className="text-emerald-400">Grade the Process.</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              VerifiEd uses keystroke forensics and behavioral analysis to verify student authorship—without AI detection flags. See the "movie" of every essay.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6 h-auto"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Forensic Writing Analytics
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Advanced process tracking that captures the complete writing journey—from first keystroke to final submission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Three-Step Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Student Writes</h3>
              <p className="text-slate-600">
                Students compose essays in our distraction-free editor while we silently record every keystroke, edit, and pause.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">System Analyzes</h3>
              <p className="text-slate-600">
                Our forensic engine calculates integrity scores, detects suspicious patterns, and maps struggle areas.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Teacher Reviews</h3>
              <p className="text-slate-600">
                Access the complete session timeline, WPM graphs, citation analysis, and exportable certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Assessment?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join Dubai's leading IB schools in process-based academic honesty verification.
          </p>
          <Button
            size="lg"
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-white text-emerald-700 hover:bg-slate-100 text-lg px-8 py-6 h-auto"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}