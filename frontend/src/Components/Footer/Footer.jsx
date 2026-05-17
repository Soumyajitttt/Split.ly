import React from 'react';

const Footer = () => {
  const footerData = [
    {
      title: "Product",
      links: ["Features", "Documentation", "Pricing", "Changelog"]
    },
    {
      title: "Company",
      links: ["About Us", "Careers", "Blog", "Privacy"]
    },
    {
      title: "Community",
      links: ["Discord", "GitHub", "Twitter", "Support"]
    }
  ];

  return (
    <footer className="bg-[#060606] border-t border-zinc-800 text-zinc-400">
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 px-6 md:px-12 py-14 border-b border-zinc-800">
          
          {/* Brand Section */}
          <div className="flex flex-col">
            <h2 className="font-mono text-[11px] tracking-[2px] text-zinc-200 uppercase mb-4">
              BrandName
            </h2>
            <p className="text-[13px] leading-[1.7] max-w-[220px]">
              Building the next generation of digital experiences with precision and speed.
            </p>
            <span className="font-mono text-[10px] tracking-[2px] text-zinc-600 uppercase mt-5">
              Engineered for Excellence
            </span>
          </div>

          {/* Link Columns */}
          {footerData.map((column, index) => (
            <div key={index} className="flex flex-col">
              <h3 className="font-mono text-[11px] tracking-[2px] text-zinc-200 uppercase mb-4">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={`#${link.toLowerCase()}`} 
                      className="text-[13px] hover:text-white transition-colors duration-150 cursor-pointer"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-5 gap-3">
          <div className="font-mono text-[11px] text-zinc-600 tracking-wider">
            © {new Date().getFullYear()} BRANDNAME INC. ALL RIGHTS RESERVED.
          </div>
          
          <div className="flex gap-2">
            <span className="font-mono text-[9px] tracking-[1.5px] px-2.5 py-1 border border-zinc-800 rounded-sm text-zinc-600 uppercase">
              System: Operational
            </span>
            <span className="font-mono text-[9px] tracking-[1.5px] px-2.5 py-1 border border-zinc-800 rounded-sm text-zinc-600 uppercase">
              v1.2.4
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;