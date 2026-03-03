import "./globals.css";

export const metadata = {
  title: "SEO Crawler",
  description: "Next frontend base for reusable dashboard views"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
