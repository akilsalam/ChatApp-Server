const express = require('express');
const { registerUser, authUser, allUsers } = require('../Contollers/userController');
const { protect } = require('../middleware/authMiddileware');

const router = express.Router()

router.route('/').post(registerUser).get(protect,allUsers)
router.post('/login',authUser)

module.exports = router;