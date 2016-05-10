/**
 * Created by chen on 16/4/2.
 */
var moment = require('moment');
var Note = require('./../models/Note.js');
//分页
exports.ret_note = function(req, res) {
    console.log("in ret_note");
    var search={author:req.session.user.username};
    var page={limit:5,num:1};//每页限制5条记录，查询的页面为num
    //查看哪页
    if(req.query.p){
        page['num']=req.query.p<1 ? 1 : req.query.p;
    }
    var model = {
        search:search,
        columns:'title author tag content createTime',
        page:page
    };
    Note.findPagination(model,function(err, pageCount, list){
        page['pageCount']=pageCount;
        page['size']=list.length;
        page['numberOf']=pageCount>5?5:pageCount;//分页用几个标签显示
        var is_null = false;
        if(list == null){
            is_null = true;
        }
        return res.render('list', {
            user:req.session.user,
            title:'笔记列表',
            is_null:is_null,
            notes:list,
            moment:moment,
            page:page
        });
    });

};