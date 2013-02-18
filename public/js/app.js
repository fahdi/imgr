
$(document).ready(function() {
    
    Picture = Backbone.Model.extend({});

    PictureList = Backbone.Collection.extend({
        model: Picture,

        url: '/list',

        parse: function(res) {
            var returnItems = [];
            _.each(res, function(item) {

                returnItems.push(item);

            });
            return returnItems;
        }

    });

    PictureListView = Backbone.View.extend({
        
        template: _.template($('#PictureListView-template').html()),

        initialize: function() {
            this.setElement($('#pictures'));

            pictureList.bind('all', this.render, this);
        },

        render: function() {
            pictureList.models.reverse();
            this.$el.html(this.template({ 'collection': pictureList }));
            return this;
        }
        
    });


    // Yay, lets get this started

    pictureList = new PictureList();
    pictureListView = new PictureListView();
    pictureList.fetch();

    // let's loop around checking for new stuff
    // setInterval(function() { pictureList.fetch() }, 10000);


});