Template.body.created = function(){
  Session.set('currentScroll', null);
};

Template.body.rendered = function(){
  var currentScroll = Session.get('currentScroll') !== null ? Session.get('currentScroll') : 0;
  $('body').scrollTop(currentScroll);
};

window.onscroll = function(){
  Session.set('currentScroll',$('body').scrollTop());
};