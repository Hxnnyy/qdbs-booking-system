
import React from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import FeaturedBarbers from '@/components/home/FeaturedBarbers';
import CTASection from '@/components/home/CTASection';

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <HowItWorks />
      <FeaturedBarbers />
      <CTASection />
    </Layout>
  );
};

export default Index;
