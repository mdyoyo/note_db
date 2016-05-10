/**
 * Created by chen on 16/3/29.
 */
//加载依赖库
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session');
var moment = require('moment');

var checkLogin = require('./checkLogin.js');
var note = require('./routes/note.js');

//引入mongoose
var mongoose = require('mongoose');
//引入模型
var models = require('./models/models');
//使用mongoose连接服务
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error',console.error.bind(console,'连接数据库失败'));

//创建express实例
var app = express();


//定义EJS模板引擎和模板文件位置，用__dirname变量获取当前模块文件所在目录的完整绝对路径
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname,'public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//建立session模型
app.use(session({
    secret:'1234',
    name:'mynote',
    cookie:{maxAge:1000*60*20},//设置session的保存时间为20分钟
    resave:false,
    saveUnintialized:true
}));

var User = models.User;
var Note = models.Note;

//响应首页get请求
//app.get('/',checkLogin.noLogin);
app.get('/',function(req,res){
    res.render('index',{
        user:req.session.user,//需要处理一下！！未登录！！
    });
});

//查看笔记详情
app.get('/detail/:_id',function(req,res){
    console.log('查看笔记！');

    Note.findOne({_id: req.params._id}).exec(function(err,art){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(art){
            //var tagString = art.tag;
            //var tags = tagString.split('×');
            //console.log(tags);
            res.render('detail',{
                title:'笔记详情',
                user: req.session.user,
                art: art,
                moment: moment
            });
        }
    });
});
//编辑笔记详情
app.get('/post_update/:_id',function(req,res){
    console.log('编辑笔记！');
    Note.findOne({_id: req.params._id}).exec(function(err,art){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(art){
            res.render('post_update',{
                title:'编辑笔记详情',
                user: req.session.user,
                art: art,
                moment: moment
            });
        }
    });
});
/**
 * 根据id删除日记
 */
app.get('/delete/:_id',function(req,res){
    console.log("删除笔记！");
    Note.findOne({_id:req.params._id})
        .exec(function(err,art){
            if(err) {
                console.log(err);
                return res.redirect('/home');
            }
            if(art) {
                Note.remove({_id:art._id},function(err,result){
                    if(err) {
                        console.log(err);
                    }
                    else{
                        console.log("删除成功"+result +err);
                    }
                    return res.redirect('/list');
                });
            }
        });
});
//响应发布页面post请求
app.post('/post_update/:_id',function(req,res) {
    Note.findOne({_id: req.params._id}).exec(function(err,art){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(art){
            art.title = req.body.title;
            art.tag=req.body.tag;
            art.content=req.body.content;
            art.save(function(err,doc){
                if(err){
                    console.log(err);
                    return res.redirect('/list');
                }
                console.log("修改成功");
                res.render('detail', {
                    user:req.session.user,
                    title: '笔记详情',
                    art:art,
                    moment:moment
                });
            });
        }
    });
});
app.get('/register',checkLogin.alreadyLogin);
//响应注册页面get请求
app.get('/register',function(req,res) {
    console.log('注册！');
    res.render('register',{
        user:req.session.user,
        title:'注册'
    });
});

//响应注册页面post请求
app.post('/register',function(req,res){
    //req.body可以获取到表单的每项数据
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;
    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err);
            return res.redirect('/register');
        }
        if(user){
            console.log('用户名已经存在');
            return res.send({msg:'用户名已存在'});
        }
        //对密码进行MD5加密
        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');
        //新建User对象用于保存数据
        var newUser = new User({
            username:username,
            password:md5password
        });
        newUser.save(function(err,doc){
            if(err){
                console.log(err);
                return res.redirect('/register');
            }
            console.log('注册成功！');
            return res.redirect('/login');
        });
    });
});
app.get('/login',checkLogin.alreadyLogin);
//响应登录页面get请求
app.get('/login',function(req,res) {
    console.log('登录！');
    res.render('login',{
        user:req.session.user,
        title:'登录'
    });
});

//post请求
app.post('/login',function(req,res){
    //req.body可以获取到表单的每项数据
    var username = req.body.username,
        password = req.body.password;

    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err);
            return res.redirect('/login');
        }
        if(!user){
            console.log('用户不存在！');
            return res.redirect('/login');
        }

        //对密码进行MD5加密
        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');
        if(user.password !== md5password){
            console.log('密码错误！');
            return res.redirect('/login');
        }
        console.log('登录成功！');
        user.password = null;
        delete user.password;
        req.session.user = user;
        return res.redirect('/');
    });
});

//退出
app.get('/quit',function(req,res) {
    req.session.user = null;
    console.log('退出！');
    return res.redirect('/mylogin');
});

