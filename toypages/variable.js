var variableList = {};
var currentVariable;
var selectedIndex;
var textProcessResult;
var Variable = Base.Variable;

var DIGITS = 4;

function roundn(d) {
   var p = Math.pow(10, d);
   return function(x) { return Math.round(x * p) / p; };
}

function taggify(tag) {
  return function(str) { return '<' + tag + '>' + str + '</' + tag + '>'; }
}

function setIndex(v) {
   selectedIndex = v;
   checkDeleteStatus();
}

function createNewVariable() {
   var id = 0, name;
   do {
      id += 1;
      name = 'Variable ' + id;
   } while (variableList.hasOwnProperty(name));
   variableList[name] = textProcessResult || new Variable([]);
   $('textarea').val('');
   textProcessResult = null;
   currentVariable = name;
   updateVarList();
   showCurrentVariable();
}

function updateVarList() {
   var select = $('#varList').html('');
   $.each(variableList, function(key, value) {
     select
         .append($('<option' + (key === currentVariable ? ' selected' : '' ) + '></option>')
         .attr('value', key)
         .text(key + ' (' + value.length() + ' values)'));
   });
}

function changeVarName(ev) {
   var newName = $(this).val();
   if (newName != currentVariable) {
      if (variableList.hasOwnProperty(newName)) {
         $(this).val(currentVariable);
         alert('A variable with that name already exists!');
      } else {
         variableList[newName] = variableList[currentVariable];
         delete variableList[currentVariable];
         currentVariable = newName;
         updateVarList();
      }
   }
}

function showCurrentVariable() {
   setIndex(0);
   $('#varName').val(currentVariable);
   $('#theTable').html(variableList[currentVariable].toHTML({ ncol: 3 }));
   computeResults();
}

function setCurrentVariable() {
   currentVariable = this.value;
   showCurrentVariable();
}

function updateProcessResult(v) {
   textProcessResult = v;
   var l = v ? v.length() : 0;
   $('#mess').html(l + ' number(s) read');
}

function addNewValue() {
   var newVal = parseFloat($(this).val());
   var currVar = variableList[currentVariable];
   if (selectedIndex === 0) {
      currVar.resize(currVar.length() + 1).set(currVar.length(), newVal);
   } else {
      currVar.set(selectedIndex, newVal);
   }
   $(this).val('');
   showCurrentVariable();
   updateVarList();
}

function selectValue() {
   setIndex($(this).data('relindex'));
   $('.selectedCell').toggleClass('selectedCell');
   $(this).toggleClass('selectedCell');
}

function checkDeleteStatus() {
   $('#delValue').prop('disabled', selectedIndex === 0);
}

function deleteValue() {
   var newValues = variableList[currentVariable].toArray();
   newValues.splice(selectedIndex - 1, 1);
   variableList[currentVariable] = variableList[currentVariable].reproduce(newValues);
   setIndex(0);
   showCurrentVariable();
   updateVarList();
}

function parseTextArea() {
   updateProcessResult(Variable.read(this.value));
}

function computeResults() {
   function makeTable(values, heading) {
      return taggify('div')(
         taggify('h3')(heading) +
         taggify('table')(
            taggify('thead')(taggify('trow')(
               values.names().toArray().map(taggify('th')).join('')
            )) +
            taggify('tbody')(taggify('trow')(
               values.toArray().map(taggify('td')).join('')
            ))
         )
      );
   }
   var resultsDiv = $('#results').html('');
   var currVar = variableList[currentVariable];
   var fiveNum = currVar.fiveNum().map(roundn(DIGITS));
   var others = new Variable([
      currVar.sum(), currVar.mean(), currVar.var(), currVar.sd(), currVar.length()
   ]).map(roundn(DIGITS)).names(['Sum', 'Mean', 'Variance', 'Std. Dev.', 'N']);
   resultsDiv
      .append(makeTable(fiveNum, 'Five Number Summary'))
      .append(makeTable(others, 'Other Statistics'))
      .append(taggify('div')(
         taggify('h3')('Frequency Table') +
         taggify('table')(
            taggify('thead')(taggify('tr')(taggify('th')('Values') + taggify('th')('Frequencies'))) +
            taggify('tbody')(currVar.table().toHTML({ withNames: true }))
         )
      ));
}

$(document).ready(function() {
   $('#addVar').click(createNewVariable);
   $('#varName').on('change', changeVarName);
   $('#varList').on('change', setCurrentVariable);
   $('textarea').on('input', parseTextArea);
   $('#newValue').on('change', addNewValue);
   $('#theTable').on('click', 'td', selectValue);
   $('#delValue').on('click', deleteValue);
   setIndex(0);
   parseTextArea.call($('textarea')[0]);
});
