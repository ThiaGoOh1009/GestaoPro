import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './src/App';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    console.error("FATAL: O elemento 'root' não foi encontrado no DOM. A aplicação React não pode iniciar.");
    document.body.innerHTML = `<div style="color: #f87171; background-color: #111827; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: sans-serif;"><h1>Erro Fatal na Aplicação</h1><p style="margin-top: 8px;">O elemento principal com id="root" não foi encontrado. Verifique o arquivo index.html.</p></div>`
}