/*
MIT License

Copyright (c) 2022 Malte Neugebauer, Hochschule Bochum

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


///START AL QUIZ SCRIPT///
class QuestionGroup {
    constructor(id, description, Questions, nextGroup) {
        this.id = id;
        this.description = description;
        this.Questions = {};
        if (!!Questions) {
            Questions.forEach(Question => {
                this.Questions[Question.id] = Question;
            });
        }
    }
}

class BubbleInfo {
    constructor(stateStringAssociation) {
        /*this.success = success;
        this.validation = validation;
        this.failure = failure;
        this.redo = redo;
        this.camebackaftersuccess = camebackaftersuccess;
        this.error = error;*/
        for(let i in stateStringAssociation) {
            this[i] = stateStringAssociation[i];
        }
    }

    getText(state) {
        if (this[state] != undefined) {
            return this[state];
        }
        return undefined;
    }
}

class Instruction {
	constructor(id, description, onsuccess, onfailure, BubbleInfo, questionsOnPage) {
		this.id = id;
		/* success means: challenge accepted and go to endboss*/
		this.onsuccess = onsuccess;
		/*failure means: give me the first easy question*/
		this.onfailure = onfailure;
        this.description = description;
        this.BubbleInfo = BubbleInfo;

        this.questionsOnPage = questionsOnPage == undefined ? 1 : questionsOnPage;
	}
	
	isSolved() {
		return false;
	}

    isCurrentlySolved() {
        return false;
    }
}

class Question extends Instruction {
    constructor(id, description, needs, BubbleInfo, onsuccess, onfailure, askBeforeSkip, questionsOnPage) {
        super(id, description, onsuccess, onfailure, BubbleInfo, questionsOnPage);
        this.needs = needs;
        this.solved = 0;
        /*solved means: solved at least once in this attempt, currentlySolved means: solved actually now in the current scope of js variables*/
        this.currentlySolved = 0;
        this.askBeforeSkip = askBeforeSkip == undefined ? true : askBeforeSkip;
    }

    isSolved(onlyOnCurrentlySolved) {
        if(onlyOnCurrentlySolved == undefined) {
            onlyOnCurrentlySolved = false;
        }
        let solvedAtAskedTime = (!onlyOnCurrentlySolved ? this.solved : this.currentlySolved);
        if (solvedAtAskedTime >= this.needs) {
            return true;
        }
        return false;
    }

    ifCurrentlySolved() {
        if (this.currentlySolved >= this.needs) {
            return true;
        }
        return false;
    }
}

class Quiz {
    constructor(QuestionGroups, currentQuestionId) {
        this.QuestionGroups = QuestionGroups;
        this.currentQuestionId = currentQuestionId;
        if (this.currentQuestionId == undefined) {
            this.currentQuestionId = Object.keys(this.QuestionGroups[0].Questions)[0];
        }

        //auto assign onsuccess and onfailure for undefined
        let grouplength = this.QuestionGroups.length;
        for (let i = 0; i < grouplength; i++) {
            let questionlength = Object.keys(this.QuestionGroups[i].Questions).length;
            for (let j = 0; j < questionlength; j++) {
                if (!this.QuestionGroups[i].Questions[Object.keys(this.QuestionGroups[i].Questions)[j]].onsuccess) {
                    //probably next question or next group
                    if (j < questionlength - 1) {
                        //next question
                        this.QuestionGroups[i].Questions[Object.keys(this.QuestionGroups[i].Questions)[j]].onsuccess = Object.keys(this.QuestionGroups[i].Questions)[j + 1];
                    } else if (i < grouplength - 1) {
                        //console.log(Object.keys(this.QuestionGroups[i].Questions)[j] + " leads to next group onsuccess ");
                        //first question of next group
                        this.QuestionGroups[i].Questions[Object.keys(this.QuestionGroups[i].Questions)[j]].onsuccess = Object.keys(this.QuestionGroups[i + 1].Questions)[0];
                    } else {
                        //console.log("no other group");
                        this.QuestionGroups[i].Questions[Object.keys(this.QuestionGroups[i].Questions)[j]].onsuccess = "_finish";
                    }
                }

                if (!this.QuestionGroups[i].Questions[Object.keys(this.QuestionGroups[i].Questions)[j]].onfailure) {
                    //probably first question of next group
                    if (i < grouplength - 1) {
                        //console.log(Object.keys(this.QuestionGroups[i].Questions)[j] + " leads to next group onfailure ");
                        this.QuestionGroups[i].Questions[Object.keys(this.QuestionGroups[i].Questions)[j]].onfailure = Object.keys(this.QuestionGroups[i + 1].Questions)[0];
                    } else {
                        //console.log("no other group");
                        this.QuestionGroups[i].Questions[Object.keys(this.QuestionGroups[i].Questions)[j]].onfailure = "_finish";
                    }
                }
            };
        }
    }

    getQuestions() {
        let objects = [];
        this.QuestionGroups.forEach(QuestionGroup => {
            for (let k in QuestionGroup.Questions) {
                objects.push(QuestionGroup.Questions[k]);
            }
        });
        return objects;
    }

    getQuestion(id) {
        if (id == undefined) {
            id = this.currentQuestionId;
        }
        for (let i = 0; i < this.QuestionGroups.length; i++) {
            if (this.QuestionGroups[i].Questions[id] != undefined) {
                return this.QuestionGroups[i].Questions[id];
            }
        }
        return false;
    }

