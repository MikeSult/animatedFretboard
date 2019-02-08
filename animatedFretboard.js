//-----------------------------------------------------------------------------
// animatedFretboard.js
// this module creates 
// var Fretboard
// used to animated notes on a fretboard
//
// returned API:

/*
	init
	clearFretCanvas
	drawFretboard
	makePositionMenu
	makeMenus
	setFretboardPosition
	setGhostTrailValue
	animateFretDot
	drawFretboardNotes
	redrawFretboardNotes
	animateChord
	clearLastAnimatedDot
	
*/
//
//  useage: include the module in your html page:
// <script src="path/to/animatedFretboard.js"></script>
//
// in the <body> add <span>s for the position and ghost trail menus 
// and <canvas> for the fretboard graphic.  
// Use the element ids shown in the example
//
/*  copy/paste example:

<p><span id="fretboardPositionSpan"></span>
| <span id="ghostTrailSpan"></span></p>
<canvas id="myFretboardCanvas" width="700" height="140" 
     style="border:1px solid #d3d3d3;">
  Your browser does not support the canvas element.
  </canvas>

*/
//
// <script>
//  var MidiNoteList = [0,2,4,5,7,9,11,12]; // major scale
//  var keyMidiNum = 60; // middle C
//  Fretboard.drawFretboard(); 
//  Fretboard.drawFretboardNotes(MidiNoteList, keyMidiNum);
// </script>
//  
//-----------------------------------------------------------------------------

 var Fretboard = (function() {

	let xPos = 40;
	let yPos = 0;
	let topLocation = 10;
	let scaleFactor = 1.0;
	let position = 0;
	let NUM_STRINGS = 6;
	let ONE_OCTAVE = 12;

/*
    // NOTE: the guitar traditionally is notated one octave higher
    // than the the actual sound or stated a different way, it sounds
    // one octave lower than is written.  There are two possible
    // solutions for processing incoming midi values
    // 1. transpose the midi values down one octave
    // 2. transpose the fretboard tuning up one octave 
    //     and leave the midi values as they are.
    //
    // version 1: tranposing the fretboard tuning up 
    // Constants for the horizontal fretboard
	// these are actually 1 octave higher than
	// the real midi numbers so that the fretboard
	// display is correct for the guitar when the incoming
	// isn't transposed.  
	// uncomment let ADJUSTMENT = ONE_OCTAVE;
*/
    // version 2: transposing incoming midi down one octave
    // using the real midi numbers on the fretboard
    // currently the incoming Midi numbers
    // are the transposed down 1 octave (-12)
    // the audio isn't transposed only the Midi number
    // used to display on the fretboard configured to the 
    // following values.
	// uncomment let ADJUSTMENT = 0; 
//    let ADJUSTMENT = 0;

     let ADJUSTMENT = ONE_OCTAVE;

    // define tuning of fretboard
	let OPEN_STRING_ONE_MIDI = 64 + ADJUSTMENT;
	let OPEN_STRING_TWO_MIDI = 59 + ADJUSTMENT;
	let OPEN_STRING_THREE_MIDI = 55 + ADJUSTMENT;
	let OPEN_STRING_FOUR_MIDI = 50 + ADJUSTMENT;
	let OPEN_STRING_FIVE_MIDI = 45 + ADJUSTMENT;
	let OPEN_STRING_SIX_MIDI = 40 + ADJUSTMENT;

	let H_START = 10;
	let H_LENGTH = 560;
	let VERTICAL_SPACE = 20;
	let H_STRING_ONE = H_START;
	let H_STRING_TWO = H_STRING_ONE + VERTICAL_SPACE;
	let H_STRING_THREE = H_STRING_TWO + VERTICAL_SPACE;
	let H_STRING_FOUR = H_STRING_THREE + VERTICAL_SPACE;
	let H_STRING_FIVE = H_STRING_FOUR + VERTICAL_SPACE;
	let H_STRING_SIX = H_STRING_FIVE + VERTICAL_SPACE;
	let NUM_FRETS = 18;
	let FRET_WIDTH = 30;
	let FRET_LENGTH = VERTICAL_SPACE*5;
	let DOT_OFFSET = 15;
	let TINY_DOT_SIZE = 2;
	let SMALL_DOT_SIZE = 4;
	let DOT_SIZE = 5;
	let ERASE_DOT_SIZE = 6;
	let ROOT_CIRCLE_SIZE = 8;
	let FIRST_FRET = xPos;
	let OPEN_STRING_DOT = FIRST_FRET - DOT_OFFSET;

    var g_position = 0;
    var g_ghostTrailLength = 0;
    var numOfTrailingGhosts = 0;
	var ghostColor;
	var indexToGhostColor = {
		0:'#444', 1:'#777', 2:'#999', 3:'#aaa', 4:'#bbb', 5:'#ccc', 6:'#ddd', 7:'#eee', 8:'#f0f0f0'
	}

	var nonAnimatedDots = [];
	var animatedDots = [];
	var isNewAnimation = true;
	var chordIsCompletelyDrawn = false;
	var CLICK_BORDER = 4;
	var currentDot;
	var prevLocY = 0; // for chord voicings
    var my36Font = "36px Maestro";
    var my24Font = "24px Maestro";

    var animatedNote = undefined;  // for single note scale animation
//    var animatedNote = [];  // for single note scale animation
    var animatedChordNotes = []; // for chord animation
    var animatedDotColor = "red";
    var dotColor = "black";
    var myMidiNoteList = [];
    var myKeyMidiNum = 57;

    let canvasFrets = document.getElementById("myFretboardCanvas");
    let ctxFrets = canvasFrets.getContext("2d");
        
	// used to translate position menu choice to int
	let positionInt = { 'OPEN': 0, '1st position': 1,
	'2nd position': 2, '3rd position': 3, 
	'4th position': 4, '5th position': 5,
	'6th position': 6, '7th position': 7, 
	'8th position': 8, '9th position': 9, 
	'10th position': 10, '11th position': 11,
	'12th position': 12 };

	// choices in the position menu
	let positionList = ["OPEN", "1st position", "2nd position", 
	"3rd position", "4th position", "5th position", "6th position",
	"7th position", "8th position", "9th position", "10th position", 
	"11th position", "12th position", ];

// menu selects the position to display animation


// utility function for MIDI
function getMidiNumberOfNotename(noteName) {
    var msg = "getMidiNumberOfNotename: keyName = " + noteName + "\nMIDI_SHARP_NAMES.length = " + MIDI_SHARP_NAMES.length;
//    console.log(msg);
    for(let i=0; i<MIDI_SHARP_NAMES.length; i++) {
        if(noteName == MIDI_SHARP_NAMES[i] ||
            noteName == MIDI_FLAT_NAMES[i] ||
                noteName == MIDI_OTHER_NAMES[i]) {
            return i;
        }
    }
    return -1;
}

var MIDI_SHARP_NAMES = ['B#_0',  'C#_1', 'Cx_1', 'D#_1',   'E_1',  'E#_1',  'F#_1', 'Fx_1',  'G#_1', 'Gx_1', 'A#_1', 'B_1',
                    'B#_1', 'C#0', 'Cx0', 'D#0', 'E0', 'E#0', 'F#0', 'Fx0', 'G#0', 'Gx0', 'A#0', 'B0',
                    'B#0', 'C#1', 'Cx1', 'D#1', 'E1', 'E#1', 'F#1', 'Fx1', 'G#1', 'Gx1', 'A#1', 'B1',
                    'B#1', 'C#2', 'Cx2', 'D#2', 'E2', 'E#2', 'F#2', 'Fx2', 'G#2', 'Gx2', 'A#2', 'B2',
                    'B#2', 'C#3', 'Cx3', 'D#3', 'E3', 'E#3', 'F#3', 'Fx3', 'G#3', 'Gx3', 'A#3', 'B3',
                    'B#3', 'C#4', 'Cx4', 'D#4', 'E4', 'E#4', 'F#4', 'Fx4', 'G#4', 'Gx4', 'A#4', 'B4',
                    'B#4', 'C#5', 'Cx5', 'D#5', 'E5', 'E#5', 'F#5', 'Fx5', 'G#5', 'Gx5', 'A#5', 'B5',
                    'B#5', 'C#6', 'Cx6', 'D#6', 'E6', 'E#6', 'F#6', 'Fx6', 'G#6', 'Gx6', 'A#6', 'B6',
                    'B#6', 'C#7', 'Cx7', 'D#7', 'E7', 'E#7', 'F#7', 'Fx7', 'G#7', 'Gx7', 'A#7', 'B7',
                    'B#7', 'C#8', 'Cx8', 'D#8', 'E8', 'E#8', 'F#8', 'Fx8', 'G#8', 'Gx8', 'A#8', 'B8',
                    'B#8', 'C#9', 'Cx9', 'D#9', 'E9', 'E#9', 'F#9', 'Fx9'];
                          

var MIDI_FLAT_NAMES = ['C_1', 'Db_1', 'D_1', 'Eb_1', 'Fb_1', 'F_1', 'Gb_1', 'G_1', 'Ab_1', 'A_1', 'Bb_1', 'Cb0',
                    'C0', 'Db0', 'D0', 'Eb0', 'Fb0', 'F0', 'Gb0', 'G0', 'Ab0', 'A0', 'Bb0', 'Cb1',
                    'C1', 'Db1', 'D1', 'Eb1', 'Fb1', 'F1', 'Gb1', 'G1', 'Ab1', 'A1', 'Bb1', 'Cb2',
                    'C2', 'Db2', 'D2', 'Eb2', 'Fb2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'Cb3',
                    'C3', 'Db3', 'D3', 'Eb3', 'Fb3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'Cb4',
                    'C4', 'Db4', 'D4', 'Eb4', 'Fb4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'Cb5',
                    'C5', 'Db5', 'D5', 'Eb5', 'Fb5', 'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'Cb6',
                    'C6', 'Db6', 'D6', 'Eb6', 'Fb6', 'F6', 'Gb6', 'G6', 'Ab6', 'A6', 'Bb6', 'Cb7',
                    'C7', 'Db7', 'D7', 'Eb7', 'Fb7', 'F7', 'Gb7', 'G7', 'Ab7', 'A7', 'Bb7', 'Cb8',
                    'C8', 'Db8', 'D8', 'Eb8', 'Fb8', 'F8', 'Gb8', 'G8', 'Ab8', 'A8', 'Bb8', 'Cb9',
                    'C9', 'Db9', 'D9', 'Eb9', 'Fb9', 'F9', 'Gb9', 'G9'];
                    


var MIDI_OTHER_NAMES = ['Dbb_1', 'Bx_0', 'Ebb_1', 'Fbb_1', 'Dx_1', 'Gbb_1', 'Ex_1', 'Abb_1', 'Ab_1', 'Bbb_1', 'Cbb0', 'Ax_1',
                    'Dbb0', 'Bx_1', 'Ebb0', 'Fbb0', 'Dx0', 'Gbb0', 'Ex0', 'Abb0', 'Ab0', 'Bbb0', 'Cbb1', 'Ax0',
                    'Dbb1', 'Bx0', 'Ebb1', 'Fbb1', 'Dx1', 'Gbb1', 'Ex1', 'Abb1', 'Ab1', 'Bbb1', 'Cbb2', 'Ax1',
                    'Dbb2', 'Bx1', 'Ebb2', 'Fbb2', 'Dx2', 'Gbb2', 'Ex2', 'Abb2', 'Ab2', 'Bbb2', 'Cbb3', 'Ax2',
                    'Dbb3', 'Bx2', 'Ebb3', 'Fbb3', 'Dx3', 'Gbb3', 'Ex3', 'Abb3', 'Ab3', 'Bbb3', 'Cbb4', 'Ax3',
                    'Dbb4', 'Bx3', 'Ebb4', 'Fbb4', 'Dx4', 'Gbb4', 'Ex4', 'Abb4', 'Ab4', 'Bbb4', 'Cbb5', 'Ax4',
                    'Dbb5', 'Bx4', 'Ebb5', 'Fbb5', 'Dx5', 'Gbb5', 'Ex5', 'Abb5', 'Ab5', 'Bbb5', 'Cbb6', 'Ax5',
                    'Dbb6', 'Bx5', 'Ebb6', 'Fbb6', 'Dx6', 'Gbb6', 'Ex6', 'Abb6', 'Ab6', 'Bbb6', 'Cbb7', 'Ax6',
                    'Dbb7', 'Bx6', 'Ebb7', 'Fbb7', 'Dx7', 'Gbb7', 'Ex7', 'Abb7', 'Ab7', 'Bbb7', 'Cbb8', 'Ax7',
                    'Dbb8', 'Bx7', 'Ebb8', 'Fbb8', 'Dx8', 'Gbb8', 'Ex8', 'Abb8', 'Ab8', 'Bbb8', 'Cbb9', 'Ax8',
                    'Dbb9', 'Bx8', 'Ebb9', 'Fbb9', 'Dx9', 'Gbb9', 'Ex9', 'Abb9'];



// make the menu
//-----------------------------------------------------
var menuSpanName = 'fretboardPositionSpan';
var menuGhostSpanName = 'ghostTrailSpan';
//<div id="'+menuDivName+'">\n

var menuName = 'position';
var positionMenu = ' fretboard position:<select name="'+menuName+'" id="'+menuName+'">\n<option value="0">Open</option>\n<option value="1">1st pos</option>\n<option value="2">2nd pos</option>\n<option value="3">3th pos</option>\n<option value="4">4th pos</option>\n<option value="5">5th pos</option>\n<option value="6">6th pos</option>\n<option value="7">7th pos</option>\n<option value="8">8th pos</option>\n<option value="9">9th pos</option>\n<option value="10">10th pos</option>\n<option value="11">11th pos</option>\n<option value="12">12th pos</option>\n</select>\n';


function makePositionMenu() {
    document.getElementById(menuSpanName).innerHTML = positionMenu;
}


var menuName2 = 'ghostTrail';
var ghostTrailMenu = 'ghost trail:<select name="'+menuName2+'" id="'+menuName2+'">\n<option value="0">Hold All</option>\n<option value="1">1</option>\n<option value="2">2</option>\n<option value="3">3</option>\n<option value="4">4</option>\n<option value="5">5</option>\n<option value="6">6</option>\n<option value="7">7</option>\n<option value="8">8</option>\n</select>\n';


function makeGhostTrailMenu() {
    console.log('makeGhostTrailMenu()');
    document.getElementById(menuGhostSpanName).innerHTML = ghostTrailMenu;
}

function init() {
    animatedNote = undefined;
    animatedChordNotes = [];
    nonAnimatedDots = [];
    clearFretCanvas();
    drawFretboard();
}

function makeMenus() {
    console.log('makeMenus()');
    makeGhostTrailMenu();
    makePositionMenu();
}

function setFretboardPosition() {
    let positionMenu = document.getElementById(menuName);
    g_position = positionMenu.selectedIndex;
    let msg = "setFretboardPosition()  position = " + g_position;
//    console.log(msg);
    clearFretCanvas();
    drawFretboard();
    redrawFretboardNotes();
    init();
}

function setGhostTrailValue() {
    let gtMenu = document.getElementById(menuName2);
    g_ghostTrailLength = gtMenu.selectedIndex;
    let msg = "setGhostTrailValue()  g_ghostTrailLength = " + g_ghostTrailLength;
//    console.log(msg);
    init();

}


function clearFretCanvas() {
//    console.log("clearCanvas()");
    ctxFrets.beginPath();
    ctxFrets.strokeStyle="#FFFFFF";
    ctxFrets.fillStyle = '#FFFFFF';
    ctxFrets.fillRect(0, 0, canvasFrets.width, canvasFrets.height);
    ctxFrets.strokeStyle="#000000";
    ctxFrets.fillStyle = '#000000';
    ctxFrets.beginPath();
}

	
function drawFretboard() {
    ctxFrets.beginPath();
    // lines
    for (let i=0; i<NUM_STRINGS; i++) {
        ctxFrets.moveTo( xPos, yPos+H_STRING_ONE+(VERTICAL_SPACE*i) );
        ctxFrets.lineTo( xPos+H_LENGTH, H_STRING_ONE+(VERTICAL_SPACE*i) );
        ctxFrets.stroke();
    }
    // frets
    for(let i=0; i<NUM_FRETS; i++) {
        ctxFrets.moveTo(xPos+(i*FRET_WIDTH), yPos+H_STRING_ONE);
        ctxFrets.lineTo(xPos+(i*FRET_WIDTH), yPos+H_STRING_SIX);
        ctxFrets.stroke();
        if(i==3 || i==5 || i==7 || i==9 || i==12) {
            ctxFrets.fillText(i, xPos+(i*FRET_WIDTH)-DOT_OFFSET, yPos+H_STRING_SIX+DOT_OFFSET);
//            drawDot(ctxFrets, xPos+(i*FRET_WIDTH)-DOT_OFFSET, (H_STRING_THREE+H_STRING_FOUR)/2, TINY_DOT_SIZE, true, "green");
        }
    }
//    ctxFrets.beginPath();
}

// call when the position menu changes
function redrawFretboardNotes() {
    var msg = "redrawFretboardNotes() myMidiNoteList = " + myMidiNoteList + " myKeyMidiNum = " + myKeyMidiNum;
//    console.log(msg);
    drawFretboardNotes(myMidiNoteList, myKeyMidiNum)
}

function drawFretboardNotes(MidiNoteList, keyMidiNum) {
    var num;
    var MidiNumber;
    // set our global vars myMidiNoteList and myKeyMidiNum
    if( myMidiNoteList != MidiNoteList )
        myMidiNoteList = MidiNoteList;
    if (myKeyMidiNum != keyMidiNum)
        myKeyMidiNum = keyMidiNum;

    var msg = "drawFretboardNotes: myMidiNoteList = " + myMidiNoteList + " position = " + position + " myKeyMidiNum = " + myKeyMidiNum;
//    console.log(msg);
        
    for (let i=0; i< myMidiNoteList.length; i++) {
        num = myMidiNoteList[i];
        MidiNumber = num + myKeyMidiNum;
        if (MidiNumber < OPEN_STRING_SIX_MIDI || MidiNumber > OPEN_STRING_ONE_MIDI+NUM_FRETS) {
            console.log("out-of-range MidiNumber = ", MidiNumber);
            return;
        }
        let loc = getLocation(MidiNumber, g_position);
        var msg = "MidiNumber = " + MidiNumber + "loc.x = " + loc.x + " loc.y = " + loc.y;
//        console.log(msg);

        // put a circle around the Root
        if (num % 12 == 0) {
            // the dot isn't an object just a drawing stroke
            // so I can't save it with this design
            drawDot(ctxFrets, loc.x, yPos+loc.y, ROOT_CIRCLE_SIZE, false) 
            // false = unfilled dot, i.e. circle
        }
        if(loc.x == OPEN_STRING_DOT)
            isFilled = false;
        else
            isFilled = true;
        
        // draw the dot
        drawDot(ctxFrets, loc.x, yPos+loc.y, DOT_SIZE, isFilled);
    }
}


function getLocation(MidiNumber, position) {
        var noteX = 0
        var noteY = 0
        var msg = "getLocation(), MidiNumber = " + MidiNumber + " position = " + position; 
//        console.log(msg);
        if(MidiNumber < OPEN_STRING_SIX_MIDI || MidiNumber > OPEN_STRING_ONE_MIDI+NUM_FRETS) {
            console.log("out-of-range MidiNumber = ", MidiNumber);
            return;
        }
        msg = "MidiNumber < OPEN_STRING_FIVE_MIDI+position = " + MidiNumber + "<" + (OPEN_STRING_FIVE_MIDI + position) +
            "\nMidiNumber < OPEN_STRING_FOUR_MIDI+position = " + MidiNumber + "<" + (OPEN_STRING_FOUR_MIDI + position) +
            "\nMidiNumber < OPEN_STRING_THREE_MIDI+position = " + MidiNumber + "<" + (OPEN_STRING_THREE_MIDI + position) +
            "\nMidiNumber < OPEN_STRING_TWO_MIDI+position = " + MidiNumber + "<" + (OPEN_STRING_TWO_MIDI + position) +
            "\nMidiNumber >= OPEN_STRING_ONE_MIDI+position = " + MidiNumber + ">=" + (OPEN_STRING_ONE_MIDI + position);
//        console.log(msg);
        if (MidiNumber < (OPEN_STRING_FIVE_MIDI + position)) {
            noteY = H_STRING_SIX;
            noteX = OPEN_STRING_DOT + (MidiNumber - OPEN_STRING_SIX_MIDI)*FRET_WIDTH;
        }
        else if (MidiNumber < (OPEN_STRING_FOUR_MIDI + position)) {
            noteY = H_STRING_FIVE;
            noteX = OPEN_STRING_DOT + (MidiNumber - OPEN_STRING_FIVE_MIDI)*FRET_WIDTH;
        }
        else if (MidiNumber < (OPEN_STRING_THREE_MIDI + position)) {
            noteY = H_STRING_FOUR;
            noteX = OPEN_STRING_DOT + (MidiNumber - OPEN_STRING_FOUR_MIDI)*FRET_WIDTH;
        }   
        else if (MidiNumber < (OPEN_STRING_TWO_MIDI + position)) {
            noteY = H_STRING_THREE;
            noteX = OPEN_STRING_DOT + (MidiNumber - OPEN_STRING_THREE_MIDI)*FRET_WIDTH;
        }
        else if (MidiNumber < (OPEN_STRING_ONE_MIDI + position)) {
            noteY = H_STRING_TWO;
            noteX = OPEN_STRING_DOT + (MidiNumber - OPEN_STRING_TWO_MIDI)*FRET_WIDTH;
        }
        else if (MidiNumber >= (OPEN_STRING_ONE_MIDI + position)) {
            noteY = H_STRING_ONE
            noteX = OPEN_STRING_DOT + (MidiNumber - OPEN_STRING_ONE_MIDI)*FRET_WIDTH
        }
        var location = {x:noteX, y:noteY};
        return location;
}

function deleteDot(ctx, x, y) {
    var fillTheDot;
	if(x == OPEN_STRING_DOT) {
		fillTheDot = false;
		// this 'whites out" the previous dot, preparing for an open dot
		drawDot(ctx, x, y, ERASE_DOT_SIZE, true, "white");
		console.log('deleteDot() x='+x+' y='+y);
	} else {
		fillTheDot = true;
	}

	drawDot(ctx, x, y, ERASE_DOT_SIZE, fillTheDot, "white");
	// draw a fretboard line
	if(x != OPEN_STRING_DOT) {
		ctx.beginPath();
		ctx.moveTo( x-ERASE_DOT_SIZE, y );
		ctx.lineTo( x+ERASE_DOT_SIZE, y );
		ctx.stroke();
	}
}



function drawDot(ctx, x, y, radius, isFilled, color) {
//    var msg = "drawDot: x=" + x + " y =" + y;
//    console.log(msg);
    var deleteLoc;
    let myRadius = radius != null ? radius : DOT_SIZE;
    let fillDot = isFilled != null ? isFilled : true;

    ctx.beginPath();
    ctx.strokeStyle = color != null ? color : dotColor;
    ctx.fillStyle = color != null ? color : dotColor;
    ctx.arc(x, y, myRadius, 0, 2*Math.PI);
    
    if(fillDot) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
    ctx.strokeStyle = dotColor;
    ctx.fillStyle = dotColor;
//    ctx.beginPath();
}

function drawAnimatedDot(ctx, x, y, radius, isFilled, color) {
    var filledDot = isFilled
    // turn off the previous animated dot
    
//    console.log(animatedNote);
    
    if (animatedNote !== undefined)  {
        let xOld = animatedNote[0].x
        let yOld = animatedNote[0].y

//---------------- new code ----------------------
// TODO: keep track of an array of animatedNote so they can be removed 
// after as array grows to user defined 'ghost_trail' length
// i.e. if ghost_trail length is 3 then the note will remain on the Fretboard
// until two more notes have been played.  Default is all notes remain
// after the animatation has passed.  For scale examples this works well.
// For scales that change keys or melodies it is better to have the notes erased
// at some point after the animated note has passed.  A ghost_trail setting of 
// 1 means only the animated note will be shown.
// 
//        console.log('nonAnimatedDots.length='+nonAnimatedDots.length);
        if(g_ghostTrailLength == 0) {
			if(xOld == OPEN_STRING_DOT) {
				fillDot = false;
				// this 'whites out" the previous dot, preparing for an open dot
				drawDot(ctx, xOld, yOld, DOT_SIZE, true, "white");
//                console.log('drawDot() dotColor=white x='+xOld+' y='+yOld);
			} else {
				fillDot = isFilled;
			}
			// draw the regular color, i.e. back to normal
//            console.log("calling drawDot() dotColor="+ dotColor);
            drawDot(ctx, xOld, yOld, DOT_SIZE, fillDot, dotColor);
//            console.log('g_ghostTrailLength == 0');
//            console.log('drawDot() dotColor='+dotColor+' x='+xOld+' y='+yOld);
        } else {
 
            if(nonAnimatedDots.length >= g_ghostTrailLength) {
                deleteLoc = nonAnimatedDots.shift();
  //              console.log('nonAnimatedDots.length >= g_ghostTrailLength: nonAnimatedDots.shift() x='+deleteLoc.x+' y='+deleteLoc.y);
                xOld = deleteLoc.x;
                yOld = deleteLoc.y;

                deleteDot(ctx, xOld, yOld);
                
				numOfTrailingGhosts = nonAnimatedDots.length;
//				console.log('numOfTrailingGhosts='+numOfTrailingGhosts);
				if(numOfTrailingGhosts > 0) {
				    for(var i=0; i < numOfTrailingGhosts; i++) {
				        xOld = nonAnimatedDots[(numOfTrailingGhosts-1)-i].x;
				        yOld = nonAnimatedDots[(numOfTrailingGhosts-1)-i].y;
				        ghostColor = indexToGhostColor[i];
//				        console.log('ghostColor='+ghostColor);
                        drawDot(ctx, xOld, yOld, DOT_SIZE, fillDot, ghostColor);
				    }
				}
            } 
            else {
                console.log('else() x='+xOld+' y='+yOld);
				if(xOld == OPEN_STRING_DOT) {
					fillDot = false;
					// this 'whites out" the previous dot, preparing for an open dot
					drawDot(ctx, xOld, yOld, DOT_SIZE, true, "white");
//                    console.log('drawDot() dotColor=white x='+xOld+' y='+yOld);
				} else {
					fillDot = isFilled;
				}
				numOfTrailingGhosts = nonAnimatedDots.length;
//				console.log('numOfTrailingGhosts='+numOfTrailingGhosts);
				if(numOfTrailingGhosts > 0) {
				    for(var i=0; i < numOfTrailingGhosts; i++) {
				        xOld = nonAnimatedDots[(numOfTrailingGhosts-1)-i].x;
				        yOld = nonAnimatedDots[(numOfTrailingGhosts-1)-i].y;
				        ghostColor = indexToGhostColor[i];
//				        console.log('ghostColor='+ghostColor);
                        drawDot(ctx, xOld, yOld, DOT_SIZE, fillDot, ghostColor);
				    }
				}

				if(nonAnimatedDots.length >= g_ghostTrailLength) {
                    deleteDot(ctx, xOld, yOld)
				} else {
                    drawDot(ctx, xOld, yOld, DOT_SIZE, fillDot, dotColor);
//                    console.log('drawDot() dotColor='+dotColor+' x='+xOld+' y='+yOld);
                }
            }
        }
        if(nonAnimatedDots.length >= g_ghostTrailLength) {
            nonAnimatedDots.shift();
        }

        animatedNote = []; // delete the animatedNote
//        animatedNote = undefined;
    } else {
        animatedNote = [];
//        console.log('NOTHING but animatedNote = {}');
    }

    fillDot = isFilled;    
    // draw the new dot
//    console.log("calling drawDot() dotColor="+ color);
    drawDot(ctx, x, y, radius, fillDot, color);
//    console.log('final drawDot() dotColor='+color+' x='+x+' y='+y);
    let loc = {x:x, y:y}
    animatedNote[0] = loc;
	if(g_ghostTrailLength > 0) {
		nonAnimatedDots.push(animatedNote[0]);
//		console.log('PUSH: animatedNote[0].x='+animatedNote[0].x+' animatedNote[0].y='+animatedNote[0].y);
	}

}

function clearLastAnimatedDot() {
    animatedNote = undefined;
}


function drawAnimatedChordDot(ctx, x, y, radius, isFilled, color) {
    var filledDot = isFilled
    var msg = "drawAnimatedChordDot() animatedChordNotes.length=" + animatedChordNotes.length + " animatedChordNotes=" + animatedChordNotes;
//    console.log(msg);
    var msg = "chordIsCompletelyDrawn=" + chordIsCompletelyDrawn;
//    console.log(msg);
    // turn off the previous animated dots
    if(chordIsCompletelyDrawn) {
        for(let i=0; i < animatedChordNotes.length; i++) {
			var xOld = animatedChordNotes[i].x
			var yOld = animatedChordNotes[i].y
			if(xOld == OPEN_STRING_DOT) {
				fillDot = false;
				// this 'whites out" the previous dot, preparing for an open dot
				drawDot(ctx, xOld, yOld, ERASE_DOT_SIZE, true, "white");
			} else {
				fillDot = isFilled;
			}
			// white out the previous dot
			drawDot(ctx, xOld, yOld, ERASE_DOT_SIZE, fillDot, "white");
            // draw a fretboard line
            if(xOld != OPEN_STRING_DOT) {
				ctx.beginPath();
				ctx.moveTo( xOld-ERASE_DOT_SIZE, yOld );
				ctx.lineTo( xOld+ERASE_DOT_SIZE, yOld );
				ctx.stroke();
            }
        }
        animatedChordNotes = [];

    }

	if(x == OPEN_STRING_DOT) {
	    fillDot = false;
	} else {
        fillDot = isFilled;
    }
    // draw the new dot
    drawDot(ctx, x, y, radius, fillDot, color);
}


// chord parameter is an array of note names 
// i.e. A3,C4,E4 in ascending pitch order
function animateChord(chord) {
    var note;
    var MidiNum;
    var loc;
    var locIndex = 0;
//    console.log("animateChord() chord="+chord);

    // this cycles through the chord notes from highest to lowest
    // and forces the next lower note to be on a different string
    // from the previous note.
    for(let i=(chord.length-1); i>=0; i--) {
        note = chord[i];
        MidiNum = getKeyMidiNumber(note);
        var loc = getLocation(MidiNum, g_position);
        // check to see if new fretboard loc is on the 
        // same string as the prev note
        if(prevLocY == loc.y) {
            // get new location on next lower pitched string
            stringNum = getNextLowerString(loc.y)
            if(stringNum != -1)
                loc = getLocationOnString(MidiNum, stringNum);
        }
        drawAnimatedChordDot(ctxFrets, loc.x, loc.y, DOT_SIZE, true, animatedDotColor);
        animatedChordNotes.push(loc);
//        animatedChordNotes[locIndex] = loc;
//        console.log("animatedChordNotes.length=" + animatedChordNotes.length);
        locIndex++;
        prevLocY = loc.y;
        chordIsCompletelyDrawn = false
    }
    chordIsCompletelyDrawn = true;
}

function getNextLowerString(location) {
    if(location == H_STRING_ONE)
        return 2;        
    else if(location == H_STRING_TWO)
        return 3;
    else if(location == H_STRING_THREE)
        return 4;        
    else if(location == H_STRING_FOUR)
        return 5;        
    else if(location == H_STRING_FIVE)
        return 6;        
    else
        return -1;        
}

function getLocationOnString(MidiNum, stringNum) {
    var startMidi = 0;
    var noteX;
    var noteY;
	if(stringNum == 1) {
	    startMidi = OPEN_STRING_ONE_MIDI;
	    noteY = H_STRING_ONE;
	} else if(stringNum == 2) {
	 	startMidi = OPEN_STRING_TWO_MIDI;
	    noteY = H_STRING_TWO;
	} else if(stringNum == 3) {
	 	startMidi = OPEN_STRING_THREE_MIDI;
	    noteY = H_STRING_THREE;
	} else if(stringNum == 4) {
		startMidi = OPEN_STRING_FOUR_MIDI;
	    noteY = H_STRING_FOUR;
	} else if(stringNum == 5) {
		startMidi = OPEN_STRING_FIVE_MIDI;
	    noteY = H_STRING_FIVE;
	} else if(stringNum == 6) {
		startMidi = OPEN_STRING_SIX_MIDI;
	    noteY = H_STRING_SIX;
	}
	
	var numFretsUpTheNeck = MidiNum - startMidi;
    noteX = OPEN_STRING_DOT + numFretsUpTheNeck*FRET_WIDTH
    var location = {x:noteX, y:noteY};
    return location;
}

function animateFretDot(note) {
    var MidiNum = getMidiNumberOfNotename(note)
    let loc = getLocation(MidiNum, g_position)
    drawAnimatedDot(ctxFrets, loc.x, loc.y, DOT_SIZE, true, animatedDotColor);
}



    return {
        clearFretCanvas: clearFretCanvas,
        drawFretboard: drawFretboard,
        makePositionMenu: makePositionMenu,
        makeMenus: makeMenus,
        init: init,
        setFretboardPosition: setFretboardPosition,
        setGhostTrailValue: setGhostTrailValue,
        animateFretDot: animateFretDot,
        drawFretboardNotes: drawFretboardNotes,
        redrawFretboardNotes : redrawFretboardNotes,
        animateChord: animateChord,
        clearLastAnimatedDot: clearLastAnimatedDot
    };

// end of "Fretboard" self-invoking module
})();

