import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Woza Mali - Recycling Management System" />
        <meta name="author" content="Woza Mali Team" />

        <meta property="og:title" content="Woza Mali - Recycling Management System" />
        <meta property="og:description" content="Woza Mali - Recycling Management System" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/w yellow.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@wozamali" />
        <meta name="twitter:image" content="/w yellow.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/w yellow.png" />
        <link rel="shortcut icon" type="image/png" href="/w yellow.png" />
        <link rel="apple-touch-icon" type="image/png" href="/w yellow.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
