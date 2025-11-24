const lodash = require('lodash');
const axios = require('axios');
const express = require('express');

// This file uses lodash, axios, and express
// So they should be marked as "used" by the analyzer

const app = express();

app.get('/', (req, res) => {
  const data = lodash.chunk([1, 2, 3, 4], 2);
  res.json({ message: 'Hello', data });
});

console.log('Demo app uses lodash, axios, express');