    getNextQuestionId(questionId) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }
        let returnValue = false;
        for (let i = 0; i < this.QuestionGroups.length; i++) {
            if (QuestionGroups[i].Questions[questionId] != undefined) {
                let nextStep = QuestionGroups[i].Questions[questionId].isSolved() ? QuestionGroups[i].Questions[questionId].onsuccess : QuestionGroups[i].Questions[questionId].onfailure;
                switch (nextStep) {
                    case "_finish":
                        return -1;
                    default:
                        return nextStep;
                        break;
                }
            }
        }
        console.log("question id not found");
        return false;
    }

    getPageURL(questionId) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }

        let firstQuestionNavElement = document.querySelector("#quiznavbutton1");
        if (!firstQuestionNavElement) {
            return false;
        }
        let plainUrl = "";
        if (!firstQuestionNavElement.href || firstQuestionNavElement.href == "#") {
            plainUrl = window.location.href;
        } else {
            plainUrl = firstQuestionNavElement.href;
        }

        //let sanitizedUrl = plainUrl.replace(/(.*?)(?:#|&page=\d*#*|&scrollpos=\d*#*)/, "\1");
        let sanitizedUrl = plainUrl;
        let relPos = plainUrl.indexOf("&scrollpos");
        if (relPos == -1) {
            relPos = plainUrl.indexOf("&page");
            if (relPos == -1) {
                relPos = plainUrl.indexOf("#");
            }
        }

        if (relPos > -1) {
            sanitizedUrl = plainUrl.substr(0, relPos);
        }

        return sanitizedUrl + "&page=" + this.getQuestion(questionId).page
    }

    getNextPageInfo(questionId, forceURL) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }
        let Question = this.getQuestion(questionId);

        if(forceURL == undefined) {
            forceURL = false;
        }

        let nextPageUrl = "";
        let nextPageLinkText = "";
        let nextQuestionId = this.getNextQuestionId();
        let possibleNextPageUrl = this.getPageURL(nextQuestionId);

        if (nextQuestionId == -1) {
            //finish
            let finishAttemptElement = document.querySelector(".endtestlink.aalink");
            if (!finishAttemptElement || !finishAttemptElement.href) {
                possibleNextPageUrl = "summary.php";
            } else {
                possibleNextPageUrl = finishAttemptElement.href;
            }
            nextPageLinkText = "&Uuml;bung beenden";
        }
        else {
            nextPageLinkText = "N&auml;chste Frage";
        }

        //actually means a real skip, no right or wrong
        if(Question.askBeforeSkip == true  && !forceURL && !Question.isSolved() && document.querySelector(".stackprtfeedback") == undefined) {
            //ask before skip
            nextPageUrl = "javascript:showAskBeforeSkipModal();";
            document.querySelector(".skip-yes").href = possibleNextPageUrl;
        }
        else {            
             nextPageUrl = possibleNextPageUrl;
        }
        return {
            url: nextPageUrl,
            linkText: nextPageLinkText
        };
    }

    updateMoodleNavButtons() {
        let buttonDivs = document.querySelectorAll(".submitbtns");
        buttonDivs.forEach(buttonDiv => {
            buttonDiv.childNodes.forEach(buttonDivChild => {
                buttonDivChild.style.visibility = "hidden";
                buttonDivChild.style.width = "0";
            });
        });

        let cameFrom = sessionStorage.getItem("camefrom");
        if(cameFrom == undefined) {
            let previousPageButton = document.getElementById("mod_quiz-prev-nav");
            if(previousPageButton != undefined) {
                previousPageButton.value = "Zurück";
                previousPageButton.style.visibility = "visible";
                previousPageButton.style.width = "auto";  
            }
        }
        else {
            let prevButton = document.createElement("a");
            prevButton.classList.add("btn", "btn-primary", "btn-prev-question");
            prevButton.href = this.getPageURL(cameFrom);
            prevButton.innerHTML = "Zur&uuml;ck";

            buttonDivs.forEach(buttonDiv => {
                buttonDiv.insertBefore(prevButton, buttonDiv.firstChild);
            });

            sessionStorage.removeItem("camefrom");
        }

        let nextButton = document.createElement("a");
        nextButton.classList.add("btn", "btn-primary", "btn-next-question");
        let nextPageInfos = this.getNextPageInfo();
        nextButton.href = nextPageInfos.url;
        nextButton.innerHTML = nextPageInfos.linkText;

        buttonDivs.forEach(buttonDiv => {
            buttonDiv.appendChild(nextButton);
        });
    }

    updateSpeechBubbles(id) {
        if (id == undefined) {
            id = this.currentQuestionId;
        }
        let currQuestion = this.getQuestion(id);
        if (!currQuestion || !currQuestion.BubbleInfo) {
            return false;
        }
        let bubbles = document.querySelectorAll(".bubble:not(.in-modal)");
        if (bubbles.length != 1) {
            console.log("bad amount of speech bubbles");
            return false;
        }
        let bubble = bubbles[0];
        let text = "";

        let icon = document.querySelector(".dm-icon");
        let iconUrls = {
            grin:"https://marvin.hs-bochum.de/~mneugebauer/dm-avatar-grin.svg",
            think:"https://marvin.hs-bochum.de/~mneugebauer/dm-avatar-think.svg",
            sad:"https://marvin.hs-bochum.de/~mneugebauer/dm-avatar-sad.svg",
            happy:"https://marvin.hs-bochum.de/~mneugebauer/dm-avatar-happy.svg"
        };
        let imgReaction = "";

        //on instruction, the revisit property of the bubble info plays a special role, so...
        if(currQuestion instanceof Instruction && !(currQuestion instanceof Question) && currQuestion.visited == true) {
            let revisitText = currQuestion.BubbleInfo.getText("revisit");
            if(revisitText != "" && revisitText != undefined) {
                text = revisitText;
            }
        }

        //get current state of question
        let stackFeedback = document.querySelector(".stackprtfeedback");
        if (stackFeedback != undefined) {
            //solved, false or partially correct

            //only move feedback to the speech bubble on one feedback field
            let stackFeedbacks = document.querySelectorAll(".stackprtfeedback");

            if (currQuestion.isSolved(true) == true) {
                imgReaction = "happy";
                if (currQuestion.BubbleInfo.getText("success") == undefined) {
                    if (stackFeedbacks.length == 1) {
                        //move the stack feedback in the speech bubble by default and add "N&auml;chste Frage/&Uuml;bung beenden"
                        let stackFeedbackInWords = "";//stackFeedback.querySelector("div");
                        let first = true;
                        //console.log(stackFeedback.childNodes);
                        stackFeedback.childNodes.forEach(function(childNode) {
                            //console.log(childNode.innerHTML);
                            if(first == false) { stackFeedbackInWords += " "; } else { first = false; }
                            if(childNode.innerHTML != undefined && childNode.innerHTML != "" && childNode.tagName != "SCRIPT") {
                                stackFeedbackInWords += childNode.innerHTML;
                            }
                        });
                        if (stackFeedbackInWords == "" /*stackFeedbackInWords == undefined || stackFeedbackInWords.innerHTML == undefined || stackFeedbackInWords.innerHTML == ""*/) {
                            text = "Richtig!";
                            console.log("no feedback found to move");
                        }
                        let nextPageInfos = this.getNextPageInfo();
                        text = stackFeedbackInWords + "Wenn es dir mehr Sicherheit gibt, kannst du diese <a href=\"javascript:;\" onclick=\"repeatQuestion();\">Aufgabe wiederholen</a>. Ansonsten bist du bereit f&uuml;r die <a href=\"" + nextPageInfos.url + "\">" + nextPageInfos.linkText + "</a>.";
                        stackFeedback.style.display = "none";
                    }
                    else {
                        text = "Richtig!";
                        console.log("using standard speech-bubble-feedback because of undefined feedback text for solved state and too many feedback fields")
                    }
                }
                else {
                    text = currQuestion.BubbleInfo.getText("success");
                }
            }
            else {
                //false or partially correct
                imgReaction = "sad";
                if (currQuestion.BubbleInfo.getText("failure") == undefined) {
                    console.log("no fail text");
                    if (stackFeedbacks.length == 1) {
                        //move the stack feedback in the speech bubble by default and add "Erneut versuchen"
                        let stackFeedbackInWords = "";/*stackFeedback.querySelector("div");*/
                        let first = true;
                        stackFeedback.childNodes.forEach(function(childNode) {
                            //console.log(childNode.innerHTML);
                            if(first == false) { stackFeedbackInWords += " "; } else { first = false; }
                            if(childNode.innerHTML != undefined && childNode.innerHTML != "" && childNode.tagName != "SCRIPT") {
                                stackFeedbackInWords += childNode.innerHTML;
                            }
                        });
                        
                        if (stackFeedbackInWords == ""/* || stackFeedbackInWords.innerHTML == undefined || stackFeedbackInWords.innerHTML == ""*/) {
                            text = "Falsch!";
                            console.log("no feedback found to move");
                        }
                        
                        
                        let nextPageInfos = this.getNextPageInfo();
                        text = stackFeedbackInWords + " Erneut versuchen? <a href=\"#\" onclick=\"document.querySelector('input[name*=redoslot]').click();\">Ja</a> <a href=\"" + nextPageInfos.url + "\">Nein (" + nextPageInfos.linkText + ")</a>"
                        stackFeedback.style.display = "none";
                    }
                    else {
                        text = "Falsch.";
                        console.log("using standard speech-bubble-feedback because of undefined feedback text for failure state and too many feedback fields")
                    }
                }
                else {
                    text = currQuestion.BubbleInfo.getText("failure");
                }
            }
        }
        else {
            //verfication, syntax error or came back to main question
            if (document.querySelector(".validationerror") != undefined) {
                //verification state
                text = currQuestion.BubbleInfo.getText("validation") == undefined ? "Wurde deine Eingabe richtig interpretiert? <a href=\"#\" onclick=\"document.querySelector('input[id*=q][name$=_-submit]').click();\">Ja</a> <a href=\"#\" onclick=\"this.parentNode.innerHTML='&Auml;ndere deine Eingabe und klicke erneut auf &quot;Pr&uuml;fen&quot;'\">Nein</a>" : currQuestion.BubbleInfo.getText("validation");
            }
            else if(document.querySelector(".alert") != undefined) {
                //syntax error
                imgReaction = "think";
                text = currQuestion.BubbleInfo.getText("error") == undefined ? "Oh! Offenbar gibt es einen Fehler bei der Eingabe. Bitte schau dir den Hinweis am Eingabefeld an, korrigiere und klicke erneut auf Pr&uuml;fen." : currQuestion.BubbleInfo.getText("error");
            }
            /*else {
                //came back to main question after the last of this group is solved
                console.log("start routine to check for coming back");
                let i = 0;
                for (i in this.QuestionGroups) {
                    if (QuestionGroups[i].Questions[this.currentQuestionId] != undefined) {
                        break;
                    }
                }
                //console.log(this.currentQuestionId + " is in group " + i);
                let keys = Object.keys(this.QuestionGroups[i].Questions);
                if (keys[0] == this.currentQuestionId) {
                    //console.log(this.currentQuestionId + " is the first question of this group");
                    if (this.QuestionGroups[i].Questions[keys[keys.length - 1]] != undefined && this.QuestionGroups[i].Questions[keys[keys.length - 1]].isSolved() == true) {
                        console.log("came back after solving last question of group");
                        if (currQuestion.BubbleInfo.getText("camebackaftersuccess") == undefined) {
                            text = "Willkommen zur&uuml;ck zu dieser Aufgabe. Haben dir die letzten Aufgaben geholfen, diese Aufgabe zu verstehen? Versuche es doch nochmal! Gehe ansonsten weiter zur n&auml;chsten Aufgabe.";
                        } else {
                            text = currQuestion.BubbleInfo.getText("camebackaftersuccess");
                        }
                        currQuestion.onfailure = currQuestion.onsuccess;
                        //this.updateMoodleNavButtons();
                    }
                }
            }*/
            //if(in verification state)
            //text = Question.BubbleInfo.getText("verify") == undefined ? "Wurde deine Eingabe richtig interpretiert? %check% <a onclick=\"...\">Nein</a>" : Question.BubbleInfo.getText("verify");
            //else if(in false state)
            //else if(in syntax error state)
            //else if(in redo state)
            //else
            //assume initial state
            //text = Question.BubbleInfo.getText("initial")
        }

        //bubble.classList.remove("hidden");

        if (text != "") {
            //append special links to text, e. g. %nextlink%, %linktoquestionid_id%, %check%
            bubble.innerHTML = text;
        }
        if(imgReaction != "" && icon != undefined) {
            icon.src = iconUrls[imgReaction];
        }

        return true;
    }
    
    updateNavigation() {
    	let navPanel = document.querySelector(".qn_buttons");
    	if(!navPanel) {
    		return false;
    	}
    	let buttons = document.querySelectorAll("[id*=quiznavbutton]");
    	if(buttons.length == undefined || buttons.length < 1) {
    		return false;
    	}
    	//group
    	//let groupHeadingNodes = [];
    	this.QuestionGroups.forEach(QuestionGroup => {
    		let wrapper = document.createElement("span");
    		wrapper.dataset.isFor = QuestionGroup.id;
    		//groupHeadingNodes.push(heading);
    		
    		let heading = document.createElement("h2");
    		heading.innerHTML = QuestionGroup.description;
    		heading.style.clear = "left";
    		wrapper.appendChild(heading);
    		
    		let j = 0;
            let k = 1;
    		let questionAmount = Object.keys(QuestionGroup.Questions).length;
    		for(let i in QuestionGroup.Questions) {
                //console.log("quiznavbutton"+(QuestionGroup.Questions[i].page+1));
    			let questionCard = document.getElementById("quiznavbutton"+(QuestionGroup.Questions[i].page+1));

                questionCard.querySelectorAll(".accesshide").forEach(slotMarker => {
                    if(slotMarker != undefined && slotMarker.nextSibling != undefined) {
                        if(!(QuestionGroup.Questions[i] instanceof Question) && QuestionGroup.Questions[i] instanceof Instruction) {
                            //assume first question to be instructions
                            slotMarker.nextSibling.data = "i";
                        }
                        else if(j < questionAmount-1) {
                            slotMarker.nextSibling.data = k;
                            k++;
                        }
                        else {
                            slotMarker.nextSibling.data = "";
                            let endbossImg = document.createElement("img");
                            endbossImg.src = "https://marvin.hs-bochum.de/~mneugebauer/skull.svg";
                            endbossImg.style.height = "20px";
                            slotMarker.parentNode.insertBefore(endbossImg, slotMarker.nextSibling);
                        }
                    }
                });
                if(!questionCard) {
                    console.log("bad question card id for question "+QuestionGroup.Questions[i].id);
                }
                else {
                    wrapper.appendChild(questionCard);
                }

                if(QuestionGroup.Questions[i].questionsOnPage > 1) {
                    for(let l=QuestionGroup.Questions[i].questionsOnPage;l>0;l--) {
                        let questionCardToHide = document.getElementById("quiznavbutton"+(QuestionGroup.Questions[i].page+l+1));
                        if(questionCardToHide != undefined) {
                            questionCardToHide.style.display = "none";
                        }
                    }
                }

    			j++;
    		};
    		
    		navPanel.appendChild(wrapper);
    	});

        //put a flag instead of a skull, a number or an "i" in the very last question card
        document.querySelectorAll(".qn_buttons span[data-is-for]:last-child a:last-child img").forEach(function(lastQuestionCard) {
            lastQuestionCard.src = "https://marvin.hs-bochum.de/~mneugebauer/flag.svg";
        });

        //show group navigation on instruction and update speech bubble navigation
        let currentQuestion = this.getQuestion();
        if(!(currentQuestion instanceof Question) && currentQuestion instanceof Instruction) {

            let CurrentGroup;
            for(let i in this.QuestionGroups) {
                if(this.QuestionGroups[i].Questions[this.currentQuestionId] != undefined) {
                    CurrentGroup = this.QuestionGroups[i];
                    break;
                }
            };

            let groupNavigation = document.querySelector(".group-navigation");
            if(groupNavigation != undefined) {
                //find current group
                
                if(CurrentGroup != undefined) {

                    //show group navigation
                    let cards = document.querySelectorAll("[data-is-for="+CurrentGroup.id+"] a")
                    let cardAmount = cards.length;
                    let keys = Object.keys(CurrentGroup.Questions);
                    for(let i=cardAmount-1;i>=0;i--) {
                        let cardClone = cards[i].cloneNode(true);
                        let stepWrapper = document.createElement("div");
                        stepWrapper.classList.add("wrap_nav_group");
                        let stepHeadingAnchor = document.createElement("a");
                        stepHeadingAnchor.href = cardClone.href;
                        let stepHeading = document.createElement("h2");
                        stepHeading.innerHTML = CurrentGroup.Questions[keys[i]].description;

                        stepHeadingAnchor.appendChild(stepHeading);
                        stepWrapper.appendChild(cardClone);
                        stepWrapper.appendChild(stepHeadingAnchor);
                        groupNavigation.appendChild(stepWrapper);
                    };

                    let groupNavCss = document.createElement("style");groupNavCss.type="text/css";groupNavCss.innerHTML = ".path-mod-quiz .group-navigation .qnbutton { text-decoration: none; font-size: 14px; line-height: 20px; font-weight: 400; background-color: #fff; background-image: none; height: 40px; width: 30px; border-radius: 3px; border: 0; overflow: visible; margin: 0 6px 6px 0;} .path-mod-quiz .group-navigation .qnbutton { background: none; background-color: rgba(0, 0, 0, 0); background-color: #eee; border: 0; border-radius: 4px; color: #000000 !important; font-size: 14px; font-weight: 700; height: 45px; line-height: 25px !important; margin: 0 5px 5px 0; width: 35px;} .group-navigation .qnbutton .thispageholder { border: 1px solid #999; border-radius: 4px; z-index: 1;}.group-navigation .qnbutton .thispageholder { border: 1px solid; border-radius: 3px; z-index: 1;}.group-navigation .qnbutton .trafficlight, group-navigation .qnbutton .thispageholder { display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0;} .path-mod-quiz .group-navigation .qnbutton.notyetanswered .trafficlight, .path-mod-quiz .group-navigation .qnbutton.invalidanswer .trafficlight { background-color: #fff;}.path-mod-quiz .group-navigation .qnbutton.notyetanswered .trafficlight, .path-mod-quiz .group-navigation .qnbutton.invalidanswer .trafficlight { background-color: #fff;}.path-mod-quiz .group-navigation .qnbutton .trafficlight { border: 0; background: #fff none center / 10px no-repeat scroll; height: 20px; margin-top: 20px; border-radius: 0 0 3px 3px;} .path-mod-quiz .group-navigation .qnbutton .trafficlight { background: #fff none center 4px / 10px no-repeat scroll; background-color: rgb(255, 255, 255); border: 0; border-radius: 0 0 4px 4px; height: 20px; margin-top: 25px;} .path-mod-quiz .group-navigation .qnbutton.correct .trafficlight {   background-color: #8bc34a;   background-image: url(/theme/image.php/adaptable/theme/1660635117/mod/quiz/checkmark); } .path-mod-quiz .group-navigation .qnbutton.notanswered .trafficlight, .path-mod-quiz .group-navigation .qnbutton.incorrect .trafficlight { background-color: #f44336; } .path-mod-quiz .group-navigation .qnbutton.partiallycorrect .trafficlight { background-color: #ff9800;   background-image: url(/theme/image.php/adaptable/theme/1660635117/mod/quiz/whitecircle); } .path-mod-quiz .group-navigation .qnbutton.thispage .thispageholder {  border: 3px solid #1f536b; } .wrap_nav_group { clear:left; }";
                    document.getElementsByTagName("head")[0].appendChild(groupNavCss);
                }
            }

            let endbossLink = document.querySelector(".endboss-link");
            if(endbossLink != undefined) {
                endbossLink.href = this.getPageURL(currentQuestion.onsuccess);
            }

            if(CurrentGroup != undefined) {
                let questionKeys = Object.keys(CurrentGroup.Questions);
                let nextWorldLink = document.querySelector(".link-next-world");
                let nextWorldURL = this.getPageURL(CurrentGroup.Questions[questionKeys[questionKeys.length-1]].onsuccess);

                if(nextWorldLink != undefined) {
                    nextWorldLink.href = nextWorldURL;
                }

                let endbossDefeat = CurrentGroup.Questions[questionKeys[questionKeys.length-1]].isSolved();
                let endbossStatePhrase = document.querySelector(".endboss-state");
                if(endbossStatePhrase != undefined) {
                    if(endbossDefeat == true) {
                        endbossStatePhrase.innerHTML = "bereits";
                    }
                    /*else {
                        endbossStatePhrase.innerHTML = "noch nicht";
                    }*/
                }

                let nextQuestionLink = document.querySelector(".link-next-question");
                if(nextQuestionLink != undefined) {
                    if(endbossDefeat == true) {
                        nextQuestionLink.innerHTML = "der n&auml;chsten Welt";
                        nextQuestionLink.href = nextWorldURL;
                        //overwrite default next question
                        document.querySelector(".btn-next-question").href = nextWorldURL;
                    }
                    else {
                        let i;
                        let page;
                        for(i in CurrentGroup.Questions) {
                            if(!CurrentGroup.Questions[i].isSolved() && CurrentGroup.Questions[i] instanceof Question) {
                                page = CurrentGroup.Questions[i].page;
                                break;
                            }
                        }
                        //console.log(page);
                        nextQuestionLink.setAttribute("onclick", 'tutorialFocusElement(document.querySelector(\'.wrap_nav_group [data-quiz-page="'+page+'"]\'));');
                        document.querySelector(".btn-next-question").href = this.getPageURL(i);
                    }
                }

                let currentLevelPhrase = document.querySelector(".current-level");
                if(currentLevelPhrase != undefined) {
                    let amount = 0;
                    let solved = 0;
                    for(let i in CurrentGroup.Questions) {
                        if(CurrentGroup.Questions[i] instanceof Question) {
                            amount++;
                            if(CurrentGroup.Questions[i].isSolved()) {
                                solved++;
                            }
                        }
                    }
                    if(endbossDefeat == true) {
                        currentLevelPhrase.innerHTML = amount+" von "+amount;
                    }
                    else {
                        currentLevelPhrase.innerHTML = solved+" von "+amount;
                    }
                }
            }

            sessionStorage.setItem("camefrom", currentQuestion.id);
        }
    	
    }

    setCurrentQuestionId(id) {
        this.currentQuestionId = id;

        //save question as visited, so next time on loading the script, question will carry the visited property with true
        let visitedQuestionsAsString = sessionStorage.getItem("visited");
        if (visitedQuestionsAsString != undefined) {
            let visitedQuestions = JSON.parse(visitedQuestionsAsString);
            if (visitedQuestions != undefined && visitedQuestions.indexOf(id) < 0) {
                visitedQuestions.push(id);
                sessionStorage.setItem("visited", JSON.stringify(visitedQuestions));
            }
        } else {
            let visited = [];
            sessionStorage.setItem("visited", JSON.stringify(visited));
        }

    }

    incrementSolved(id) {
        if (id == undefined) {
            id = this.currentQuestionId;
        }
        this.getQuestion(id).solved++;
        this.getQuestion(id).currentlySolved++;

        if (this.getQuestion(id).isSolved()) {
            let solvedQuestionsAsString = sessionStorage.getItem("solved");
            if (solvedQuestionsAsString != undefined) {
                let solvedQuestions = JSON.parse(solvedQuestionsAsString);
                if (solvedQuestions != undefined) {
                    if (solvedQuestions.indexOf(id) == -1) {
                        solvedQuestions.push(id);
                        sessionStorage.setItem("solved", JSON.stringify(solvedQuestions));
                    }
                }
            }
        }

    }
}

