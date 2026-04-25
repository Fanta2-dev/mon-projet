import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true }); // important
      const res = await axios.post('http://localhost:8000/api/register', form, {
        withCredentials: true
      });

      console.log('Utilisateur inscrit:', res.data);
    } catch (err) {
      console.error('Erreur inscription:', err.response?.data || err.message);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input name="name" type="text" placeholder="Nom" onChange={handleChange} />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} />
      <input name="password" type="password" placeholder="Mot de passe" onChange={handleChange} />
      <input name="password_confirmation" type="password" placeholder="Confirmer mot de passe" onChange={handleChange} />
      <button type="submit">S'inscrire</button>
      
    </form>
  );
}

export default Register;