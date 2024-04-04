const Chat = require('../modals/chatModel');
const Message = require('../modals/messageModel');
const User = require('../modals/userModel');

const sendMessage = async (req, res) => {
    const { content, chatId, isImage } = req.body;

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
        isImage: isImage ? true : false, // Optionally, store whether it's an image
    };

    try {
        var message = await Message.create(newMessage);
        console.log("hello");
        message = await message.populate("sender","name pic");
        message = await message.populate("chat");
        message = await User.populate(message,{
            path: 'chat.users',
            select: "name pic email",
        })

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage:message,
        })

        res.json(message);


    } catch (error) {
        throw new Error(error.message);
    }

}


const allMessages = async (req,res) => {

    try {
        const messages = await Message.find({chat: req.params.chatId})
        .populate("sender","name pic email")
        .populate("chat");

        res.json(messages);
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
};

const editMessage = async (req, res) => {
    const { messageId } = req.params;

    try {
        // Find the message by ID and update its content
        const message = await Message.findByIdAndUpdate(
            messageId,
            { content: "This Message was Deleted" },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



module.exports = { sendMessage,allMessages,editMessage };
