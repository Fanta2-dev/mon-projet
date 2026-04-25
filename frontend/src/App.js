// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import api from './services/api';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InformatiquePage from './pages/InformatiquePage';
import ReseauTelecomPage from './pages/ReseauTelecomPage';
import AdminReseauPage from './pages/AdminReseauPage';
import DashboardChefDepartement from './pages/DashboardChefDepartement';
import DashboardCoordinateur from './pages/DashboardCoordinateur';
import DashboardResponsableMetier from './pages/DashboardResponsableMetier';
import DashboardApprenant from './pages/DashboardApprenant';
import DashboardEnseignant from './pages/DashboardEnseignant';
import MarquerPresences from './pages/MarquerPresences';

// Composant sécurisé
import BintaOnlyRoute from './components/BintaOnlyRoute'; // ✅ Nouveau composant

function App() {
  useEffect(() => {
    const fetchData = async () => {
      await api.get('/sanctum/csrf-cookie', { withCredentials: true });
    };
    fetchData();
  }, []);

  return (
    <Router>
      <Routes>
         {/* <Route 
          path="/admin/*" 
          element={
            window.location.href = 'http://localhost:8000/binta'
          } 
        /> */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/metier/informatique" element={<InformatiquePage />} />
        <Route path="/metier/reseau-telecom" element={<ReseauTelecomPage />} />
        <Route path="/metier/admin-reseau" element={<AdminReseauPage />} />
        <Route path="/dashboard/chef" element={<DashboardChefDepartement />} />
        <Route path="/dashboard/coordinateur" element={<DashboardCoordinateur />} />
        <Route path="/dashboard/responsable-metier" element={<DashboardResponsableMetier />} />
        <Route path="/dashboard/enseignant" element={<DashboardEnseignant />} />
        <Route path="/marquer-presences" element={<MarquerPresences />} />

        <Route path="/dashboard/apprenant/:metierSlug/:annee" element={<DashboardApprenant />}  />

        <Route path="/dashboard/apprenant/:metierSlug/annee-:annee" element={<DashboardApprenant />}  />


        🔐 Seul Binta peut accéder à Filament
        <Route path="/admin/*" element={<BintaOnlyRoute />} />
          {/* ✅ AJOUTEZ CETTE ROUTE FALLBACK POUR LES ERREURS */}
       
      </Routes>
    </Router>
  );
}

export default App;