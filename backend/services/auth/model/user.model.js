import mongoose from "mongoose";

const userSchema =
new mongoose.Schema({

   firebaseUid:{
      type:String,
      required:true,
      unique:true
   },

   name:String,

   email:{
      type:String,
      required:true,
      unique:true
   },


    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    interviewCoin:{
      type:Number,
      default:150
   }

},{
   timestamps:true
});

 const User =
mongoose.model(
   "User",
   userSchema
);

export default User;