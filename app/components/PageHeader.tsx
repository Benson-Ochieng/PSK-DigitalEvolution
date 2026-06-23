import React from "react";

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div
      style={{
        backgroundImage: "url('/images/page-header-bg.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "65px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.2rem",
        marginBottom: "2.5rem",
        borderBottom: "3px solid #f7c276",
        width: "100%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Torn paper top edge overlay */}
      <svg 
        viewBox="0 0 1000 20" 
        preserveAspectRatio="none" 
        style={{ 
          position: "absolute", 
          top: "-1px", 
          left: 0, 
          width: "100%", 
          height: "15px", 
          pointerEvents: "none" 
        }}
      >
        <path 
          d="M0,0 L1000,0 L1000,10 Q990,12 980,8 Q970,5 960,10 Q950,13 940,9 Q930,6 920,11 Q910,14 900,9 Q890,5 880,11 Q870,13 860,8 Q850,6 840,11 Q830,14 820,9 Q810,6 800,10 Q790,12 780,7 Q770,5 760,10 Q750,12 740,8 Q730,5 720,10 Q710,13 700,9 Q690,6 680,11 Q670,14 660,9 Q650,5 640,11 Q630,13 620,8 Q610,6 600,11 Q590,14 580,9 Q570,6 560,10 Q550,12 540,7 Q530,5 520,10 Q510,12 500,8 Q490,5 480,10 Q470,13 460,9 Q450,6 440,11 Q430,14 420,9 Q410,5 400,11 Q390,13 380,8 Q370,6 360,11 Q350,14 340,9 Q330,6 320,10 Q310,12 300,7 Q290,5 280,10 Q270,12 260,8 Q250,5 240,10 Q230,13 220,9 Q210,6 200,11 Q190,14 180,9 Q170,5 160,11 Q150,13 140,8 Q130,6 120,11 Q110,14 100,9 Q90,6 80,10 Q70,12 60,7 Q50,5 40,10 Q30,12 20,8 Q10,5 0,10 Z" 
          fill="#ffffff" 
        />
      </svg>
      <i
        className="fa fa-paw"
        style={{
          transform: "rotate(45deg)",
          fontSize: "18px",
          color: "#f7c276",
          display: "inline-block"
        }}
      />
      <h1
        style={{
          fontFamily: '"Patrick Hand", cursive',
          fontSize: "1.8rem",
          fontWeight: 700,
          color: "#1e5da7",
          margin: 0,
          letterSpacing: "0.05em",
          textTransform: "uppercase"
        }}
      >
        {title}
      </h1>
      <i
        className="fa fa-paw"
        style={{
          transform: "rotate(-45deg)",
          fontSize: "18px",
          color: "#f7c276",
          display: "inline-block"
        }}
      />
    </div>
  );
}
