var fileInput;
var Dataset = Base.Dataset

function taggify(tag) {
  return function(str) { return '<' + tag + '>' + str + '</' + tag + '>'; }
}

function processResults(str) {
  var dSet = Dataset.read(str, { header: true });
  var contents = [];
  contents.push(taggify('tr')(dSet.names().map(taggify('th')).toArray().join('\n')));
  new Base.Variable.Matrix(dSet.toArray()).eachRow(function(row) {
    contents.push(taggify('tr')(row.map(taggify('td')).toArray().join('\n')));
  });
  $('#theTable').html(contents.join('\n'));
}

function readFile() {
   var file = fileInput[0].files[0];
   var reader = new FileReader();
   reader.onload = function(str) {
      processResults(reader.result);
   };
   reader.readAsText(file);
}

$(document).ready(function() {
   fileInput = $('input[type=file]');
   // console.log(new Base.Variable([1,2,5,6]).toArray());
   fileInput.change(readFile);
});
