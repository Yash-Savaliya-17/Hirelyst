import React from 'react';
import { AlertTriangle, Check, Rocket, Layers, Target, TrendingUp } from 'lucide-react';

const SelectionAnalysis = ({ selectionanalysis }: any) => {
  const weakItems = selectionanalysis.weak_bullets ?? selectionanalysis.weak_elements ?? [];
  console.log(weakItems)
  return (
    <div className="bg-gradient-to-br from-blue-50 to-white font-manrope  rounded-xl p-6 w-full mx-auto">
      <div className="flex items-center mb-6 border-b pb-4 border-blue-100">
        <Rocket className="text-blue-600 mr-4" size={40} />
        <div>
          <h2 className="text-xl font-bold text-gray-800">Resume Enhancement Analyzer</h2>
          <p className="text-gray-500 text-sm">Transform Your Professional Narrative</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
        <div className="flex items-center mb-3">
          <Layers className="text-yellow-600 mr-3" size={24} />
          <h3 className="text-lg font-bold text-yellow-800">Key Improvement Strategies</h3>
        </div>
        <ul className="space-y-2 pl-4">
          {selectionanalysis.improvements.map((improvement: any, index: number) => (
            <li key={index} className="text-gray-700 flex items-center">
              <Check className="text-green-500 mr-2" size={15} />
              <span className="text-sm">{improvement}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
        <div className="flex items-center mb-3">
          <Target className="text-red-600 mr-3" size={24} />
          <h3 className="text-lg font-bold text-red-800">Current Limitations</h3>
        </div>
        <ul className="space-y-2 pl-4">
          {selectionanalysis.issues.map((issue: any, index: number) => (
            <li key={index} className="text-gray-700 flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={15} />
              <span className="text-sm">{issue}</span>
            </li>
          ))}
        </ul>
      </div>

      {weakItems?.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-blue-600 mr-3" size={24} />
            <h3 className="text-lg font-bold text-blue-800">
              Bullet Point Transformation
            </h3>
          </div>

          <div className="space-y-6">
            {weakItems.map((weakItem: any, index: number) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-red-700 mb-2 flex items-center">
                      <AlertTriangle className="mr-2 text-red-500" size={16} />
                      Current Version
                    </p>
                    <p className="bg-red-50 p-3 rounded-lg border text-sm font-semibold border-red-200 text-gray-700 ">
                      "{weakItem.current}"
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-green-700 mb-2 flex items-center">
                      <Check className="mr-2 text-green-500" size={16} />
                      Improved Version
                    </p>
                    <p className="bg-green-50 p-3 text-sm font-semibold rounded-lg border border-green-200 text-gray-700">
                      "{weakItem.improved}"
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-gray-100 p-3 font-semibold rounded-lg text-sm text-gray-600">
                  <strong className="text-gray-800">Analysis:</strong> {weakItem.why_weak}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionAnalysis;