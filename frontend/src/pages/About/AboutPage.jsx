import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Cake, Heart, Award, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

const AboutPage = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await api.get('/content/about-us');
        if (res.data?.data) {
          setAboutData(res.data.data);
        }
      } catch (err) {
        console.warn('Error fetching about us:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3.5 py-1 rounded-full">
          <Cake className="w-3.5 h-3.5" />
          <span>Our Journey</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-chocolate leading-tight">
          {aboutData?.title || 'The Story of Ammas Pastries'}
        </h1>
        <p className="text-sm font-semibold text-amber-800">
          {aboutData?.tagline || 'Crafting Fresh Smiles and Sweet Moments Since 2005'}
        </p>
      </div>

      {/* Story & Image Banner */}
      <div className="bg-white rounded-3xl overflow-hidden border border-amber-100 shadow-warm grid grid-cols-1 md:grid-cols-12 items-center">
        <div className="md:col-span-6 p-8 sm:p-12 space-y-4">
          <h2 className="font-serif font-bold text-2xl text-chocolate">
            Baking With Pure Love & Wholesome Craft
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {aboutData?.story ||
              'Ammas Pastries began with a humble dream: to bake cakes that taste just like home-made love, using only wholesome dairy ingredients, zero preservatives, and uncompromised craftsmanship. Over the years, we have grown into one of Bengaluru’s most beloved artisan bakeries, serving thousands of celebrations each week.'}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every layer of sponge is baked in small artisan batches every morning. We believe that cakes are not merely desserts; they are the centerpieces of human joy and lifelong memories.
          </p>
        </div>

        <div className="md:col-span-6 h-full min-h-[300px]">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900"
            alt="Ammas Pastries Kitchen Craft"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Kitchen Standards */}
      <div className="bg-gradient-to-br from-cream via-amber-50 to-cream rounded-3xl p-8 sm:p-12 border border-amber-200/80 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Our Unbending Quality</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            5-Star Kitchen Standards
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {(aboutData?.kitchen_standards || [
            '100% Pure Dairy Fresh Cream with Zero Vegetable Shortening',
            'Finest Belgian Couverture Chocolates and Dutch Cocoa',
            'Farm-fresh Seasonal Fruits Delivered Every Morning',
            'Stringent 5-Star Kitchen Sanitation & Hygiene Protocols',
            'Dedicated 100% Pure Vegetarian / Eggless Baking Lines',
          ]).map((standard, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-amber-100 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-chocolate">{standard}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {(aboutData?.stats || [
          { value: '500,000+', label: 'Celebrations Sweetened' },
          { value: '45 Mins', label: 'Average Delivery Time' },
          { value: '4.9 ★', label: 'Google Customer Rating' },
          { value: '15+', label: 'Bengaluru Outlets' },
        ]).map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs space-y-1">
            <div className="font-serif text-3xl font-bold text-chocolate">{stat.value}</div>
            <div className="text-xs font-medium text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AboutPage;
