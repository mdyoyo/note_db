/**
 * Created by chen on 16/4/3.
 */
var mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/notes');

exports.mongoose=mongoose;