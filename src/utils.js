"use strict";

module.exports.lowerFirstLetter = function(name) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

module.exports.upperFirstLetter = function(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