let DefaultBubble = new BubbleInfo({});

let SynQuestions = [];
let FraQuestions = [];
let PQQuestions = [];
let RulQuestions = [];
let LogQuestions = [];
let TriQuestions = [];
let SurQuestions = [];

let pythagorasPhrase = "Der Satz des Pythagoras besagt, dass die Ankathete zum Quadrat addiert mit der Gegenkathete zum Quadrat die Hypothenuse zum Quadrat ergibt. Mathematisch ausgedrückt: \\(a^2+b^2=c^2\\;\\)."

SynQuestions.push(new Instruction("start_instructions", "Check-In Übungsraum", "syn_instructions", "syn_instructions"));
SynQuestions.push(new Instruction("syn_instructions", "Check-In Syntax", "syn_main", "syn_a1", new BubbleInfo({revisit:"Du bist zur&uuml;ck in der &Uuml;bersicht dieser Mathe-Welt, in der es darum geht, <b>wie man Antworten richtig eingibt</b>. Hier bist du in Level <b class=\"current-level\">x von y</b>. Du hast den <a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.endboss-link'));\">Endgegner</a> in dieser Welt <span class=\"endboss-state\">noch nicht</span> besiegt. Schau dir unten deinen Fortschritt an und springe von hier aus zur Frage deiner Wahl. Von hier aus kannst du auch zur <a class=\"link-next-world\">n&auml;chsten Mathe-Welt</a> springen. Ich w&uuml;rde dir empfehlen, mit <a class=\"link-next-question\">der ersten ungel&ouml;sten Frage dieser Welt</a> weiterzumachen. Mit Klick auf &quot;<a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.submitbtns'));\">N&auml;chste Frage</a>&quot; gelangst du dorthin."})));
SynQuestions.push(new Question("syn_a1", "Gleichung eingeben ", 1, DefaultBubble, "syn_a2", "syn_a2", true));
SynQuestions.push(new Question("syn_a2", "Bruch &amp; Division eingeben", 1, DefaultBubble, "syn_b1", "syn_b1", true));
SynQuestions.push(new Question("syn_b1", "Potenzen", 1, DefaultBubble, "syn_b2", "syn_b2", true));
SynQuestions.push(new Question("syn_b2", "Rationale Ausdrücke", 1, DefaultBubble, "syn_c", "syn_c", true));
SynQuestions.push(new Question("syn_c", "Wurzelzeichen", 1, DefaultBubble, "syn_d", "syn_d", true));
SynQuestions.push(new Question("syn_d", "Mehrere Lösungen", 1, DefaultBubble, "syn_e", "syn_e", true));
SynQuestions.push(new Question("syn_e", "Gleichung mehrschrittig lösen", 1, DefaultBubble, "syn_f", "syn_f", true));
SynQuestions.push(new Question("syn_f", "Griechische Buchstaben", 1, DefaultBubble, "syn_main", "syn_main"));
SynQuestions.push(new Question("syn_main", "Syntax Endgegner", 1, new BubbleInfo({success:"Sehr gut! Du hast die erste Welt gemeistert. Du bist bereit f&uuml;r die n&auml;chste Mathe-Welt!", camebackaftersuccess:"Willkommen zur&uuml;ck zur ersten Aufgabe. Kannst du mit dem Wissen, was du auf dem Weg gesammelt hast, diese Aufgabe jetzt l&ouml;sen? Versuche es nochmal! Mit Klick auf &quot;N&auml;chste Frage&quot; kommst du zur n&auml;chsten Aufgabe."}), "fra_instructions", "syn_instructions"));
FraQuestions.push(new Instruction("fra_instructions", "Check-In Bruchrechengeln und binomische Formeln", "fra_main", "fra_a", new BubbleInfo({revisit:"Du bist zur&uuml;ck in der &Uuml;bersicht der Mathe-Welt <b>Bruchrechenregeln und binomische Formeln</b>. Hier bist du in Level <b class=\"current-level\">x von y</b>. Du hast den <a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.endboss-link'));\">Endgegner</a> in dieser Welt <span class=\"endboss-state\">noch nicht</span> besiegt. Schau dir unten deinen Fortschritt an und springe von hier aus zur Frage deiner Wahl. Von hier aus kannst du auch zur <a class=\"link-next-world\">n&auml;chsten Mathe-Welt</a> springen. Ich w&uuml;rde dir empfehlen, mit <a class=\"link-next-question\">der ersten ungel&ouml;sten Frage dieser Welt</a> weiterzumachen. Mit Klick auf &quot;<a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.submitbtns'));\">N&auml;chste Frage</a>&quot; gelangst du dorthin."})));
FraQuestions.push(new Question("fra_a", "Brüche kürzen ", 1, DefaultBubble, "fra_b", "fra_b"));
FraQuestions.push(new Question("fra_b", "Brüche erweitern und addieren ", 1, DefaultBubble, "fra_c", "fra_c"));
FraQuestions.push(new Question("fra_c", "Brüche multiplizieren ", 1, DefaultBubble, "fra_d", "fra_d"));
FraQuestions.push(new Question("fra_d", "Brüche dividieren ", 1, DefaultBubble, "fra_e", "fra_e"));
FraQuestions.push(new Question("fra_e", "Doppelbrüche ", 1, DefaultBubble, "fra_f", "fra_f"));
FraQuestions.push(new Question("fra_f", "Brüche Zwischenfazit ", 1, DefaultBubble, "bin_a", "bin_a"));
FraQuestions.push(new Question("bin_a", "Erste binomische Formel ", 1, DefaultBubble, "bin_b", "bin_b"));
FraQuestions.push(new Question("bin_b", "Zweite binomische Formel ", 1, DefaultBubble, "bin_c", "bin_c"));
FraQuestions.push(new Question("bin_c", "Dritte binomische Formel ", 1, DefaultBubble, "bin_main", "bin_main"));
FraQuestions.push(new Question("bin_main", "Anwendungsaufgabe ", 1, DefaultBubble, "fra_main", "fra_main"));
FraQuestions.push(new Question("fra_main", "Bruch mit binomischem Term erweitern ", 1, DefaultBubble, "pq_instructions", "fra_instructions"));
/*FraQuestions.push(new Question("fra_main", "Bruch vereinfachen mithilfe binomischer Formeln ", 1, new BubbleInfo({camebackaftersuccess:"Willkommen zur&uuml;ck zur ersten Aufgabe. Kannst du mit dem Wissen, was du auf dem Weg gesammelt hast, diese Aufgabe jetzt l&ouml;sen? Versuche es nochmal! Mit Klick auf &quot;N&auml;chste Frage&quot; kommst du zur n&auml;chsten Aufgabe."}), "pq_instructions", "fra_instructions"));*/
PQQuestions.push(new Instruction("pq_instructions", "Check-In p-q-Formel", "pq_main", "pq_a", new BubbleInfo({revisit:"Du bist zur&uuml;ck in der &Uuml;bersicht der Mathe-Welt <b>p-q-Formel</b>. Hier bist du in Level <b class=\"current-level\">x von y</b>. Du hast den <a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.endboss-link'));\">Endgegner</a> in dieser Welt <span class=\"endboss-state\">noch nicht</span> besiegt. Schau dir unten deinen Fortschritt an und springe von hier aus zur Frage deiner Wahl. Von hier aus kannst du auch zur <a class=\"link-next-world\">n&auml;chsten Mathe-Welt</a> springen. Ich w&uuml;rde dir empfehlen, mit <a class=\"link-next-question\">der ersten ungel&ouml;sten Frage dieser Welt</a> weiterzumachen. Mit Klick auf &quot;<a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.submitbtns'));\">N&auml;chste Frage</a>&quot; gelangst du dorthin."})));
PQQuestions.push(new Question("pq_a", "Termumformung ", 1, DefaultBubble, "pq_b", "pq_b"));
PQQuestions.push(new Question("pq_b", "pq-Formel anwenden", 1, DefaultBubble, "pq_main", "pq_main"));
PQQuestions.push(new Question("pq_main", "Endboss ", 1, new BubbleInfo({camebackaftersuccess:"Willkommen zur&uuml;ck zu dieser Aufgabe. Kannst du jetzt die Termumformung und die p-q-Formel anwenden, um diese Aufgabe zu l&ouml;sen? Viel Erfolg!"}), "rul_instructions", "pq_instructions"));
RulQuestions.push(new Instruction("rul_instructions", "Check-In Potenzrechenregeln", "rul_main", "rul_a", new BubbleInfo({revisit:"Du bist zur&uuml;ck in der &Uuml;bersicht der <b>Potenzrechenregeln</b>-Welt. Hier bist du in Level <b class=\"current-level\">x von y</b>. Du hast den <a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.endboss-link'));\">Endgegner</a> in dieser Welt <span class=\"endboss-state\">noch nicht</span> besiegt. Schau dir unten deinen Fortschritt an und springe von hier aus zur Frage deiner Wahl. Von hier aus kannst du auch zur <a class=\"link-next-world\">n&auml;chsten Mathe-Welt</a> springen. Ich w&uuml;rde dir empfehlen, mit <a class=\"link-next-question\">der ersten ungel&ouml;sten Frage dieser Welt</a> weiterzumachen. Mit Klick auf &quot;<a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.submitbtns'));\">N&auml;chste Frage</a>&quot; gelangst du dorthin."})));
RulQuestions.push(new Question("rul_a", "Potenzen addieren ", 1, DefaultBubble, "rul_b", "rul_b"));
RulQuestions.push(new Question("rul_b", "Potenzen subtrahieren ", 1, DefaultBubble, "rul_c", "rul_c"));
RulQuestions.push(new Question("rul_c", "Wurzel als Potenz darstellen ", 1, DefaultBubble, "rul_d", "rul_d"));
RulQuestions.push(new Question("rul_d", "Potenzen multiplizieren ", 1, DefaultBubble, "rul_e", "rul_e"));
RulQuestions.push(new Question("rul_e", "Potenzrechenregeln anwenden ", 1, DefaultBubble, "rul_main", "rul_main"));
RulQuestions.push(new Question("rul_main", "Endboss ", 1, new BubbleInfo({camebackaftersuccess:"Willkommen zur&uuml;ck zur Ausgangsaufgabe zu den Potenzrechenregeln. Jetzt hast du jede Potenzrechenregel kennengelernt. Versuche es nochmal, diese Aufgabe zu lösen. Mit Klick auf &quot;N&auml;chste Frage&quot; kommst du zur n&auml;chsten Aufgabe."}), "tri_instructions", "rul_instructions"));
/*LogQuestions.push(new Instruction("log_instructions", "Check-In Zinseszins und Logarithmus", "log_main", "log_a"));
LogQuestions.push(new Question("log_a", "Zinsrechnung ", 1, DefaultBubble, "log_b", "log_b"));
LogQuestions.push(new Question("log_b", "Zinseszinsrechnung ", 1, DefaultBubble, "log_c", "log_c"));
LogQuestions.push(new Question("log_c", "Logarithmus ", 1, DefaultBubble, "log_d", "log_d"));
LogQuestions.push(new Question("log_d", "Mithilfe von Logarithmus gesuchte Potenz bestimmen ", 1, DefaultBubble, "log_main", "log_main"));
LogQuestions.push(new Question("log_main", "Endboss ", 1, DefaultBubble, "tri_instructions", "log_instructions"));*/

