
import React from 'react';
import Layout from '@/components/Layout';
import BarberHero from '@/components/barbers/BarberHero';
import BarberGrid from '@/components/barbers/BarberGrid';
import BarberCTA from '@/components/barbers/BarberCTA';

const Barbers = () => {
  return (
    <Layout>
      <BarberHero />
      
      {/* Barbers grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <BarberGrid />
        </div>
      </section>

      <BarberCTA />
    </Layout>
  );
};

export default Barbers;
