function extend(obj) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function (source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    };
  });
  return obj;
}

function array(size) {
  return Array.apply(null, Array(size));
}

function elt(name, attributes) {
  var node = document.createElement(name);

  attributes && Object.keys(attributes).forEach(function (attr) {
    node.setAttribute(attr, attributes[attr]);
  });

  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];
    if (typeof child === 'string') {
      child = document.createTextNode(child);
    }
    node.appendChild(child);
  }

  return node;
}

function identity(x) { return x; }

function list($) {
  if (typeof $ === 'string') {
    $ = $.split(/\s+/).filter(identity);
  }
  return Array.isArray($) ? $ : [$];
}

function random(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
}
