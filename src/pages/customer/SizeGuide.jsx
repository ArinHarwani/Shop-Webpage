import React, { useState, useMemo } from 'react';
import Header from '../../components/Header';
import * as DS from '../../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

export default function SizeGuide() {
  const categories = Object.keys(TYPE_LABELS);
  const [activeTab, setActiveTab] = useState(categories[0]);
  const guideData = useMemo(() => DS.getSizeGuideData(), []);
  const tabLabel = TYPE_LABELS[activeTab] || activeTab;
  const data = guideData[tabLabel] || guideData['Top'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Size Guide</h1>
        <p className="text-gray-500 mb-8">Find your perfect fit. All measurements are in inches.</p>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`filter-chip ${activeTab === cat ? 'filter-chip-active' : 'filter-chip-inactive'}`}
            >
              {TYPE_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Measurement Table */}
        {data && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{tabLabel} Size Chart</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-brand-600">
                    {data.headers.map(h => (
                      <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} hover:bg-brand-50 transition-colors`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-6 py-4 text-sm ${j === 0 ? 'font-semibold text-brand-700' : 'text-gray-700'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* How to Measure */}
        <div className="mt-8 bg-brand-50 rounded-2xl border border-brand-100 p-6">
          <h3 className="text-lg font-bold text-brand-900 mb-4">How to Measure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-brand-700 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-brand-800">Bust / Chest</h4>
                <p className="text-sm text-brand-700">Measure around the fullest part of your bust, keeping the tape level.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-brand-700 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-brand-800">Waist</h4>
                <p className="text-sm text-brand-700">Measure around the narrowest part of your natural waist.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-brand-700 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-brand-800">Hip</h4>
                <p className="text-sm text-brand-700">Measure around the widest part of your hips.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-brand-700 font-bold text-sm">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-brand-800">Length</h4>
                <p className="text-sm text-brand-700">Measure from the highest point of the shoulder to the desired hemline.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
