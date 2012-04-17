Posts = new Meteor.Collection("posts");

function getCurrentUnixTimestamp(){
  return Math.round((new Date()).getTime() / 1000);  
}

function calculateScore(createdAt, ups){
  var hoursSincePosted = (getCurrentUnixTimestamp() - createdAt)/3600;
  return (ups) / Math.pow((hoursSincePosted+2), 1.8);
}

function updatePostScore(id){
  var post = Posts.findOne(id);
  Posts.update(id, {$set: {score: calculateScore(post.createdAt, post.ups)}});
}

function calculateScores(){
  Posts.find().forEach(function(doc){
    updatePostScore(doc._id);
  });
  
  setTimeout(calculateScores, 1500);
}

if (Meteor.is_client) {
  
  Template.list.posts = function () {
    var posts = Posts.find({}, {sort: {score: -1}}).fetch();
    return posts.slice(0,30);
  };
  
  Template.post.getDomain = function() {
    if(this.url.match(/:\/\/(www\.)?(.[^/:]+)/)){
      return '(' + this.url.match(/:\/\/(www\.)?(.[^/:]+)/)[2] + ')';      
    }
  }
  
  Template.post.getFormattedCreatedAt = function() {
    var d = new Date();
    d.setTime(this.createdAt * 1000);
    return d.toDateString() + ' ' + d.toTimeString();
  }
  
  Template.post.mine = function () {    
    if($.inArray(this._id, $.parseJSON(Session.get("my_posts"))) !== -1){
      return 'mine';
    }
  };
  
  Template.post.events = {
    'click span.upvote': function () {
      Posts.update(this._id, {$inc: {ups: 1}});
      updatePostScore(this._id)
    }
  };
  
  Template.body.events = {
    'click a.submit': function() {
      $('body').addClass('submit');
    },
    
    'click a.new': function() {
      $('body').removeClass('submit');
    },
    
    
    'click #submit_btn': function() {
      var post = Posts.insert({
				subject: $("#submit_subject").val(), 
				url: $("#submit_url").val(),
				ups: 1,
				createdAt: getCurrentUnixTimestamp(),
				score: calculateScore(getCurrentUnixTimestamp, 1)
			});
			
			if(Session.get("my_posts")){
  			var myPosts = $.parseJSON(Session.get("my_posts"));			  
			}else{
			  var myPosts = new Array();
			}
			
			myPosts.push(post);
			Session.set("my_posts", JSON.stringify(myPosts));
			
			$("#submit_subject, #submit_url").val('');
      $('body').removeClass('submit');
      
    }
  }
  
  calculateScores();

}
