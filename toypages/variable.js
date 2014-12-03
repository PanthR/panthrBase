var Event = (function(){

   function createHandlers(obj) {
      Object.defineProperty(obj, '_handlers', { value: {} });
   }
   var register = function(event, handler, context) {
      if (!this._handlers) { createHandlers(this); }
      if (!this._handlers[event]) { this._handlers[event] = []; }
      this._handlers[event].push({ handler: handler, context: context || null });
      return this;
   };
   var trigger = function(event, data) {
      ((this._handlers && this._handlers[event]) || []).forEach(function(obj) {
         obj.handler.call(obj.context, data);
      });
   };

   var Event = {
      mixin: function(obj) {
         Object.defineProperty(obj, 'register', { value: register });
         Object.defineProperty(obj, 'trigger', { value: trigger });
      }
   };

   Event.mixin(Event);

   return Event;
}());

var DIGITS = 4;

function roundn(d) {
   var p = Math.pow(10, d);
   return function(x) { return Math.round(x * p) / p; };
}
function taggify(tag) {
  return function(str) { return '<' + tag + '>' + str + '</' + tag + '>'; }
}

var Variable = Base.Variable;

var appState = Object.create({
   setIndex: function setIndex(v) {
      this.selectedIndex = v;
      this.trigger('newIndex', v);
      // checkDeleteStatus();
   },
   newVariable: function newVariable() {
      var id = 0, name;
      do {
         id += 1;
         name = 'Variable ' + id;
      } while (this.variableList.hasOwnProperty(name));
      this.variableList[name] = this.textProcessResult || new Variable([]);
      this.textProcessResult = null;
      this.variableList._current = name;
      this.trigger('listUpdated', this.variableList);
      this.trigger('newCurrentVar', this);
   },
	changeVarName: function changeVarName(newName) {
      var currVar = this.variableList._current;
      if (this.variableList.hasOwnProperty(newName)) { return false; }
      this.variableList[newName] = this.variableList[currVar];
      delete this.variableList[currVar];
      this.variableList._current = newName;
      this.trigger('listUpdated', this.variableList);
      this.trigger('varNameChanged', newName);
      return true;
   },
	setCurrent: function setCurrent(newVar) {
      this.variableList._current = newVar;
      this.trigger('newCurrentVar', this);
   },
   updateProcessResult: function updateProcessResult(v) {
      this.textProcessResult = v;
   },
	newValue: function newValue(newVal) {
      var currVar = this.variableList[this.variableList._current];
      if (this.selectedIndex === 0) {
         currVar.resize(currVar.length() + 1).set(currVar.length(), newVal);
         this.trigger('listUpdated', this.variableList);
      } else {
         currVar.set(this.selectedIndex, newVal);
      }
      this.trigger('currentValuesChanged', currVar);
   },
	deleteValue: function deleteValue() {
      var currVar = this.variableList._current;
      var newValues = this.variableList[currVar].toArray();
      newValues.splice(this.selectedIndex - 1, 1);
      this.variableList[currVar] = this.variableList[currVar].reproduce(newValues);
      this.trigger('listUpdated', this.variableList);
      this.trigger('currentValuesChanged', this.variableList[currVar]);
   }
});

appState.variableList = {};
appState.selectedIndex = 0;
appState.textProcessResult = null;

Object.defineProperty(appState.variableList, '_current', {
   writable: true,
   value: null
});

Event.mixin(appState);



function populateSelect(variableList) {
   var select = $('#varList').html('');
   $.each(variableList, function(key, value) {
     select
         .append($('<option' + (key === variableList._current ? ' selected' : '' ) + '></option>')
         .attr('value', key)
         .text(key + ' (' + value.length() + ' values)'));
   });
}

// In reaction to change in the appState
function updateVarName(newName) {
   this.val(newName);
   this.data('old-value', newName);
}

// In reaction to a DOM change
function changeVarName(ev) {
   if ($(this).val() === $(this).data('old-value')) { return; }
   if (appState.changeVarName($(this).val())) { return; }
   // failure in changing value
   $(this).val($(this).data('old-value'));
   alert('A variable with that name already exists!');
}

function updateValueTable(newValues) {
   appState.setIndex(0);  // TODO
   $('#theTable').html(newValues.toHTML({ ncol: 3 }));
}

function setCurrentVariable() { appState.setCurrent(this.value); }

function newVariable() {
   $('textarea').val('');
   appState.newVariable();
}
function addNewValue() {
   appState.newValue(parseFloat($(this).val()));
   $(this).val('');

}

function selectValue() {
   appState.setIndex($(this).data('relindex'));
   $('.selectedCell').toggleClass('selectedCell');
   $(this).toggleClass('selectedCell');
}

function checkDeleteStatus() {
   $('#delValue').prop('disabled', selectedIndex === 0);
}

function deleteValue() {
   appState.deleteValue();
}

function parseTextArea() {
   var v = Variable.read(this.value);
   var l = v ? v.length() : 0;
   appState.updateProcessResult(v);
   $('#mess').html(l + ' number(s) read');   // TODO
}

function updateResults(newValues) {
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
   var fiveNum = newValues.fiveNum().map(roundn(DIGITS));
   var others = new Variable([
      newValues.sum(), newValues.mean(), newValues.var(), newValues.sd(), newValues.length()
   ]).map(roundn(DIGITS)).names(['Sum', 'Mean', 'Variance', 'Std. Dev.', 'N']);
   resultsDiv
      .append(makeTable(fiveNum, 'Five Number Summary'))
      .append(makeTable(others, 'Other Statistics'))
      .append(taggify('div')(
         taggify('h3')('Frequency Table') +
         taggify('table')(
            taggify('thead')(taggify('tr')(taggify('th')('Values') + taggify('th')('Frequencies'))) +
            taggify('tbody')(newValues.table().toHTML({ withNames: true }))
         )
      ));
}

appState.register('newCurrentVar', function() {
   this.trigger('varNameChanged', this.variableList._current);
   this.trigger('currentValuesChanged', this.variableList[this.variableList._current]);
   parseTextArea.call($('textarea')[0]);
}, appState);
appState.register('listUpdated', populateSelect);
appState.register('varNameChanged', updateVarName, $('#varName'));
appState.register('currentValuesChanged', updateValueTable);
appState.register('currentValuesChanged', updateResults);

$(document).ready(function() {
   $('#addVar').click(newVariable);
   $('#varName').on('change', changeVarName);
   $('#varList').on('change', setCurrentVariable);
   $('textarea').on('input', parseTextArea);
   $('#newValue').on('change', addNewValue);
   $('#theTable').on('click', 'td', selectValue);
   $('#delValue').on('click', deleteValue);
   appState.setIndex(0);
   parseTextArea.call($('textarea')[0]);
});
