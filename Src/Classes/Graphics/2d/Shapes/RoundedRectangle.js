/*
   Author: Mara Miulescu
   Date:   07/05/2018
*/

    class RoundedRectangle2d extends Shape2d {
          constructor(graphics, width, height, radius, color) {
              super(graphics, color);
              this.setWidth(width);
              this.setHeight(height);
              this.setRadius(radius);
          }

          __redraw() {
              this.gfx.clear();
              this.gfx.beginFill(this.color);
              this.gfx.drawRoundedRect(-0.5*this.width, -0.5*this.height, this.width, this.height, this.radius);
              this.gfx.endFill();

              this.gfx.hitArea = new PIXI.RoundedRectangle(-0.5*this.width, -0.5*this.height, this.width, this.height, this.radius);
          }

          setRadius(radius) {
              this.radius = radius;
              this.__redraw();
              return this;
          }

          setWidth(width) {
              this.width = width;
              this.__redraw();
              return this;
          }

          setHeight(height) {
              this.height = height;
              this.__redraw();
              return this;
          }

          getWidth() {
              return this.width;
          }

          getHeight() {
              return this.height;
          }

          getRadius() { // returns radius of the rounded corners
              return this.radius;
          }

          __getRadius() { // returns longest distance from center to a corner
              return ((Math.sqrt(((this.height-2*this.radius)*(this.height-2*this.radius))+((this.width-2*this.radius)*(this.width-2*this.radius)))+2*this.radius)/2);
          }

    }
