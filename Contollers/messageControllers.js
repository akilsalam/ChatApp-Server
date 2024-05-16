const Chat = require('../modals/chatModel');
const Message = require('../modals/messageModel');
const User = require('../modals/userModel');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const upload = multer();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const sendMessage = async (req, res) => {
    try {
        const { content, chatId, isImage } = req.body;
        const file = req.files; 

        console.log("content", content);
        console.log("chatId", chatId);
        console.log("image", isImage);
        console.log("file", file); 

        if ((!content && !isImage) || !chatId) {
            console.log("Invalid data passed into request");
            return res.status(400).json({ error: "Invalid data passed into request" });
        }

        const newMessage = {
            sender: req.user._id,
            content: content || "",
            chat: chatId,
            isImage: !!isImage,
        };

        if (newMessage.isImage) {
            const uploadedFile = req.files.content; 

            const params = {
              Bucket: process.env.AWS_BUCKET,
              Key: uploadedFile.name, 
              Body: uploadedFile.data, 
              ACL: 'public-read',
            };
            

            try {
                const s3Response = await s3.upload(params).promise();
                newMessage.content = uploadedFile.name;
                console.log('Uploaded image successfully to S3.');
            } catch (error) {
                console.error("Error uploading image:", error);
                // Handle upload error appropriately (e.g., return error to client)
                return res.status(500).json({ error: "Failed to upload image" });
            }
        } else {
            console.warn("No image uploaded"); // Log if no image is uploaded
        }

        // Create message in the database with minimal population
        const message = await Message.create(newMessage);
        const populatedMessage = await Message.populate(message, { path: "sender", select: "name pic" });

        // Respond with the message
        res.json(populatedMessage);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
};

  
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
