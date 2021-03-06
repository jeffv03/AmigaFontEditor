var COPIED_SQUARE;

function FontColor(hex,code)
{
	this.hex=hex;
	this.code=code;
	this.binaryCode=(code >>> 0).toString(2);
	var rgb=hexToRgb(this.hex);
	this.amigaR=Math.round(rgb.r*15/255).toString(16);
	this.amigaG=Math.round(rgb.g*15/255).toString(16);
	this.amigaB=Math.round(rgb.b*15/255).toString(16);
}

function FontColorsTable(nBitplanes)
{
	this.nBitplanes = nBitplanes;
	this.FontColorsArray = [],
	this.fgIndexColor = 0,
	this.bgIndexColor = 0,
	this.changeBitplanes = function (nBitplanes) { 
		// Shrink the array
		if (nBitplanes<this.nBitplanes)
		{
			this.FontColorsArray = this.FontColorsArray.slice(0,Math.pow(2,nBitplanes));
		}
		// Increase array size
		else if (nBitplanes>this.nBitplanes)
		{
			for (var i=Math.pow(2,this.nBitplanes);i<Math.pow(2,nBitplanes);i++)
				this.FontColorsArray.push(new FontColor('#000000',this.FontColorsArray.length));
		}
		this.nBitplanes=nBitplanes 
	},
	this.addFont24BitHexColor = function (hex) {
		if (this.FontColorsArray.length<Math.pow(2,this.nBitplanes))
			this.FontColorsArray.push(new FontColor(hex,this.FontColorsArray.length));
	};
	this.addFont24BitHexColorAtPos = function (hex,pos) {
		if (pos<this.FontColorsArray.length)
			this.FontColorsArray[pos]=new FontColor(hex,pos);
	};
	this.setFgColorIndex = function (index) {
		this.fgIndexColor = index;
	};
	this.setBgColorIndex = function (index) {
		this.bgIndexColor = index;
	};
	this.getBgFontColor = function () {
		return this.FontColorsArray[this.bgIndexColor];
	};
	this.getFontColorById = function (id) {
		return this.FontColorsArray[id];
	};
	this.getFgFontColor = function (index) {
		return this.FontColorsArray[this.fgIndexColor];
	};
	this.getTableSize = function () { return this.FontColorsArray.length };
	this.changeColor = function (index,hex) {
		this.FontColorsArray[index]=new FontColor(hex,index);
	}
}


