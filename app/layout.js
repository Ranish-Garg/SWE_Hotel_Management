import '@/frontend/styles.css';
import Clock from '@/frontend/components/Clock.jsx';

export const metadata = {
  title: 'Hotel Automation',
  description: 'Reservations, room tariff, catering and billing for a 5-star hotel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600&display=swap"
        />
      </head>
      <body>
        <header className="hero">
          <div className="inner">
            <div className="brand-row">
              <span className="logo">H</span>
              <span className="brand">Hotel Automation</span>
              <span className="stars">★★★★★</span>
              <Clock />
            </div>
            <h1>Front desk, catering and billing in one place</h1>
            <p>Reserve rooms, record what guests order, revise the tariff and settle every bill at check-out.</p>
          </div>
        </header>
        <main className="page">{children}</main>
        <footer className="footer">Hotel Automation Software &middot; Reservations &middot; Tariff &middot; Catering &middot; Billing</footer>
      </body>
    </html>
  );
}
