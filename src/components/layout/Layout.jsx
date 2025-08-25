// components/layout/Layout.jsx
import React from 'react';
import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <Header />
      {children}
    </div>
  );
}