function createFontTable(characters,palette,resolution)
{
	return {
		characters:characters,
		fontArray:[],
		palette:palette,
		resolution:resolution,
		createList: function (parent) {
			var fontArray=[];
			this.characters.forEach(function(element) {
	  			var li = document.createElement("li");
	  			li.setAttribute("id", "lifont"+element);
				var p = document.createElement("p");
				var oTxt = document.createTextNode("Font: `"+String.fromCharCode(element)+"' Ascii code: "+element);

				p.appendChild(oTxt);
	  			li.appendChild(p);
					
	  			parent.appendChild(li);
				var fontObj = createFontObj(SQUARE_PIXELS,resolution.x,resolution.y,li,this.palette);
	  			fontObj.createCanvas();
	  			fontArray.push(fontObj);
			});
			this.fontArray=fontArray;
			return;
		},
		appendlListToUl: function (parent) {
			this.characters.forEach(function(element) {
				var li = document.createElement("li");
				li.appendChild(document.createTextNode(String.fromCharCode(parseInt(element))));
				parent.appendChild(li);
				li.addEventListener('click',function () { window.location.href='#lifont'+ parseInt(element)});
			});
		},
		getHexDataString: function (nBitplanes) {
			var binaryCharacters="";
			for (var j=0;j<nBitplanes;j++)
				for (var i = 0; i < table.fontArray.length; i++)
				{
					var canvas=this.fontArray[i].canvas;
					binaryCharacters+=canvas.data.getBinaryDataStringForBitplane(j);
				}
			var s = binaryCharacters;
			var i, k, part, accum, ret = '';
			for (i = s.length-1; i >= 3; i -= 4) {
				// extract out in substrings of 4 and convert to hex
				part = s.substr(i+1-4, 4);
				accum = 0;
				for (k = 0; k < 4; k += 1) {
					if (part[k] !== '0' && part[k] !== '1') {
					    // invalid character
					    return { valid: false };
					}
					// compute the length 4 substring
					accum = accum * 2 + parseInt(part[k], 10);
				}
				if (accum >= 10) {
					// 'A' to 'F'
					ret = String.fromCharCode(accum - 10 + 'A'.charCodeAt(0)) + ret;
				} else {
					// '0' to '9'
					ret = String(accum) + ret;
				}
			}
			// remaining characters, i = 0, 1, or 2
			if (i >= 0) {
				accum = 0;
				// convert from front
				for (k = 0; k <= i; k += 1) {
					if (s[k] !== '0' && s[k] !== '1') {
					    return { valid: false };
					}
					accum = accum * 2 + parseInt(s[k], 10);
				}
				// 3 bits, value cannot exceed 2^3 - 1 = 7, just convert
				ret = String(accum) + ret;
			}
			return ret;
		},
		getBinaryDataString: function (nBitplanes) {
			var binaryCharacters="";
			for (var j=0;j<nBitplanes;j++)
				for (var i = 0; i < table.fontArray.length; i++)
				{
					var canvas=this.fontArray[i].canvas;
					binaryCharacters+=canvas.data.getBinaryDataStringForBitplane(j);
				}
			return binaryCharacters;
		},
		getBinaryData: function (nBitplanes) {
			var xres=this.resolution.x;
			var yres=this.resolution.y;
			var binaryData = new Uint8Array(xres*yres/8*this.fontArray.length*nBitplanes);
			var offset=0;
			for (var j=0;j<nBitplanes;j++)
				for (var i = 0; i < table.fontArray.length; i++)
				{
					var canvas=this.fontArray[i].canvas;
					var sampleBytes=canvas.data.getBinaryDataForBitplane(j);			
					binaryData.set(sampleBytes,offset);
					offset+=sampleBytes.length;
				}
			return binaryData;
		},
		drawRawData: function (rawData,nBitplanes) {
			//console.log(rawData);

			// Set resolution variables
			var xres=this.resolution.x;
			var yres=this.resolution.y;

			// Init resultarray
			for (var z = 0; z < table.fontArray.length; z++)
			{
				var binaryArray = [nBitplanes];
				for (var i=0;i<nBitplanes;i++)
					binaryArray[i]=new Uint8Array(xres*yres/8);
				//Cycle an entire font
				for (var i=0;i<xres*yres/8;i++)
				{
					//console.log("Byte"+i);
					// Cycle all the bitplanes
					for (var j=0;j<nBitplanes;j++)
					{
						//console.log("Bitplane"+j);
						var byte=rawData[(z*xres*yres/8)+i+j*xres*yres/8*table.fontArray.length];
						//console.log(byte);
						binaryArray[j][i]=byte;
					}
					//console.log(rawData[i]);
				}
				// Binaryarray is an array of Uint8Array, each element of the array is a bitplane representation of a font, bitplane0 is at index 0, bitplane1 is at index 1 and so on
				//console.log(binaryArray);
				this.fontArray[z].drawFontFromData(binaryArray);
			}
		},
		updateColor: function (index,color) {
			for (var i = 0; i < table.fontArray.length; i++)
			{
				for (var j=0;j<table.fontArray[i].squaresObjs.length;j++)
				{
					if (table.fontArray[i].squaresObjs[j].code==index)
					{
						//console.log(table.fontArray[i].squaresObjs[j].code);
						table.fontArray[i].squaresObjs[j].reset(table.fontArray[i].palette.getBgFontColor());
						if (index>0)
							table.fontArray[i].squaresObjs[j].storeClick(table.fontArray[i].palette.getBgFontColor(),table.fontArray[i].palette.getFgFontColor());
					}
				}
			}
		},
		updatePalette: function (newPalette) {
			this.palette=newPalette;
			for (var i = 0; i < table.fontArray.length; i++)
				table.fontArray[i].updatePalette(newPalette);

		},
		changeFontXRes: function (newXres) {
			for (var i = 0; i < table.fontArray.length; i++)
				table.fontArray[i].changeCanvasXResolution(newXres);
			this.resolution.x=newXres;
		},
		changeFontYRes: function (newYres) {
			for (var i = 0; i < table.fontArray.length; i++)
				table.fontArray[i].changeCanvasYResolution(newYres);
			this.resolution.y=newYres;
		}
	};
}

