import '@/frontend/styles.css';

export const metadata = {
  title: 'Hotel Automation',
  description: 'Reservations, room tariff, catering and billing for a 5-star hotel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="inner">
            <h1>Hotel Automation</h1>
            <span className="sub">Reservations &middot; Tariff &middot; Catering &middot; Billing</span>
            <span className="mark">5-star</span>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
