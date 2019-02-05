const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/demo', (req, res) => res.end('OK'));