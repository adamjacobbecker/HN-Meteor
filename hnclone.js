Posts = new Meteor.Collection("posts");

function getCurrentUnixTimestamp(){
  return Math.round((new Date()).getTime() / 1000);  
}

function calculateScore(createdAt, ups){
  var hoursSincePosted = (getCurrentUnixTimestamp() - createdAt)/3600;
  return (ups + 1) / Math.pow((hoursSincePosted+2), 1.8);
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
    return Posts.find({}, {sort: {score: -1}});
  };
  
  Template.post.getDomain = function() {
    if(this.url.match(/:\/\/(www\.)?(.[^/:]+)/)){
      return '(' + this.url.match(/:\/\/(www\.)?(.[^/:]+)/)[2] + ')';      
    }
  }
  
  Template.post.events = {
    'click span.upvote': function () {
      Posts.update(this._id, {$inc: {ups: 1}});
      updatePostScore(this._id)
    }
  };
  
  Template.body.events = {
    'click a.submit': function() {
      $('.list-container').hide();
      $('.submit-container').show();
    },
    
    'click a.new': function() {
      $('.submit-container').hide();
      $('.list-container').show();
    },
    
    
    'click #submit_btn': function() {
      Posts.insert({
				subject: $("#submit_subject").val(), 
				url: $("#submit_url").val(),
				ups: 0,
				createdAt: getCurrentUnixTimestamp(),
				score: 0
			});
			
			$("#submit_subject, #submit_url").val('');
      $('.submit-container').hide();
			$('.list-container').show();
      
    }
  }
  
  calculateScores();
}
