const express = require('express');
const module = {};

module.exports = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'unauthorized', message: 'x-api-key header required' });
  }
  req.apiKey = apiKey;
  next();
};
