import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopDeliveryBar from '../Navbar/TopDeliveryBar';
import MainNavbar from '../Navbar/MainNavbar';
import SecondaryNavbar from '../Navbar/SecondaryNavbar';
import Footer from '../Footer/Footer';
import LocationPromptModal from '../Location/LocationPromptModal';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col bg-cream-50/40 text-gray-800 relative">
      <LocationPromptModal />
      <TopDeliveryBar />
      <MainNavbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <SecondaryNavbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
