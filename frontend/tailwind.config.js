/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "mtg-card-back":
          "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
      },
      boxShadow: {
        "mtg-card":
          "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      },
      keyframes: {
        drawCard: {
          '0%': {
            transform: 'translateY(0) scale(0.8) rotateY(0deg)',
            opacity: '0'
          },
          '20%': {
            transform: 'translateY(-20px) scale(0.9) rotateY(180deg)',
            opacity: '1'
          },
          '80%': {
            transform: 'translateY(-100px) scale(1.1) rotateY(0deg)',
            opacity: '1'
          },
          '100%': {
            transform: 'translateY(-200px) scale(1) rotateY(0deg)',
            opacity: '0'
          }
        },
        drawFromDeck: {
          '0%': {
            transform: 'translateY(0) scale(1) rotateY(0deg)',
            opacity: '1'
          },
          '20%': {
            transform: 'translateY(-10px) scale(1.05) rotateY(180deg)',
            opacity: '1'
          },
          '80%': {
            transform: 'translateY(-150px) scale(1.1) rotateY(0deg)',
            opacity: '1'
          },
          '100%': {
            transform: 'translateY(-300px) scale(1) rotateY(0deg)',
            opacity: '0'
          }
        }
      },
      animation: {
        'drawCard': 'drawCard 0.8s ease-out forwards',
        'drawFromDeck': 'drawFromDeck 0.8s ease-out forwards'
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".mtg-card-back": {
          background:
            "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
          border: "2px solid #d4af37",
          "border-radius": "8px",
          "box-shadow":
            "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
        },
      });
    },
  ],
};