function createFontObj(square_pixels,xres,yres,parentObject,palette)
{
	return { 
		square_pixels:square_pixels,
		xres:xres,
		yres:yres,
		palette:palette,
		canvas:undefined,
		context:undefined,
		squaresObjs:[],
		createCanvas: function () {
			canvas = document.createElement('canvas');
	  		canvas.width  = square_pixels*xres;
	  		canvas.height = square_pixels*yres;
			this.canvas = canvas;
	  		parentObject.appendChild(canvas);

			// Create clear button
			var p = document.createElement("p");
			var clearBtn = document.createElement("BUTTON");
			var clearTxt = document.createTextNode("Clear");
			clearBtn.appendChild(clearTxt);
			p.appendChild(clearBtn);
			parentObject.appendChild(p);

			// Copy button
			var copyBtn = document.createElement("BUTTON");
			var copyTxt = document.createTextNode("Copy");
			copyBtn.appendChild(copyTxt);
			p.appendChild(copyBtn);
			parentObject.appendChild(p);

			// Create paste button
			var pasteBtn = document.createElement("BUTTON");
			var pasteTxt = document.createTextNode("Paste");
			pasteBtn.appendChild(pasteTxt);
			p.appendChild(pasteBtn);
			parentObject.appendChild(p);

			context = canvas.getContext('2d');
			canvas.data = this;
			clearBtn.data = this;
			copyBtn.data = this;
			pasteBtn.data = this;

			for (ysquarecont=0;ysquarecont<this.yres;ysquarecont++)
				for (xsquarecont=0;xsquarecont<this.xres;xsquarecont++)
				{
					var square = createSquareObj(context,xsquarecont,ysquarecont);
					square.draw(this.palette.getBgFontColor());
					this.squaresObjs.push(square);
	  			}
			canvas.addEventListener("mousemove",function(e){
			   	var pos = this.data.findPos(this);
				var x = e.pageX - pos.x;
				var y = e.pageY - pos.y;
				var coord = "x=" + x + ", y=" + y;
				var c = this.getContext('2d');
				var p = c.getImageData(x, y, 1, 1).data; 
					//var hex = "#" + ("000000" + this.data.rgbToHex(p[0], p[1], p[2])).slice(-6);
					//console.log(coord);
					//console.log(hex);
				square_selected=this.data.getSquare(Math.floor(x/this.data.square_pixels),Math.floor(y/this.data.square_pixels));
				if (square_selected==undefined) return; 
				other_squares=this.data.getOtherSquares(Math.floor(x/this.data.square_pixels),Math.floor(y/this.data.square_pixels));
				// On hover i fill the square	
				square_selected.fill(this.data.palette.getFgFontColor());
				for (var i = 0; i < other_squares.length; i++) {
					if (other_squares[i].pixel_clicked==false) other_squares[i].unfill(this.data.palette.getBgFontColor());
				}
			});
			// On mouse exit canvas unfill all non clicked squares
			canvas.addEventListener("mouseout",function(e){
				all_squares=this.data.getAllSquares();
				for (var i = 0; i < all_squares.length; i++) {
					if (all_squares[i].pixel_clicked==false) all_squares[i].unfill(this.data.palette.getBgFontColor());
				}
			});
			canvas.addEventListener("click",function(e){
				var pos = this.data.findPos(this);
				var x = e.pageX - pos.x;
				var y = e.pageY - pos.y;
				square_selected=this.data.getSquare(Math.floor(x/this.data.square_pixels),Math.floor(y/this.data.square_pixels));
				square_selected.storeClick(this.data.palette.getBgFontColor(),this.data.palette.getFgFontColor());
			});

			// Handler for clearing image at button press
			clearBtn.addEventListener("click",function(e){
				this.data.clearAllSquares();
			});

			// Handle for storing font
			copyBtn.addEventListener("click",function(e){
				COPIED_SQUARE=[];
				for (var i=0;i<this.data.palette.nBitplanes;i++)
				{
					COPIED_SQUARE[i]=new Uint8Array(this.xres*this.yres/8);
					COPIED_SQUARE[i]=this.data.getBinaryDataForBitplane(i);
				}
				alert('Image copied');
			});

			// Handle for pasting font
			pasteBtn.addEventListener("click",function(e){
				this.data.drawFontFromData(COPIED_SQUARE);
				alert('Image pasted');
			});
		},
		changeCanvasXResolution : function (newXres)
		{

			this.canvas.width  = square_pixels*newXres;
			var newSquaresObj=[];
			for (ysquarecont=0;ysquarecont<this.yres;ysquarecont++)
				for (xsquarecont=0;xsquarecont<newXres;xsquarecont++)
				{
					var square = createSquareObj(this.canvas.getContext('2d'),xsquarecont,ysquarecont);
					var oldSquare = this.getSquare(xsquarecont,ysquarecont);
					if (oldSquare==undefined)
						square.draw(this.palette.getBgFontColor());
					else
					{
						if (oldSquare.code>0) square.storeClick(this.palette.getBgFontColor(),this.palette.getFontColorById(oldSquare.code));
						else square.draw(this.palette.getBgFontColor());
					}
					newSquaresObj.push(square);
	  			}
	  		
	  		this.squaresObjs=newSquaresObj;
	  		this.xres=newXres;
	  		return ;
		},
		changeCanvasYResolution : function (newYres)
		{
			this.canvas.height  = square_pixels*newYres;
			var newSquaresObj=[];
			for (ysquarecont=0;ysquarecont<newYres;ysquarecont++)
				for (xsquarecont=0;xsquarecont<this.xres;xsquarecont++)
				{
					var square = createSquareObj(this.canvas.getContext('2d'),xsquarecont,ysquarecont);
					var oldSquare = this.getSquare(xsquarecont,ysquarecont);
					if (oldSquare==undefined)
						square.draw(this.palette.getBgFontColor());
					else
					{
						if (oldSquare.code>0) square.storeClick(this.palette.getBgFontColor(),this.palette.getFontColorById(oldSquare.code));
						else square.draw(this.palette.getBgFontColor());
					}
					newSquaresObj.push(square);
	  			}
	  		
	  		this.squaresObjs=newSquaresObj;
	  		this.yres=newYres;
	  		return ;
		},
		// Get a square object from a coordinate pair
		getSquare: function (x,y)
		{
			for (var i = 0; i < this.squaresObjs.length; i++) {
				if (this.squaresObjs[i].x==x && this.squaresObjs[i].y==y )
					return this.squaresObjs[i];
			}
		},
		// Removes a square object from a coordinate pair
		removeSquare: function (x,y)
		{
			for (var i = 0; i < this.squaresObjs.length; i++) {
				if (this.squaresObjs[i].x==x && this.squaresObjs[i].y==y )
				{
					this.squaresObjs.splice(i);
					return;
				}
			}
		},
		// Get all squares not matching the coordinate given
		getOtherSquares: function (x,y)
		{
			var res = [];
			for (var i = 0; i < this.squaresObjs.length; i++) {
				if (this.squaresObjs[i].x!=x || this.squaresObjs[i].y!=y )
					res.push(this.squaresObjs[i]);
			}
			return res;
		},
		getAllSquares: function ()
		{
			return this.squaresObjs;
		},
		clearAllSquares: function ()
		{
			for (var i = 0; i < this.squaresObjs.length; i++) {
				//this.squaresObjs[i].unfill(this.palette.getBgFontColor());
				this.squaresObjs[i].reset(this.palette.getBgFontColor());
			}
		},
		getBinaryBitplanes: function () {
			var resultArray = [];
			for (var i=0;i<this.palette.nBitplanes;i++)
				resultArray[i]="";
			for (var i = 0; i < this.squaresObjs.length; i++) 
			{
				var binaryCode=(this.squaresObjs[i].code >>> 0).toString(2);
				while (binaryCode.length<this.palette.nBitplanes)
					binaryCode=binaryCode+"0";
				for (var contBitplanes=0;contBitplanes<this.palette.nBitplanes;contBitplanes++)
					resultArray[contBitplanes]+=binaryCode[contBitplanes];
			}
			return resultArray;
		},
		// Get a specific bitplane binarydata in string from
		getBinaryDataStringForBitplane: function (bitplaneNumber) {
			var res="";
			if (bitplaneNumber>this.palette.nBitplanes) return res;
			for (var i = 0; i < this.squaresObjs.length; i++) 
			{
				var binaryCode=(this.squaresObjs[i].code >>> 0).toString(2);
				while (binaryCode.length<this.palette.nBitplanes)
					binaryCode="0"+binaryCode;
				binaryCode=binaryCode.split("").reverse().join("");
				res+=binaryCode[bitplaneNumber];
			}
			return res;
		},
		// Get a specific bitplane binarydata in Uint8Array format
		getBinaryDataForBitplane: function (bitplaneNumber) {
			var resIndex=0;
			var byteIndex=7;
			var res = new Uint8Array(this.xres*this.yres/8);
			if (bitplaneNumber>this.palette.nBitplanes) return res;
			for (var i = 0; i < this.squaresObjs.length; i++) 
			{
				var temp=0;
				var binaryCode=(this.squaresObjs[i].code >>> 0).toString(2);
				while (binaryCode.length<this.palette.nBitplanes)
					binaryCode="0"+binaryCode;
				binaryCode=binaryCode.split("").reverse().join("");

				if (binaryCode[bitplaneNumber]!='0')
				{
					temp=Math.pow(2, byteIndex);
					res[resIndex]+=temp;
				}
				if (byteIndex==0){ byteIndex=7; resIndex++; }
				else byteIndex--;
			}

			return res;
		},
		// Get a string representing binary data of the image
		getBinaryDataString: function () {
			var res="";
			var resultArray = this.getBinaryBitplanes();
			for (var i=0;i<this.palette.nBitplanes;i++)
				res+=resultArray[i];
			return res;
		},
		// Find mouse position inside canvas
		findPos: function (obj) {
			var curleft = 0, curtop = 0;
			if (obj.offsetParent) {
				do {
					curleft += obj.offsetLeft;
					curtop += obj.offsetTop;
				} while (obj = obj.offsetParent);
				return { x: curleft, y: curtop };
			}
			return undefined;
		},
		rgbToHex : function (r,g,b) {
			if (r > 255 || g > 255 || b > 255)
				throw "Invalid color component";
			return ((r << 16) | (g << 8) | b).toString(16);
		},
		getHexDataString: function () {
			var s = this.getBinaryDataString();
			var i, k, part, accum, ret = '';
			for (i = s.length-1; i >= 3; i -= 4) {
				// extract out in substrings of 4 and convert to hex
				part = s.substr(i+1-4, 4);
				accum = 0;
				for (k = 0; k < 4; k += 1) {
					if (part[k] !== '0' && part[k] !== '1') {
					    // invalid character
					    return { valid: false };
					}
					// compute the length 4 substring
					accum = accum * 2 + parseInt(part[k], 10);
				}
				if (accum >= 10) {
					// 'A' to 'F'
					ret = String.fromCharCode(accum - 10 + 'A'.charCodeAt(0)) + ret;
				} else {
					// '0' to '9'
					ret = String(accum) + ret;
				}
			}
			// remaining characters, i = 0, 1, or 2
			if (i >= 0) {
				accum = 0;
				// convert from front
				for (k = 0; k <= i; k += 1) {
					if (s[k] !== '0' && s[k] !== '1') {
					    return { valid: false };
					}
					accum = accum * 2 + parseInt(s[k], 10);
				}
				// 3 bits, value cannot exceed 2^3 - 1 = 7, just convert
				ret = String(accum) + ret;
			}
			//return { valid: true, result: ret };
			return ret;
		},
		// Function to set squares status according to a binaryData array, this array must be made by 0 or 1 only and his length must match the font resolution
		setSquares : function (binaryData) {
			//console.log(binaryData);
			if (binaryData.length!=this.squaresObjs.length) return ;
			for (var i = 0; i < this.squaresObjs.length; i++) {
				if (binaryData[i]==0)
				{
					this.squaresObjs[i].unfill(this.palette.getBgFontColor());
					this.squaresObjs[i].pixel_clicked=false;
				}
				else
				{
					this.squaresObjs[i].fill(this.palette.getFgFontColor());
					this.squaresObjs[i].pixel_clicked=true;
				}				
			}
		},
		drawFontFromData: function(data){
			var squaresObjsCont=0;
			// Get length of the first bitplane
			var imgLength=data[0].length;

			// read n-th byte
			for (var n=0;n<imgLength;n++)
			{
				// Cycle each bitplane and read the nth byte of every bitplane
				var bitArray=[];
				for (var i=0;i<8;i++) bitArray[i]=0;

				for (var i=0;i<data.length;i++)
				{
					//console.log("Leggo byte "+i+" del bitplane "+i);
					//Cycle from 0 to 7 to read the byte bit by bit
					for (var j=0,byteValue=data[i][n];j<8;j++)
					{
						bitArray[j]+=(byteValue%2)*Math.pow(2,i);
						byteValue=Math.floor(byteValue/2);
					}
				}
				bitArray=bitArray.reverse();
				//console.log("Bittarray per carattere "+n+"-"+bitArray);
				for (var i=0;i<8;i++)
				{
					this.squaresObjs[squaresObjsCont].reset(this.palette.getBgFontColor());
					if (bitArray[i]>0)
					{
						this.squaresObjs[squaresObjsCont].storeClick(this.palette.getBgFontColor(),this.palette.getFontColorById(bitArray[i]));
					}
					squaresObjsCont++;
				}
				
			}
			return ;
		},
		updatePalette: function (newPalette){
			this.palette=newPalette;
			for (var i = 0; i < this.squaresObjs.length; i++) {
				if (this.squaresObjs[i].code>=Math.pow(2,newPalette.nBitplanes))
					this.squaresObjs[i].reset(this.palette.getBgFontColor());
			}
		}

	};
}

