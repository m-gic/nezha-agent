import Link from 'next/link'
export default function Home() {
return (
<div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
  <h1 style={{ color: '#0070f3' }}>欢迎来到我的Next.js应用</h1>
    <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
      这是我第一个Next.js页面！Next.js让React应用的开发变得简单而高效。
      </p>
        <div style={{ marginTop: '2rem' }}>
          <Link
          href="/about"
          style={{
          backgroundColor: '#0070f3',
          color: 'white',
          padding: '0.8rem 1.5rem',
          borderRadius: '4px',
          textDecoration: 'none'
          }}
          >
          前往关于页面
          </Link>
            </div>
              </div>
                )
                }