
import React from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/home/HowItWorks';
import FeaturedBarbers from '@/components/home/FeaturedBarbers';
import CTASection from '@/components/home/CTASection';

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <Features />
      <HowItWorks />
      <FeaturedBarbers />
      <CTASection />
    </Layout>
  );
};

export default Index;