TriQuestions.push(new Instruction("tri_instructions", "Check-In Trigonometrie", "tri_main", "tri_a", new BubbleInfo({revisit:"Du bist zur&uuml;ck in der &Uuml;bersicht der <b>Trigonometrie</b>-Welt. Hier bist du in Level <b class=\"current-level\">x von y</b>. Du hast den <a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.endboss-link'));\">Endgegner</a> in dieser Welt <span class=\"endboss-state\">noch nicht</span> besiegt. Schau dir unten deinen Fortschritt an und springe von hier aus zur Frage deiner Wahl. Von hier aus kannst du auch zur <a class=\"link-next-world\">n&auml;chsten Mathe-Welt</a> springen. Ich w&uuml;rde dir empfehlen, mit <a class=\"link-next-question\">der ersten ungel&ouml;sten Frage dieser Welt</a> weiterzumachen. Mit Klick auf &quot;<a href=\"javascript:;\" onclick=\"tutorialFocusElement(document.querySelector('.submitbtns'));\">N&auml;chste Frage</a>&quot; gelangst du dorthin."})));
TriQuestions.push(new Question("tri_a", "Begriffskl&auml;rungen ", 3, new BubbleInfo({success:"Richtig!", failure:"Falsch. Schaue dir die Grafik unten an und wiederhole die Aufgabe. Viel Erfolg!"}), "tri_b", "tri_b", true));
TriQuestions.push(new Question("tri_b", "Satz des Pythagoras 1 ", 2, new BubbleInfo({success:"Richtig! "+pythagorasPhrase, failure:"Falsch. "+pythagorasPhrase+" Versuche es ruhig noch einmal. Viel Erfolg!"}), "tri_c", "tri_c"));
TriQuestions.push(new Question("tri_c", "Satz des Pythagoras 2 ", 2, new BubbleInfo({success:"Richtig!", failure:"Falsch. Versuche es ruhig noch einmal. Viel Erfolg!"}), "tri_d", "tri_d"));
TriQuestions.push(new Question("tri_d", "Begriffsklärungen trigonometrischer Funktionen ", 3, new BubbleInfo({success:"Richtig!", failure:"Falsch. Versuche es ruhig noch einmal. Viel Erfolg!"}), "tri_e", "tri_e"));
TriQuestions.push(new Question("tri_e", "Trigonometrie 2 ", 1, DefaultBubble, "tri_f", "tri_f"));
TriQuestions.push(new Question("tri_f", "Trigonometrische Umkehrfunktionen 1 ", 1, DefaultBubble, "tri_g", "tri_g"));
TriQuestions.push(new Question("tri_g", "Trigonometrische Umkehrfunktion 2 ", 1, DefaultBubble, "tri_main", "tri_main"));
TriQuestions.push(new Question("tri_main", "Endboss ", 1, new BubbleInfo({camebackaftersuccess:"Willkommen zur&uuml;ck zu dieser Aufgabe. In den letzten Aufgaben ging es um Kompetenzen, die du zum Lösen dieser Aufgabe verwenden kannst. Kannst du sie jetzt lösen? Viel Erfolg!"}), "sur_instructions"/*"_finish"*/, "tri_instructions"));

