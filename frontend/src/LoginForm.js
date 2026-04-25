import React, { useState } from 'react';
import axios from 'axios';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    try {
      // 1. Obtenir le cookie CSRF
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
        withCredentials: true,
      });

      // 2. Envoyer la requête de login
      const response = await axios.post(
        'http://localhost:8000/api/login',
        { email, password },
        { withCredentials: true }
      );

      console.log('Connexion réussie ✅', response.data);
      setErreur('');
      // ici tu peux rediriger ou stocker l'utilisateur

    } catch (error) {
      console.error('Erreur de connexion ❌', error.response?.data || error.message);
      setErreur('Email ou mot de passe incorrect');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <br />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        required
      />
      <br />
      <button type="submit">Se connecter</button>
      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
    </form>
  );
}
