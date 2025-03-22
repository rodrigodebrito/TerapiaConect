/**
 * Rotas de autenticação
 */

const express = require('express');
const { validateRefreshToken } = require('../middleware/auth.middleware');
const { login, refreshToken, register } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @route POST /login
 * @desc Autenticar usuário e retornar token
 * @access Público
 */
router.post('/', login);

/**
 * @route POST /login/refresh
 * @desc Atualizar token de acesso usando refresh token
 * @access Público
 */
router.post('/refresh', validateRefreshToken, refreshToken);

/**
 * @route POST /login/register
 * @desc Registrar um novo usuário
 * @access Público
 */
router.post('/register', register);

module.exports = router; 