SurQuestions.push(new Instruction("sur_instructions", "Start Umfrage", "sur_a", "sur_a", DefaultBubble));
SurQuestions.push(new Question("sur_a", "Umfrage", 1, new BubbleInfo({beforeskip:"Bitte drücke noch auf &quot;Prüfen&quot; bevor du weitergehst, damit deine Antworten auf die Umfrage abgespeichert werden. Oder möchtest du die Umfrage überspringen? "}), "_finsih", "_finish", true, 6));


let AllQuestions = SynQuestions.concat(FraQuestions, PQQuestions, RulQuestions/*, LogQuestions*/, TriQuestions, SurQuestions);

for (let i = 0; i < AllQuestions.length; i++) {
    AllQuestions[i].page = i;
}


let QuestionGroups = [];
QuestionGroups.push(new QuestionGroup("syn", "Syntax", SynQuestions));
QuestionGroups.push(new QuestionGroup("fra", "Brüche &amp; binom. Formeln", FraQuestions));
QuestionGroups.push(new QuestionGroup("pq", "pq-Formel", PQQuestions));
QuestionGroups.push(new QuestionGroup("rul", "Potenzen", RulQuestions));
//QuestionGroups.push(new QuestionGroup("log", "Zinsesinzs &amp; Logarithmus", LogQuestions));
QuestionGroups.push(new QuestionGroup("tri", "Trigonometrie", TriQuestions));
QuestionGroups.push(new QuestionGroup("sur", "Umfrage", SurQuestions));

