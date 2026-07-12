function securityHeaders(req, res, next) {
  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://lh3.googleusercontent.com; connect-src 'self' http://localhost:3000; frame-ancestors 'none';"
  );

  // HTTP Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Frame-Options (Clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options (MIME sniffing protection)
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
}

module.exports = securityHeaders;
