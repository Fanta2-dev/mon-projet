// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Convertit metier_id en slug pour l'URL
  const getMetierSlug = (metierId) => {
    const slugs = {
      1: 'informatique',
      2: 'reseau-telecom',
      3: 'admin-reseau',
    };
    return slugs[metierId] || 'informatique';
  };

  // ✅ Redirige vers le bon dashboard selon le rôle
  const getRedirectPath = (user) => {
    // 1. Vérifie si LandingPage a sauvegardé une redirection
    const savedRedirect = localStorage.getItem('redirectAfterLogin');
    if (savedRedirect) {
      localStorage.removeItem('redirectAfterLogin');
      return savedRedirect;
    }

    // 2. Redirection selon le rôle — adapté aux routes de App.jsx
    switch (user.role) {
      case 'apprenant': {
        const metierSlug = getMetierSlug(user.metier_id);
        const annee = user.annee || 1;
        return `/dashboard/apprenant/${metierSlug}/${annee}`;
      }
      case 'enseignant':
        return '/dashboard/enseignant';
      case 'responsable_metier':
        return '/dashboard/responsable-metier';
      case 'coordinateur':
        return '/dashboard/coordinateur';
      case 'chef_departement':
        return '/dashboard/chef'; // ✅ correspond à App.jsx
      case 'admin':
        return '/binta';
      default:
        return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🍪 1. Récupère le cookie CSRF
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
        withCredentials: true,
      });

      // 📤 2. Envoie la requête de connexion
      const res = await axios.post('http://localhost:8000/api/login', {
        email: formData.email,
        password: formData.password,
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const { user, token } = res.data;

      // 💾 3. Sauvegarde token et user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ 4. Redirige vers le bon dashboard
      const path = getRedirectPath(user);
      console.log(`✅ Connecté en tant que "${user.role}" → ${path}`);
      navigate(path);

    } catch (err) {
      console.error('Erreur connexion:', err);
      const message =
        err.response?.data?.message ||
        'Erreur réseau. Vérifiez votre connexion.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '25px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '25px' }}>
        Connexion
      </h2>

      {error && (
        <div style={{
          background: '#ffe6e6',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#cc0000',
          border: '1px solid #ffcccc'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          disabled={loading}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            background: loading ? '#6c757d' : '#007bff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
        Pas encore de compte ?{' '}
        <a href="/register" style={{ color: '#007bff' }}>S'inscrire</a>
      </p>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '12px',
  margin: '10px 0',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  padding: '14px',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  marginTop: '10px',
  fontWeight: '600',
};

export default LoginPage;