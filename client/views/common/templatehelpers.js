Handlebars.registerHelper('refreshEvery', function(seconds) {
  if (!Deps.active)
    return
    
  var computation = Deps.currentComputation
  Meteor.setTimeout(function() { 
    computation.invalidate();
  }, parseInt(seconds) * 1000);
});