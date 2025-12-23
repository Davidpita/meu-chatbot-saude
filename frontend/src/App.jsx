import React from 'react';
import Chatbot from './Chatbot';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-container">
          <div className="header-icon"><span className="material-icons">medical_services</span></div>
          <div className="header-content">
            <h1>Assistente Virtual de Saúde Pública</h1>
            <p>Sistema de Inteligência Artificial para informações sobre o SUS</p>
          </div>
        </div>
      </header>
      
      <main className="App-main">
        <div className="dashboard">
          <div className="info-cards">
            <div className="card">
              <span className="material-icons">medical_services</span>
              <h3>Informações de Saúde</h3>
              <p>Orientações sobre consultas, exames e tratamentos</p>
            </div>
            
            <div className="card">
              <span className="material-icons">location_on</span>
              <h3>Localização de Unidades</h3>
              <p>Encontre postos de saúde e UPAs mais próximos</p>
            </div>
            
            <div className="card">
              <span className="material-icons">emergency</span>
              <h3>Emergências 24h</h3>
              <p>Orientação imediata para situações de urgência</p>
            </div>
            
            <div className="card">
              <span className="material-icons">medication</span>
              <h3>Medicamentos</h3>
              <p>Informações sobre Farmácia Popular e programas</p>
            </div>
          </div>
          
          <div className="chatbot-section">
            <div className="section-header">
              <h2><span className="material-icons">chat</span> Conversa com o Assistente</h2>
              <p>Pergunte sobre qualquer dúvida relacionada à saúde pública</p>
            </div>
            <Chatbot />
          </div>
        </div>
        
        <div className="disclaimer">
          <span className="material-icons">warning</span>
          <p>
            <strong>Importante:</strong> Este assistente fornece informações gerais e 
            <strong> NÃO substitui</strong> atendimento médico profissional. 
            Em emergências, ligue <strong>192 (SAMU)</strong> imediatamente.
          </p>
        </div>
      </main>
      
      <footer className="App-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="material-icons">health_and_safety</span>
            <span>SUS Virtual</span>
          </div>
          <div className="footer-links">
            <a href="https://misau.gov.mz" target="_blank" rel="noopener noreferrer">
              <span className="material-icons">public</span> Ministério da Saúde
            </a>
            <a href="tel:823366">
              <span className="material-icons">phone</span> Disque 823366
            </a>
            <a href="tel:192">
              <span className="material-icons">emergency</span> SAMU 192
            </a>
          </div>
          <p className="footer-copyright">
            Sistema de Saúde Pública &copy; {new Date().getFullYear()} - Assistente Virtual
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;