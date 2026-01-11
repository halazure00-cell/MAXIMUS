/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#06f906",
                "background-light": "#f5f8f5",
                "background-dark": "#000000",
                "hud-gray": "#1a1a1a",
                "hud-red": "#ff0033",
                "hud-yellow": "#ffcc00",
            },
            fontFamily: {
                "display": ["Space Grotesk", "monospace"],
                "mono": ["Space Grotesk", "monospace"]
            },
            backgroundImage: {
                'hex-pattern': "url('data:image/svg+xml,%3Csvg width=\\'24\\' height=\\'40\\' viewBox=\\'0 0 24 40\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z\\' fill=\\'%23111\\' fill-opacity=\\'0.4\\' fill-rule=\\'evenodd\\'/%3E%3C/svg%3E')",
            },
            animation: {
                'radar-sweep': 'spin 4s linear infinite',
            }
        },
    },
    plugins: [],
}
