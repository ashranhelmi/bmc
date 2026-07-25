<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <script>
        (function() {
            const stored = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (stored === 'dark' || (!stored && prefersDark)) {
                document.documentElement.classList.add('dark');
            }
        })();
    </script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #fafafa;
            color: #111;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container { text-align: center; padding: 2rem; }
        .code { font-size: 8rem; font-weight: 800; line-height: 1; color: #e5e7eb; }
        .title { font-size: 1.5rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .description { color: #6b7280; font-size: 0.95rem; margin-bottom: 2rem; }
        .btn {
            display: inline-block;
            padding: 0.6rem 1.5rem;
            background: #111;
            color: #fff;
            border-radius: 0.5rem;
            text-decoration: none;
            font-size: 0.9rem;
            transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.8; }

        /* Dark mode */
        html.dark body { background: #111; color: #f9fafb; }
        html.dark .code { color: #1f2937; }
        html.dark .description { color: #9ca3af; }
        html.dark .btn { background: #f9fafb; color: #111; }
    </style>
</head>
<body>
    <div class="container">
        <div class="code">404</div>
        <h1 class="title">Page not found</h1>
        <p class="description">Sorry, the page you're looking for doesn't exist or has been moved.</p>
        <a href="{{ auth()->check() ? url('/dashboard') : url('/login') }}" class="btn">
            Go back home
        </a>
    </div>
</body>
</html>
