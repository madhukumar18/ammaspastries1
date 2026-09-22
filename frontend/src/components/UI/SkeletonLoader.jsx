import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-amber-100/50 shadow-xs animate-pulse">
    <div className="aspect-square w-full rounded-lg sm:rounded-xl bg-slate-100 mb-2" />
    <div className="h-2.5 sm:h-3 w-12 sm:w-16 bg-slate-100 rounded-full mb-1.5" />
    <div className="h-3.5 sm:h-5 w-3/4 bg-slate-200 rounded-md mb-1.5" />
    <div className="h-2.5 sm:h-3 w-full bg-slate-100 rounded-md mb-1" />
    <div className="h-2.5 sm:h-3 w-2/3 bg-slate-100 rounded-md mb-2.5 sm:mb-4" />
    <div className="pt-2 sm:pt-3 border-t border-slate-100 flex justify-between items-center gap-1">
      <div className="h-4 sm:h-6 w-12 sm:w-16 bg-slate-200 rounded-md" />
      <div className="h-6 sm:h-8 w-14 sm:w-20 bg-amber-200/50 rounded-lg sm:rounded-xl" />
    </div>
  </div>
);

export const BannerSkeleton = () => (
  <div className="w-full h-[380px] sm:h-[440px] md:h-[480px] lg:h-[510px] bg-slate-100 rounded-2xl sm:rounded-3xl animate-pulse" />
);

export const OrderCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse space-y-3">
    <div className="flex justify-between">
      <div className="h-4 w-28 bg-slate-200 rounded" />
      <div className="h-4 w-20 bg-amber-100 rounded-full" />
    </div>
    <div className="h-3 w-40 bg-slate-100 rounded" />
    <div className="h-12 w-full bg-slate-50 rounded-xl" />
  </div>
);
