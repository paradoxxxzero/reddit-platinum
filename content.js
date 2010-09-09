/*
  reddit platinum : reddit plugin that simplifies keyboard navigation and allows to hide some layout parts

    Copyright (C) 2010 Mounier Florian aka paradoxxxzero

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
*/

var _debug = false;
var isUpsideDown = false;
var keysOn = true;
var alreadyRequested;
var currentTopic = 1;
var commentMode = $(".commentarea").length != 0;
// comment in non comment mode are for the profile page, message are for mails
var topics = commentMode ?
    $(".commentarea").children(".sitetable").find(".thing.comment").children(".entry") :
    $("#siteTable > .thing.link,#siteTable > .thing.comment,#siteTable > .thing.message");

// Listen to the body for any DOM modifications
$("#siteTable").bind("DOMNodeInserted", mustUpdateTopics);
$(".commentarea").bind("DOMNodeInserted", disableKeysOnInput);
disableKeysOnInput();

function disableKeysOnInput() {
    $("input,textarea").focus(function () {
	keysOn = false;
    });
    $("input,textarea").blur(function () {
	keysOn = true;
    });
}

function mustUpdateTopics() {
    if(alreadyRequested) return;
    alreadyRequested = true;
    setTimeout(updateTopics, 500);
}

// Uncaching topics to allow dom modifications
function updateTopics() {
    topics = commentMode ?
	$(".commentarea").children(".sitetable").find(".thing.comment").children(".entry") :
	$("#siteTable > .thing.link,#siteTable > .thing.comment,#siteTable > .thing.message");
    topics.css({border: '1px solid #fff'});
    topic().css({ backgroundColor: '#eee', borderTopColor: '#ccc', borderBottomColor: '#ccc', borderLeftColor: '#ccc', borderRightColor: '#ccc' }, 500);
    disableKeysOnInput();
    alreadyRequested = false;
}

if(!has(topics)) {
    throw "No topics found";
}
$(document).keydown(keyd);
$(document).mousewheel(scrolld);

topics.css({border: '1px solid #fff'});
highlightCurrentTopic();

function topic() {
    return $(topics[currentTopic - 1]);
}

function highlightCurrentTopic() {
    topic().animate({ backgroundColor: '#eee', borderTopColor: '#ccc', borderBottomColor: '#ccc', borderLeftColor: '#ccc', borderRightColor: '#ccc' }, 500);
    _log("Highlighted topic : " + currentTopic);
}
function lowlightCurrentTopic() {
    topic().animate({ backgroundColor: '#fff', borderTopColor: '#fff', borderBottomColor: '#fff', borderLeftColor: '#fff', borderRightColor: '#fff'}, 500);
    _log("Delighted topic : " + currentTopic);
}
function scrollToCurrentTopic(fromAbove) {
    var topicOffset = topics[currentTopic - 1].offsetTop;
    if(!topic().is(":visible") || topicOffset == 0) {
	// Invisible topic/comment or unpositionned -> skipping next

	// If an end is encoutered -> change side
	isUpsideDown = isUpsideDown || (currentTopic == 1 || currentTopic == topics.length);

	_log("Descending " + currentTopic);
	(isUpsideDown ? !fromAbove : fromAbove) ? nextTopic(1, true) : previousTopic(1, true);
	_log("Monting " + currentTopic);
	return;
    }
    var actual = topicOffset - $('body').scrollTop();
    var turnAround = (isUpsideDown ? !fromAbove : fromAbove); // Get real direction
    if((turnAround && actual  > (window.innerHeight / 2))     // Going down cross the middle
       || (!turnAround && actual < (window.innerHeight / 2))  // Going up cross the middle
       || (actual < 0) || (actual > window.innerHeight)) {    // Negative or greater than screen ?! Page must have been manually scrolled, rescrolling
	var bodyScroll = topicOffset - window.innerHeight / 2;
 	$('body').stop(true, true);
	$('body').animate({ scrollTop: bodyScroll}, 500);
    }
    isUpsideDown = false;
}
function openCurrent(shift) {
    var link = topic().children("div.entry").children("p.title").children("a.title").attr('href');
    if(!link) return;
    if(!link.match('f?(ht)?tps?://')) link = 'http://www.reddit.com' + link;
    chrome.extension.sendRequest({url: link, focus: !shift});
}
function openCurrentComment(shift) {
    var link = topic().children("div.entry").children("ul.flat-list").children("li.first").children("a.comments").attr('href');
    if(!link) return;
    if(!link.match('f?(ht)?tps?://')) link = 'http://www.reddit.com' + link;
    chrome.extension.sendRequest({url: link, focus: !shift});
}
function upvote() {
    if(commentMode) topic().parent().children("div.midcol").children("div.up,div.upmod").click();
    else topic().children("div.midcol").children("div.up,div.upmod").click();
}
function downvote() {
    if(commentMode) topic().parent().children("div.midcol").children("div.down,div.downmod").click();
    else topic().children("div.midcol").children("div.down,div.downmod").click();
}
function previousTopic(n, noanim) {
    if(currentTopic < 1 + n) return;
    if(!noanim) lowlightCurrentTopic();
    currentTopic -= n;
    scrollToCurrentTopic(false);
    if(!noanim) highlightCurrentTopic();
}
function nextTopic(n, noanim) {
    if(currentTopic + n > topics.length ) return;
    if(!noanim) lowlightCurrentTopic();
    currentTopic += n;
    scrollToCurrentTopic(true);
    if(!noanim) highlightCurrentTopic();
}
function firstTopic() {
    lowlightCurrentTopic();
    currentTopic = 1;
    highlightCurrentTopic();
    scrollToCurrentTopic(false);
}
function lastTopic() {
    lowlightCurrentTopic();
    currentTopic = topics.length;
    scrollToCurrentTopic(true);
    highlightCurrentTopic();
}
function hideTopic() {
    if(commentMode) {
	if(topic().children("div.collapsed").is(':visible')) topic().children("div.collapsed").children("a.expand").click();
	else topic().children("div.noncollapsed").children("p.tagline").children("a.expand").click();
    }
    else topic().children("div.entry").children("ul.flat-list").find(".state-button.hide-button").find("a").click();    
}
function expando() {
    if(commentMode) $(topic().children("div.noncollapsed").children("ul.flat-list").children("li")[topic().children("div.noncollapsed").children("ul.flat-list").children("li").length - 1]).children("a").click();
    else topic().children("div.entry").children("div.expando-button").click();    
}

