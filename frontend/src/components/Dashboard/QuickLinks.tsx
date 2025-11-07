import React from "react";

const QuickLinks: React.FC = () => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-2 border-b border-gray-200 bg-blue-200">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
      </div>
      <ul className="space-y-2 p-4">
        <li>
          <a href="#" className="text-blue-600 hover:underline">
            Link 1
          </a>
        </li>
        <li>
          <a href="#" className="text-blue-600 hover:underline">
            Link 2
          </a>
        </li>
        <li>
          <a href="#" className="text-blue-600 hover:underline">
            Link 3
          </a>
        </li>
      </ul>
    </div>
  );
};

export default QuickLinks;
