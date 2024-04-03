const express = require('express')
const { protect } = require('../middleware/authMiddileware');
const { sendMessage, allMessages } = require('../Contollers/messageControllers');

const router = express.Router()

router.route('/').post(protect,sendMessage)
router.route('/:chatId').get(protect,allMessages)

module.exports = router;