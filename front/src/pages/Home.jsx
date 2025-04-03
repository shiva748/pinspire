import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Home = () => {
  // Sample image data (in a real app, this would come from API)
  const [pins, setPins] = useState([
    {
      id: 1,
      image: "https://picsum.photos/id/26/500/300",
      title: "Modern workspace design",
      user: "creativestudio",
      saves: 245
    },
    {
      id: 2,
      image: "https://picsum.photos/id/42/500/300",
      title: "Minimal kitchen styling",
      user: "interiordesign",
      saves: 1821
    },
    {
      id: 3,
      image: "https://picsum.photos/id/110/500/300",
      title: "Camping under stars",
      user: "outdooradventures",
      saves: 743
    },
    {
      id: 4,
      image: "https://picsum.photos/id/102/500/300",
      title: "Breakfast perfection",
      user: "foodlover",
      saves: 983
    },
    {
      id: 5,
      image: "https://picsum.photos/id/10/500/300",
      title: "Mountain escape road trip",
      user: "travelbug",
      saves: 2045
    },
    {
      id: 6,
      image: "https://picsum.photos/id/106/500/300",
      title: "DIY plant holders",
      user: "craftlover",
      saves: 456
    },
    {
      id: 7,
      image: "https://picsum.photos/id/165/500/300",
      title: "Minimalist living room",
      user: "homedecor",
      saves: 1274
    },
    {
      id: 8,
      image: "https://picsum.photos/id/21/500/300",
      title: "Fashion week highlights",
      user: "styleinspo",
      saves: 872
    },
    {
      id: 9,
      image: "https://picsum.photos/id/48/500/300",
      title: "Productivity setup",
      user: "techlife",
      saves: 654
    },
    {
      id: 10,
      image: "https://picsum.photos/id/90/500/300",
      title: "Sunset yoga",
      user: "wellnessguru",
      saves: 1489
    },
    {
      id: 11,
      image: "https://picsum.photos/id/65/500/300",
      title: "Urban photography",
      user: "cityshooter",
      saves: 1780
    },
    {
      id: 12,
      image: "https://picsum.photos/id/76/500/300",
      title: "Healthy smoothie recipes",
      user: "nutritionlab",
      saves: 2381
    },
    {
      id: 13,
      image: "https://picsum.photos/id/237/500/300",
      title: "Pet photography tips",
      user: "petlover",
      saves: 3142
    },
    {
      id: 14,
      image: "https://picsum.photos/id/160/500/300",
      title: "Elegant table settings",
      user: "entertainpro",
      saves: 1675
    },
    {
      id: 15,
      image: "https://picsum.photos/id/119/500/300",
      title: "Coastal home decor",
      user: "seasideliving",
      saves: 1948
    }
  ]);

  // Set random heights for the pins to create a more realistic masonry effect
  useEffect(() => {
    setPins(pins.map(pin => ({
      ...pin,
      height: Math.floor(Math.random() * (450 - 200) + 200)
    })));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      {/* Hero Section with animated decorative background */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-base-100/50 to-base-100 py-16 md:py-24">
        {/* Animated decorative circles */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-primary/5 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute top-1/4 right-10 w-24 h-24 rounded-full bg-secondary/5 animate-float"></div>
        <div className="absolute bottom-10 left-1/4 w-32 h-32 rounded-full bg-accent/5 animate-float-slow"></div>
        
        {/* Animated decorative pins */}
        <div className="absolute top-10 right-1/3 opacity-20 rotate-6 animate-float-slow">
          <div className="w-16 h-16 rounded-xl bg-primary/20"></div>
        </div>
        <div className="absolute bottom-1/3 right-10 opacity-30 -rotate-12 animate-bounce-slow">
          <div className="w-20 h-20 rounded-xl bg-secondary/20"></div>
        </div>
        <div className="absolute top-1/2 left-10 opacity-20 rotate-12 animate-float">
          <div className="w-14 h-14 rounded-xl bg-neutral/20"></div>
        </div>
        
        {/* Moving background particles */}
        <div className="absolute w-3 h-3 rounded-full bg-primary/20 top-1/3 left-1/4 animate-ping-slow"></div>
        <div className="absolute w-5 h-5 rounded-full bg-secondary/10 bottom-1/4 right-1/3 animate-ping-slower"></div>
        <div className="absolute w-4 h-4 rounded-full bg-accent/10 top-2/3 right-1/4 animate-ping-slow"></div>
        
        {/* Content */}
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-base-content leading-tight animate-fade-in">
              Get your next <span className="text-primary">creative idea</span>
            </h1>
            <p className="text-xl text-base-content/80 mb-8 max-w-2xl mx-auto animate-fade-in-delay">
              Discover and save creative ideas for all your projects and interests
            </p>
            
            <div className="flex justify-center mt-8 animate-fade-in-delay-longer">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-base-200/50 text-base-content">
                <svg className="w-5 h-5 mr-2 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span className="font-medium">Over 10 billion monthly inspirations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow py-8 px-4 bg-base-100">
        {/* Pinterest-style masonry layout with themed colors */}
        <div className="max-w-screen-2xl mx-auto columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
          {pins.map((pin) => (
            <div 
              key={pin.id} 
              className="mb-4 break-inside-avoid rounded-xl overflow-hidden bg-base-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative group">
                <img 
                  src={pin.image} 
                  alt={pin.title}
                  style={{ height: `${pin.height}px` }}
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4">
                  <div className="flex justify-end">
                    <button className="bg-primary hover:bg-primary/90 text-primary-content font-medium px-4 py-2 rounded-full">
                      Save
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <a href="#" className="bg-base-100/90 hover:bg-base-100 rounded-full p-2 text-base-content">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </a>
                    <a href="#" className="bg-base-100/90 hover:bg-base-100 rounded-full p-2 text-base-content">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-base-content mb-1">{pin.title}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/70">{pin.user}</span>
                  <span className="flex items-center text-base-content/70">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3.22l-.61-.6a5.5 5.5 0 0 0-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 0 0-7.78-7.77l-.61.61z" />
                    </svg>
                    {pin.saves}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// Add custom animations to tailwind
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes float-slow {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0) rotate(-12deg); }
    50% { transform: translateY(-20px) rotate(-5deg); }
  }
  
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.5); opacity: 0.3; }
    100% { transform: scale(1); opacity: 0.5; }
  }
  
  @keyframes ping-slower {
    0% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(2); opacity: 0.2; }
    100% { transform: scale(1); opacity: 0.6; }
  }
  
  @keyframes fade-in {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-float-slow {
    animation: float-slow 8s ease-in-out infinite;
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 7s ease-in-out infinite;
  }
  
  .animate-ping-slow {
    animation: ping-slow 5s ease-in-out infinite;
  }
  
  .animate-ping-slower {
    animation: ping-slower 7s ease-in-out infinite;
  }
  
  .animate-fade-in {
    animation: fade-in 1s ease-out forwards;
  }
  
  .animate-fade-in-delay {
    opacity: 0;
    animation: fade-in 1s ease-out 0.3s forwards;
  }
  
  .animate-fade-in-delay-longer {
    opacity: 0;
    animation: fade-in 1s ease-out 0.6s forwards;
  }
`;
document.head.appendChild(style);

export default Home;
