const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors');
const connectDB = require("./config/db");
const userRoutes = require("./Routes/userRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddileware");
const path = require('path')

const app = express();
dotenv.config();
connectDB();
app.use(cors());
app.use(express.json());


app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// ----Deployment-----//

const __dirname1 = path.resolve();
if(process.env.NODE_ENV === 'production') {

    app.use(express.static(path.join(__dirname1,"../frontend/build")));

    app.get('*',(req,res)=> {
        res.sendFile(path.resolve(__dirname1,"frontend","build","index.html"));
    })
}else{
    app.get("/", (req,res) => {
        res.send("API is Running");
    });
}

// ----Deployment-----//


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server started running on ${PORT}`);
});

const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:3000",
    },
});

const onlineUsers = [{}];

io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        console.log("User connected:", userData.name);
        socket.emit("connected");
        if (!onlineUsers.some(user => user._id === userData._id)) {
            onlineUsers.push(userData);
        }
        io.emit('user online', onlineUsers);
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log("User Joined Room:", room);
    });

    socket.on('typing', (room) => socket.in(room).emit("typing"));
    socket.on('stop typing', (room) => socket.in(room).emit("stop typing"));

    socket.on('new message', (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach(user => {
            if (user._id == newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived);
        });
    });

    

    socket.on("disconnect", () => {
        console.log("User disconnected");
        // Leave the room based on userData._id
        onlineUsers.forEach(user => {
            if (user.socketId === socket.id) {
                socket.leave(user._id);
            }
        });
        // Remove the user from onlineUsers array
        onlineUsers.splice(onlineUsers.findIndex(user => user.socketId === socket.id), 1);
        io.emit('user online', onlineUsers);
    });
});
