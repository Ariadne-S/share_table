import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

function showError(el: HTMLElement, err: unknown) {
  const msg = err instanceof Error ? (err.stack || err.message) : String(err)
  el.innerHTML = `
    <div style="padding:2rem;color:#e74c3c;font-family:system-ui;background:#1a1a1a;min-height:100vh">
      <h1>Failed to load app</h1>
      <pre style="white-space:pre-wrap;word-break:break-word">${msg.replace(/</g, '&lt;')}</pre>
      <p>Check the browser console (F12) for more details.</p>
    </div>
  `
}

async function loadApp() {
  const rootEl = document.getElementById('root')
  if (!rootEl) {
    document.body.innerHTML = '<p style="padding:2rem;color:red">Error: #root element not found</p>'
    return
  }
  try {
    const [{ ErrorBoundary }, { ThemeProvider }, { ToastProvider }, { default: App }] = await Promise.all([
      import('./ErrorBoundary'),
      import('./contexts/ThemeContext'),
      import('./contexts/ToastContext'),
      import('./App'),
    ])
    await import('./index.css')
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (err) {
    console.error('App load error:', err)
    showError(rootEl!, err)
  }
}

loadApp()
