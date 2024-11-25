const axios = require("axios");
const Admin = require("../models/admin.model");

// VAT validation function using an external API
const validateVAT = async (vatNumber) => {
  try {
    // Replace this URL with an actual VAT validation API endpoint
    // const response = await axios.get(
    //   `https://api.vatcheckapi.com/v2/check?vat_number=LU26375245&apikey=${process.env.VAT_API_KEY}`,
    //   {
    //     headers: { Authorization: `Bearer ${process.env.VAT_API_KEY}` },
    //   }
    // );

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function () {
      console.log(this.responseText);
    });
    oReq.open(
      "GET",
      `https://api.vatcheckapi.com/v2/check?vat_number=LU26375245&apikey=${process.env.VAT_API_KEY}`
    );
    oReq.send();

    // return response.data.isValid; // Assuming the API returns { isValid: true/false }
  } catch (error) {
    console.error("VAT validation error:", error.message);
    return false;
  }
};

module.exports = validateVAT;
