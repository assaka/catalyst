// Default 404 page content for new stores
const default404Content = `
<div style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
  <div style="font-size: 6rem; font-weight: bold; color: #9CA3AF; margin-bottom: 1rem;">404</div>
  
  <h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">
    Oops! Page Not Found
  </h1>
  
  <p style="color: #6B7280; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6;">
    We're sorry, but the page you're looking for seems to have wandered off. 
    Don't worry though – we'll help you find what you need!
  </p>
  
  <div style="margin-bottom: 2rem;">
    <p style="color: #374151; margin-bottom: 1rem;">Here are some helpful links:</p>
    <ul style="list-style: none; padding: 0; color: #2563EB;">
      <li style="margin-bottom: 0.5rem;">
        <a href="/" style="color: #2563EB; text-decoration: none;">🏠 Home Page</a>
      </li>
      <li style="margin-bottom: 0.5rem;">
        <a href="/category" style="color: #2563EB; text-decoration: none;">🛍️ Shop All Products</a>
      </li>
      <li style="margin-bottom: 0.5rem;">
        <a href="/contact" style="color: #2563EB; text-decoration: none;">📞 Contact Us</a>
      </li>
    </ul>
  </div>
  
  <div style="background-color: #F3F4F6; padding: 1.5rem; border-radius: 8px; margin-top: 2rem;">
    <p style="color: #374151; margin: 0; font-size: 0.9rem;">
      <strong>Need help?</strong> If you believe this is an error or you can't find what you're looking for, 
      please don't hesitate to contact our support team. We're here to help!
    </p>
  </div>
</div>
`;

const default404Metadata = {
  meta_title: "404 - Page Not Found | {{store_name}}",
  meta_description: "Sorry, we couldn't find the page you're looking for. Browse our products or contact us for assistance.",
  meta_keywords: "404, page not found, error, help",
  meta_robots_tag: "noindex, nofollow"
};

module.exports = {
  default404Content,
  default404Metadata
};