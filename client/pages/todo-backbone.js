var $ = require('jquery');

// Legacy loading for Bootstrap
window.jQuery = window.$ = $;
require('bootstrap');

import _ from 'underscore';
import Backbone from 'backbone';
import Handlebars from 'handlebars';
import lscache from 'lscache';
import todoItemTemplate from 'html!templates/todoItem.html';

// Backbone Todo App

// Model

var TodoModel = Backbone.Model.extend({
  defaults: {
    todos: []
  },
  todoSchema: {
    id: 0,
    title: '',
    completed: false
  },
  fetch: function() {
    var data = lscache.get('todos');
    data = this.applySchema(data);
    this.set('todos', data);
  },
  save: function() {
    var data = this.get('todos');
    data = this.applySchema(data);
    lscache.set('todos', data);
  },
  applySchema: function(todos) {
    var data = todos;
    var schema = this.todoSchema;
    data = (_.isArray(todos)) ? data : [];  // shorthand if statement. ? if true, : if false.
    data = data.map(function(todo, index) {
      todo.id = index;
      return _.defaults(todo, schema);
    });
    return data;
  },
  addItem: function(newTitle) {
    var newTodo = {title: newTitle};
    var todos = this.get('todos');
    todos.push(newTodo);
    this.set('todos', todos);
    this.save();
  },
  removeItem: function(id) {
    var todos = this.get('todos');
    todos.splice(id, 1);
    this.save();
  },
  itemCompleted: function(id, isCompleted) {
    var todos = this.get('todos');
    var item = _.findWhere(todos, {id: id});
    item.completed = isCompleted;
    this.set('todos', todos);
    this.save();
  }
});

// fetch and save have a default behavior which may make them work in an unwanted way
// if not overwritten.  They expect to retrieve and save data from/to a database.  We
// will typically use local storage via lscache instead.

var todoModel = new TodoModel();

// View

var TodoControllerView = Backbone.View.extend({
  el: '.todo-container',
  model: todoModel,
  events: {
    'click .btn-add': 'addTodoItem'
  },
  initialize: function() {
    this.model.fetch();
  },
  render: function() {
    var todos = this.model.get('todos');
    var $listGroup = this.$el.find('.list-group');
    $listGroup.empty();
    todos.map(function(todo) {
      var view = new TodoItemView(todo);
      $listGroup.append(view.$el);
    });
  },
  addTodoItem: function() {
    var $input = this.$el.find('.input-name');
    var newTitle = $input.val();
    if (newTitle === '') { return; }
    this.model.addItem(newTitle);
    $input.val('');
    this.render();
  },
  removeItem: function(id) {
    this.model.removeItem(id);
    this.render();
  },
  itemCompleted: function(id, isCompleted) {
    this.model.itemCompleted(id, isCompleted);
    this.render();
  }
});

var TodoItemView = Backbone.View.extend({
  tagName: 'li',                                 // el = <li class="list-group-item"></li>
  className: 'list-group-item',
  events: {
    'click .close': 'removeItem',
    'change .completed-checkbox': 'completedClicked'
  },
  template: Handlebars.compile(todoItemTemplate),
  initialize: function(todo) {
    this.data = todo;
    this.render(todo);
  },
  render: function(todo) {
    this.$el.empty().append(this.template(todo));
    this.$el.toggleClass('disabled', this.data.completed);
  },
  removeItem: function() {
    todoControllerView.removeItem(this.data.id);
  },
  completedClicked: function(event) {
    var isChecked = $(event.currentTarget).is(':checked');
    todoControllerView.itemCompleted(this.data.id, isChecked);
  }
});

var todoControllerView = new TodoControllerView();  // this calls TodoControllerView.initialize

module.exports = todoControllerView;

