var PROFANITY = [
];
PROFANITY  = new RegExp( PROFANITY.join("|") ,"gi");

module.exports = function clearProfanity(s){
  return s.replace( PROFANITY, function(m) {
    // Jawn is Philly slang for "a person, place or thing" making it appropriate in any context.
    return 'jawn';
  });
}
