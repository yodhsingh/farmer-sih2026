/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                forest: '#1A5D1A',
                'forest-dark': '#004407',
                gold: '#D4A017',
                'gold-dark': '#795900',
                lime: '#7CB342',
                'lime-light': '#91D885',
                cream: '#FAF9F6',
                ghost: '#E0DED7',
                'ghost-dark': '#C0C9BA',
            },
        },
    },
    plugins: [],
}