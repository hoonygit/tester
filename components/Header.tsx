
import React from 'react';

const CloudIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-sm sticky top-0 z-10 p-4 sm:px-8 border-b border-slate-700">
      <div className="container mx-auto flex items-center gap-4">
        <CloudIcon className="w-8 h-8 text-cyan-400" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          제주도 기상 데이터 분석
        </h1>
      </div>
    </header>
  );
};