function keyd(event) {
    if(!keysOn) return true;
    if(event.keyCode == 38) { // Up
	if(event.ctrlKey) {
	    upvote();
	} else {
	    if(commentMode) {
		if(event.shiftKey) previousSibling();
		else if(event.altKey || event.metaKey) previousParent();
		else previousTopic(1);
	    } else { 
		previousTopic(1);
	    }
	}
    } else if (event.keyCode == 40) { //Down
	if(event.ctrlKey) {
	    downvote();
	} else {
	    if(commentMode) {
		if(event.shiftKey) nextSibling();
		else if(event.altKey || event.metaKey) nextParent();
		else nextTopic(1);
	    } else { 
		nextTopic(1);
	    }
	}
    } else if(event.keyCode == 33) { // Page Up
	previousTopic(5);
    } else if(event.keyCode == 34) { // Page Down
	nextTopic(5);	
    } else if(event.keyCode == 36) { // Begin
	firstTopic();
    } else if(event.keyCode == 35) { // End
	lastTopic();
    } else if(event.keyCode == 46) { // Del
	hideTopic();
    } else if(event.keyCode == 13 || event.keyCode == 39) { // Enter or Left
	openCurrent(event.shiftKey);
    } else if(event.keyCode == 37) { // Right
	openCurrentComment(event.shiftKey);
    } else if(event.keyCode == 32) { // Space
	expando();
    } else if(event.keyCode == 27) { // Escape
	self.close();
    } else {
	return true;
    }
    event.stopPropagation();
    return false;
}
function scrolld (event, delta) {
    if(delta < 0) {
	    if(commentMode) {
		if(event.shiftKey) nextSibling();
		else if(event.altKey || event.metaKey) nextParent();
		else nextTopic(1);
	    } else { 
		nextTopic(1);
	    }
    } else {
	    if(commentMode) {
		if(event.shiftKey) previousSibling();
		else if(event.altKey || event.metaKey) previousParent();
		else previousTopic(1);
	    } else { 
		previousTopic(1);
	    }
    }
    event.stopPropagation();
    return false;
}

function previousSibling() {
    lowlightCurrentTopic();
    var oldCurrentTopic = currentTopic;
    var currentLevel = topic().parents().length;
    while(currentTopic > 1) {
	currentTopic--;
	if(topic().parents().length == currentLevel) { // 3 levels between each comment level
	    scrollToCurrentTopic(true);
	    highlightCurrentTopic();
	    return;
	}
    }
    currentTopic = oldCurrentTopic;
    highlightCurrentTopic();
}

function nextSibling() {
    lowlightCurrentTopic();
    var oldCurrentTopic = currentTopic;
    var currentLevel = topic().parents().length;
    while(currentTopic < topics.length) {
	currentTopic++;
	if(topic().parents().length == currentLevel) { // 3 levels between each comment level
	    scrollToCurrentTopic(true);
	    highlightCurrentTopic();
	    return;
	}
    }
    currentTopic = oldCurrentTopic;
    highlightCurrentTopic();
}
function previousParent() {
    lowlightCurrentTopic();
    var oldCurrentTopic = currentTopic;
    var currentLevel = topic().parents().length;
    while(currentTopic > 1) {
	currentTopic--;
	if(topic().parents().length == currentLevel - 3) { // 3 levels between each comment level
	    scrollToCurrentTopic(true);
	    highlightCurrentTopic();
	    return;
	}
    }
    currentTopic = oldCurrentTopic;
    highlightCurrentTopic();
}

function nextParent() {
    lowlightCurrentTopic();
    var oldCurrentTopic = currentTopic;
    var currentLevel = topic().parents().length;
    while(currentTopic < topics.length) {
	currentTopic++;
	if(topic().parents().length == currentLevel - 3) { // 3 levels between each comment level
	    scrollToCurrentTopic(true);
	    highlightCurrentTopic();
	    return;
	}
    }
    currentTopic = oldCurrentTopic;
    highlightCurrentTopic();
}
function has(thing) {
    return thing.length > 0;
}

function _log(toLog) {
    if(_debug) console.log(toLog);
}
function turnOnDebug() {
    _debug = true;
}
