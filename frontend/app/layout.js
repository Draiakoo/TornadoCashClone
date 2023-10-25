import './globals.css'
import Web3ContextProvider from '@/context/Web3Context'


export const metadata = {
  title: 'Tornado Cash Clone',
  description: 'This is a cloned project for educational purpouses only',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3ContextProvider>
          {children}
        </Web3ContextProvider>
      </body>
    </html>
  )
}
