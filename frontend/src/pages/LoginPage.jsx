// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverPort, setServerPort] = useState(8000);
  const navigate = useNavigate();

  // Tester plusieurs ports au chargement
  useEffect(() => {
    const testPorts = async () => {
      const ports = [8000, 8001, 8002, 8003];
      for (const port of ports) {
        try {
          console.log(`Test du port ${port}...`);
          const response = await fetch(`http://127.0.0.1:${port}`, {
            method: 'HEAD',
            mode: 'no-cors',
          });
          console.log(`✅ Port ${port} disponible`);
          setServerPort(port);
          return;
        } catch (err) {
          console.log(`❌ Port ${port} non disponible`);
        }
      }
      console.log('Aucun port trouvé');
    };
    testPorts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`Tentative sur le port ${serverPort}...`);

      // Essayer sans CSRF d'abord (simplifié)
      const response = await fetch(`http://127.0.0.1:${serverPort}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Réponse:', data);

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      // Connexion réussie
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirection
      if (data.user.role === 'enseignant' || data.user.role === 'responsable_metier') {
        navigate('/dashboard/enseignant');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error('Erreur complète:', err);
      
      if (err.message.includes('Failed to fetch')) {
        setError(`
          🌐 Serveur Laravel introuvable !
          
          Démarrer Laravel avec :
          1. Ouvrez un terminal dans "mon-projet/backend"
          2. Exécutez : php artisan serve --host=127.0.0.1 --port=${serverPort}
          3. Attendez "Laravel development server started"
          4. Rafraîchissez cette page
          
          Port actuel testé : ${serverPort}
        `);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '25px' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>🔐 Connexion</h2>
      
      <div style={{ 
        background: '#e8f4fd', 
        padding: '10px', 
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <strong>Port testé : {serverPort}</strong>
      </div>

      {error && (
        <div style={{ 
          background: '#ffe6e6', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#cc0000',
          whiteSpace: 'pre-line'
        }}>
          {error}
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 15px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Rafraîchir
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="enseignant1@isep.sn"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
          style={{ 
            width: '100%', 
            padding: '12px', 
            margin: '10px 0',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        <input
          type="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
          style={{ 
            width: '100%', 
            padding: '12px', 
            margin: '10px 0',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: loading ? '#6c757d' : '#007bff', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;