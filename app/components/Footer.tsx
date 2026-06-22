import { Link } from "react-router";
import { useCart } from "../context/cart";

export default function Footer() {
  const { count, subtotal, setIsCartOpen } = useCart();

  return (
    <>
      {/* 1. Illustration banner (puppies and kittens strip) */}
      <div className="illustration-strip">
        <img 
          src="/images/iStock_puppies_and_kittens_footer_aug_2023.jpg" 
          alt="Puppies and Kittens peeping" 
          loading="lazy"
        />
      </div>

      {/* 2. Main Footer Grid */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            
            {/* Column 1 */}
            <div className="footer-col footer-col-need-help">
              <h3>Need Help ?</h3>
              <ul>
                <li>
                  <Link to="/shop">
                    <i className="fa fa-home footer-inline-icon"></i> See All Our Stores
                  </Link>
                </li>
                <li>
                  <Link to="/shop">
                    <i className="fa fa-info-circle footer-inline-icon"></i> Pet Avenue
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="footer-col">
              <h3>Learn</h3>
              <ul>
                <li><Link to="/shop">Food Comparison Charts</Link></li>
                <li><Link to="/shop">Brochures</Link></li>
                <li><Link to="/shop">Retail Locations</Link></li>
                <li><Link to="/shop">Blog</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="footer-col">
              <h3>Information</h3>
              <ul>
                <li><Link to="/why-us">Why Choose Us</Link></li>
                <li><Link to="/shop">About Us</Link></li>
                <li><Link to="/shop">Quality Management</Link></li>
                <li><Link to="/shop">Terms & Conditions</Link></li>
                <li><Link to="/shop">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="footer-col">
              <h3>Follow Us</h3>
              <p>We are available on all social channels. Follow us for latest updates and notifications !!</p>
              
              <div className="footer-socials">
                <a href="https://www.facebook.com/petstorekenya" className="footer-social-link" target="_blank" rel="noreferrer" title="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                <a href="https://twitter.com/petstorekenya" className="footer-social-link" target="_blank" rel="noreferrer" title="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/petstorekenya/" className="footer-social-link" target="_blank" rel="noreferrer" title="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/" className="footer-social-link" target="_blank" rel="noreferrer" title="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163C23.33 5.097 22.493 4.26 21.427 4.092 19.515 3.793 12 3.793 12 3.793S4.485 3.793 2.573 4.092C1.507 4.26.67 5.097.502 6.163.2 8.087.2 12 .2 12S.2 15.913.502 17.837c.168 1.066.992 1.91 2.07 2.078C4.485 20.207 12 20.207 12 20.207S19.515 20.207 21.427 19.915c1.066-.168 1.903-1.012 2.07-2.078.303-1.924.303-5.837.303-5.837s0-3.913-.302-5.837zm-14.16 8.358V9.479l6.19 3.521-6.19 3.521z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* 3. Bottom Bar */}
        <div className="footer-bottom-bar">
          <p>Petstore Kenya (Petstore.co.ke) - All Rights Resevered.</p>
        </div>
      </footer>

      {/* 4. Floaters */}
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/254795350292?text=Hello%2C%20I%20need%20to%20know%20more%20about%3A" 
        className="whatsapp-floating" 
        target="_blank" 
        rel="noreferrer"
        title="WhatsApp Us"
      >
        <svg viewBox="0 0 24 24">
          <path d="M12.012 2c-5.506 0-9.988 4.481-9.988 9.987 0 2.006.591 3.874 1.614 5.434l-1.638 5.979 6.136-1.612c1.499.816 3.208 1.282 5.018 1.282 5.505 0 9.988-4.481 9.988-9.987S17.518 2 12.012 2zm6.208 13.855c-.254.717-1.488 1.341-2.07 1.401-.502.052-1.155.083-2.607-.492-2.316-.917-3.882-3.237-4.004-3.398-.112-.15-1.026-1.347-1.026-2.571 0-1.224.636-1.826.866-2.072.235-.246.502-.307.671-.307.169 0 .341.005.492.01.164.01.378-.061.594.461.221.533.758 1.846.825 1.979.066.133.112.287.02.472-.087.185-.133.297-.267.456-.133.159-.282.353-.404.472-.138.139-.287.292-.123.574.164.282.727 1.204 1.558 1.942.825.733 1.527.96 1.748 1.077.22.118.349.098.481-.051.133-.15.574-.666.727-.892.154-.226.307-.19.518-.113.209.077 1.332.625 1.563.743.231.118.384.179.44.277.057.097.057.564-.197 1.28z"/>
        </svg>
      </a>

      {/* Floating Cart Button (triggers drawer) */}
      <button className="cart-floating" onClick={() => setIsCartOpen(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span>
          Cart ({count}) - KES {subtotal.toLocaleString()}
        </span>
      </button>
    </>
  );
}
