const generateToken = require("../config/generateToken");
const User = require("../modals/userModel");

const registerUser = async(req,res) => {
    const {name,email,password,pic} = req.body;

    if(!name || !email || !password) {
        res.status(400);
        res.json({ success: false, message: 'Please Enter All the Fields' });

    }
    const userExists = await User.findOne({email})
    
    if(userExists) {
        res.status(400);
        res.json({ success: false, message: 'User Already Exist' });
    }else{

        
        const user = await User.create({
        name,
        email,
        password,
        pic
    })
    
    if(user) {
        res.status(201).json({
            _id: user._id,
            name:user.name,
            email:user.email,
            pic:user.pic,
            token: generateToken(user._id)
        })
    } else{
        res.status(401);
        res.json({ success: false, message: 'User Not Found' });
    }
}
}

const authUser = async (req,res) => {
    const {email,password} = req.body;

    const user = await User.findOne({email});

    if(user && (await user.matchPassword(password))){
        res.json({
            _id: user._id,
            name:user.name,
            email:user.email,
            pic:user.pic,
            token: generateToken(user._id)
        });
    }else{
        res.status(401);
        res.json({ success: false, message: 'Invalid UserName or Password😔' });
    }
}

const allUsers = async (req,res) => {
    const keyword = req.query.search ? {
        $or:[
            { name: {$regex: req.query.search, $options: "i"}},
            { email: {$regex: req.query.search, $options: "i"}},
        ],
    }
    : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id }})
    res.send(users)

    console.log(keyword);
}

module.exports = {registerUser,authUser,allUsers}