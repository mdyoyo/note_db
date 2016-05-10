var express=require('express');
var path=require('path');
var bodyParser=require('body-parser');
var crypto=require('crypto');
var session=require('express-session');

var models=require('./models/models');
var moment=require('moment');

var Note=models.Note;

var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'mynode',
  password: '123456',
  database: 'mynode'
});

connection.connect();


//创建express实例
var app=express();
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

  //定义静态文件目录
  app.use(express.static(path.join(__dirname,'public')));

  //定义数据解析器
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended:true}));

  //建立sesson模型
  app.use(session({
    secret:'1234',
    name:'myNote',
    cookie:{maxAge:1000*60*20},
    resave:false,
    saveUninitialized:true
  }));


app.use(function(req, res, next){
  res.locals.user = req.session.user;
  var err = req.session.error;
  delete req.session.error;
  res.locals.message = '';
   res.locals.message1 = '';
  if (err==="用户不存在"||err==="密码错误") res.locals.message = '<div class="alert alert-error">' + err + '</div>';
  else{
 
  if (err) res.locals.message1 = '<div class="alert alert-error">' + err + '</div>';
  }
  next();
});

  //响应首页get请求
  app.get('/',function(req,res)
  {
  
      res.render('index',{
      user:req.session.user,
      title:'首页'
    });
  	
  });

app.get('/list',function(req,res)
  {

  var value=req.session.user.username;
   console.log(value);
  //connection.connect(function (err) {
  //if (err) throw err;
  var query =  connection.query('SELECT * FROM note where author=?',value, function (err, ret) {
    if (err) {
    console.log(err);
    return res.redirect('/');
  }
  res.render('list1',{
      user:req.session.user,
      notes:ret,
      isMysql:1,
      title:'笔记'
    });
   //connection.end();
// });
});

  });

  app.get('/login',function(req,res)
  {
    console.log('登录');
    res.render('login',{
      user:req.session.user,
      title:'登录',
      message:'',
      err:''
    });
  });

  app.post('/login',function(req,res)
  {
    var username=req.body.username,
     password=req.body.password;
   
    var value=username;

   // connection.connect(function (err) {
  //if (err) throw err;
    var query =  connection.query('SELECT * FROM users where username=?',value, function (err, ret) {
      res.locals.user = req.session.user;
    if (err) {
    console.log(err);
    return res.redirect('/');
  }

    if(ret.length==0)
    {
       console.log('用户不存在');
        req.session.error='用户不存在';
      return res.redirect('/');
    }
    console.log(ret[0].password+" password");
     var md5=crypto.createHash('md5');
      md5password=md5.update(password).digest('hex');
      if(ret[0].password!==md5password)
      {
        console.log("密码错误！");
        
        req.session.error='密码错误';
        //var err=req.session.error;
        //res.locals.message = '<div class="alert alert-error">' + err + '</div>';
         return res.redirect('/');
      }
      else
      {
      console.log('登录成功！');
      ret[0].password=null;
      delete ret[0].password;
      req.session.user=ret[0];
      console.log(ret[0]+" ret0");
       return res.redirect('/list');
       }
       // connection.end();
  //});
  });

  });

  app.post('/register',function(req,res)
  {
    res.locals.user = req.session.user;
   var username=req.body.username,
   password=req.body.password,
   passwordRepeat=req.body.passwordRepeat;

   if(username.trim().length==0)
   {
    console.log("用户名不能为空！");
    req.session.error='用户名不能为空！';
    return res.redirect('/');
  }
  if(password.trim().length==0||passwordRepeat.trim().length==0)
  {
    console.log("密码不能为空！");
    req.session.error='密码不能为空!';
    return res.redirect('/');
  }
  if(password!=passwordRepeat)
  {
    console.log("两次输入密码不一致！");
    req.session.error='两次输入密码不一致！';
    return res.redirect('/');
  }

 //connection.connect(function (err) {
  //if (err) throw err;
  var value=username;
  var query =  connection.query('SELECT * FROM users where username=?',value, function (err, ret) {
    if (err) {
    console.log(err);
    return res.redirect('/');
  }
  if(ret)
  {
    console.log('用户名已经存在');
      req.session.error='用户已经存在';
     
    return res.redirect('/');
  }
 // connection.end();
//});
});
  
var md5=crypto.createHash('md5');
  md5password=md5.update(password).digest('hex');
 
 var  userAddSql = 'INSERT INTO users(username,password) VALUES(?,?)';
 var  userAddSql_Params = [username, md5password];
//connection.connect(function (err) {
 // if (err) throw err;
connection.query(userAddSql,userAddSql_Params,function (err, result) {
        if(err){
         console.log('[INSERT ERROR] - ',err.message);
           return res.redirect('/');
        }       
       console.log('-------INSERT----------');
       //console.log('INSERT ID:',result.insertId);       
       console.log('INSERT ID:',result);       
       console.log('#######################'); 
        console.log('注册成功!');
        
    
    // connection.end();
//});/
});
return res.redirect('/');

  
});



