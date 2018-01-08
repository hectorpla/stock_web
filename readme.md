# Description

This is the Web part of the project. Please refer to <https://github.com/hectorpla/stock_android> for the Android.

# Project Structure

The directory architecture is flat and all sources are under the root directory. 
Front ends are accessing the back end via relative path.

+ index.html is main and the only entrance for the application. *View* module (among MVC) of the application is located here. Angular directives that define *model* access the controller are also located here. Due to the two-way data-binding architecture of AngularJs, changes in view are reflected in the associated models.

+ stockApp.js is the file that defines the application logic - *the angular Controller*. Some *models* are also defined here. All event handling programs are here.

+ stockinfo.js is a module responsible for drawing pictures (stock price chart, indicator charts, etc.) in the page . 

+ \*.php files are back-end sources that receive requests from the front-end application and make responses. All of them are middle layers making requests to the actual web service hosts (Alpha Vantage, Markit On Demand and Seeking Alpha) on behalf of the front-end and process the data into desired form as output.

# Design and Decision Making
The module in stockinfo.js is constructed with the knowledge of the layout in index.html. For example, it assumes there is a *div* that has ID #Price-plot, and draws pictures in that DOM object. This incurs a tight coupling between the html code and this module.

It might also be a bad practice to define states and methods as properties of the global variable *window*, which are accessed directly from the controller of Angular. Should have added a layer of indirection, packing all those functionalities as a service to pass to Angular.

On the other hand, it might be clearer to define the cached data (stock price data retrieved and the like) as variables under the scope of the Angular controller. However, as it turned out, keeping this logic apart from the angular app facilitates the usability of the code in the development for the android app. Preserving the drawing logic as a standalone logic, which only depends on the highchart.js, is reasonable treatment in many cases.

