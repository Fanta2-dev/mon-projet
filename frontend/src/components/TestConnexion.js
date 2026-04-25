import axios from "axios";
import { useEffect } from "react";

function TestConnection() {
  useEffect(() => {
    axios
      .get("http://localhost:8000/sanctum/csrf-cookie", {
        withCredentials: true,
      })
      .then(() => {
        console.log("✅ Connecté à Laravel Sanctum !");
      })
      .catch((error) => {
        console.error("❌ Erreur de connexion :", error);
      });
  }, []);

  return <p>Test de connexion...</p>;
}

export default TestConnection;
