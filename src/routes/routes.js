const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');

router.get('/', (req, res) => {
    res.render('login');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

router.post(
    '/register',
    authController.register
);

router.post(
    '/login',
    authController.login
)

module.exports = router;