//响应发布页面get请求
app.get('/post',function(req,res) {
    console.log('发布！');
    res.render('post',{
        user:req.session.user,
        title:'发布'
    });
});

//响应发布页面post请求
app.post('/post',function(req,res) {
    var note = new Note({
        title:req.body.title,
        author:req.session.user.username,
        tag:req.body.tag,
        content:req.body.content
    });
    note.save(function(err,doc){
        if(err){
            console.log(err);
            return res.redirect('/post');
        }
        console.log('文章发表成功！');
        return res.redirect('/list');
    });
});

app.get('/detail',function(req,res) {
    console.log('查看笔记！');
    res.render('detail',{
        user:req.session.user,
        title:'查看笔记'
    });
});

app.get('/hi',function(req,res) {
    console.log('查看笔记！');
    res.render('hi',{
        user:req.session.user
//        title:'查看笔记'
    });
});

app.get('/jsonp',function(req,res,next){
    res.jsonp({status:'jsonp'});
});

app.get('/json',function(req,res,next){
    var x = req.query.usernameXXX;
    console.log(x);
    res.send({status:'json',x:"hi"});
});
app.get('/check_login',function(req,res,next){
    console.log('检查登录');
    var username = req.query.uname;
    var password = req.query.pwd;
    console.log(username +" "+password);
    var status = false;
    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err);
            return res.redirect('/mylogin');
        }
        if(!user){
            console.log('用户不存在！');
            status = false;
        }
        else{
            //对密码进行MD5加密
            var md5 = crypto.createHash('md5'),
                md5password = md5.update(password).digest('hex');
            if(user.password !== md5password){
                console.log('密码错误！');
                status = false;
            }else{
                console.log('登录成功！');
                status = true;
                user.password = null;
                delete user.password;
                req.session.user = user;
            }
        }
        res.send({"status":status});
    });
});
app.get('/checkUsername_register',function(req,res,next){
    console.log('查看是否重名');
    var username = req.query.username_r;
    console.log(username);
    User.findOne({username:username},function(err,user){
        if (err) {
            console.log(err);
            return res.redirect('/myregister');
        }
        var already_exist = false;
        var msg = "恭喜，用户名可用";
        if (user) {
            console.log('用户名已经存在');
            already_exist = true;
            msg = "用户名已存在，请修改";
        }
        res.send({"status":already_exist,"msg":msg});
    });
});
app.get('/list',checkLogin.noLogin);
app.get('/list',note.ret_note);

app.get('/my_publish',checkLogin.noLogin);
app.get('/my_publish',function(req,res) {
    console.log('发表笔记！');
    res.render('my_publish',{
        user:req.session.user
    });
});
app.get('/publishDiary',function(req,res){
    console.log("my发表日记");
    var title = req.query.title_value;
    console.log('title= '+ title);
    var tags = req.query.tags_value;
    console.log('tags= '+ tags);
    var content = req.query.content_value;
    console.log('content= '+ content);

    var note = new Note({
        title:title,
        author:req.session.user.username,
        tag:tags,
        content:content
    });
    note.save(function(err,doc){
        if(err){
            console.log(err);
            return res.redirect('/my_publish');
        }
        console.log('文章发表成功！');
        res.send({"status":true});
    });
});
//监听3000端口
app.get('/mylogin',function(req,res) {
    console.log('my登录！');
    res.render('mylogin',{
        user:req.session.user
//        title:'查看笔记'
    });
});
app.get('/myregister',function(req,res) {
    console.log('my注册！');
    res.render('myregister',{
        user:req.session.user
    });
});
//响应注册页面post请求
app.post('/myregister',function(req,res){
    //req.body可以获取到表单的每项数据
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;
    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err);
            return res.redirect('/myregister');
        }
        if(user){
            console.log('用户名已经存在');
            return res.send({msg:'用户名已存在'});
        }
        //对密码进行MD5加密
        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');
        //新建User对象用于保存数据
        var newUser = new User({
            username:username,
            password:md5password
        });
        newUser.save(function(err,doc){
            if(err){
                console.log(err);
                return res.redirect('/myregister');
            }
            console.log('注册成功！');
            return res.redirect('/mylogin');
        });
    });
});
//查看笔记详情
app.get('/my_detail/:_id',function(req,res){
    console.log('my查看笔记！');
    Note.findOne({_id: req.params._id}).exec(function(err,art){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(art){
            var tagString = art.tag;
            var tags = tagString.split('×');
            tags.pop();
            console.log(tags);
            console.log(art.content);
            res.render('my_detail',{
                user: req.session.user,
                art: art,
                moment: moment,
                tags:tags
            });
        }
    });
});
app.listen(3000,function(req,res){
    console.log('app is running at port 3000.');
});