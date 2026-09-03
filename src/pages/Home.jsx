import React from 'react';
import Hero from '../components/Hero';
import FeaturesGrid from '../components/FeaturesGrid';

const Home = () => {
  return (
    <main className="flex flex-col items-center justify-center pt-8">
      <Hero />
      <FeaturesGrid />
    </main>
  );
};

export default Home;