let ALQuiz = new Quiz(QuestionGroups);

let solvedQuestionsAsString = sessionStorage.getItem("solved");
if (solvedQuestionsAsString != undefined) {
    let solvedQuestions = JSON.parse(solvedQuestionsAsString);
    if (solvedQuestions != undefined) {
        solvedQuestions.forEach(function (solvedQuestion) {
            let Question = ALQuiz.getQuestion(solvedQuestion);
            Question.solved = Question.needs;
        });
    }
} else {
    let solved = [];
    sessionStorage.setItem("solved", JSON.stringify(solved));
}

let visitedQuestionsAsString = sessionStorage.getItem("visited");
if (visitedQuestionsAsString != undefined) {
    let visitedQuestions = JSON.parse(visitedQuestionsAsString);
    if (visitedQuestions != undefined) {
        visitedQuestions.forEach(function (visitedQuestion) {
            let Question = ALQuiz.getQuestion(visitedQuestion);
            Question.visited = true;
        });
    }
} else {
    let visited = [];
    sessionStorage.setItem("visited", JSON.stringify(visited));
}

document.addEventListener("DOMContentLoaded", function () {

    if (window.location.href.indexOf("review.php") < 0) {

           //add ask-before-skip modal
            let modal = document.createElement("div");
            modal.classList.add("dmmodal");
            modal.addEventListener("click", function(event) {
                if(!event.target.closest(".dmmodal-content")) {
                    this.style.display = "none";
                }
            });
            let modalContent = document.createElement("div");
            modalContent.classList.add("dmmodal-content", "formulation");
            let closeSpan = document.createElement("span");
            closeSpan.classList.add("dmclose");
            closeSpan.innerHTML = "&times;";
            closeSpan.onclick = function() { this.closest(".dmmodal").style.display="none"; };
            let contentParagraph = document.createElement("p");
            let modalBubble = document.createElement("p");
            modalBubble.classList.add("bubble", "in-modal");
            modalBubble.innerHTML = "Bist du sicher, dass du diese Aufgabe &uuml;berspringen m&ouml;chtest?";
            if(ALQuiz != undefined && ALQuiz.getQuestion() != undefined && ALQuiz.getQuestion().BubbleInfo != undefined && ALQuiz.getQuestion().BubbleInfo.getText("beforeskip") != undefined) {
                modalBubble.innerHTML = ALQuiz.getQuestion().BubbleInfo.getText("beforeskip");
            }
            modalBubble.style.marginTop = "50px";
            let dmicon = document.createElement("img");
            dmicon.classList.add("dm-icon");
            dmicon.src="https://marvin.hs-bochum.de/~mneugebauer/dm-avatar-grin.svg";
            let yesButton = document.createElement("a");
            yesButton.classList.add("skip-yes");
            yesButton.href = "javascript:;";
            yesButton.innerHTML = "Ja";
            let noButton = document.createElement("a");
            noButton.classList.add("skip-no");
            noButton.href = "javascript:;";
            noButton.innerHTML = "Nein";
            noButton.onclick = function() { this.closest(".dmmodal").style.display="none"; };

            modalBubble.appendChild(yesButton);
            modalBubble.innerHTML += " ";
            modalBubble.appendChild(noButton);

            modalContent.appendChild(closeSpan);
            modalContent.appendChild(modalBubble);
            modalContent.appendChild(dmicon);
            modalContent.appendChild(contentParagraph);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

        //in development state: interrupt button update to give the main page time to recognize the inline scripts like increment solved and set current question id
        /*setTimeout('*/ALQuiz.updateSpeechBubbles(); ALQuiz.updateMoodleNavButtons(); ALQuiz.updateNavigation(); /*', 500)*/;
    }


    //add styles, e. g. speech bubble
    let style = document.createElement("style");
    style.type = "text/css";
    //.que .outcome background-color is #fcefdc;
    style.innerHTML = ".bubble { /* layout*/ position: relative; max-width: 30em; /* looks*/ background-color: #fcefdc; padding: 1.125em 1.5em; font-size: 1.25em; border-radius: 1rem; box-shadow:	0 0.125rem 0.5rem rgba(0, 0, 0, .3), 0 0.0625rem 0.125rem rgba(0, 0, 0, .2); } .bubble:not(.no-arrow)::before { /* layout*/ content: ''; position: absolute; width: 0; height: 0; top: 100%; left: 1.5em; /* offset should move with padding of parent*/ border: .75rem solid transparent; border-bottom: none; /* looks*/ border-top-color: #fcefdc; filter: drop-shadow(0 0.0625rem 0.0625rem rgba(0, 0, 0, .1)); } .formulation a { text-decoration:underline; } .mathsinput { position:fixed; display:flex; width:100vw; bottom:0px; z-index:1; } .mathsinput button { flex-grow:1; } table.trigonometry_table { border:1px solid black;width:100%; } table.trigonometry_table th, td { border:1px solid black;text-align:center; } .dm-icon { border:2px solid black; border-radius:50%; width: 7.5em; } .user-focus { background-color: #000; width: 100%; height: 100%; position: absolute; opacity: 0.5; overflow: none; display: block; left: 0; } .user-focus.hide-top { top:0; } .user-focus.hide-bottom { bottom:0; } .dmmodal { display: none; /* Hidden by default */ position: fixed; /* Stay in place */ z-index: 1; /* Sit on top */ padding-top: 100px; /* Location of the box */ left: 0; top: 0; width: 100%; /* Full width */ height: 100%; /* Full height */ overflow: auto; /* Enable scroll if needed */ background-color: rgb(0,0,0); /* Fallback color */ background-color: rgba(0,0,0,0.4); /* Black w/ opacity */ } /* Modal Content */ .dmmodal-content { background-color: #fefefe; margin: auto; padding: 20px; border: 1px solid #888; width: 80%; } /* The Close Button */ .dmclose { color: #aaaaaa; float: right; font-size: 28px; font-weight: bold; } .close:hover, .close:focus { color: #000; text-decoration: none; cursor: pointer; } .mathsinput { position:fixed; display:flex; width:100vw; bottom:0px; z-index:1; } .mathsinput button { flex-grow:1; } .show-on-mobile-only { display:inline-block; } .show-on-desktop-only { display:none; } @media (min-width:991px) { .mathsinput { display:none; } .show-on-mobile-only { display:none; } .show-on-desktop-only { display:inline-block; } } .mathsbutton { border:1px solid black; border-radius:50%; height:2em; width:2em; float:right; background-color:#aaaaaa; background-image:url(\"https://marvin.hs-bochum.de/~mneugebauer/operators-white.svg\"); background-repeat:no-repeat; background-size:90%; background-position:50%; } .mathsbutton.active { background-color:#e2001a; }";
    document.getElementsByTagName('head')[0].appendChild(style);

    /*let butt = document.createElement("input");
    butt.value = "Try another question like this";
    butt.classList.add("btn");
    butt.classList.add("btn-secondary");
    butt.type = "submit";
    butt.name = "redoslot" + ALQuiz.getQuestion().page;
    document.getElementById("responseform").appendChild(butt);*/

    //show additional maths input if neccessary
    document.querySelectorAll("input, textarea").forEach(function(inputElement) {
        inputElement.addEventListener("focus", function() {
            lastFocusedInputElement = this;
        });
    });

    let mathsInput = ["+", "-", "*", "/", "(", ")", "^", "="];
    let mathsButtons = [];
    mathsInput.forEach(function(mathsInputSymbol) {
        let button = document.createElement("button");
        button.type = "button";
        button.innerHTML = mathsInputSymbol;
        button.onclick = function() {
            if (!lastFocusedInputElement) {
                console.log("no focused element to enter maths-symbol");
                return;
            }
            let caretPos = lastFocusedInputElement.selectionStart;
            let currentContent = lastFocusedInputElement.value;
            lastFocusedInputElement.value = currentContent.substring(0, caretPos) + mathsInputSymbol + currentContent.substring(caretPos);
            lastFocusedInputElement.focus();
            lastFocusedInputElement.setSelectionRange(caretPos + 1, caretPos + 1);
        };
        mathsButtons.push(button);
    });

    let mathsInputButtonDiv = document.createElement("div");
    mathsInputButtonDiv.classList.add("mathsinput");

    mathsButtons.forEach(function(mathsButton) {
        mathsInputButtonDiv.appendChild(mathsButton);
    });

    document.body.appendChild(mathsInputButtonDiv);

    //safari hack to show mathsinput at correct position
    addSafariMathsInputAboveKeyboardSupport();


    addMathsOperatorButton();
});

