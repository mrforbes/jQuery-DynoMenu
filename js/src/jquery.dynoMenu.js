/*
 * @plugin: jquery dynoMenu v0.5
 * @author: michael forbes
 * @description: dynamic css3 based drop down menu, adjust font size/add dropdown menu to accomodate long horizontal menus without wrapping
 * 
 * 
 */

;(function($) {

    $.dynoMenu = function(el, options) {
        
        var defaults = {
            minFontSize: 11,
            adjustMenuBy: 'dropdown',
            onSelect: function() {}
        },
        resizeTimeout = null,
        plugin = this,
        shiftMenuRight = function(el){
            el.find('>li >a').each(function(){
                var self = $(this),
                    selfWidth = self.outerWidth(true),
                    
                    next,offset,newLeft = null;
                  
                if(selfWidth < plugin.calc.averageListItemWidth) {
                    self.width(plugin.calc.averageListItemWidth);
                }
                else if(selfWidth > plugin.calc.averageListItemWidth){      
                    if(self.next().length > 0){
                            next = self.next();
                            offset = next.offset();
                            newLeft = parseInt(offset.left,10) + parseInt(selfWidth,10);
                            next.css('left',newLeft);   
                    }
                }
            });
        },
        // this will move the menu to the left if it is going outside the viewport
        shiftMenu = function(el){
            var windowWidth = $(window).width(),
               selfUOffset = el.offset(),
               selfUWidth = el.outerWidth(true),
               selfURight = parseInt(selfUOffset.left,10) + parseInt(selfUWidth,10),
               shift = 0,
               parent = el.closest('ul'),
               pOffset = parent.offset();
            if(selfURight > windowWidth){  //too far right - its going off the screen - move it to the left of the menu
               shift = parseInt(pOffset.left,10) - selfURight;
               el.css('left',shift);
            }
            else{
                shiftMenuRight(el);
            }
        },
        equalizeWidth = function(){
            //loop through every anchor and adjust the width, allowing for margin and padding.
            plugin.el.find('>li > a').each(function(){
            var self = $(this),
                outerWidth = self.outerWidth(true),
                width = self.width(),
                differenceInWidth = outerWidth - width,
                newWidth = plugin.calc.averageListItemWidth - differenceInWidth;
                self.css('width',newWidth);
            });
            
        },
        adjustWidth = function(){
            var differenceInWidth = plugin.calc.parentWidth - plugin.calc.totalListItemWidth,
                addedWidth = Math.floor(differenceInWidth / plugin.calc.listItemCount),
                self, width = null;
            plugin.el.find('>li >a').each(function(){
                self = $(this);
                width = self.width() + addedWidth;     
                self.css('width',width);
            });    
            
        },
        // remove one list item at a time and place it in a new list item 'more' until we get it small enough that it will stop
        adjustByDropdown = function(){
            if(plugin.el.find('.more').length === 0){ 
                    plugin.el.append('<li class="more"><a href="#">more</a><ul></ul></li>');  //create the 'more' dropdown
            }
            //remove the next to last element, put it under more, and rerender
            var more = plugin.el.find('.more'),
                beforeMoreClone = more.prev().clone();
            more.find('> a').css('fontSize',plugin.settings.minFontSize);
            more.prev().remove();
            more.find('> ul').prepend(beforeMoreClone);
            plugin.render();
        },
        adjustMenu = function(){
            // first, try shrinking the menu font size to the min size in the settings to make it all fit... if that doesn't work add a scroll, dropdown, or some other method of collecting the extra items.
            //get current font size
            var fontSize = parseInt(plugin.el.find('> li > a:first').css('fontSize'),10),
                newFontSize = fontSize - 1;
            //try reducing the font size to make it fit
            if(fontSize > plugin.settings.minFontSize){
                plugin.el.find('a').css('fontSize', newFontSize);
                plugin.render();
            }
            //if you are here, that means that the smaller font size wasn't enough... decide what to do from here, lets use a setting for it
            else {
                if(plugin.settings.adjustMenuBy === 'dropdown') {
                // remove one list item at a time and place it in a new list item 'more' until we get it small enough that it will stop
                    adjustByDropdown();
                }
            }
        },
         //get the longest item, this is the minimum width each will be if they can spread out
        getMinListItemWidth = function(){
            var minListItemWidth = 0;
            plugin.el.find('> li > a').each(function(){
                var width = $(this).outerWidth(true);
                if(width > minListItemWidth){
                    minListItemWidth = width;
                }  
            });
            return minListItemWidth;
        },
        
        //get the average width based on total width / count
        getAverageListItemWidth = function(){
            var average = Math.floor(plugin.calc.parentWidth / plugin.calc.listItemCount);
            return average;
        },
        
        //get the total width to see if goes outside the boundaris of the ul
        getTotalListItemWidth = function(){
            var totalListItemWidth = 0;
            plugin.el.find('> li > a').each(function(){
                totalListItemWidth += parseInt($(this).outerWidth(true),10);
            });
            return totalListItemWidth;
        },
        getCalculations = function() {
            /* CALCULATIONS */
            //first, get the width of the parent element
            plugin.calc.parentWidth = plugin.el.parent().width();
            // get the current longest list item width
            plugin.calc.minListItemWidth = getMinListItemWidth();
            // get the average width based on the parent width
            plugin.calc.averageListItemWidth = getAverageListItemWidth();
            //get the total width of the list items.. can be greater than the parentwidth thanks to nowrap
            plugin.calc.totalListItemWidth = getTotalListItemWidth();
        },
        
        //constructor
        init = function() {
            // class variables
            plugin.calc = {};
            plugin.settings = $.extend({}, defaults, options);
            plugin.el = $(el);
            plugin.calc.listItemCount = plugin.el.find('> li').length;
            plugin.calc.originalFontSize = parseInt(plugin.el.find('> li > a:first').css('fontSize'),10);
            plugin.events();
            plugin.render();            
        };

        plugin.settings = {};
        
        plugin.events = function(){
            plugin.el.on('mouseenter','a',function(){  //delegate the event on the nav
                var self = $(this),
                    next = null;
                if(self.closest('ul').attr('class') === plugin.el.attr('class')){ //make sure you are on the top level
                    if(self.next().length > 0) {
                        shiftMenu(self.next());
                    }
                }
                else {
                //this is a sub menu item.. but it still has a next to adjust.
                    if(self.next().length > 0) {
                        next = self.next();
                        shiftMenu(next);
                        //needs to move a little more to allow for the arrow
                        next.addClass('shifted');
                    }
                }
            });
            
             //resize the menu so it fits in the window, if not set to a fixed width.
            window.onresize = function() {
                window.clearTimeout(resizeTimeout);
                resizeTimeout = window.setTimeout(plugin.updateRender,500);
            };
            
        };
        
       
        
        //this runs when the page width changes, resets the menu to original defaults and does the calculations again
        plugin.updateRender = function(){
            plugin.el.find('a').attr('style','').css('fontSize',plugin.calc.originalFontSize);
            var moreItems = plugin.el.find('.more ul').html();
            plugin.el.find('.more').remove();
            plugin.el.append(moreItems);
            plugin.el.find('.shifted').attr('style','').removeClass('shifted');
            plugin.render();
        };
        
        plugin.render = function() {    
            getCalculations();
            var calc = plugin.calc; 
           
            // if the average width is wider than the widest current list item, make them all wider, otherwise we have to do the heavy lifting
            if(calc.averageListItemWidth > calc.minListItemWidth){
                equalizeWidth();
            }
            else if(calc.totalListItemWidth < calc.parentWidth){
                adjustWidth();
            } 
            else {
                adjustMenu();
            }
            
            
            
        };
        
        init();

    };

}(jQuery));
