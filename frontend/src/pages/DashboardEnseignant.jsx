// src/pages/DashboardEnseignant.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Navbar,
  Nav,
  Alert,
  Offcanvas,
  Badge
} from 'react-bootstrap';
import api from '../services/api';
import LogoutButton from '../components/LogoutButton';
import { Link, useNavigate } from 'react-router-dom';

function DashboardEnseignant() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [soumissions, setSoumissions] = useState([]);
  const [selectedDevoir, setSelectedDevoir] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [showSoumissions, setShowSoumissions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDevoirs, setShowDevoirs] = useState(false);
  
  // États pour les cours en ligne
  const [showCoursModal, setShowCoursModal] = useState(false);
  const [coursEnLigne, setCoursEnLigne] = useState([]);
  const [showCoursEnLigne, setShowCoursEnLigne] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  const [newDevoir, setNewDevoir] = useState({
    titre: '',
    description: '',
    uea_nom: '',
    date_limite: '',
    coefficient: 1,
    fichier_sujet: null,
    type_sujet: 'texte',
    metier: '',
    annee: ''
  });

  const [newCours, setNewCours] = useState({
    nom: '',
    uea_nom: '',
    metier_id: '',
    annee: '',
    date: '',
    heure_debut: '',
    heure_fin: '',
    duree: '4h',
    lien_reunion: '',
    plateforme: 'google_meet',
    description: '',
    creer_automatiquement: true
  });

  const metiers = [
    { id: 1, value: 'DWM', label: 'DWM - Développement Web & Mobile' },
    { id: 2, value: 'RT', label: 'RT - Réseaux & Télécom' },
    { id: 3, value: 'ASRI', label: 'ASRI - Administration Système & Réseau' }
  ];

  const annees = [
    { value: '1', label: 'Première année' },
    { value: '2', label: 'Deuxième année' }
  ];

  const plateformes = [
    { value: 'google_meet', label: '🎥 Google Meet', icon: '🎥' },
    { value: 'zoom', label: '📹 Zoom', icon: '📹' },
    { value: 'teams', label: '💼 Microsoft Teams', icon: '💼' },
    { value: 'autre', label: '🔗 Autre', icon: '🔗' }
  ];

  const plateformesCodes = {
    'google_meet': 'GM',
    'zoom': 'ZM', 
    'teams': 'TM',
    'autre': 'OT'
  };

  const isResponsableMetier = (user) => {
    if (!user) return false;
    
    console.log("🔍 Vérification rôle responsable_metier:", user?.role);
    
    if (typeof user.role === 'string') {
      return user.role === 'responsable_metier' || 
             user.role.includes('responsable_metier');
    }
    
    return false;
  };

  const handleGoToResponsableDashboard = () => {
    console.log("🔄 Navigation vers Dashboard Responsable Métier");
    navigate('/dashboard/responsable-metier');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      window.location.href = '/login';
      return;
    }

    try {
      const userData = JSON.parse(userStr);

      if (userData.role !== 'enseignant' && userData.role !== 'responsable_metier') {
        alert("Accès refusé : vous n'êtes pas un enseignant ou responsable métier");
        if (userData.role === 'apprenant') {
          const metierSlug = slugify(userData.metier);
          window.location.href = `/dashboard/apprenant/${metierSlug}/annee-${userData.annee}`;
        } else if (userData.role === 'chef_departement') {
          window.location.href = '/dashboard/chef';
        } else if (userData.role === 'coordinateur') {
          window.location.href = '/dashboard/coordinateur';
        } else {
          window.location.href = '/';
        }
        return;
      }

      setUser(userData);
      console.log("✅ Accès DashboardEnseignant autorisé pour:", userData.role);
      console.log("🔍 isResponsableMetier:", isResponsableMetier(userData));
    } catch (err) {
      console.error("Erreur parsing user data", err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
  }, []);

  // ✅ CORRECTION : Fonction fetchDevoirs améliorée
  const fetchDevoirs = async () => {
    try {
      const res = await api.get('/api/enseignant/devoirs');
      
      // ✅ CORRECTION : Debug pour voir les données reçues
      console.log("📊 Données devoirs reçues:", res.data);
      
      // ✅ CORRECTION : Formater les données pour afficher correctement
      const devoirsFormatted = res.data.map(devoir => {
        console.log(`🔍 Devoir ${devoir.id}:`, {
          metier: devoir.metier,
          annee: devoir.annee,
          fichier_consigne: devoir.fichier_consigne,
          fichier_consigne_url: devoir.fichier_consigne_url
        });
        
        return {
          ...devoir,
          // ✅ CORRECTION : Extraire les valeurs textuelles pour éviter l'erreur React
          metier: typeof devoir.metier === 'object' ? devoir.metier.nom || devoir.metier.value || devoir.metier : devoir.metier || 'Non spécifié',
          annee: typeof devoir.annee === 'object' ? devoir.annee.value || devoir.annee : devoir.annee || '?',
          uea_nom: typeof devoir.uea_nom === 'object' ? devoir.uea_nom.nom || devoir.uea_nom : devoir.uea_nom || devoir.uea?.nom || 'N/A',
          // S'assurer que le fichier est détecté correctement
          hasFile: !!devoir.fichier_consigne
        };
      });
      
      setDevoirs(devoirsFormatted);
    } catch (err) {
      console.error('Erreur:', err.response?.data);
    }
  };

  const fetchCoursEnLigne = async () => {
    try {
      const res = await api.get('/api/seances?type=en_ligne');
      setCoursEnLigne(res.data || []);
    } catch (err) {
      console.error('Erreur chargement cours en ligne:', err.response?.data);
    }
  };

  const slugify = (text) => {
    return text
      ?.toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    setNewDevoir({ ...newDevoir, [e.target.name]: e.target.value });
  };

  const handleCoursChange = (e) => {
    setNewCours({ ...newCours, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream'
      ];
      
      const maxSize = 50 * 1024 * 1024;

      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.zip')) {
        alert('❌ Format de fichier non supporté. Utilisez PDF ou ZIP.');
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        alert('❌ Fichier trop volumineux. Taille max: 50MB');
        e.target.value = '';
        return;
      }

      setNewDevoir({ ...newDevoir, fichier_sujet: file });
    }
  };

  const handleTypeSujetChange = (type) => {
    setNewDevoir({ 
      ...newDevoir, 
      type_sujet: type,
      fichier_sujet: type === 'texte' ? null : newDevoir.fichier_sujet
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    if (!newDevoir.metier || !newDevoir.annee) {
      alert('❌ Veuillez sélectionner le métier et l\'année concernés.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      formData.append('titre', newDevoir.titre);
      formData.append('description', newDevoir.description);
      formData.append('uea_nom', newDevoir.uea_nom);
      formData.append('date_limite', newDevoir.date_limite);
      formData.append('coefficient', newDevoir.coefficient);
      formData.append('type_sujet', newDevoir.type_sujet);
      formData.append('metier', newDevoir.metier);
      formData.append('annee', newDevoir.annee);

      if (newDevoir.type_sujet === 'fichier' && newDevoir.fichier_sujet) {
        formData.append('fichier_sujet', newDevoir.fichier_sujet);
      }

      await api.post('/api/devoirs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert(`✅ Devoir créé pour les ${newDevoir.metier} - Année ${newDevoir.annee} ! Les apprenants ont été notifiés.`);
      setNewDevoir({ 
        titre: '', 
        description: '', 
        uea_nom: '', 
        date_limite: '', 
        coefficient: 1,
        fichier_sujet: null,
        type_sujet: 'texte',
        metier: '',
        annee: ''
      });
      setShowModal(false);
      
      await fetchDevoirs();
    } catch (err) {
      console.error('Erreur création devoir:', err.response?.data);
      alert('❌ Erreur lors de la création du devoir');
    } finally {
      setUploading(false);
    }
  };

  const genererLienReunion = async (plateforme) => {
    try {
      setCreatingMeeting(true);
      
      const response = await api.post('/api/meetings/demo', {
        plateforme: plateforme
      });

      if (response.data.success) {
        setNewCours(prev => ({
          ...prev,
          lien_reunion: response.data.lien,
          plateforme: plateforme
        }));
        alert(`✅ Lien ${plateforme} généré automatiquement !`);
      } else {
        alert('❌ Erreur lors de la génération du lien');
      }
    } catch (error) {
      console.error('Erreur génération lien:', error);
      alert('❌ Erreur lors de la génération du lien de réunion');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleSubmitCours = async (e) => {
    e.preventDefault();
    setUploading(true);

    if (!newCours.metier_id || !newCours.annee) {
      alert('❌ Veuillez sélectionner le métier et l\'année concernés.');
      setUploading(false);
      return;
    }

    if (!newCours.lien_reunion) {
      alert('❌ Veuillez fournir un lien de réunion.');
      setUploading(false);
      return;
    }

    try {
      const salle = `OL-${plateformesCodes[newCours.plateforme]}`;

      const seanceData = {
        nom: newCours.nom,
        uea_nom: newCours.uea_nom,
        metier_id: newCours.metier_id,
        annee: newCours.annee,
        enseignant_id: user.id,
        date: newCours.date,
        heure_debut: newCours.heure_debut,
        heure_fin: newCours.heure_fin,
        duree: newCours.duree,
        type: 'en_ligne',
        lien_reunion: newCours.lien_reunion,
        statut: 'programmee',
        salle: salle
      };

      const response = await api.post('/api/seances', seanceData);

      alert('✅ Cours en ligne créé avec succès !');
      
      setNewCours({
        nom: '',
        uea_nom: '',
        metier_id: '',
        annee: '',
        date: '',
        heure_debut: '',
        heure_fin: '',
        duree: '4h',
        lien_reunion: '',
        plateforme: 'google_meet',
        description: ''
      });
      
      setShowCoursModal(false);
      await fetchCoursEnLigne();
    } catch (err) {
      console.error('Erreur création cours en ligne:', err.response?.data);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        let errorMessage = 'Erreurs de validation:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `• ${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        alert('❌ Erreur lors de la création du cours en ligne: ' + 
          (err.response?.data?.message || 'Vérifiez les données saisies'));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleVoirMesDevoirs = async () => {
    setActiveSection('devoirs');
    setShowDevoirs(true);
    await fetchDevoirs();
    setShowSidebar(false);
  };

  const handleVoirCoursEnLigne = async () => {
    setActiveSection('cours_en_ligne');
    setShowCoursEnLigne(true);
    await fetchCoursEnLigne();
    setShowSidebar(false);
  };

  const handleFermerDevoirs = () => {
    setShowDevoirs(false);
    setActiveSection('accueil');
  };

  const handleVoirSoumissions = async (devoir) => {
    setSelectedDevoir(devoir);
    setShowSoumissions(true);
    setActiveSection('soumissions');
    try {
      const res = await api.get(`/api/devoirs/${devoir.id}/soumissions`);
      setSoumissions(res.data);
    } catch (err) {
      console.error('Erreur soumissions:', err.response?.data);
      alert('Erreur lors du chargement des soumissions');
    }
  };

  const handleFeedbackChange = (soumissionId, value) => {
    setFeedbacks({ ...feedbacks, [soumissionId]: value });
  };

  const handleEnvoyerFeedback = async (soumissionId) => {
    try {
      await api.post(`/api/soumissions/${soumissionId}/feedback`, {
        feedback: feedbacks[soumissionId] || ''
      });
      alert('Feedback envoyé !');
      handleVoirSoumissions(selectedDevoir);
    } catch (err) {
      console.error('Erreur feedback:', err.response?.data);
      alert('Erreur lors de l\'envoi du feedback');
    }
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setShowSidebar(false);
  };

  const handleCopierLien = (lien) => {
    navigator.clipboard.writeText(lien);
    alert('✅ Lien copié dans le presse-papier !');
  };

  const cardHoverStyle = {
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer',
    border: '1px solid #e9ecef'
  };

  const cardHoverEffect = {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0, 123, 255, 0.15)',
    borderColor: '#007bff'
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'accueil':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm text-center border-0 bg-white">
                <Card.Body className="py-5">
                  <h2 className="mb-3 text-primary">👋 Bienvenue, {user?.name}</h2>
                  <p className="lead mb-5 text-muted">
                    Gérez facilement vos cours, devoirs et présences
                  </p>
                  
                  <div className="row justify-content-center g-4">
                    <div className="col-md-3 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            📚
                          </div>
                          <h5 className="text-primary">Gérer mes Devoirs</h5>
                          <p className="text-muted small flex-grow-1">
                            Créer de nouveaux devoirs ou consulter ceux existants
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={handleVoirMesDevoirs}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Voir mes Devoirs
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-3 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            🎥
                          </div>
                          <h5 className="text-primary">Cours en ligne</h5>
                          <p className="text-muted small flex-grow-1">
                            Organiser des cours via Google Meet, Zoom, etc.
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={() => setShowCoursModal(true)}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Créer un cours
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-3 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            ✅
                          </div>
                          <h5 className="text-primary">Marquer Présences</h5>
                          <p className="text-muted small flex-grow-1">
                            Gérer les présences de vos apprenants
                          </p>
                          <Link to="/marquer-presences" className="mt-auto">
                            <Button 
                              variant="primary" 
                              className="w-100"
                              style={{
                                borderRadius: '25px',
                                padding: '10px 20px'
                              }}
                            >
                              Accéder
                            </Button>
                          </Link>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-3 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            ➕
                          </div>
                          <h5 className="text-primary">Créer un Devoir</h5>
                          <p className="text-muted small flex-grow-1">
                            Publier un nouveau devoir pour vos apprenants
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={() => setShowModal(true)}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Créer maintenant
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );

      case 'cours_en_ligne':
        return (
          showCoursEnLigne && (
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm border-0 bg-white">
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">🎥 Mes Cours en Ligne</h5>
                    <div>
                      <Button 
                        size="sm" 
                        variant="light" 
                        className="me-2"
                        onClick={() => setShowSidebar(true)}
                      >
                        ☰ Menu
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-light" 
                        className="me-2"
                        onClick={() => setShowCoursModal(true)}
                      >
                        + Nouveau cours
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light" 
                        onClick={() => {
                          setShowCoursEnLigne(false);
                          setActiveSection('accueil');
                        }}
                      >
                        ✕ Fermer
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {coursEnLigne.length === 0 ? (
                      <Alert variant="primary" className="text-center py-4 bg-light border-0">
                        <h6 className="mb-3 text-primary">Aucun cours en ligne programmé</h6>
                        <p className="mb-0 text-muted">
                          Créez votre premier cours en ligne avec Google Meet, Zoom ou Teams.
                        </p>
                      </Alert>
                    ) : (
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Cours</th>
                            <th>UEA</th>
                            <th>Métier / Année</th>
                            <th>Date & Heure</th>
                            <th>Plateforme</th>
                            <th>Lien</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coursEnLigne.map(cours => (
                            <tr key={cours.id}>
                              <td>
                                <strong className="text-primary">{cours.nom}</strong>
                              </td>
                              <td className="text-muted">{cours.uea_nom}</td>
                              <td>
                                <Badge bg="info">{cours.metier?.nom || 'N/A'}</Badge>
                                {' '}
                                <Badge bg="secondary">Année {cours.annee}</Badge>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {new Date(cours.date).toLocaleDateString()}<br/>
                                  {cours.heure_debut} - {cours.heure_fin}
                                </small>
                              </td>
                              <td>
                                <Badge bg="success">{cours.salle}</Badge>
                              </td>
                              <td>
                                <Button 
                                  size="sm" 
                                  variant="outline-primary"
                                  onClick={() => handleCopierLien(cours.lien_reunion)}
                                >
                                  📋 Copier
                                </Button>
                                {' '}
                                <a 
                                  href={cours.lien_reunion} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-primary"
                                >
                                  🔗 Ouvrir
                                </a>
                              </td>
                              <td>
                                <Badge bg={cours.statut === 'programmee' ? 'warning' : 'success'}>
                                  {cours.statut}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )
        );

      case 'devoirs':
        return (
          showDevoirs && (
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm border-0 bg-white">
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">📚 Mes Devoirs</h5>
                    <div>
                      <Button 
                        size="sm" 
                        variant="light" 
                        className="me-2"
                        onClick={() => setShowSidebar(true)}
                      >
                        ☰ Menu
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-light" 
                        className="me-2"
                        onClick={() => setShowModal(true)}
                      >
                        + Nouveau
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light" 
                        onClick={handleFermerDevoirs}
                      >
                        ✕ Fermer
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {devoirs.length === 0 ? (
                      <Alert variant="primary" className="text-center py-4 bg-light border-0">
                        <h6 className="mb-3 text-primary">Aucun devoir publié</h6>
                        <p className="mb-0 text-muted">
                          Commencez par créer votre premier devoir en cliquant sur "Nouveau Devoir".
                        </p>
                      </Alert>
                    ) : (
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Titre</th>
                            <th>UEA</th>
                            <th>Métier</th>
                            <th>Année</th>
                            <th>Type</th>
                            <th>Date limite</th>
                            <th>Coefficient</th>
                            <th>Soumissions</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devoirs.map(d => (
                            <tr key={d.id}>
                              <td>
                                <strong className="text-primary">{d.titre}</strong>
                                {/* ✅ CORRECTION : Afficher l'icône fichier basé sur fichier_consigne */}
                                {d.fichier_consigne && <span className="ms-1">📎</span>}
                              </td>
                              <td className="text-muted">
                                {/* ✅ CORRECTION : Gérer uea_nom qui pourrait être un objet */}
                                {d.uea_nom}
                              </td>
                              <td>
                                {/* ✅ CORRECTION : Utiliser directement d.metier (déjà formaté dans fetchDevoirs) */}
                                <span className="badge bg-info">{d.metier}</span>
                              </td>
                              <td>
                                {/* ✅ CORRECTION : Utiliser directement d.annee (déjà formaté dans fetchDevoirs) */}
                                <span className="badge bg-secondary">Année {d.annee}</span>
                              </td>
                              <td>
                                {/* ✅ CORRECTION : Type basé sur fichier_consigne */}
                                <span className={`badge ${d.fichier_consigne ? 'bg-primary' : 'bg-secondary'}`}>
                                  {d.fichier_consigne ? 'Fichier' : 'Texte'}
                                </span>
                              </td>
                              <td className="text-muted">
                                {new Date(d.date_limite).toLocaleDateString()}
                                <br />
                                <small className="text-warning">
                                  {new Date(d.date_limite).toLocaleTimeString()}
                                </small>
                              </td>
                              <td>
                                <span className="badge bg-primary">{d.coefficient}</span>
                              </td>
                              <td>
                                <span className={`badge ${d.soumissions_count > 0 ? "bg-success" : "bg-secondary"}`}>
                                  {d.soumissions_count || 0} soumission(s)
                                </span>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleVoirSoumissions(d)}
                                  disabled={!d.soumissions_count}
                                  className="me-1"
                                >
                                  👁️ Voir
                                </Button>
                                {/* ✅ CORRECTION : Utiliser fichier_consigne_url au lieu de construire l'URL manuellement */}
                                {d.fichier_consigne_url && (
                                  <a 
                                    href={d.fichier_consigne_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-success"
                                  >
                                    📥 Télécharger
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )
        );

      case 'soumissions':
        return (
          showSoumissions && selectedDevoir && (
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm border-0 bg-white">
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">📨 Soumissions pour : {selectedDevoir.titre}</h5>
                    <div>
                      <Button 
                        size="sm" 
                        variant="light" 
                        className="me-2"
                        onClick={() => setShowSidebar(true)}
                      >
                        ☰ Menu
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light" 
                        onClick={() => {
                          setShowSoumissions(false);
                          setActiveSection('devoirs');
                        }}
                      >
                        ← Retour
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {soumissions.length === 0 ? (
                      <Alert variant="primary" className="text-center py-4 bg-light border-0">
                        Aucune soumission pour ce devoir.
                      </Alert>
                    ) : (
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Apprenant</th>
                            <th>Fichier</th>
                            <th>Feedback</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {soumissions.map(s => (
                            <tr key={s.id}>
                              <td className="text-primary">{s.apprenant_nom || s.apprenant?.name || 'N/A'}</td>
                              <td>
                                {s.fichier ?
                                  <a href={s.fichier} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                    📎 Voir
                                  </a>
                                  : <span className="text-muted">Aucun</span>}
                              </td>
                              <td>
                                {s.feedback ? (
                                  <span className="text-primary fw-bold">{s.feedback}</span>
                                ) : (
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={feedbacks[s.id] || ''}
                                    onChange={e => handleFeedbackChange(s.id, e.target.value)}
                                    placeholder="Entrer un feedback..."
                                  />
                                )}
                              </td>
                              <td>
                                {!s.feedback && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleEnvoyerFeedback(s.id)}
                                    disabled={!feedbacks[s.id]}
                                  >
                                    Envoyer
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )
        );

      case 'presences':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">✅ Marquer les Présences</h5>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowSidebar(true)}
                  >
                    ☰ Menu
                  </Button>
                </Card.Header>
                <Card.Body className="text-center py-5">
                  <div className="mb-4 text-primary" style={{ fontSize: '4rem' }}>✅</div>
                  <h4 className="text-primary mb-3">Gestion des présences</h4>
                  <p className="lead text-muted mb-4">
                    Accédez à l'interface complète de gestion des présences de vos apprenants
                  </p>
                  <Link to="/marquer-presences">
                    <Button 
                      variant="primary" 
                      size="lg"
                      style={{
                        borderRadius: '25px',
                        padding: '12px 30px',
                        fontSize: '1.1rem'
                      }}
                    >
                      Accéder au Module de Présence
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );

      default:
        return renderMainContent('accueil');
    }
  };

  return (
    <div className="dashboard-container d-flex flex-column min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold">📚 Dashboard Enseignant</Navbar.Brand>
          <Nav className="ms-auto d-flex align-items-center">
            {isResponsableMetier(user) && (
              <Button 
                variant="warning"
                onClick={handleGoToResponsableDashboard}
                className="me-2 d-flex align-items-center gap-1"
                style={{ 
                  borderRadius: '20px', 
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '8px 16px'
                }}
              >
                🎯 Responsable Métier
              </Button>
            )}
            
            <Button 
              variant="outline-light" 
              className="me-3"
              onClick={() => setShowSidebar(true)}
            >
              ☰ Menu
            </Button>
            <span className="text-white me-3">👤 {user?.name}</span>
            {/* <LogoutButton onLogout={handleLogout} /> */}
            <LogoutButton />
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 py-4 bg-light">
        <Row>
          <Offcanvas 
            show={showSidebar} 
            onHide={() => setShowSidebar(false)}
            placement="start"
            style={{ width: '280px' }}
          >
            <Offcanvas.Header closeButton className="bg-primary text-white">
              <Offcanvas.Title>📊 Navigation</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0 bg-white">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'accueil' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => handleNavigation('accueil')}
                >
                  <span className="me-2">🏠</span>
                  Accueil
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'devoirs' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={handleVoirMesDevoirs}
                >
                  <span className="me-2">📚</span>
                  Mes Devoirs
                  {devoirs.length > 0 && (
                    <span className="badge bg-primary ms-auto">{devoirs.length}</span>
                  )}
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'cours_en_ligne' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={handleVoirCoursEnLigne}
                >
                  <span className="me-2">🎥</span>
                  Cours en ligne
                  {coursEnLigne.length > 0 && (
                    <span className="badge bg-success ms-auto">{coursEnLigne.length}</span>
                  )}
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'presences' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => handleNavigation('presences')}
                >
                  <span className="me-2">✅</span>
                  Marquer Présences
                </button>
                
                <button
                  className="list-group-item list-group-item-action d-flex align-items-center"
                  onClick={() => {
                    setShowModal(true);
                    setShowSidebar(false);
                  }}
                >
                  <span className="me-2">➕</span>
                  Créer un Devoir
                </button>

                <button
                  className="list-group-item list-group-item-action d-flex align-items-center"
                  onClick={() => {
                    setShowCoursModal(true);
                    setShowSidebar(false);
                  }}
                >
                  <span className="me-2">🎥</span>
                  Créer un Cours en ligne
                </button>
              </div>
              
              <div className="p-3 border-top bg-light">
                <small className="text-muted">
                  <strong>📈 Statistiques :</strong><br />
                  • Devoirs créés: <span className="fw-bold text-primary">{devoirs.length}</span><br />
                  • Cours en ligne: <span className="fw-bold text-success">{coursEnLigne.length}</span><br />
                  • Soumissions totales: <span className="fw-bold text-primary">
                    {devoirs.reduce((acc, d) => acc + (d.soumissions_count || 0), 0)}
                  </span>
                </small>
              </div>
            </Offcanvas.Body>
          </Offcanvas>

          <Col xs={12}>
            {renderMainContent()}
          </Col>
        </Row>
      </Container>

      <footer className="bg-primary text-white mt-auto">
        <Container className="py-4">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-2">📚 Plateforme Éducative</h6>
              <p className="mb-0 text-light">
                Système de gestion des devoirs et présences - Enseignant
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-flex justify-content-md-end justify-content-start flex-wrap gap-3">
                <small className="text-light">
                  👤 Connecté en tant que: <span className="fw-bold">{user?.name}</span>
                </small>
                <small className="text-light">
                  🏫 <span className="fw-bold">ISEP</span>
                </small>
                <small className="text-light">
                  📅 {new Date().getFullYear()} © Tous droits réservés
                </small>
              </div>
            </Col>
          </Row>
          <hr className="my-3 border-light" />
          <Row>
            <Col className="text-center">
              <small className="text-light">
                Développé avec ❤ pour une meilleure expérience éducative
              </small>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Modal de création de devoir */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>📝 Créer un nouveau devoir</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Titre</Form.Label>
              <Form.Control
                type="text"
                name="titre"
                value={newDevoir.titre}
                onChange={handleChange}
                placeholder="Ex: TP1 - Algorithmique"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newDevoir.description}
                onChange={handleChange}
                placeholder="Décrivez le devoir en détail..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Métier concerné</Form.Label>
              <Form.Select
                name="metier"
                value={newDevoir.metier}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un métier</option>
                {metiers.map(metier => (
                  <option key={metier.value} value={metier.value}>
                    {metier.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Année concernée</Form.Label>
              <Form.Select
                name="annee"
                value={newDevoir.annee}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez une année</option>
                {annees.map(annee => (
                  <option key={annee.value} value={annee.value}>
                    {annee.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Type de sujet</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="Sujet en texte"
                  name="type_sujet"
                  value="texte"
                  checked={newDevoir.type_sujet === 'texte'}
                  onChange={() => handleTypeSujetChange('texte')}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Fichier (PDF/ZIP)"
                  name="type_sujet"
                  value="fichier"
                  checked={newDevoir.type_sujet === 'fichier'}
                  onChange={() => handleTypeSujetChange('fichier')}
                />
              </div>
            </Form.Group>

            {newDevoir.type_sujet === 'fichier' && (
              <Form.Group className="mb-3">
                <Form.Label className="text-primary">📎 Fichier du sujet (PDF ou dossier ZIP)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.zip"
                  onChange={handleFileChange}
                  required={newDevoir.type_sujet === 'fichier'}
                />
                <Form.Text className="text-muted">
                  Formats acceptés: PDF ou ZIP (max 50MB)
                </Form.Text>
                {newDevoir.fichier_sujet && (
                  <Alert variant="primary" className="mt-2 small bg-light border-0">
                    📄 Fichier sélectionné: {newDevoir.fichier_sujet.name} 
                    ({(newDevoir.fichier_sujet.size / 1024 / 1024).toFixed(2)} MB)
                  </Alert>
                )}
              </Form.Group>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">UEA</Form.Label>
              <Form.Control
                type="text"
                name="uea_nom"
                value={newDevoir.uea_nom}
                onChange={handleChange}
                placeholder="Ex: Algorithmique, Réseaux Informatiques..."
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Date limite</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="date_limite"
                    value={newDevoir.date_limite}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Coefficient</Form.Label>
                  <Form.Control
                    type="number"
                    name="coefficient"
                    min="1"
                    max="10"
                    value={newDevoir.coefficient}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? 'Création en cours...' : 'Créer le devoir'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de création de cours en ligne */}
      <Modal show={showCoursModal} onHide={() => setShowCoursModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>🎥 Organiser un cours en ligne</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitCours}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>💡 Astuce :</strong> Cliquez sur 🔗 pour générer automatiquement un lien de démonstration.
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Nom du cours</Form.Label>
              <Form.Control
                type="text"
                name="nom"
                value={newCours.nom}
                onChange={handleCoursChange}
                placeholder="Ex: Cours de Programmation Web"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">UEA</Form.Label>
              <Form.Control
                type="text"
                name="uea_nom"
                value={newCours.uea_nom}
                onChange={handleCoursChange}
                placeholder="Ex: Développement Web"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Métier concerné</Form.Label>
                  <Form.Select
                    name="metier_id"
                    value={newCours.metier_id}
                    onChange={handleCoursChange}
                    required
                  >
                    <option value="">Sélectionnez un métier</option>
                    {metiers.map(metier => (
                      <option key={metier.id} value={metier.id}>
                        {metier.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Année concernée</Form.Label>
                  <Form.Select
                    name="annee"
                    value={newCours.annee}
                    onChange={handleCoursChange}
                    required
                  >
                    <option value="">Sélectionnez une année</option>
                    {annees.map(annee => (
                      <option key={annee.value} value={annee.value}>
                        {annee.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Plateforme</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {plateformes.map(plateforme => (
                  <div key={plateforme.value} className="d-flex align-items-center me-3">
                    <Form.Check
                      type="radio"
                      label={plateforme.label}
                      name="plateforme"
                      value={plateforme.value}
                      checked={newCours.plateforme === plateforme.value}
                      onChange={handleCoursChange}
                      className="me-1"
                    />
                    {plateforme.value !== 'autre' && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => genererLienReunion(plateforme.value)}
                        disabled={creatingMeeting}
                        className="ms-2"
                      >
                        {creatingMeeting ? '⏳' : '🔗'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Form.Text className="text-muted">
                Cliquez sur 🔗 pour générer automatiquement un lien de démonstration
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">🔗 Lien de la réunion</Form.Label>
              <Form.Control
                type="url"
                name="lien_reunion"
                value={newCours.lien_reunion}
                onChange={handleCoursChange}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                required
              />
              <Form.Text className="text-muted">
                Collez le lien complet de votre réunion (Google Meet, Zoom, Teams...)
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={newCours.date}
                    onChange={handleCoursChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Heure début</Form.Label>
                  <Form.Control
                    type="time"
                    name="heure_debut"
                    value={newCours.heure_debut}
                    onChange={handleCoursChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Heure fin</Form.Label>
                  <Form.Control
                    type="time"
                    name="heure_fin"
                    value={newCours.heure_fin}
                    onChange={handleCoursChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Durée</Form.Label>
              <Form.Select
                name="duree"
                value={newCours.duree}
                onChange={handleCoursChange}
                required
              >
                <option value="4h">4 heures</option>
                <option value="8h">8 heures (journée complète)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Description (optionnel)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={newCours.description}
                onChange={handleCoursChange}
                placeholder="Points à aborder, documents à préparer..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={() => setShowCoursModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? '🎥 Création en cours...' : '🎥 Créer le cours en ligne'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default DashboardEnseignant;