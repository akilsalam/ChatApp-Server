const Chat = require("../modals/chatModel");
const User = require("../modals/userModel");

const accessChat = async (req,res) => {
    const {userId} = req.body;

    if(!userId){
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            {users: { $elemMatch: { $eq: req.user._id } } },
            { users: {$elemMatch: {$eq: userId} } },
        ],
    }).populate("users", "-password")
        .populate("latestMessage");

        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "name pic email",
        });

        if (isChat.length > 0){
            res.send(isChat[0]);
        }
        else{
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            try{
                const createdChat = await Chat.create(chatData);

                const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                    "users",
                    "-password"
                );
                res.status(200).send(FullChat);
            }
            catch(error){
                res.status(400);
                throw new Error(error.message);
            }
        }
}

const fetchChats = async (req,res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user?._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({updatedAt: -1})
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name pic email",
                });

                res.status(200).send(results);
            })
        }
            catch(error){
                res.status(400);
                throw new Error(error.message);
            }
}

const createGroupChat = async (req, res) => {
    // Check if required fields are present in the request body
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all the fields" });
    }

    // Parse the users array from the request body
    const users = JSON.parse(req.body.users);

    // Check if there are at least two users
    if (users.length < 2) {
        return res.status(400).send("More than 2 users are required to form a group chat");
    }

    // Add the current user to the users array
    users.push(req.user);

    try {
        // Find the group chat with the specified name and users
        let groupChat = await Chat.findOne({
            chatName: req.body.name,
            users: { $all: users }, // Match all users in the array
            isGroupChat: true,
            groupAdmin: req.user,
        });

        // If group chat not found, create a new one
        if (!groupChat) {
            const chatData = {
                chatName: req.body.name,
                isGroupChat: true,
                users: users,
                groupAdmin: req.user,
            };
            groupChat = await Chat.create(chatData);
        }

        // Populate and send the response
        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");
        res.status(200).json(fullGroupChat);
    } catch (error) {
        // Handle errors
        console.error("Error in createGroupChat:", error);
        res.status(500).send("Internal Server Error");
    }
};

const renameGroup = async (req,res) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName,
        },
        {
            new:true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat Not Found")
    }
    else{
        res.json(updatedChat);
    }
};

const addToGroup = async (req,res) => {
    const {chatId, userId} = req.body;

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId },
        },
        {
            new:true
        }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")

    if(!added){
        res.status(404)
        throw new Error("Chat Not Found")
    }
    else{
        res.json(added)
    }
}

const removeFromGroup = async (req,res) => {
    const {chatId, userId} = req.body;

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId },
        },
        {
            new:true
        }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")

    if(!removed){
        res.status(404)
        throw new Error("Chat Not Found")
    }
    else{
        res.json(removed)
    }
}

module.exports = {accessChat,fetchChats,createGroupChat,renameGroup,addToGroup,removeFromGroup}