document.addEventListener("load", function () {
    //ALQuiz.updateSpeechBubbles();
});

function tutorialFocusElement(elem) {
    if(!elem) {
        console.log("element to focus not found");
        return;
    }

    let userFocusTop = document.createElement("div");
    userFocusTop.classList.add("user-focus", "hide-top");
    userFocusTop.onclick = removeTutorialFocus;
    let userFocusBottom = document.createElement("div");
    userFocusBottom.classList.add("user-focus", "hide-bottom");
    userFocusBottom.onclick = removeTutorialFocus;

    let offset = 0;
    let pageHeight = 0;
    let bodyNode = null;
    let pageElementWHS = document.getElementById("page");
    if(!pageElementWHS) {
        //probably not in moodle of university of applied sciences Gelsenkirchen, Germany
        offset = window.pageYOffset;
        pageHeight = document.documentElement.scrollHeight;
        bodyNode = document.body;
    }
    else {
        //probably in moodle of university of applied sciences Gelsenkirchen, Germany
        let navbar = document.querySelector("nav");
        offset = pageElementWHS.scrollTop - (!navbar ? 0 : navbar.getBoundingClientRect().height);
        pageHeight = pageElementWHS.scrollHeight;
        console.log("we are probably in WHS-Moodle");
        //console.log("offset: "+offset+", pageHeight: "+pageHeight);
        bodyNode = pageElementWHS;
    }
    
    let position = elem.getBoundingClientRect(elem);
    userFocusTop.style.height=Math.ceil(position.top+offset-20)+"px";

    userFocusBottom.style.top = Math.ceil(position.bottom+offset+20)+"px";
    userFocusBottom.style.height=Math.ceil(pageHeight-(position.bottom+offset+20))+"px";
    //console.log(userFocusTop.style.height,userFocusBottom.style.top,userFocusBottom.style.height);

    bodyNode.appendChild(userFocusTop);
    bodyNode.appendChild(userFocusBottom);

    if(supportsSmoothScrolling() == true) {
        elem.scrollIntoView({behavior:"smooth", block:"center", inline:"center"});
    }
    else {
        safariScrollTo(elem);
    }
}

