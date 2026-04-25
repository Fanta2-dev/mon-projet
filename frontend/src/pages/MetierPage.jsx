// src/pages/MetierPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function MetierPage({ metierId, metierNom }) {
  const [apprenants, setApprenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApprenants = async () => {
      try {
        const res = await api.get(`/api/apprenants?metier_id=${metierId}`);
        
        console.log("📦 Données API reçues:", res.data);
        
        const data = res.data;
        let apprenantsData = [];
        
        if (Array.isArray(data)) {
          apprenantsData = data;
        } else if (data && Array.isArray(data.data)) {
          apprenantsData = data.data;
        } else if (data && Array.isArray(data.apprenants)) {
          apprenantsData = data.apprenants;
        } else if (data && data.success && Array.isArray(data.data)) {
          apprenantsData = data.data;
        } else {
          console.warn("📋 Format inattendu:", data);
          apprenantsData = data ? [data] : [];
        }
        
        setApprenants(apprenantsData);
        
      } catch (err) {
        console.error("❌ Erreur API:", err.response?.data || err.message);
        setApprenants([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApprenants();
  }, [metierId]);

  const handleRetour = () => {
    navigate(-1);
  };

  // Styles intégrés - Palette bleu et blanc uniquement
  const styles = {
    metierCard: {
      border: 'none',
      borderRadius: '15px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(13, 110, 253, 0.1)'
    },
    cardHeaderCustom: {
      background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
      borderBottom: 'none',
      padding: '1.5rem 2rem'
    },
    cardBodyCustom: {
      backgroundColor: '#ffffff',
      minHeight: '400px',
      padding: 0
    },
    cardFooterCustom: {
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #dee2e6',
      padding: '1rem 2rem'
    },
    tableContainer: {
      maxHeight: '600px',
      overflowY: 'auto'
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    tableHeaderTh: {
      background: 'transparent',
      color: 'white',
      fontWeight: 600,
      border: 'none',
      padding: '1rem 0.75rem',
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    tableRow: {
      transition: 'all 0.3s ease',
      borderBottom: '1px solid #e9ecef',
      backgroundColor: 'white'
    },
    tableRowHover: {
      backgroundColor: '#e7f1ff !important',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(13, 110, 253, 0.15)',
      cursor: 'pointer'
    },
    tableTd: {
      padding: '1rem 0.75rem',
      verticalAlign: 'middle',
      border: 'none'
    },
    avatarCircle: {
      width: '35px',
      height: '35px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '0.8rem'
    },
    emailCell: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.9rem'
    },
    statusBadge: {
      padding: '0.4rem 0.8rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 500,
      backgroundColor: '#0d6efd',
      color: 'white'
    },
    badgeCount: {
      animation: 'pulse 2s infinite'
    },
    retourBtn: {
      borderRadius: '25px',
      padding: '0.5rem 1.5rem',
      fontWeight: 500,
      transition: 'all 0.3s ease',
      border: '2px solid #0d6efd',
      color: '#0d6efd',
      backgroundColor: 'transparent'
    },
    retourBtnHover: {
      backgroundColor: '#0d6efd',
      color: 'white',
      transform: 'translateX(-3px)'
    }
  };

  // Gestion du survol des lignes
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <>
      {/* Styles inline */}
      <style>
        {`
          .table-container::-webkit-scrollbar {
            width: 6px;
          }
          .table-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .table-container::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
            border-radius: 10px;
          }
          .table-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #0b5ed7 0%, #084298 100%);
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .badge-pulse {
            animation: pulse 2s infinite;
          }
          @media (max-width: 768px) {
            .table-header th {
              font-size: 0.8rem;
              padding: 0.75rem 0.5rem;
            }
            .table-row td {
              padding: 0.75rem 0.5rem;
              font-size: 0.9rem;
            }
            .card-header-custom h2 {
              font-size: 1.5rem;
            }
          }
        `}
      </style>

      <Container className="mt-4">
        {/* Bouton Retour */}
        <div className="d-flex justify-content-start mb-3">
          <Button 
            variant="outline-primary" 
            onClick={handleRetour}
            style={styles.retourBtn}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0d6efd';
              e.target.style.color = 'white';
              e.target.style.transform = 'translateX(-3px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#0d6efd';
              e.target.style.transform = '';
            }}
          >
            ← Retour
          </Button>
        </div>

        <Card style={styles.metierCard}>
          <Card.Header style={styles.cardHeaderCustom}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-0 text-white">📊 {metierNom}</h2>
                <p className="mb-0 mt-1 text-light opacity-85">
                  Gestion des apprenants
                </p>
              </div>
              <div style={styles.badgeCount}>
                <span className="badge bg-white text-primary fs-6 badge-pulse">
                  {apprenants.length} apprenant(s)
                </span>
              </div>
            </div>
          </Card.Header>
          
          <Card.Body style={styles.cardBodyCustom}>
            <div className="table-container" style={styles.tableContainer}>
              <h5 className="px-4 pt-4 mb-3 text-primary">
                📋 Liste des apprenants
              </h5>
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-3 text-primary">Chargement des apprenants...</p>
                </div>
              ) : apprenants.length === 0 ? (
                <Alert variant="primary" className="mx-4 border-primary">
                  <div className="text-center">
                    <span className="fs-1 text-primary mb-3">👥</span>
                    <h5 className="text-primary">Aucun apprenant inscrit</h5>
                    <p className="mb-0 text-primary">
                      Aucun apprenant n'est actuellement inscrit dans ce métier.
                    </p>
                  </div>
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={styles.tableHeader}>
                      <tr>
                        <th style={{...styles.tableHeaderTh, paddingLeft: '2rem'}}>Année</th>
                        <th style={styles.tableHeaderTh}>Nom</th>
                        <th style={styles.tableHeaderTh}>Prénom</th>
                        <th style={styles.tableHeaderTh}>Email</th>
                        <th style={{...styles.tableHeaderTh, textAlign: 'center'}}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apprenants.map((apprenant, index) => (
                        <tr 
                          key={apprenant.id || index} 
                          style={{
                            ...styles.tableRow,
                            ...(hoveredRow === index ? styles.tableRowHover : {})
                          }}
                          onMouseEnter={() => setHoveredRow(index)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td style={{
                            ...styles.tableTd, 
                            paddingLeft: '2rem', 
                            fontWeight: 'bold', 
                            color: '#0d6efd'
                          }}>
                            {apprenant.annee || apprenant.annee_scolaire || 'N/A'}
                          </td>
                          <td style={styles.tableTd}>
                            <div className="d-flex align-items-center">
                              <div style={styles.avatarCircle}>
                                {apprenant.nom?.charAt(0) || apprenant.prenom?.charAt(0) || 'A'}
                              </div>
                              <span className="ms-3 text-dark">
                                {apprenant.nom || apprenant.user?.nom || apprenant.name?.split(' ')[0] || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td style={{...styles.tableTd, fontWeight: 500, color: '#212529'}}>
                            {apprenant.prenom || apprenant.user?.prenom || apprenant.name?.split(' ')[1] || 'N/A'}
                          </td>
                          <td style={styles.tableTd}>
                            <div style={styles.emailCell}>
                              <span className="me-2 text-primary">📧</span>
                              <span className="text-dark">
                                {apprenant.email || apprenant.user?.email || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td style={{...styles.tableTd, textAlign: 'center'}}>
                            <span className="badge" style={styles.statusBadge}>
                              Actif
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Card.Body>
          
          <Card.Footer style={styles.cardFooterCustom}>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-primary">
                Dernière mise à jour: {new Date().toLocaleDateString()}
              </small>
              <small className="text-primary fw-bold">
                Total: {apprenants.length} apprenant(s)
              </small>
            </div>
          </Card.Footer>
        </Card>
      </Container>
    </>
  );
}

export default MetierPage;