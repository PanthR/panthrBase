var fileInput;
var downloadLink;
var downloadUrl;
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
  makeLinkToDataset(dSet);
}

function makeLinkToDataset(dSet) {
  var written = dSet.write({ quote: true, sep: ',' });
  var blob = new Blob([written], {type : 'text/csv'});
  if (downloadUrl) { window.URL.revokeObjectURL(downloadUrl); }
  downloadUrl = window.URL.createObjectURL(blob);
  downloadLink.attr('href', downloadUrl).show();
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
   downloadLink = $('#download').hide();
   fileInput.change(readFile);
});
