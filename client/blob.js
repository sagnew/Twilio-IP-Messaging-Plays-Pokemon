/*global URL*/

/* dependencies */
var Blob = require('blob');

module.exports = blobToImage;

function blobToImage(imageData) {
  if (typeof imageData === 'string') {
    return 'data:image/png;base64,' + imageData;
  } else if (Blob && 'undefined' != typeof URL) {
    var blob = new Blob([imageData], {type: 'image/png'});
    return URL.createObjectURL(blob);
  } else {
    return 'about:blank';
  }
}
