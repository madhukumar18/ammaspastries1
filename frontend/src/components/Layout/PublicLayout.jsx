import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopDeliveryBar from '../Navbar/TopDeliveryBar';
import MainNavbar from '../Navbar/MainNavbar';
import SecondaryNavbar from '../Navbar/SecondaryNavbar';
import Footer from '../Footer/Footer';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cream-50/40 text-gray-800">
      <TopDeliveryBar />
      <MainNavbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <SecondaryNavbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
