/**
 * Created by chen on 16/4/3.
 */
var Note = require('./models').Note;

var NoteDao=function(){};

NoteDao.prototype.findPagination = function(obj,callback) {
    var q=obj.search||{};//查询条件
    var col=obj.columns;//数据返回字段

    var pageNumber=obj.page.num||1;//当前是第几页，如果不存在则默认为第1页
    var resultsPerPage=obj.page.limit||10;//每页多少条记录

    var skipFrom = (pageNumber * resultsPerPage) - resultsPerPage;
    var query = Note.find(q,col).sort('-create_time').skip(skipFrom).limit(resultsPerPage);

    query.exec(function(error, results) {
        if (error) {
            callback(error, null, null);
        } else {
            Note.count(q, function(error, count) {
                if (error) {
                    callback(error, null, null);
                } else {
                    var pageCount = Math.ceil(count / resultsPerPage);
                    callback(null, pageCount, results);
                }
            });
        }
    });
}
/*******
 保存
 ********/
NoteDao.prototype.save=function(obj,callback){
    var instance=new Note(obj);
    instance.save(function(err){
        callback(err);
    })
}

module.exports=new NoteDao();