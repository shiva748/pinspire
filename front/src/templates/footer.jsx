import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    { title: "About", url: "/about" },
    { title: "Blog", url: "/blog" },
    { title: "Business", url: "/business" },
    { title: "Terms of Service", url: "/terms" },
    { title: "Privacy Policy", url: "/privacy" },
    { title: "Help", url: "/help" },
  ];

  return (
    <footer className="bg-base-100 border-t py-8 px-6 mt-12">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="flex items-center text-xl font-bold text-primary">
              <svg className="w-6 h-6 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0a12 12 0 0 0-4.373 23.178c-.035-.947-.003-2.086.236-3.113.263-1.023 1.696-6.455 1.696-6.455s-.426-.867-.426-2.115c0-1.984 1.15-3.463 2.583-3.463 1.22 0 1.81.915 1.81 2.013 0 1.223-.777 3.055-1.182 4.751-.337 1.42.714 2.584 2.121 2.584 2.541 0 4.25-3.264 4.25-7.127 0-2.938-1.979-5.136-5.582-5.136-4.07 0-6.604 3.036-6.604 6.426 0 1.17.345 1.993.897 2.63.252.299.29.417.197.76-.066.252-.217.86-.279 1.102-.09.346-.366.47-.673.342-1.878-.766-2.756-2.831-2.756-5.15 0-3.827 3.228-8.416 9.627-8.416 5.145 0 8.527 3.724 8.527 7.72 0 5.283-2.937 9.232-7.268 9.232-1.455 0-2.823-.788-3.29-1.682l-.895 3.55c-.323 1.172-.957 2.346-1.536 3.27.866.257 1.776.395 2.717.395a12 12 0 0 0 12-12A12 12 0 0 0 12 0z" />
              </svg>
              Pinspire
            </span>
          </div>
          
          <div className="flex gap-4">
            <a href="https://twitter.com" className="p-2 rounded-full text-base-content hover:text-primary hover:bg-base-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
              </svg>
            </a>
            <a href="https://facebook.com" className="p-2 rounded-full text-base-content hover:text-primary hover:bg-base-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
              </svg>
            </a>
            <a href="https://instagram.com" className="p-2 rounded-full text-base-content hover:text-primary hover:bg-base-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="fill-current">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link, index) => (
            <Link key={index} to={link.url} className="text-sm text-base-content/70 hover:text-primary">
              {link.title}
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-8 text-sm text-base-content/60">
          © {currentYear} Pinspire. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;