// Function to create a square (single pixel within a canvas
function createSquareObj(context,x,y)
{
	return {
		context: context,
   		x: x,
   		y: y,
   		code: 0,
		pixel_clicked: false,  // If true the pixel has been clicked
		pixel_filled: false,   // If true the pixel has been filled (this occurs whether the pixel has been click or the mouse pointer is hovering on it
		draw: function (color) {
			context.beginPath();
			context.rect(x*SQUARE_PIXELS, y*SQUARE_PIXELS, SQUARE_PIXELS, SQUARE_PIXELS);
			context.fillStyle = color.hex;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = 'black';
			context.stroke();
		},
		//Fill the square with black
		fill: function (color) {
			if (this.pixel_filled==true) return ;
			context.beginPath();
			context.rect(x*SQUARE_PIXELS, y*SQUARE_PIXELS, SQUARE_PIXELS, SQUARE_PIXELS);
			context.fillStyle = color.hex;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = 'black';
			context.stroke();
			this.pixel_filled=true;
		},
		// Fill the square with white
		unfill: function (color) {
			if (this.pixel_filled==false) return ;
			context.beginPath();
			context.rect(x*SQUARE_PIXELS, y*SQUARE_PIXELS, SQUARE_PIXELS, SQUARE_PIXELS);
			context.fillStyle = color.hex;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = 'black';
			context.stroke();
			this.pixel_filled=false;
		},
		// Change the state of the square
		storeClick(bgcolor,fgcolor) {
			this.pixel_clicked=!this.pixel_clicked;
			if (this.pixel_clicked==true)	{this.fill(fgcolor);this.code=fgcolor.code;}
			else							{this.unfill(bgcolor);this.code=bgcolor.code;}
		},
		reset(color) {
			this.pixel_clicked=false;
			this.pixel_filled=false;
			this.code=0;
			context.beginPath();
			context.rect(x*SQUARE_PIXELS, y*SQUARE_PIXELS, SQUARE_PIXELS, SQUARE_PIXELS);
			context.fillStyle = color.hex;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = 'black';
			context.stroke();
		}
	};
}
function hexToRgb(hex) 
{
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
