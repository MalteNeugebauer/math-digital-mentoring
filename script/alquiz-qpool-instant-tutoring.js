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
    
    addQuestion(QuestionObject) {
        this.Questions[QuestionObject.id] = QuestionObject;
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
	constructor(id, description, page, onsuccess, onfailure, BubbleInfoObject, questionsOnPage) {
		this.id = id;
		/* success means: challenge accepted and go to endboss*/
		this.onsuccess = onsuccess;
		/*failure means: give me the first easy question*/
		this.onfailure = onfailure;
        this.description = description;
        this.page = page;
        this.BubbleInfo = BubbleInfoObject;
        if(this.BubbleInfo == undefined) {
            this.BubbleInfo = new BubbleInfo({});
        }

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
    constructor(id, description, page, needs, BubbleInfo, onsuccess, onfailure, askBeforeSkip, questionsOnPage, autoTriggerFeedbackCondition, variants) {
        super(id, description, page, onsuccess, onfailure, BubbleInfo, questionsOnPage);
        this.needs = needs;
        this.solved = 0;
        /*solved means: solved at least once in this attempt, currentlySolved means: solved actually now in the current scope of js variables*/
        this.currentlySolved = 0;
        this.askBeforeSkip = askBeforeSkip == undefined ? true : askBeforeSkip;
        if(!!autoTriggerFeedbackCondition) {
            try {
                this.autoTriggerFeedbackCondition = Function(autoTriggerFeedbackCondition);
            }
            catch(error) {
                this.autoTriggerFeedbackCondition = false;
                console.log("error during converting an auto trigger feedback condition function string into a function");
                console.log(error);
            }
        }
        //elsewise, this.autoTriggerFeedbackCondition remains undefined
        this.variants = variants == undefined ? 1 : variants;
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
    constructor(quizObject/*QuestionGroups*/, currentQuestionId, enableAskBeforeSkip) {
        this.QuestionGroups = {};
        this.currentQuestionId;
        this.askBeforeSkipEnabled = enableAskBeforeSkip == undefined ? false : enableAskBeforeSkip;
        //console.log(quizObject);
        if(quizObject != undefined) {
            if(quizObject.groups != undefined) {
                for(let questionGroupId in quizObject.groups) {
                    this.QuestionGroups[questionGroupId] = new QuestionGroup(questionGroupId, quizObject.groups[questionGroupId]);
                    console.log("added "+questionGroupId);
                }
                console.log(this.QuestionGroups);
                this.currentQuestionId = currentQuestionId;
                if(currentQuestionId == undefined) {
                    //If currentQuestionId is undefined, take first question in JSON-object.
                    this.currentQuestionId = Object.keys(quizObject.questions)[0];
                }
            }
            let pageCount = 0;
            if(quizObject.questions != undefined) {
                for(let questionId in quizObject.questions) {
                    let groupToAddId;
                    if(this.QuestionGroups[quizObject.questions[questionId].group] != undefined) {
                        groupToAddId = quizObject.questions[questionId].group;
                    }
                    else {
                        //try to identify group by token, elsewise add to group "unsorted"
                        if(questionId.indexOf("_") != -1) {
                            let expectedGroupNameMatch = questionId.match(/^(.*)_/);
                            if(expectedGroupNameMatch[1] != undefined && expectedGroupNameMatch[1] != "") {
                                if(this.QuestionGroups[expectedGroupNameMatch[1]] != undefined) {
                                    groupToAddId = expectedGroupNameMatch[1];
                                }
                            }
                        }
                        if(groupToAddId == undefined) {
                            if(this.QuestionGroups.unsorted == undefined) {
                                this.QuestionGroups.unsorted = new QuestionGroup("unsorted", "Unsorted Questions");
                            }
                            groupToAddId = "unsorted";
                        }
                        //Note: Clarify: Why are the parameters of this function differing from the parameters below?
                        this.QuestionGroups[groupToAddId].addQuestion(new Question(questionId,quizObject.questions[questionId].name));
                    }

                    let BubbleInfoObject;
                    if(quizObject.questions[questionId].BubbleInfo != undefined) {
                        BubbleInfoObject = new BubbleInfo(quizObject.questions[questionId].BubbleInfo);
                    }
                    let needs = 1;
                    if(quizObject.questions[questionId].needs != undefined) {
                        needs = quizObject.questions[questionId].needs;
                    }

                    let ElementToAdd;
                    if(quizObject.questions[questionId].type == "instruction") {
                        ElementToAdd = new Instruction(questionId,quizObject.questions[questionId].name,pageCount, quizObject.questions[questionId].onsuccess, quizObject.questions[questionId].onfailure, BubbleInfoObject, quizObject.questions[questionId].onpage);
                    }
                    else {
                        ElementToAdd = new Question(questionId,quizObject.questions[questionId].name,pageCount, needs, BubbleInfoObject, quizObject.questions[questionId].onsuccess, quizObject.questions[questionId].onfailure, quizObject.questions[questionId].askBeforeSkip, quizObject.questions[questionId].onpage, quizObject.questions[questionId].autoTriggerFeedbackCondition, quizObject.questions[questionId].variants);
                        if(!!quizObject.questions[questionId].autoTriggerFeedbackCondition) {
                            console.log("found "+quizObject.questions[questionId].autoTriggerFeedbackCondition);
                            console.log("interpreted as");
                            console.log(ElementToAdd.autoTriggerFeedbackCondition);
                        }
                    }
                    this.QuestionGroups[groupToAddId].addQuestion(ElementToAdd);
                    pageCount = pageCount + 1 + (ElementToAdd.variants > 1 ? ElementToAdd.variants-1 : 0) + (ElementToAdd.questionsOnPage > 1 ? ElementToAdd.questionsOnPage : 0); 
                }
            }
        }

        //auto assign onsuccess and onfailure for undefined
        let groupNames = Object.keys(this.QuestionGroups);
        let grouplength = groupNames.length;
        for (let i = 0; i < grouplength; i++) {
            //If desried to lead the learners always to the next exercise independent of success or failure, use the following lines.
            let questionNames = Object.keys(this.QuestionGroups[groupNames[i]].Questions);
            let questionlength = questionNames.length;
            for (let j = 0; j < questionlength; j++) {
                if (!this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onsuccess || !this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onfailure) {
                    //console.log("something for "+questionNames[j]+" is undefined");
                    //probably next question or next group
                    if (j < questionlength - 1) {
                        //next question
                        if(this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onsuccess == undefined) {
                            this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onsuccess = questionNames[j + 1];
                        }
                        if(this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onfailure == undefined) {
                            this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onfailure = questionNames[j + 1];
                        }
                    } else if (i < grouplength - 1) {
                        //console.log(questionNames[j] + " leads to next group onsuccess ");
                        //first question of next group
                        if(this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onsuccess == undefined) {
                            this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onsuccess = Object.keys(this.QuestionGroups[groupNames[i + 1]].Questions)[0];
                        }
                        if(this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onfailure == undefined) {
                            this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onfailure = Object.keys(this.QuestionGroups[groupNames[i + 1]].Questions)[0];
                        }
                    } else {
                        //console.log("no other group");
                        if(this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onsuccess == undefined) {
                            this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onsuccess = "_finish";
                        }
                        if(this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onfailure == undefined) {
                            this.QuestionGroups[groupNames[i]].Questions[questionNames[j]].onfailure = "_finish";
                        }
                    }
                }
            };

            //If desired to let the learners continue in the same world on success and send to the next world on failure, uncomment the following lines.
            /*
            let questionlength = Object.keys(this.QuestionGroups[groupNames[i]].Questions).length;
            for (let j = 0; j < questionlength; j++) {
                if (!this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onsuccess) {
                    //probably next question or next group
                    if (j < questionlength - 1) {
                        //next question
                        this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onsuccess = Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j + 1];
                    } else if (i < grouplength - 1) {
                        //console.log(Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j] + " leads to next group onsuccess ");
                        //first question of next group
                        this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onsuccess = Object.keys(this.QuestionGroups[groupNames[i + 1]].Questions)[0];
                    } eonfailure
                }

                if (!this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onfailure) {
                    //You may want to lead users to the first question of next group, assuming, that they are not able to solve the next (harder) question unless they are not able to solve the current (easier) question.
                    if (i < grouplength - 1) {
                        //console.log(Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j] + " leads to next group onfailure ");
                        this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onfailure = Object.keys(this.QuestionGroups[groupNames[i + 1]].Questions)[0];
                    } else {
                        //console.log("no other group");
                        this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onfailure = "_finish";
                    }
                }
            };
            */
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
        for (let i in this.QuestionGroups) {
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
        //let returnValue = false;
        for (let i in this.QuestionGroups) {
            if(this.QuestionGroups[i].Questions[questionId] != undefined) {
                let nextStep = this.QuestionGroups[i].Questions[questionId].isSolved() ? this.QuestionGroups[i].Questions[questionId].onsuccess : this.QuestionGroups[i].Questions[questionId].onfailure;
                switch (nextStep) {
                    case "_finish":
                        return -1;
                        break;
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
            //sanitizedUrl = plainUrl.substr(0, relPos);
            sanitizedUrl = plainUrl.slice(0, relPos);
        }

        let pageToReturn = this.getRandomPageOfQuestion(questionId);
        /*let pageToReturn = this.getQuestion(questionId).page;
        //pick a random variant if existent
        let numVariants = this.getQuestion(questionId).variants;
        if(this.getQuestion(questionId).variants > 1) {
            let randomPage = pageToReturn;
            let match = window.location.href.match(/page=(\d*)/);
            if(match != undefined && match[1] != undefined) {
                let currentPage = match[1];
                do {
                    randomPage = pageToReturn+Math.floor(Math.random()*numVariants);
                } while(randomPage == currentPage);
            }
            else {
                randomPage = pageToReturn+Math.floor(Math.random()*numVariants);
            }
            pageToReturn = randomPage;
        }*/
        return sanitizedUrl + "&page=" + pageToReturn;
    }

    getRandomPageOfQuestion(questionId) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }
        let CurrQuestion = this.getQuestion(questionId);
        let pageToReturn = CurrQuestion.page;
        //pick a random variant if existent
        let numVariants = CurrQuestion.variants;
        if(numVariants > 1) {
            let randomPage = pageToReturn;
            let match = window.location.href.match(/page=(\d*)/);
            if(match != undefined && match[1] != undefined) {
                let currentPage = match[1];
                do {
                    randomPage = pageToReturn+Math.floor(Math.random()*numVariants);
                } while(randomPage == currentPage);
            }
            else {
                randomPage = pageToReturn+Math.floor(Math.random()*numVariants);
            }
            pageToReturn = randomPage;
        }
        return pageToReturn;
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
        if(this.askBeforeSkipEnabled == true && Question.askBeforeSkip == true  && !forceURL && !Question.isSolved() && document.querySelector(".stackprtfeedback") == undefined) {
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

        let cameFrom = localStorage.getItem("camefrom");
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

            localStorage.removeItem("camefrom");
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
                        text = stackFeedbackInWords + "Wenn es dir mehr Sicherheit gibt, kannst du diese <a href=\"javascript:;\" onclick=\"repeatQuestion();\">Aufgabe mit anderen Zahlen wiederholen</a>. Ansonsten bist du bereit f&uuml;r die <a href=\"" + nextPageInfos.url + "\">" + nextPageInfos.linkText + "</a>.";
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
                        text = stackFeedbackInWords + " Erneut versuchen? <a href=\"#\" onclick=\"document.querySelector('input[name*=redoslot],button[name*=redoslot]').click();\">Ja</a> <a href=\"" + nextPageInfos.url + "\">Nein (" + nextPageInfos.linkText + ")</a>"
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
                text = currQuestion.BubbleInfo.getText("validation") == undefined ? "Wurde deine Eingabe richtig interpretiert? <a href=\"#\" onclick=\"document.querySelector('input[id*=q][name$=_-submit],button[id*=q][name$=_-submit]').click();\">Ja</a> <a href=\"#\" onclick=\"this.parentNode.innerHTML='&Auml;ndere deine Eingabe und klicke erneut auf &quot;Pr&uuml;fen&quot;'\">Nein</a>" : currQuestion.BubbleInfo.getText("validation");
            }
            else if(/*document.querySelector(".alert")*/document.querySelector(".stackinputerror") != undefined) { //Switched from ".alert" to ".stackinputerror", because in quiz preview may a block with class ".alert" appear to inform the previewer that -- e. g. -- a test is not yet activated.
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
        for(let m in this.QuestionGroups) {
    	//this.QuestionGroups.forEach(QuestionGroup => {
    		let wrapper = document.createElement("span");
    		wrapper.dataset.isFor = this.QuestionGroups[m].id;
    		//groupHeadingNodes.push(heading);
    		
    		let heading = document.createElement("h2");
    		heading.innerHTML = this.QuestionGroups[m].description;
    		heading.style.clear = "left";
    		wrapper.appendChild(heading);
    		
    		let j = 0;
            let k = 1;
    		let questionAmount = Object.keys(this.QuestionGroups[m].Questions).length;

            let solvedQuestionsAsString = localStorage.getItem("solved");
            let solvedQuestionsAsArray = [];
            if(solvedQuestionsAsString != undefined) {
                solvedQuestionsAsArray = JSON.parse(solvedQuestionsAsString);
            }

            let partiallyCorrectQuestionsAsString = localStorage.getItem("partially");
            let partiallyCorrectQuestionsAsArray = [];
            if(partiallyCorrectQuestionsAsString != undefined) {
                partiallyCorrectQuestionsAsArray = JSON.parse(partiallyCorrectQuestionsAsString);
            }

            let falseQuestionsAsString = localStorage.getItem("false");
            let falseQuestionsAsArray = [];
            if(falseQuestionsAsString != undefined) {
                falseQuestionsAsArray = JSON.parse(falseQuestionsAsString);
            }

    		for(let i in this.QuestionGroups[m].Questions) {
                //console.log("quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+1));
    			let questionCard = document.getElementById("quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+1));

                questionCard.querySelectorAll(".accesshide").forEach(slotMarker => {
                    if(slotMarker != undefined && slotMarker.nextSibling != undefined) {
                        if(!(this.QuestionGroups[m].Questions[i] instanceof Question) && this.QuestionGroups[m].Questions[i] instanceof Instruction) {
                            //assume first question to be instructions
                            slotMarker.nextSibling.data = "i";
                        }
                        else if(j < questionAmount-1) {
                            slotMarker.nextSibling.data = k;
                            k++;
                        }
                        else {
                            console.log("entering algorithm for "+this.QuestionGroups[m].Questions[i].id);
                            slotMarker.nextSibling.data = "";
                            let endbossImg = document.createElement("img");
                            if(this.QuestionGroups[m].Questions[i].id == "start") {
                                console.log("setting start to house");
                                endbossImg.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/house-solid.svg";
                            }
                            else {
                                endbossImg.src = "https://marvin.hs-bochum.de/~mneugebauer/skull.svg";
                            }
                            endbossImg.style.height = "20px";
                            slotMarker.parentNode.insertBefore(endbossImg, slotMarker.nextSibling);
                        }
                    }
                });
                if(!questionCard) {
                    console.log("bad question card id for question "+this.QuestionGroups[m].Questions[i].id);
                }
                else {
                    
                    if(solvedQuestionsAsArray.indexOf(this.QuestionGroups[m].Questions[i].id) != -1) {
                        console.log(this.QuestionGroups[m].Questions[i].id + " has already been solved");
                        questionCard.classList.add("correct");
                    }
                    else if(partiallyCorrectQuestionsAsArray.indexOf(this.QuestionGroups[m].Questions[i].id) != -1) {
                        console.log(this.QuestionGroups[m].Questions[i].id + " has already been solved");
                        questionCard.classList.add("partiallycorrect");
                    }
                    else if(falseQuestionsAsArray.indexOf(this.QuestionGroups[m].Questions[i].id) != -1) {
                        console.log(this.QuestionGroups[m].Questions[i].id + " has already been solved");
                        questionCard.classList.add("incorrect");
                    }
                    wrapper.appendChild(questionCard);
                }


                /*if(this.QuestionGroups[m].Questions[i].questionsOnPage > 1) {
                    for(let l=this.QuestionGroups[m].Questions[i].questionsOnPage;l>0;l--) {
                        let questionCardToHide = document.getElementById("quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+l+1));
                        if(questionCardToHide != undefined) {
                            questionCardToHide.style.display = "none";
                        }
                    }
                }*/
                if(this.QuestionGroups[m].Questions[i].variants > 1) {
                    if(this.QuestionGroups[m].Questions[i].questionsOnPage > 1) {
                        //... how to handle variants of questions with many questions on one page?
                    }
                    else {
                        //let numVariants = this.QuestionGroups[m].Questions[i].variants;
                        for(let l=1;l<this.QuestionGroups[m].Questions[i].variants;l++) {
                            let questionCardToHide = document.getElementById("quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+l+1));
                            if(questionCardToHide != undefined) {
                                questionCardToHide.style.display = "none";
                            }
                        }
                    }
                    //correct enumeration
                    //k = k-this.QuestionGroups[m].Questions[i].variants+1;
                }
                else {
                    if(this.QuestionGroups[m].Questions[i].questionsOnPage > 1) {
                        this.hideMultipleQuestionCards(m, i);
                    }
                }

    			j++;
    		};
    		
    		navPanel.appendChild(wrapper);
    	}/*)*/;

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

            localStorage.setItem("camefrom", currentQuestion.id);
        }
    	
    }


    hideMultipleQuestionCards(m, i) {
        if(this.QuestionGroups[m].Questions[i].questionsOnPage > 1) {
            for(let l=this.QuestionGroups[m].Questions[i].questionsOnPage;l>0;l--) {
                let questionCardToHide = document.getElementById("quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+l+1));
                if(questionCardToHide != undefined) {
                    questionCardToHide.style.display = "none";
                }
            }
        }
    }

    setCurrentQuestionId(id) {
        this.currentQuestionId = id;

        //save question as visited, so next time on loading the script, question will carry the visited property with true
        let visitedQuestionsAsString = localStorage.getItem("visited");
        if (visitedQuestionsAsString != undefined) {
            let visitedQuestions = JSON.parse(visitedQuestionsAsString);
            if (visitedQuestions != undefined && visitedQuestions.indexOf(id) < 0) {
                visitedQuestions.push(id);
                localStorage.setItem("visited", JSON.stringify(visitedQuestions));
            }
        } else {
            let visited = [];
            localStorage.setItem("visited", JSON.stringify(visited));
        }
        this.markQuestionAsCurrent(id)
    }

    incrementSolved(id) {
        if (id == undefined) {
            id = this.currentQuestionId;
        }
        this.getQuestion(id).solved++;
        this.getQuestion(id).currentlySolved++;

        if (this.getQuestion(id).isSolved()) {
            let solvedQuestionsAsString = localStorage.getItem("solved");
            if (solvedQuestionsAsString != undefined) {
                let solvedQuestions = JSON.parse(solvedQuestionsAsString);
                if (solvedQuestions != undefined) {
                    if (solvedQuestions.indexOf(id) == -1) {
                        solvedQuestions.push(id);
                        localStorage.setItem("solved", JSON.stringify(solvedQuestions));
                    }
                }
            }
            else {
                let toSave = '["'+id+'"]';
                localStorage.setItem("solved", toSave);
            }
        }
    }

    saveState(state, id) {
        if(state != "false" && state != "partially") {
            return;
        }
        if(id == undefined) {
            id = this.currentQuestionId;
        }

        let saveStateQuestionsAsString = localStorage.getItem(state);
        if (saveStateQuestionsAsString != undefined) {
            let saveStateQuestions = JSON.parse(saveStateQuestionsAsString);
            if (saveStateQuestions != undefined) {
                if (saveStateQuestions.indexOf(id) == -1) {
                    saveStateQuestions.push(id);
                    localStorage.setItem(state, JSON.stringify(saveStateQuestions));
                }
            }
        }
        else {
            let toSave = '["'+id+'"]';
            localStorage.setItem(state, toSave);
        }
    }

    markQuestionAsCurrent(questionId) {
        if(questionId != undefined) {
            questionId = this.currentQuestionId;
        }
        let currentQuestion = this.getQuestion(questionId);
        if(!currentQuestion) {
            return;
        }

        let currentMarkedNavButtons = document.querySelectorAll(".qnbutton.thispage");
        currentMarkedNavButtons.forEach(function(currentMarkedNavButton) {
            currentMarkedNavButton.classList.remove("thispage");
        });

        let currentQuestionButtons = document.querySelectorAll('.qnbutton[data-quiz-page="'+currentQuestion.page+'"]');
        currentQuestionButtons.forEach(function(currentQuestionButton) {
            currentQuestionButton.classList.add("thispage");
        });
    }
}

class InstantTutoringQuiz extends Quiz {

    constructor(quizObject/*QuestionGroups*/, currentQuestionId) {
        super(quizObject/*QuestionGroups*/, currentQuestionId);
        console.log(quizObject);

        this.validationElement;
        this.notificationBubbleContainer;
        this.updateValidationTimerId;
        this.validationLastState;
        this.exclamationContainer;
        this.globalMessage = "";
        this.globalElementToAppend;

    }

    init() {
        let currentlyViewingQuestion = this.getQuestion() instanceof Question;
        
        this.validationElement = document.querySelector(".formulation.clearfix .stackinputfeedback");

        if(this.validationElement == undefined) {
            console.log("ALQuiz: UpdateValidation not started, because no validation element found "+(currentlyViewingQuestion == true ? "for unknown reasons" : " because we are on an instruction element")+".");
        }
        else {
            this.updateValidationTimerId = setInterval(this.updateValidation, 1500, this);
        }

        if(currentlyViewingQuestion == true) {
            let fixedContainer = document.createElement("div");
            fixedContainer.classList.add("chat-ui");

            let dmIcon = document.createElement("img");
            dmIcon.classList.add("dm-icon");
            dmIcon.src = "https://marvin.hs-bochum.de/~mneugebauer/dm-avatar-grin.svg";
            dmIcon.onclick = function() {
                let bubble = document.querySelector(".chat-ui .bubble");
                if(bubble.dataset.isTransitioning == true) {
                    return;
                }
                bubble.classList.toggle("active");
                if(bubble.classList.contains("active") == true) {
                    bubble.classList.toggle("temporarily-removed");
                }
                document.querySelector(".chat-ui .red-dot").classList.remove("active");
            }

            let speechBubbleContainer = document.createElement("div");
            speechBubbleContainer.classList.add("bubble", /*"temporarily-removed"*/"active");
            speechBubbleContainer.addEventListener("transitionend", removeSpeechBubbleAfterTransitionEnd);
            let speechBubbleContentElement = document.createElement("div");
            speechBubbleContentElement.classList.add("bubble-content");
            speechBubbleContainer.appendChild(speechBubbleContentElement);
            this.notificationBubbleContainer = speechBubbleContainer;
            this.notificationBubbleContentElement = speechBubbleContentElement;

            speechBubbleContainer.dataset.isTransitioning = "0";
            speechBubbleContainer.ontransitionstart = function() {
                this.dataset.isTransitioning = "1";
            }
            speechBubbleContainer.ontransitionend = function() {
                this.dataset.isTransitioning = "0";
            }

            let iconContainer = document.createElement("div");
            //iconContainer.style.float = "right";
            iconContainer.style.position = "relative";

            let exclamationContainer = document.createElement("div");
            exclamationContainer.classList.add("red-dot");
            this.exclamationContainer = exclamationContainer;

            fixedContainer.appendChild(speechBubbleContainer);
            iconContainer.appendChild(dmIcon);
            iconContainer.appendChild(exclamationContainer);
            fixedContainer.appendChild(iconContainer);

            document.querySelector(".formulation").appendChild(fixedContainer);

            document.querySelector("button[id$=_-submit], input[id$=_-submit]").addEventListener("click", function(event) {
                event.preventDefault();
                receiveFeedback();
            });
        }
    }

    //overwrites parent function
    updateSpeechBubbles(id) {
        let currentlyViewingQuestion = this.getQuestion() instanceof Question;
        if(currentlyViewingQuestion == false) {
            //Don't update when viewing instruction elements.
            return;
        }
        if (id == undefined) {
            id = this.currentQuestionId;
        }
        let currQuestion = this.getQuestion(id);
        if (!currQuestion || !currQuestion.BubbleInfo) {
            return false;
        }
        let bubbles = document.querySelectorAll(".bubble:not(.in-modal) .bubble-content");
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
        let alert = false;

        //initial state
        console.log("update speech bubble to initial state");
        text = currQuestion.BubbleInfo.getText("init") == undefined ? "Starte mit der Bearbeitung dieser Aufgabe, damit ich dir R&uuml;ckmeldung geben kann." : currQuestion.BubbleInfo.getText("init");
        alert = true;

        //First of all, if there is a single hint on the page, move it into the speech bubble. It may be overwritten in the ongoing process.
        let hints = document.querySelectorAll(".hint");
        if(hints.length != 1) {
            console.log("bad amount of hints");
            //do nothing, text stays the same
        }
        else if(hints[0].innerHTML != "") {
            text = hints[0].innerHTML;
            hints[0].style.display = "none";
        }
        else {
            console.log("Found hint, but it's empty.")
        }

        if (text != "") {
            //append special links to text, e. g. %nextlink%, %linktoquestionid_id%, %check%
            //...
            bubble.innerHTML = text;
        }
        if(imgReaction != "" && icon != undefined) {
            icon.src = iconUrls[imgReaction];
        }
        if(alert == true) {
            this.exclamationContainer.classList.add("active");
        }

        //rerun MathJax if possible to convert text-code to formulas
        try {
            if(MathJax != undefined) {
                console.log("convert tex to formulas");
                MathJax.Hub.Typeset();
            }
            else {
                /*Somehow there is a problem with Tex-Code in Speech Bubbles...
                //try again in five second
                setTimeout(function() {
                    console.log("set mathjax timeout");
                    if(MathJax != undefined) {
                        console.log("convert tex to formulas");
                        MathJax.Hub.Typeset();
                        MathJax.Hub.Typeset();
                    }
                    else {*/
                        console.log("MathJax not existent.");
                    /*}
                }, 5000);
                console.log("MathJax not existent.");*/
            }
        }
        catch(Error) {
            console.log("error in rerunning MathJax");
            console.log(Error);
        }

        return true;
    }

    updateValidation(object) {
        if(object == undefined) {
            object = this;
        }

        let workingValidationElement = object.validationElement.cloneNode(true);
        workingValidationElement.id = workingValidationElement.id+"_clone";
        workingValidationElement.style.display = "";
        workingValidationElement.style.background = "none";
        workingValidationElement.style.border = "none";

        //has changed?
        if(!object.validationLastState) {
            //probably an update is needed
        }
        else {
            let presentationElementClone = workingValidationElement.querySelector("[role=presentation]");
            if(presentationElementClone == undefined) {
                //console.log("nothing to display or error");
                if(workingValidationElement.classList.contains("error")) {
                    //console.log("error");
                    //same error as last time?
                    let stackinputerrorElementLast = object.validationLastState.querySelector(".stackinputerror");
                    //console.log(stackinputerrorElementLast);
                    let stackinputerrorElementCurrent = workingValidationElement.querySelector(".stackinputerror");
                    //console.log(stackinputerrorElementCurrent);
                    /*if(stackinputerrorElementLast != undefined && stackinputerrorElementCurrent != undefined) {
                        console.log(stackinputerrorElementLast.isEqualNode(stackinputerrorElementCurrent));
                    }*/
                    if(stackinputerrorElementLast != undefined && stackinputerrorElementCurrent != undefined && stackinputerrorElementLast.isEqualNode(stackinputerrorElementCurrent)) {
                        //nothing changed
                        console.log("nothing to change (same error)");
                        return false;
                    }
                    //else continue below
                }
                else {
                    console.log("nothing to change");
                    return false;
                }
            }
            else {
                let presentationElementLast = object.validationLastState.querySelector("[role=presentation]");
                if(presentationElementClone.isEqualNode(presentationElementLast)) {
                    //console.log("no update neccessary")
                    return false;
                }
            }
        }


        //check state
        if(workingValidationElement.classList.contains("error")) {
            console.log("error");
            //error routine
            //object.GameElements.helper.container.querySelector(".exclamation").classList.add("active");
            //object.speechBubbleElement.style.color = "#999999";

            //guess error type
            let errorText = "";
            let errType;
            //the following lines work for validation next to input[type=text]-elements 
            /*let errorTextElement = workingValidationElement.querySelector(".stackinputerror");
            if(!errorTextElement) {
                errType = "unknown_error";
            }
            else {
                errorText = errorTextElement.innerHTML;
                console.log(errorText);
                if(errorText.indexOf("missing * characters") != -1) {
                    errType = "multiplication_dot_missing";
                }
                else if(errorText.indexOf("invalid final character") != -1) {
                    errType = "invalid_final_char";
                }
                else {
                    errType = "unknown_error"
                }
            }
            console.log(errType);
            object.processError(errType);*/

            //the following lines work for validation next to textarea-elements
            let nodesContainingErrorInfos = workingValidationElement/*.querySelector(".stackinputerror")*/;
            let first = true;
            nodesContainingErrorInfos.childNodes.forEach(function(nodeContainingErrorInfos) {
                if(first == false) { errorText += " "; } else { first = false; }
                if(nodeContainingErrorInfos.nodeType == 3) {
                    errorText += nodeContainingErrorInfos.nodeValue;
                }
            });
            
            if(errorText == "") {
                errType = "unknown_error";
            }
            //below is relevant for each branch
            else {
                //errorText = errorTextElement.innerHTML;
                if(errorText.indexOf("missing * characters") != -1) {
                    errType = "multiplication_dot_missing";
                }
                else if(errorText.indexOf("invalid final character") != -1) {
                    errType = "invalid_final_char";
                }
                else if(errorText.indexOf("listing the values") != -1) {
                    errType = "invalid_value_listing";
                }
                else {
                    errType = "unknown_error"
                }
            }
            
            object.processError(errType, false);
            //return false;
        }
        else if(workingValidationElement.classList.contains("loading")) {
            console.log("wait a moment and try again in some seconds");
        }
        else {
            //hide notification speech bubble after reattempting after error
            if(object.validationLastState != undefined && object.validationLastState.classList.contains("error")) {
                object.hideNotificationSpeechBubble();
            }
            
            //Following lines are relevant for fantasy branch.
            /*
            object.GameElements.helper.container.querySelector(".exclamation").classList.remove("active");
            //Where is our fairy? If user is currently notified by speech bubble due to error, send back!
            let helperNode = document.querySelector(".fairy-place-holder img");
            if(helperNode != undefined) {
                hideNotificationSpeechBubble();
            }

            object.speechBubbleElement.style.color = "";

            //clean speeach bubble and insert into speech bubble
            while(object.speechBubbleElement.lastChild) {
                object.speechBubbleElement.removeChild(object.speechBubbleElement.lastChild);
            }
            object.speechBubbleElement.appendChild(workingValidationElement);
            */
        }
        //console.log("reached end of updateVali");

        object.validationLastState = workingValidationElement;

        //On autoTriggerFeedback, check if autoTriggerCondition is met.
        let currentQuestion = object.getQuestion();
        if(currentQuestion.autoTriggerFeedbackCondition != undefined && typeof currentQuestion.autoTriggerFeedbackCondition == "function" && currentQuestion.autoTriggerFeedbackCondition() == true) {
            receiveFeedback();
        }

        return true;
    }

    killUpdateValidationTimer() {
        clearTimeout(this.updateValidationTimerId);
    }

    processError(errType, autoShowSpeechBubble) {
        if(errType == undefined) {
            errType = "unknown_error";
        }
        let texts = {
            multiplication_dot_missing:[
                //"Mind to enter your answers with stars * for multiplications!",
                "Denke daran, f&uuml;r Multiplikationen Sterne * zu nutzen.",
                //"Mind the *!",
                "Denk' an die *!",
                //"Don't forget to use stars * for your multiplications!"
                "Vergiss nicht, durch Sterne * deine Multiplilkationen anzuzeigen."
            ],
            invalid_final_char:[
                //"It is not possible to end a term like this.",
                "So darf der Term nicht enden.",
                //"Your term ends invalid.",
                "Mit dem letzten Zeichen in deinem Termn stimmt etwas nicht.",
                //"No, like this the term can't be interpreted because of a wrong final character."
                "So kann der Term nicht interpretiert werden, weil das letzte Zeichen falsch ist."
            ],
            invalid_value_listing:[
                //"To give more than one solution, do it like this: y = ? or y = ?"
                "Um mehr als eine L&ouml;sung anzugeben, gehe so vor: y = ? or y = ? ."
            ],
            unknown_error:[
                //"Something is wrong with your syntax, try again!",
                "Etwas stimmt mit der Syntax nicht. Bitte versuche es noch einmal.",
                //"This term can't be interpreted. Maybe you misspelled something?",
                "Dieser Term kann nicht interpretiert werden. Hast du dich vielleicht vertippt?",
                //"This won't work and I don't know why. Please try again!"
                "Dieser Term funktioniert nicht und ich wei&szlig; nicht warum. Bitte versuche es noch einmal."
            ]
            
        };
        let possibleTexts = texts[errType];
        let text = "";
        if(possibleTexts == undefined) {
            possibleTexts = texts.unknown_error;
        }
        text = possibleTexts[Math.floor(Math.random()*possibleTexts.length)];
        //this.notificationBubbleContainer.innerHTML = text;
        //this.exclamationContainer.classList.add("active");
        this.processNotification(text, autoShowSpeechBubble);
    }

    processNotification(message, autoShowSpeechBubble, elementToAppend) {
        console.log("processing notification");
        if(message == undefined) {
            console.log("no message to process");
            return false;
        }
        if(autoShowSpeechBubble == undefined) {
            autoShowSpeechBubble = false;
        }

        if(this.notificationBubbleContainer.classList.contains("active")) {
            this.notificationBubbleContainer.classList.remove("active");

            this.globalMessage = message;
            this.globalElementToAppend = elementToAppend;
            this.notificationBubbleContainer.addEventListener("transitionend", showSpeechBubbleAgainAfterClose, false);
            return;
        }
        else {
            this.notificationBubbleContainer.removeEventListener("transitionend", showSpeechBubbleAgainAfterClose);
            
            this.notificationBubbleContainer.classList.add("active");
            this.notificationBubbleContainer.classList.remove("temporarily-removed");
        }

        this.notificationBubbleContentElement.innerHTML = message;
        this.updateQuestionLinks();
        //rerun MathJax if possible to convert text-code to formulas
        if(!!MathJax) {
            console.log("convert tex to formulas");
            MathJax.Hub.Typeset();
        }
        else {
            console.log("MathJax not existent.");
        }

        if(elementToAppend != undefined) {
            this.notificationBubbleContentElement.appendChild(elementToAppend);
        }
        else {
            console.log("elementToAppend is undefined");
        }
        //console.log(message);
        if(autoShowSpeechBubble) {
            this.showNotificationSpeechBubble();
        }
    }

    showNotificationSpeechBubble() {
        this.notificationBubbleContainer.classList.remove("temporarily-removed");
        this.notificationBubbleContainer.classList.add("active");
        this.exclamationContainer.classList.remove("active");
    }

    hideNotificationSpeechBubble() {
        this.notificationBubbleContainer.classList.remove("active");
        this.exclamationContainer.classList.remove("active");
    }

    updateQuestionLinks() {
        let ALQuizObject = this;
        document.querySelectorAll("[data-question-link]").forEach(function(questionLink) {
            let url = ALQuizObject.getPageURL(questionLink.dataset.questionLink);
            if(!url) {
                return;
            }
            questionLink.href = url;
        });
    }

    markQuestionAsSolved(questionId) {
        if(questionId != undefined) {
            questionId = this.currentQuestionId;
        }
        let currentQuestion = this.getQuestion(questionId);
        let solvedNowQuestionButtons = document.querySelectorAll('.qnbutton[data-quiz-page="'+currentQuestion.page+'"]');
        solvedNowQuestionButtons.forEach(function(solvedNowQuestionButton) {
            solvedNowQuestionButton.classList.add("correct");
        });
    }
}

async function createALQuizFromLastQuizElement() {
    //Expect gamified quiz structure in last element of quiz in json-format.
    let linkToLastQuizItem = document.querySelector("#mod_quiz_navblock a:last-child");
    if(linkToLastQuizItem != undefined && linkToLastQuizItem.href != undefined) {
        //console.log(linkToLastQuizItem.href)
    }
    else {
        //throw clean error
        return;
    }
    //console.log(linkToLastQuizItem.href);
    return await fetch(linkToLastQuizItem.href).then(function(response) {
        return response.text();
    })
    .then(function(htmlText) {
        //console.log(htmlText);
        let regexresult = htmlText.match(/class=".*?qtext.*?">([\d\D]*?)<\/div>/);
        if(!regexresult) {
            //throw clean error
            return false;
        }
        let firstBrace = regexresult[0].indexOf('{');
        let lastBrace = regexresult[0].lastIndexOf('}');

        let jsonString = regexresult[0].slice(firstBrace, lastBrace+1);
        
        //In the moodle backend, sometimes unwanted line breaks are added, probably by TinyMCE. These are removed with the following line. Line breaks inserted into the JSON texts with "\n" are not removed (this would be /\\n/).
        //Furthermore, for yet unknown reasons Moodle adds <span class="nolink">...</span>-Tags around LaTex code. This is completely removed here.
        jsonString = jsonString.replace(/\n/g,"").replace(/<span class="[\d\D]*?nolink.*?>(.*?)<\/span>/g, "$1");
        //console.log(jsonString);

        let quizObject = JSON.parse(jsonString);
        //ALQuiz = new Quiz(quizObject);

        //console.log(JSON.parse(jsonString));
        //If everything went fine up to here, the last element of the quiz contained the configuration and is to be hidden.
        linkToLastQuizItem.style.display = "none";

        return quizObject;
    });
}
let currentQuestionId;

//Will be overwritten later, but is initialized to ensure any calls of ALQuiz in the question text will be processed.
let ALQuiz = new Quiz();
/*let ALQuiz = new Quiz(QuestionGroups);

let solvedQuestionsAsString = localStorage.getItem("solved");
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
    localStorage.setItem("solved", JSON.stringify(solved));
}

let visitedQuestionsAsString = localStorage.getItem("visited");
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
    localStorage.setItem("visited", JSON.stringify(visited));
}*/

document.addEventListener("DOMContentLoaded", function () {

    if (window.location.href.indexOf("review.php") < 0) {

        createALQuizFromLastQuizElement().then(createdQuizObject => {

            ALQuiz = new InstantTutoringQuiz(createdQuizObject, ALQuiz.currentQuestionId);

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

            ALQuiz.init();
            //in development state: interrupt button update to give the main page time to recognize the inline scripts like increment solved and set current question id
            /*setTimeout('*/ALQuiz.updateSpeechBubbles(); ALQuiz.updateMoodleNavButtons(); ALQuiz.updateNavigation(); /*', 500)*/;

            //If there are textareas, a STACK-equivalence-reasoning task is expected. In this case, we pull feedback after each new line.
            document.querySelectorAll(".formulation textarea").forEach(function(questionTextareaField) {
                questionTextareaField.addEventListener("input", receiveInstantFeedbackOnNewLine);
            });
        });
    }


    //add styles, e. g. speech bubble
    let style = document.createElement("style");
    style.type = "text/css";
    //.que .outcome background-color is #fcefdc;
    style.innerHTML = ".red-dot { position: absolute; top: 2%; right:0%; background:#e2001a; padding:1em; box-sizing:border-box; border-radius: 100%; display:none; } .red-dot.active { display:block; } .chat-ui { position:fixed; bottom:50px; right:50px; z-index:1; float:right; display:flex; flex-direction:column; } .bubble { /* layout*/ position: relative; max-width:15em; display:block; /* looks*/ background-color: #fcefdc; padding: 1.125em 1.5em; font-size: 1.25em; border-radius: 1rem; box-shadow:0 0.125rem 0.5rem rgba(0, 0, 0, .3), 0 0.0625rem 0.125rem rgba(0, 0, 0, .2); transition:transform 1s; transform-origin:bottom; z-index:1; max-height:60vh; } .bubble:not(.inquestion) { transform:scale(1,0); } .bubble.inquestion { max-width:unset; } .bubble.active { transform:scale(1,1); } .bubble.temporarily-removed { height:0; } .bubble:not(.no-arrow)::before { /* layout*/ content: ''; position: absolute; width: 0; top: 100%; right: 1.5em; /* offset should move with padding of parent*/ border: .75rem solid transparent; border-bottom: none; /* looks*/ border-top-color: #fcefdc; filter: drop-shadow(0 0.0625rem 0.0625rem rgba(0, 0, 0, .1)); } .bubble.inquestion:not(.no-arrow)::before { right:unset; left:1.5em; } .bubble .bubble-content { /*an additional div to ensure scrollability by simultaneously keep the speech-bubble-arrow visible, which indeed is an overflow*/ overflow:scroll; max-height:50vh; } .formulation a { text-decoration:underline; } .mathsinput { position:fixed; display:flex; width:100vw; bottom:0px; z-index:1; } .mathsinput button { flex-grow:1; } table.trigonometry_table { border:1px solid black;width:100%; } table.trigonometry_table th, td { border:1px solid black;text-align:center; } .dm-icon { float:right; border:2px solid black; border-radius:50%; width: 7.5em; box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, .3), 0 0.0625rem 0.125rem rgba(0, 0, 0, .2); } .dm-icon.inquestion { float:none; } .user-focus { background-color: #000; width: 100%; height: 100%; position: absolute; opacity: 0.5; overflow: none; display: block; left: 0; z-index:2; } .user-focus.hide-top { top:0; } .user-focus.hide-bottom { bottom:0; } .dmmodal { display: none; /* Hidden by default */ position: fixed; /* Stay in place */ z-index: 1; /* Sit on top */ padding-top: 100px; /* Location of the box */ left: 0; top: 0; width: 100%; /* Full width */ height: 100%; /* Full height */ overflow: auto; /* Enable scroll if needed */ background-color: rgb(0,0,0); /* Fallback color */ background-color: rgba(0,0,0,0.4); /* Black w/ opacity */ } /* Modal Content */ .dmmodal-content { background-color: #fefefe; margin: auto; padding: 20px; border: 1px solid #888; width: 80%; } /* The Close Button */ .dmclose { color: #aaaaaa; float: right; font-size: 28px; font-weight: bold; } .close:hover, .close:focus { color: #000; text-decoration: none; cursor: pointer; } .mathsinput { position:fixed; display:flex; width:100vw; bottom:0px; z-index:1; } .mathsinput button { flex-grow:1; } .show-on-mobile-only { display:inline-block; } .show-on-desktop-only { display:none; } .mathsbutton { float:right; border:1px solid black; border-radius:50%; height:2em; width:2em; background-color:#aaaaaa; background-image:url(\"https://marvin.hs-bochum.de/~mneugebauer/operators-white.svg\"); background-repeat:no-repeat; background-size:90%; background-position:50%; } .mathsbutton.active { background-color:#e2001a; } @media (min-width:991px) { .mathsinput { display:none; } .show-on-mobile-only { display:none; } .show-on-desktop-only { display:inline-block; } .chat-ui { position:relative; flex-direction:row; width:100%; float:left; bottom:auto; right:auto; } /*add max-height transition to ensure other relative positioned elements move together with bubble on transition*/ .bubble:not(.inquestion) { max-height:0em; order:2; transform-origin:top; transition:transform 1s, max-height 1s; max-width:unset;  } .bubble.active { max-height:20em; } .bubble .bubble-content { max-height:19em; } .bubble:not(.no-arrow):not(.inquestion)::before { left:auto; right:100%; top:1.5em; border-bottom:.75rem solid transparent; border-left: none; border-top-color:transparent; border-right-color:#fcefdc; box-shadow:none; } } .stackinputerror { display:none !important; }";
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


//INSTANT TUTORING FUNCTIONS
let lastTextareaLength;
let lastTextareaEndingWhitespaces;
var Parser = new DOMParser();
function receiveInstantFeedbackOnNewLine() {
    let currentTextareaEndingWhitespaces = this.value.match(/.*?(\s*)$/)[1].length;
    //console.log(this.value.charAt(this.value.length-1));
    if(this.value.charAt(this.value.length-1) == "\n" && (lastTextareaLength < this.value.length || lastTextareaLength == undefined) && (/*cursor is at end of textare*/ this.selectionStart == this.value.length || (/*betwenn cursor and end of textarea are only whitespaces and the amount of new lines in the end raised*/ this.value.substring(this.selectionStart).match(/[^\s]/) == null && currentTextareaEndingWhitespaces > lastTextareaEndingWhitespaces))) {
        //if(this.selectionStart == this.value.length) {
            console.log("time to receive feedback");
            receiveFeedback();
        /*}
        else {
            //Cursor may not be at the end, but user wants feedback
            let remainingText = this.value.substring(this.selectionStart)
            console.log("remainingText: "+remainingText);
            if(remainingText.match("[^\s]*") == null) {
                //Remaining text consists only of whitespaces
            }
        }*/
    }
    lastTextareaLength = this.value.length;
    lastTextareaEndingWhitespaces = currentTextareaEndingWhitespaces;
}

function receiveFeedback() {
    let form = document.getElementById("responseform");
    if(form == undefined) {
        //error handling
        console.log("no form to submit");
        return false;
    }
    let formData = new FormData(form);
    let submitButtonData = document.querySelector("input.submit,button.submit");
    if(submitButtonData == undefined) {
        //error handling
        console.log("no submit button found");
        return false;
    }
    //let formDataAnswer = structuredClone(formData);
    let formDataAnswer = new FormData(form);
    formDataAnswer.append(submitButtonData.name, submitButtonData.value);
    //console.log("try to fetch 1");
    //console.log(document.querySelector("input[name$=sequencecheck]").value);
    //console.log(document.querySelector("input[name$=ans1_val]") == undefined ? "undefined" : document.querySelector("input[name$=ans1_val]").name);
    fetch(form.action, {method:"POST",body:formDataAnswer})
    .then(response => {
        if(response.status == 404) {
            throw new Error("test99");
        }
        return response.text();
    })
    .then(text => {
        let fetchedPage = Parser.parseFromString(text, "text/html");
        let formFetchedPage = fetchedPage.getElementById("responseform");

        let repeatButton = fetchedPage.querySelector(".mod_quiz-redo_question_button");
        if(repeatButton == undefined) {
            //If there is no repeat button, we are probably on a validation page, which happens for unknown reasons. If there are no syntax errors, submit again to get feedback page. But if there are syntax errors, the form sequence check has to be corrected
            let syntaxErrorNotification = fetchedPage.querySelector(".stackinputerror");
            if(syntaxErrorNotification != undefined) {
                console.log("there is a syntax error");
                //update sequence check
                console.log("sequence check: changed "+document.querySelector("input[name$=sequencecheck]").value+" to "+formFetchedPage.querySelector("input[name$=sequencecheck]").value);
                document.querySelector("input[name$=sequencecheck]").value = formFetchedPage.querySelector("input[name$=sequencecheck]").value;
                //leave promise chain here
                throw new Error("test3");
            }
            let submitButton = fetchedPage.querySelector("input.submit,button.submit");
            if(submitButton == undefined) {
                //Maybe the user submitted an answer containing a syntax error, leading (again) to the verification page. If this is the case, there is this Moodle-information-page, informing that users entered answers out of the ordinary control sequence. In this case, the continue button resets something so we can continue.
                throw new Error("test1");
            }

            //else
            
            /*console.log("sequence check: changed "+document.querySelector("input[name$=sequencecheck]").value+" to "+formFetchedPage.querySelector("input[name$=sequencecheck]").value);
            document.querySelector("input[name$=sequencecheck]").value = formFetchedPage.querySelector("input[name$=sequencecheck]").value;
            if(document.querySelector("input[name$=ans1_val]") != undefined) {
                console.log("element name: changed "+document.querySelector("input[name$=ans1_val]").name+" to "+formFetchedPage.querySelector("input[name$=ans1_val]").name);
                document.querySelector("input[name$=ans1_val]").name = formFetchedPage.querySelector("input[name$=ans1_val]").name;
            }*/

            let matchSubmit = [
                "",
                submitButton.name,
                submitButton.value
            ];

            let formDataSubmitValidation = new FormData(formFetchedPage);

            formDataSubmitValidation.append(matchSubmit[1], matchSubmit[2]);

            //console.log("try to fetch 2");
            return fetch(formFetchedPage.action, {method:"POST", body:formDataSubmitValidation}).then(response => { return response.text(); }).then(text => { return Parser.parseFromString(text, "text/html"); });
        }
        else {
            return fetchedPage;
        }
    })
    .then(fetchedPage => {
        //let fetchedPage = Parser.parseFromString(text, "text/html");
        let toAppendToMessage;
        let formFetchedPage = fetchedPage.getElementById("responseform");

        //if response is not positive, immediately repeat question
        //get information about repeat button from response
        //we look for input.mod_quiz-redo_question_button
        //let matchRedo = text.match(/input.*?name="(.*?)".*?value="(.*?)".*?class=".*?mod_quiz-redo_question_button.*?/);
        let repeatButton = fetchedPage.querySelector(".mod_quiz-redo_question_button");
        if(repeatButton == undefined) {
            //Maybe the user submitted an answer containing a syntax error, leading (again) to the verification page.
            throw new Error("test2");
        }
        let matchRedo = [
            "",
            repeatButton.name,
            repeatButton.value
        ];
        //console.log(matchRedo);
        //For feedback, we look for .stackprtfeedback (each of them).
        //let matchFeedback = text.match(/class=".*?stackprtfeedback.*?".*?><div class="(.*?)">([\d\D]*?)<div class="outcome clearfix/);
        //console.log(matchFeedback);
        let generalFeedbackNode = fetchedPage.querySelector(".stackprtfeedback .partiallycorrect, .stackprtfeedback .incorrect, .stackprtfeedback .correct");
        let feedbackContentNode = fetchedPage.querySelector(".stackprtfeedback");
        let matchFeedback = [
            "",
            generalFeedbackNode.classList.item(0),
            feedbackContentNode.innerHTML
        ];

        //console.log(formFetchedPage);

        let message = "";
        let lastStroke = false;

        //if(true/*Currently, it is not possible to offer different reactions between correct and incorrect / partially correct due to out of sequence error. matchFeedback[1] == "partiallycorrect" || matchFeedback[1] == "incorrect"*/) {
            message = matchFeedback[2];

            //get ready for redo
            let formDataRetry = new FormData(formFetchedPage);
            formDataRetry.append(matchRedo[1], matchRedo[2]);

            /*return */fetch(formFetchedPage.action, {method:"POST", body:formDataRetry});
            //Following line: Simple but effecitve. Alternatively one could process the fetch-response and filter fetchedPage.querySelector("input[name$=sequencecheck]") and maybe also fetchedPage.querySelector("input[name$=ans1_val]") to apply these to the current document.
            document.querySelector("input[name$=sequencecheck]").value = 1;

        //}
        //else {
            //correct or undefined
         /*   console.log("victory");
            let possibleTexts = [
                "You made it! Congratulations!",
                "Well done! You are victorious!",
                "Wonderful! You made it!"
            ];
            message = possibleTexts[Math.floor(Math.random()*possibleTexts.length)];
            lastStroke = true;

            //does the following line work as expected?
            ALQuiz.incrementSolved();*/

            /* Try to prevent submission out of sequence error: This one fails
            //fetch same page to ensure staying in the right sequence and preventing the "submission out of sequence friendly message" error to be displayed
            console.log("refetch "+ALQuiz.getPageURL());
            fetch(ALQuiz.getPageURL());
            */
        //}

        if(matchFeedback[1] == "partiallycorrect" || matchFeedback[1] == "incorrect") {
            console.log("partially or incorrect");
            ALQuiz.saveState(matchFeedback[1] == "partiallycorrect" ? "partially" : "false");
        }
        else {
            console.log("victory");
            //important to call getPageURL to generate different variants
            //let repeatURL = ALQuiz.getPageURL();
            //let nextURL = ALQuiz.getPageURL(ALQuiz.getQuestion().onsuccess);
            toAppendToMessage = document.createElement("p");
            let repeatAnchor = document.createElement("a");
            repeatAnchor.innerHTML = " Aufgabe mit anderen Zahlen wiederholen";
            repeatAnchor.href = "javascript:;";
            let nextAnchor = document.createElement("a");
            nextAnchor.innerHTML = "n&auml;chste Aufgabe";
            nextAnchor.href = "javascript:;";

            texts = ["Wenn es dir mehr Sicherheit gibt, kannst du diese ", ". Ansonsten bist du bereit f&uuml;r die ", ".", "Wenn es dir mehr Sicherheit gibt, kannst du hier noch etwas experimentieren"].map(function(string) { let node = document.createElement("span"); node.innerHTML = string; return node; });

            //toAppendToMessage.innerHTML = "Wenn es dir mehr Sicherheit gibt, kannst du diese ";
            if(ALQuiz.currentQuestionId == "start") {
                toAppendToMessage.appendChild(texts[3]);
            }
            else {
                toAppendToMessage.appendChild(texts[0]);
                toAppendToMessage.appendChild(repeatAnchor);
            }
            //toAppendToMessage.innerHTML += ". Ansonsten bist du bereit f&uuml;r die ";
            toAppendToMessage.appendChild(texts[1]);
            toAppendToMessage.appendChild(nextAnchor);
            //toAppendToMessage.innerHTML += ".";
            toAppendToMessage.appendChild(texts[2]);


            let returnedPageRepeat  = ALQuiz.getRandomPageOfQuestion();
            repeatAnchor.addEventListener("click", function(event) {
                event.preventDefault();
                document.getElementById("quiznavbutton"+(returnedPageRepeat+1)).click(); 
            });
            console.log(returnedPageRepeat);


            let returnedPageNext  = ALQuiz.getRandomPageOfQuestion(ALQuiz.getQuestion().onsuccess);
            nextAnchor.addEventListener("click", function(event) {
                event.preventDefault();
                document.getElementById("quiznavbutton"+(returnedPageNext+1)).click(); 
            });
            console.log(returnedPageNext);
            //message += "Wenn es dir mehr Sicherheit gibt, kannst du diese <a href=\""+repeatURL+"\">Aufgabe wiederholen</a>. Ansonsten bist du bereit f&uuml;r die <a href=\"" + nextURL + "\">n&auml;chste Aufgabe</a>.";
            console.log(toAppendToMessage);
            //does the following line work as expected?
            ALQuiz.incrementSolved();
            ALQuiz.markQuestionAsSolved();
        }


        //object.animateAttack(lastStroke);
        //show feedback
        //setTimeout(function() { object.processNotification(message, true); }, 1000);
        console.log(toAppendToMessage);
        ALQuiz.processNotification(message, true, toAppendToMessage);
        ALQuiz.updateQuestionLinks();
    })
    .catch(function(error) {
        console.log("catched error");
        console.log(error);
    });
}

function removeSpeechBubbleAfterTransitionEnd() {
    if(this.classList.contains("active") == false) {
        this.classList.add("temporarily-removed");
    }
}

function showSpeechBubbleAgainAfterClose() {
    ALQuiz.processNotification(ALQuiz.globalMessage, undefined, ALQuiz.globalElementToAppend);
    console.log("show now!");
}

//OVERALL GAMIFIED QUIZ FUNCTIONS
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
        //let navbar = document.querySelector("nav");
        //offset = pageElementWHS.scrollTop - (!navbar ? 0 : navbar.getBoundingClientRect().height);
        //pageHeight = pageElementWHS.scrollHeight;
        //console.log("we are probably in WHS-Moodle");
        //console.log("offset: "+offset+", pageHeight: "+pageHeight);
        offset = -pageElementWHS.getBoundingClientRect().top+pageElementWHS.scrollTop;
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