app.get('/register',function(req,res)
{

 console.log('注册!');
 res.render('register',{
  user:req.session.user,
  title:'注册',
  err:''
});
});
app.get('/post',function(req,res)
{

 console.log('发布!');
 res.render('post',{
   user:req.session.user,
  title:'发布'
});
});
app.post('/post',function(req,res)
{
 
var  noteAddSql = 'INSERT INTO note(title,author,tag,content) VALUES(?,?,?,?)';
var noteAddSql_Params = [req.body.title, req.session.user.username,req.body.tag,req.body.content];
//connection.connect(function (err) {
 // if (err) throw err;
connection.query(noteAddSql,noteAddSql_Params,function (err, result) {
        if(err){
         console.log('[INSERT ERROR] - ',err.message);
           return res.redirect('/post');
        }       
       console.log('-------INSERT----------');
       //console.log('INSERT ID:',result.insertId);       
       console.log('INSERT ID:',result);       
       console.log('#######################'); 
        console.log('插入成功!');
        
    return res.redirect('/list');
   

//});
});
});
app.get('/quit',function(req,res)
{
  req.session.user=null;
 console.log('退出!');
 return res.redirect('/login');
});

app.get('/detail/:_id',function(req,res)
{
  if (req.params._id === 'favicon.ico') {
    //res.writeHead(404, {});
    return res.redirect('/list');
}
 console.log('查看笔记!'+req.params._id);

//connection.connect(function (err) {
  //if (err) throw err;
   var value=req.params._id;
  var query =  connection.query('SELECT * FROM note where id=?',value, function (err, ret) {
    if (err) {
    console.log(err);
    return res.redirect('/');
  }
  if(ret)
  {
    res.render('detail',{
   user:req.session.user,
   title:'笔记详情',
   art:ret[0],
   moment:moment
  });
  }
//connection.end();
//});
});
  
 
});

app.get('/delete/:_id',function(req,res)
{
 console.log('删除笔记!'+req.params._id);

//connection.connect(function (err) {
//  if (err) throw err;
 var  value =req.params._id;
//ɾ
connection.query('DELETE FROM note WHERE id = ?',value,function (err, result) {
        if(err){
          console.log('[DELETE ERROR] - ',err.message);
          return res.redirect('/list');
        }       
 
       return res.redirect('/list');
//connection.end();
//});
});
 
});

app.post('/edit',function(req,res)
{
 console.log("edit"+req.body.content);
 // var id=req.body.id;
  console.log(req.body.id+"idid");
//connection.connect(function (err) {
 // if (err) throw err;
  var noteModSql = 'UPDATE note SET content = ? WHERE id = ?';
var noteModSql_Params = [req.body.content,req.body.id];
//改 up
connection.query(noteModSql,noteModSql_Params,function (err, result) {
   if(err){
         console.log('[UPDATE ERROR] - ',err.message);
         return;
   }       
  console.log('----------UPDATE-------------');
  console.log('UPDATE affectedRows',result.affectedRows);
   return res.redirect('/list'); 
  console.log('******************************');
//connection.end();
//});
 
});
 
});

app.get('/checkUsername_register',function(req,res,next){   
 console.log('查看是否重名');  
   var username = req.query.username_r;    
   console.log(username);
  // connection.connect(function (err) {
  //if (err) throw err;
   var value=username;
  var query =  connection.query('SELECT * FROM users where username=?',value, function (err, ret) {
    if (err) {
    console.log(err);
    return res.redirect('/');
  }
     console.log(ret);
    var already_exist = false;   
    var msg = "恭喜，用户名可用";  
  if(ret.length!=0)
  {
    console.log('用户名已经存在');
      already_exist = true;   
             msg = "用户名已存在，请修改";//  
  }

   res.send({"status":already_exist,"msg":msg});
    
//});

 });

});

app.get('/checkUsername_login',function(req,res,next){   
 console.log('查看是否存在用户');  
   var username = req.query.username_r;    
   console.log(username); 
 //connection.connect(function (err) {
 // if (err) throw err;
  var value=username;
  var query =  connection.query('SELECT * FROM users where username=?',value, function (err, ret) {
    if (err) {
    console.log(err);
    return res.redirect('/');
  }

    var already_exist = true;   
     var msg = "恭喜，用户名可用";     
  if(ret.length==0)
  {
    console.log('用户名不存在');
      already_exist = false;   
         msg = "用户名不存在,请重新输入";//      
               //return res.redirect('/'); //   
  }

   res.send({"status":already_exist,"msg":msg});
    
//});  

 });
});
//监听3000端口
app.listen(3000,function(req,res)
{
	console.log('app is running at port 3000');

});
