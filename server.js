// Charge les variables d'environnement depuis le fichier .env (pour le développement local)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

// --- Configuration CORS ---
// Récupère l'URL du frontend depuis les variables d'environnement
// En production, cette variable sera définie sur Render.
// En développement local, elle peut être définie dans .env ou par défaut à localhost.
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:8080";

// Middleware pour permettre les requêtes cross-origin (CORS)
// Ceci est crucial pour que votre frontend puisse communiquer avec ce backend
app.use(cors({
  origin: allowedOrigin, // Autorise uniquement l'origine spécifiée
  optionsSuccessStatus: 200 // Pour la compatibilité des anciens navigateurs
}));

// Middleware pour parser les corps de requête JSON
app.use(express.json());

// Middleware pour servir les fichiers statiques (si vous avez un dossier 'public' pour votre frontend)
// Cette ligne est généralement utile si votre backend sert aussi le frontend.
// Dans votre cas, avec Vercel pour le frontend, cette ligne est moins critique ici.
app.use(express.static(path.join(__dirname, "public")));

// Route POST pour initier un paiement via PayTech
app.post("/api/pay", async (req, res) => {
  try {
    // Extrait le montant, le nom du client et le téléphone du corps de la requête
    const { amount, clientName, clientPhone } = req.body;

    // Validation basique du montant
    if (!amount || amount < 100) {
      return res.status(400).json({
        message: "Le montant doit être supérieur ou égal à 100 FCFA.",
      });
    }

    // Payload de la requête à l'API PayTech
    const paytechPayload = {
      item_name: "Commande de la boutique", // Nom de l'article ou de la commande
      item_price: amount, // Montant du paiement
      currency: "XOF", // Devise (Franc CFA)
      ref_command: `CMD-${Date.now()}`, // Référence unique pour la commande
      command_name: "Paiement boutique", // Nom de la commande affiché à l'utilisateur
      env: "test", // Environnement de PayTech : "test" pour le développement, "prod" pour la production

      // IMPORTANT : Ces URLs sont maintenant récupérées depuis les variables d'environnement !
      // ipn_url: URL pour les notifications de paiement instantanées de PayTech (nécessite un endpoint sur votre serveur)
      ipn_url: process.env.IPN_URL, // Doit être une URL accessible publiquement
      // success_url: URL vers laquelle l'utilisateur sera redirigé après un paiement réussi
      success_url: process.env.SUCCESS_URL, // L'URL de votre frontend Vercel pour la page de succès
      // cancel_url: URL vers laquelle l'utilisateur sera redirigé s'il annule le paiement
      cancel_url: process.env.CANCEL_URL, // L'URL de votre frontend Vercel pour la page d'annulation

      // Champ personnalisé pour stocker des informations supplémentaires
      custom_field: JSON.stringify({
        client_name: clientName || "Client inconnu",
        client_phone: clientPhone || "0000000000",
      }),
    };

    // En-têtes de la requête, incluant les clés API PayTech
    const headers = {
      "Content-Type": "application/json",
      // Les clés API sont récupérées depuis les variables d'environnement (fichier .env ou Render)
      API_KEY: process.env.PAYTECH_API_KEY,
      API_SECRET: process.env.PAYTECH_API_SECRET,
    };

    // Envoie la requête POST à l'API de demande de paiement de PayTech
    const response = await axios.post(
      "https://paytech.sn/api/payment/request-payment",
      paytechPayload,
      { headers }
    );

    // Log la réponse de PayTech en cas de succès
    console.log("✅ Paiement initié :", response.data);

    // Renvoie l'URL de redirection de PayTech au frontend
    res.json({ redirect_url: response.data.redirect_url });
  } catch (error) {
    // Gestion des erreurs
    console.error("❌ Erreur dans /api/pay :", error.message);
    if (error.response) {
      // Si l'erreur provient de la réponse de PayTech
      console.error("Détails PayTech:", error.response.data);
      return res.status(500).json({
        message: "Erreur PayTech",
        error: error.response.data,
      });
    }
    // Erreur générale du serveur
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// Définit le port d'écoute du serveur
const PORT = process.env.PORT || 3001; // Utilise la variable d'environnement PORT (fournie par Render) ou 3001 par défaut
// Démarre le serveur et écoute sur toutes les interfaces réseau (0.0.0.0)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur démarré sur http://0.0.0.0:${PORT}`);
});
