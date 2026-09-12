const { initializeApp } = require("firebase-admin/app");
initializeApp();
exports.revealPhone = require("./phone-reveal").revealPhone;