function removeTutorialFocus() {
    document.querySelectorAll(".user-focus").forEach(function(userFocusElement) {
        userFocusElement.parentNode.removeChild(userFocusElement);
    });
}

function repeatQuestion() {
    document.querySelector('.mod_quiz-redo_question_button').click();
}

function showAskBeforeSkipModal() {
    document.querySelector(".dmmodal").style.display = "block";
}

/*function addMathsOperatorButton() {
    document.querySelectorAll(".formulation.clearfix input[type=text], textarea").forEach(function(inputElement) { let mathsButton = document.createElement("img"); mathsButton.src = "https://marvin.hs-bochum.de/~mneugebauer/operators.svg";
    mathsButton.addEventListener("click", function(event) {
    event.preventDefault();
    //document.querySelector(".mathsinput").classList.toggle("hide");
    let mathsInput = document.querySelector(".mathsinput");
    if(mathsInput.style.display == "none") {
        mathsInput.style.display = "flex";
    }
    else {
        mathsInput.style.display = "none";
    }
    });
    inputElement.parentNode.appendChild(mathsButton); });
}*/

function addMathsOperatorButton() {
    document.querySelectorAll(".formulation.clearfix").forEach(function(questionElement) {
        let mathsButtonDiv = document.createElement("div");
        mathsButtonDiv.classList.add("mathsbutton");

        let mathsInput = document.querySelector(".mathsinput");
        let display = window.getComputedStyle(mathsInput).display;
        if(display == "flex") {
            mathsButtonDiv.classList.add("active");
        }

        mathsButtonDiv.addEventListener("click", function() {
            //document.querySelector(".mathsinput").classList.toggle("hide");
            //let mathsInput = document.querySelector(".mathsinput");
            if(!mathsInput.style.display || mathsInput.style.display == "") {
                display = window.getComputedStyle(mathsInput).display;
            }
            else {
                display = mathsInput.style.display;
            }

            if(display == "none") {
                mathsInput.style.display = "flex";
                this.classList.add("active");
            }
            else {
                mathsInput.style.display = "none";
                this.classList.remove("active");
            }
        });
        //mathsButtonDiv.appendChild(mathsButton);
        questionElement.appendChild(mathsButtonDiv);
    });
}


//SAFARI HACKS BELOW
function addSafariMathsInputAboveKeyboardSupport() {
    //alert("checking for safari");
    let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if(isSafari == true) {

        //alert("You are using Safari");

        //sadly not working solution from stackoverflow
        //style.innerHTML = ".testclass, .mathsinput { display:none; bottom:270px; } @media screen and (min-aspect-ratio:11/16) { .testclass, .mathsinput { display:none; } }";
        document.querySelectorAll("input.algebraic").forEach(function(inputElement) {
            //console.log(inputElement);
            inputElement.onfocus = function() {
                let mathsInput = document.querySelector(".mathsinput");
                mathsInput.style.position = "absolute";
                mathsInput.style.bottom = "auto";
                let position = this.getBoundingClientRect();
                mathsInput.style.top = Math.ceil(position.bottom+window.pageYOffset)+"px";
                //console.log(position);
            }
        });
    }
}

function supportsSmoothScrolling() {
    let body = document.body;
    let scrollSave = body.style.scrollBehavior;
    body.style.scrollBehavior = 'smooth';
    let hasSmooth = getComputedStyle(body).scrollBehavior === 'smooth';
    body.style.scrollBehavior = scrollSave;
    return hasSmooth;
};

//thanks to Jeff Starr from https://perishablepress.com/vanilla-javascript-scroll-anchor/
function safariScrollTo(elem){

    if(elem == undefined) {
        return;
    }
    let position = elem.getBoundingClientRect();
    let to = (position.top+window.pageYOffset)-window.screen.availHeight/2;
    //console.log(to);

    var i = parseInt(window.pageYOffset);
    //console.log(i);
    if ( i != to ) {
        to = parseInt(to);
        if (i < to) {
            var int = setInterval(function() {
                if (i > (to-20)) i += 1;
                else if (i > (to-40)) i += 3;
                else if (i > (to-80)) i += 8;
                else if (i > (to-160)) i += 18;
                else if (i > (to-200)) i += 24;
                else if (i > (to-300)) i += 40;
                else i += 60;
                window.scroll(0, i);
                if (i >= to) clearInterval(int);
            }, 15);
        }
        else {
            var int = setInterval(function() {
                if (i < (to+20)) i -= 1;
                else if (i < (to+40)) i -= 3;
                else if (i < (to+80)) i -= 8;
                else if (i < (to+160)) i -= 18;
                else if (i < (to+200)) i -= 24;
                else if (i < (to+300)) i -= 40;
                else i -= 60;
                window.scroll(0, i);
                if (i <= to) clearInterval(int);
            }, 15);
        }
    }
};

///END AL QUIZ SCRIPT///