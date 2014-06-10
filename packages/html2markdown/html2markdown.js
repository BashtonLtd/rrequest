var htmlparser = Npm.require('htmlparser2');

tags = {
  blockquote: {prefix: '\n> ', postfix: '\n', eachline: true, allowempty: false},
  p: {prefix: '\n\n', postfix: '\n', eachline: false, allowempty: true},
  div: {prefix: '\n\n', postfix: '\n', eachline: false, allowempty: true},
  br: {prefix: '\n', postfix: '', eachline: false, allowempty: true},
  h1: {prefix: '# ', postfix: '\n', eachline: false, allowempty: true},
  h2: {prefix: '## ', postfix: '\n', eachline: false, allowempty: true},
  h3: {prefix: '### ', postfix: '\n', eachline: false, allowempty: true},
  h4: {prefix: '#### ', postfix: '\n', eachline: false, allowempty: true},
  h5: {prefix: '##### ', postfix: '\n', eachline: false, allowempty: true},
  h6: {prefix: '###### ', postfix: '\n', eachline: false, allowempty: true},
  hr: {prefix: '\n* * *', postfix: '\n', eachline: false, allowempty: true},
  b: {prefix: '**', postfix: '**', eachline: false, allowempty: true},
  strong: {prefix: '**', postfix: '**', eachline: false, allowempty: true},
  i: {prefix: '_', postfix: '_', eachline: false, allowempty: true},
  em: {prefix: '_', postfix: '_', eachline: false, allowempty: true},
  code: {prefix: '`', postfix: '`', eachline: false, allowempty: true},
  a: {prefix: '', postfix: '', eachline: false, allowempty: true},
  img: {prefix: '', postfix: '', eachline: false, allowempty: true}
};

text2markdown = function(sourcetext) {
  var outputtext = '';
  if (sourcetext !== undefined) {
    var lines = sourcetext.split('\n');
    var lastlinestart = '';
    lines.forEach(function(line) {
      if (line.charAt(0) == '>') {
        if (lastlinestart != '>') {
          line = '\n' + line;
        }
        lastlinestart = '>';
      } else {
        if (lastlinestart == '>') {
          line = '\n' + line;
        }
        lastlinestart = '';
      }
      outputtext = outputtext + '\n' + line;
    });
  }
  return outputtext;
};

html2markdown = function (sourcehtml) {
  var handler = new htmlparser.DefaultHandler(
    function (error, dom) {
      if (error) {

      } else {
        
      }
    },
    { verbose: false, ignoreWhitespace: false }
    );

  var parser = new htmlparser.Parser(handler);

  parser.parseComplete(sourcehtml);
  var output = '';
  handler.dom.forEach(function (item){
    output = output + process(item, '', '');
  });
  output = cleanUp(output);
  return output;
};

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function cleanUp(string) {
  string = string.replace(/^[\t\r\n]+|[\t\r\n]+$/g, ''); // trim leading/trailing whitespace
  string = string.replace(/\n\s+\n/g, '\n\n');
  string = string.replace(/\n{3,}/g, '\n\n'); // limit consecutive linebreaks to 2
  return string;
}

function process (node, parentprefix, parentpostfix) {
  var text = '';
  var prefix = '';
  var postfix = '';
  var eachline = false;
  var allowempty = true;

  if (node.type == 'text') {
    text += node.data;
  } else if (node.type == 'tag') {
    prefix = tags[node.name] ? tags[node.name]['prefix'] : '';
    postfix = tags[node.name] ? tags[node.name]['postfix'] : '';
    eachline = tags[node.name] ? tags[node.name]['eachline'] : false;
    allowempty = tags[node.name] ? tags[node.name]['allowempty'] : true;
  } else if (node.type == 'style') {
    return '';
  } else if (node.type == 'script') {
    return '';
  }
  
  if (node.children !== undefined) {
    node.children.forEach(function(child) {
      if (eachline === true){
        if (endsWith(text, '\n')) {
          text += parentprefix + process(child, prefix, postfix) + parentpostfix;
        } else {
          text += parentprefix + process(child, '', '') + parentpostfix;
        }
      } else {
        text += parentprefix + process(child, '', '') + parentpostfix;
      }
    });
  }
  if (eachline === true) {
    text = text.replace(/\n{3,}/g, '\n');
    text = text.replace(/\n/g, '\n' + prefix);
  }
  if (!allowempty) {
    if (text === '') {
      return text;
    } else {
      return prefix + text + postfix;
    }
  } else {
    return prefix + text + postfix;
  }
}