const axios = require("axios");

exports.initiatePayment = async (req, res) => {
  try {
    const { amount, clientName, clientPhone } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        message: "Le montant doit être supérieur ou égal à 100 FCFA.",
      });
    }

    const paytechPayload = {
      item_name: "Commande de la boutique",
      item_price: amount,
      currency: "XOF",
      ref_command: `CMD-${Date.now()}`,
      command_name: "Paiement boutique",
      env: "test",
      ipn_url: process.env.IPN_URL,
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL,
      custom_field: JSON.stringify({
        client_name: clientName || "Client inconnu",
        client_phone: clientPhone || "0000000000",
      }),
    };

    const headers = {
      "Content-Type": "application/json",
      API_KEY: process.env.PAYTECH_API_KEY,
      API_SECRET: process.env.PAYTECH_API_SECRET,
    };

    const response = await axios.post(
      "https://paytech.sn/api/payment/request-payment",
      paytechPayload,
      { headers }
    );

    console.log("✅ Paiement initié :", response.data);
    res.json({ redirect_url: response.data.redirect_url });

  } catch (error) {
    console.error("❌ Erreur dans initiatePayment :", error.message);
    if (error.response) {
      console.error("Détails PayTech:", error.response.data);
      return res.status(500).json({
        message: "Erreur PayTech",
        error: error.response.data,
      });
    }
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
