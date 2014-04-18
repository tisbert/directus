//  Media Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'directus_fancy_media';
  Module.system = true;

    var template = '<style type="text/css"> \
                  div.ui-thumbnail { \
                    float: left; \
                    margin-top: 8px; \
                    max-height: 200px; \
                    padding: 10px; \
                    background-color: #ffffff; \
                    border: 1px solid #ededed; \
                    -webkit-border-radius:3px; \
                    -moz-border-radius:3px; \
                    border-radius:3px; \
                    color: #ededed; \
                    text-align: center; \
                    cursor: pointer; \
                  } \
                  div.ui-thumbnail.empty { \
                    width: 300px; \
                    height: 100px; \
                    background-color: #ffffff; \
                    border: 2px dashed #ededed; \
                    padding: 9px; \
                    font-size: 16px; \
                    font-weight: 600; \
                    line-height: 100px; \
                  } \
                  div.ui-thumbnail.empty.dragover, \
                  div.ui-thumbnail.empty:hover { \
                    background-color: #fefefe; \
                    border: 2px dashed #cccccc; \
                    cursor: pointer; \
                  } \
                  div.ui-thumbnail img { \
                    max-height: 200px; \
                  } \
                  div.ui-img-details { \
                    float: left; \
                    position: relative; \
                    margin-top: 15px; \
                    margin-left: 10px; \
                    line-height: 18px; \
                  } \
                  div.ui-img-details a.title { \
                    font-size: 18px; \
                  } \
                  div.ui-img-details div { \
                    display: inline; \
                  } \
                  div.ui-img-details i { \
                    font-weight: 400; \
                    font-style: italic; \
                    color: #ccc; \
                  } \
                  button.btn-right { \
                    margin-top: 8px; \
                    margin-right: 10px; \
                  } \
                  </style> \
                  {{#if url}} \
                  <div class="ui-thumbnail has-media"> \
                    <img src="{{thumbUrl}}"> \
                  </div> \
                  <div class="ui-img-details"> \
                    <i>{{mediaModel.title}}</i><br> \
                    <button class="btn btn-small btn-primary btn-right" data-action="swap" type="button">Choose media</button> \
                  </div> \
                  {{/if}} \
                  <div style="{{#if url}}display:none;{{/if}}" id="mediaDropArea" class="ui-thumbnail empty ui-thumbnail-dropzone">Drag media here, or click for existing</div> \
                  <input style="display:none" id="fileAddInput" type="file" class="large" />';

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    serialize: function() {

      var data = {},
          userId,
          model = this.model,
          authenticatedUser = app.users.getCurrentUser();

      data = model.toJSON();
      if (!model.has('id')) {
        userId = authenticatedUser.id;
        data.isNew = true;
      } else {
        userId = model.get('user');
      }

      var user = app.users.get(userId);

      data.link = undefined;
      data.thumbUrl = undefined;

      var storageAdapter = model.get('storage_adapter');

      if(storageAdapter !== null &&
         storageAdapter !== undefined &&
         storageAdapter !== '') {
          data.url = model.makeMediaUrl(false);
          data.thumbUrl = model.makeMediaUrl(true);
      }

      data.name = model.get('name');
      data.orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';

      return data;
    },

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    events: {
      'click a[data-action=toggle-form]': function() {
        //$('.upload-form').toggleClass('hide');
      },
      'click li[data-action=swap]': function() {
        //this.$el.find('#swap-file').toggleClass('hide');
      },
      'change input[type=file]': function(e) {
        var file = $(e.target)[0].files[0];
        var model = this.model;
        app.sendFiles(file, function(data) {
          model.set(data[0]);
          model.trigger('sync');
        });
      },
      'click .ui-thumbnail-dropzone': function(e) {
        this.$el.find('#fileAddInput').click();
      },
      'click button[data-action="swap"]': function(e) {
        this.$el.find('#mediaDropArea').show();
      }
    },

    initialize: function() {
      this.model.on('change', this.render, this);
    },
    afterRender: function() {
      var timer;
      var $dropzone = this.$el.find('.ui-thumbnail');
      var model = this.model;
      var self = this;

      $dropzone.on('dragover', function(e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $dropzone.addClass('dragover');
      });

      $dropzone.on('dragleave', function(e) {
        clearInterval(timer);
        timer = setInterval(function(){
          $dropzone.removeClass('dragover');
          clearInterval(timer);
        },50);
      });

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      $dropzone[0].ondrop = _.bind(function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (e.dataTransfer.files.length > 1) {
          alert('One file only please');
          return;
        }
        app.sendFiles(e.dataTransfer.files, function(data) {
          model.set(data[0]);
          model.trigger('sync');
        });
        $dropzone.removeClass('dragover');
      }, this);

    },
  });

  Module.list = function(options) {
    var model = options.model;
    var orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';
    var url = model.makeMediaUrl(true);
    var isImage = _.contains(['image/jpeg','image/png'], model.get('type'));
    var thumbUrl = isImage ? url : app.PATH + 'assets/img/document-100x120.png';

    var img = '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';
    return img;
  };

  return Module;
});