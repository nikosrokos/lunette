import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div>
          <strong className="brand">Lunette</strong>
          <p>Find sunglasses that fit — and the studios who make them.</p>
        </div>
        <div className="cta-row">
          <Link href="/fit">Find my fit</Link>
          <Link href="/discover">Browse frames</Link>
          <Link href="/seller/login">Seller login</Link>
        </div>
      </div>
    </footer>
  );
}
