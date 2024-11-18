const axios = require("axios");

// VAT validation function using an external API
const validateVAT = async (vatNumber) => {
  try {
    // Replace this URL with an actual VAT validation API endpoint
    const response = await axios.get(
      `https://api.vatcheckapi.com/v2/check?vat_number=LU26375245&apikey=${process.env.VAT_API_KEY}`,
      {
        headers: { Authorization: `Bearer ${process.env.VAT_API_KEY}` },
      }
    );

    return response.data.isValid; // Assuming the API returns { isValid: true/false }
  } catch (error) {
    console.error("VAT validation error:", error.message);
    return false;
  }
};

module.exports = validateVAT;
