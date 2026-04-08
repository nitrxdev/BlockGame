import './globals.css';

export const metadata = {
  title: 'Block Game',
  description: 'Mobile-friendly puzzle game',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}