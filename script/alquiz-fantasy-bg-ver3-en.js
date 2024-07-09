console.log("here starts alquiz fantasy ver 3");

class GamifiedQuiz {
    constructor(quizObject) {
        this.currentQuestionId;
        this.currentPage;
        this.Parser = new DOMParser();
        this.QuestionGroups = {};
        this.solvedVariants = [];
        //this.QuestionGroupsById = {};
        if (quizObject != undefined) {
            if (quizObject.groups != undefined) {
                for (let questionGroupId in quizObject.groups) {
                    this.QuestionGroups[questionGroupId] = new QuestionGroup(questionGroupId, quizObject.groups[questionGroupId]);
                }
            }
            let pageCount = 0;
            if (quizObject.questions != undefined) {
                for (let questionId in quizObject.questions) {
                    let groupToAddId;
                    if (this.QuestionGroups[quizObject.questions[questionId].group] != undefined) {
                        groupToAddId = quizObject.questions[questionId].group;
                    }
                    else {
                        //try to identify group by token, elsewise add to group "unsorted"
                        if (questionId.indexOf("_") != -1) {
                            let expectedGroupNameMatch = questionId.match(/^(.*)_/);
                            if (expectedGroupNameMatch[1] != undefined && expectedGroupNameMatch[1] != "") {
                                if (this.QuestionGroups[expectedGroupNameMatch[1]] != undefined) {
                                    groupToAddId = expectedGroupNameMatch[1];
                                }
                            }
                        }
                        if (groupToAddId == undefined) {
                            if (this.QuestionGroups.unsorted == undefined) {
                                this.QuestionGroups.unsorted = new QuestionGroup("unsorted", "Unsorted Questions");
                            }
                            groupToAddId = "unsorted";
                        }
                        this.QuestionGroups[groupToAddId].addQuestion(new Question(questionId, quizObject.questions[questionId].name));
                    }
                    let ElementToAdd;
                    if (quizObject.questions[questionId].type == "instruction") {
                        ElementToAdd = new Instruction(questionId, quizObject.questions[questionId].name, pageCount, quizObject.questions[questionId].onsuccess, quizObject.questions[questionId].onfailure, quizObject.questions[questionId].BubbleInfo, quizObject.questions[questionId].onpage);
                    }
                    else {
                        ElementToAdd = new Question(questionId, quizObject.questions[questionId].name, pageCount, quizObject.questions[questionId].needs, quizObject.questions[questionId].BubbleInfo, quizObject.questions[questionId].onsuccess, quizObject.questions[questionId].onfailure, quizObject.questions[questionId].askBeforeSkip, quizObject.questions[questionId].onpage, quizObject.questions[questionId].variants, quizObject.questions[questionId].color, quizObject.questions[questionId].filter);
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

                /*if (!this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onfailure) {
                    //You may want to lead users to the first question of next group, assuming, that they are not able to solve the next (harder) question unless they are not able to solve the current (easier) question.
                    if (i < grouplength - 1) {
                        //console.log(Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j] + " leads to next group onfailure ");
                        this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onfailure = Object.keys(this.QuestionGroups[groupNames[i + 1]].Questions)[0];
                    } else {
                        //console.log("no other group");
                        this.QuestionGroups[groupNames[i]].Questions[Object.keys(this.QuestionGroups[groupNames[i]].Questions)[j]].onfailure = "_finish";
                    }
                }*/
            };
        }

        //check for storage data
        let solvedQuestionsAsString = sessionStorage.getItem("solved");
        if (solvedQuestionsAsString != undefined) {
            let solvedQuestions;
            try {
                solvedQuestions = JSON.parse(solvedQuestionsAsString);
            } catch (error) {
                console.log("Error in parsing solved questions from json. Reset solved questions to [].")
                let solved = [];
                sessionStorage.setItem("solved", JSON.stringify(solved));
            }
            if (solvedQuestions != undefined) {
                solvedQuestions.forEach(solvedQuestion => {
                    let Question = this.getQuestion(solvedQuestion);
                    if(!Question) {
                        console.log("-- WARNING -- Quiz structure may have changed. A question id stored in session storage was not found in quiz object.");
                    }
                    else {
                        Question.solved = Question.needs;
                    }
                });
            }
        }
        else {
            let solved = [];
            sessionStorage.setItem("solved", JSON.stringify(solved));
        }

        let solvedVariantsAsString = sessionStorage.getItem("solvedVariants");
        if (solvedVariantsAsString != undefined) {
            let solvedVariants;
            try {
                solvedVariants = JSON.parse(solvedVariantsAsString);
            } catch (error) {
                console.log("Error in parsing solved Variants from json. Reset solved Variants to [].")
                let solvedVariants = [];
                sessionStorage.setItem("solvedVariants", JSON.stringify(solvedVariants));
            }
            if (solvedVariants != undefined) {
                this.solvedVariants = solvedVariants;
                for(let j in this.QuestionGroups) {
                    for(let i in this.QuestionGroups[j].Questions) {
                        for(let k=0;k<this.QuestionGroups[j].Questions[i].variants;k++) {
                            if(solvedVariants.indexOf(this.QuestionGroups[j].Questions[i].page+k) != -1) {
                                this.QuestionGroups[j].Questions[i].solvedVariants.push(k);
                            }
                        }
                    }
                }
            }
        }
        else {
            let solvedVariants = [];
            sessionStorage.setItem("solvedVariants", JSON.stringify(solvedVariants));
        }

    }

    setCurrentQuestionId(questionId) {
        this.currentQuestionId = questionId;
        this.markQuestionAsCurrent(this.currentQuestionId);
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

    updateNavigation() {
        let navPanel = document.querySelector(".qn_buttons");
        if (!navPanel) {
            return false;
        }
        let buttons = document.querySelectorAll("[id*=quiznavbutton]");
        if (buttons.length == undefined || buttons.length < 1) {
            return false;
        }

        let solvedQuestionsAsString = sessionStorage.getItem("solved");
        let solvedQuestionsAsArray = [];
        if(solvedQuestionsAsString != undefined) {
            solvedQuestionsAsArray = JSON.parse(solvedQuestionsAsString);
        }

        let partiallyCorrectQuestionsAsString = sessionStorage.getItem("partially");
        let partiallyCorrectQuestionsAsArray = [];
        if(partiallyCorrectQuestionsAsString != undefined) {
            partiallyCorrectQuestionsAsArray = JSON.parse(partiallyCorrectQuestionsAsString);
        }

        let falseQuestionsAsString = sessionStorage.getItem("false");
        let falseQuestionsAsArray = [];
        if(falseQuestionsAsString != undefined) {
            falseQuestionsAsArray = JSON.parse(falseQuestionsAsString);
        }

        //group
    	//let groupHeadingNodes = [];
        for(let m in this.QuestionGroups) {
            //this.QuestionGroups.forEach(QuestionGroup => {

            let j = 0;
            let k = 1;
            let questionAmount = Object.keys(this.QuestionGroups[m].Questions).length;

            let wrapper = document.createElement("span");
            wrapper.classList.add("section-wrapper");
            wrapper.dataset.isFor = this.QuestionGroups[m].id;
            //groupHeadingNodes.push(heading);
            
            let heading = document.createElement("h2");
            heading.innerHTML = this.QuestionGroups[m].description;
            heading.style.clear = "left";
            wrapper.appendChild(heading);

            let drawerCloser;
            for(let i in this.QuestionGroups[m].Questions) {
                //console.log("quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+1));
                let questionCard = document.getElementById("quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+1));
                if(questionCard == undefined) {
                    console.log("bad question id "+"quiznavbutton"+(this.QuestionGroups[m].Questions[i].page+1));
                    continue;
                }
                let drawerParent = questionCard.closest(".drawer");
                let drawerCloser;
                if(drawerParent != undefined) {
                    if(drawerCloser == undefined) {
                        drawerCloser = drawerParent.querySelector("[data-action=\"closedrawer\"]");
                    }
                }
                //if still undefined, we are probably in a different theme
                if(drawerCloser == undefined) {
                    inOtherTheme = true;
                }
                let object = this;
                questionCard.dataset.questionId = this.QuestionGroups[m].Questions[i].id;
                let clickFunction;
                if(this.QuestionGroups[m].Questions[i].id != "start") {
                    clickFunction = function(event) {
                        event.preventDefault();
                        event.stopPropagation();

                        if(videoAnimation == true) { return; }

                        if(!inOtherTheme) {
                            //handle block drawer
                            let modal = document.querySelector(".modal-backdrop.show");
                            if(modal != undefined) {
                                drawerCloser.click();
                            }
                        }
                        if(object.currentQuestionId != this.dataset.questionId) {
                            object.teleportDialog(object, this.dataset.questionId);
                        };
                        return false;
                    };
                }
                else {
                    clickFunction = function(event) {
                        event.preventDefault();
                        event.stopPropagation();

                        if(videoAnimation == true) { return; }

                        if(!inOtherTheme) {
                        //handle block drawer
                            let modal = document.querySelector(".modal-backdrop.show");
                            if(modal != undefined) {
                                drawerCloser.click();
                            }
                        }
                        if(object.currentQuestionId != this.dataset.questionId) {
                            object.goBackToCity();
                        }
                        return false;
                    };
                }
                questionCard.addEventListener("click", clickFunction);

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
                            slotMarker.nextSibling.data = "";
                            let endbossImg = document.createElement("img");
                            if(this.QuestionGroups[m].Questions[i].id == "start") {
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
        }

        /*
        //put a flag instead of a skull, a number or an "i" in the very last question card
        document.querySelectorAll(".qn_buttons span[data-is-for]:last-child a:last-child img").forEach(function (lastQuestionCard) {
            lastQuestionCard.src = "https://marvin.hs-bochum.de/~mneugebauer/flag.svg";
        });
        */
        //add a last goal flag button
        let object = this;
        let questionCardClone = document.getElementById("quiznavbutton1").cloneNode(true);
        questionCardClone.id = "test";//"quiznavbutton_finish";
        questionCardClone.classList.remove("thispage");
        questionCardClone.classList.remove("correct");
        questionCardClone.classList.remove("incorrect");
        questionCardClone.classList.remove("partiallycorrect");
        questionCardClone.removeAttribute("data-quiz-page");
        questionCardClone.querySelector("img").src = "https://marvin.hs-bochum.de/~mneugebauer/flag.svg";
        questionCardClone.addEventListener("click", function(event) {
            console.log("clicked last question card");
            event.preventDefault();
            event.stopPropagation();
            if(videoAnimation == true) { return; }

            //handle block drawer
            let drawerParent = this.closest(".drawer");
            let drawerCloser;
            if(drawerParent != undefined) {
                drawerCloser = drawerParent.querySelector("[data-action=\"closedrawer\"]");
            }
            //if(drawerCloser != undefined) {
            let modal = document.querySelector(".modal-backdrop.show");
            if(modal != undefined && drawerCloser != undefined) {
                drawerCloser.click();
            }
            if(object.currentQuestionId != this.dataset.questionId) {
                object.teleportDialog(object, this.dataset.questionId);
            };
            //}

            if(!object.finished) {
                object.processNotification("This is the final destination. You cannot teleport here, but must first defeat the enemies.", true);
            }
            else {
                object.goToNextScene(object, true, -1, true);
            }

            return false;
        });
        document.querySelector(".section-wrapper:last-of-type").appendChild(questionCardClone);

        //show group navigation on instruction and update speech bubble navigation
        let currentQuestion = this.getQuestion();
        if (!(currentQuestion instanceof Question) && currentQuestion instanceof Instruction) {

            let CurrentGroup;
            for (let i in this.QuestionGroups) {
                if (this.QuestionGroups[i].Questions[this.currentQuestionId] != undefined) {
                    CurrentGroup = this.QuestionGroups[i];
                    break;
                }
            };

            let groupNavigation = document.querySelector(".group-navigation");
            if (groupNavigation != undefined) {
                //find current group

                if (CurrentGroup != undefined) {

                    //show group navigation
                    let cards = document.querySelectorAll("[data-is-for=" + CurrentGroup.id + "] a")
                    let cardAmount = cards.length;
                    let keys = Object.keys(CurrentGroup.Questions);
                    for (let i = cardAmount - 1; i >= 0; i--) {
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

                    let groupNavCss = document.createElement("style"); groupNavCss.type = "text/css"; groupNavCss.innerHTML = ".path-mod-quiz .group-navigation .qnbutton { text-decoration: none; font-size: 14px; line-height: 20px; font-weight: 400; background-color: #fff; background-image: none; height: 40px; width: 30px; border-radius: 3px; border: 0; overflow: visible; margin: 0 6px 6px 0;} .path-mod-quiz .group-navigation .qnbutton { background: none; background-color: rgba(0, 0, 0, 0); background-color: #eee; border: 0; border-radius: 4px; color: #000000 !important; font-size: 14px; font-weight: 700; height: 45px; line-height: 25px !important; margin: 0 5px 5px 0; width: 35px;} .group-navigation .qnbutton .thispageholder { border: 1px solid #999; border-radius: 4px; z-index: 1;}.group-navigation .qnbutton .thispageholder { border: 1px solid; border-radius: 3px; z-index: 1;}.group-navigation .qnbutton .trafficlight, group-navigation .qnbutton .thispageholder { display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0;} .path-mod-quiz .group-navigation .qnbutton.notyetanswered .trafficlight, .path-mod-quiz .group-navigation .qnbutton.invalidanswer .trafficlight { background-color: #fff;}.path-mod-quiz .group-navigation .qnbutton.notyetanswered .trafficlight, .path-mod-quiz .group-navigation .qnbutton.invalidanswer .trafficlight { background-color: #fff;}.path-mod-quiz .group-navigation .qnbutton .trafficlight { border: 0; background: #fff none center / 10px no-repeat scroll; height: 20px; margin-top: 20px; border-radius: 0 0 3px 3px;} .path-mod-quiz .group-navigation .qnbutton .trafficlight { background: #fff none center 4px / 10px no-repeat scroll; background-color: rgb(255, 255, 255); border: 0; border-radius: 0 0 4px 4px; height: 20px; margin-top: 25px;} .path-mod-quiz .group-navigation .qnbutton.correct .trafficlight {   background-color: #8bc34a;   background-image: url(/theme/image.php/adaptable/theme/1660635117/mod/quiz/checkmark); } .path-mod-quiz .group-navigation .qnbutton.notanswered .trafficlight, .path-mod-quiz .group-navigation .qnbutton.incorrect .trafficlight { background-color: #f44336; } .path-mod-quiz .group-navigation .qnbutton.partiallycorrect .trafficlight { background-color: #ff9800;   background-image: url(/theme/image.php/adaptable/theme/1660635117/mod/quiz/whitecircle); } .path-mod-quiz .group-navigation .qnbutton.thispage .thispageholder {  border: 3px solid #1f536b; } .wrap_nav_group { clear:left; }";
                    document.getElementsByTagName("head")[0].appendChild(groupNavCss);
                }
            }

            let endbossLink = document.querySelector(".endboss-link");
            if (endbossLink != undefined) {
                endbossLink.href = this.getPageURL(currentQuestion.onsuccess).url;
            }

            if (CurrentGroup != undefined) {
                let questionKeys = Object.keys(CurrentGroup.Questions);
                let nextWorldLink = document.querySelector(".link-next-world");
                let nextWorldURL = this.getPageURL(CurrentGroup.Questions[questionKeys[questionKeys.length - 1]].onsuccess).url;

                if (nextWorldLink != undefined) {
                    nextWorldLink.href = nextWorldURL;
                }

                let endbossDefeat = CurrentGroup.Questions[questionKeys[questionKeys.length - 1]].isSolved();
                let endbossStatePhrase = document.querySelector(".endboss-state");
                if (endbossStatePhrase != undefined) {
                    if (endbossDefeat == true) {
                        endbossStatePhrase.innerHTML = "bereits";
                    }
                    /*else {
                        endbossStatePhrase.innerHTML = "noch nicht";
                    }*/
                }

                let nextQuestionLink = document.querySelector(".link-next-question");
                if (nextQuestionLink != undefined) {
                    if (endbossDefeat == true) {
                        nextQuestionLink.innerHTML = "der n&auml;chsten Welt";
                        nextQuestionLink.href = nextWorldURL;
                        //overwrite default next question
                        document.querySelector(".btn-next-question").href = nextWorldURL;
                    }
                    else {
                        let i;
                        let page;
                        for (i in CurrentGroup.Questions) {
                            if (!CurrentGroup.Questions[i].isSolved() && CurrentGroup.Questions[i] instanceof Question) {
                                page = CurrentGroup.Questions[i].page;
                                break;
                            }
                        }
                        //console.log(page);
                        nextQuestionLink.setAttribute("onclick", 'tutorialFocusElement(document.querySelector(\'.wrap_nav_group [data-quiz-page="' + page + '"]\'));');
                        document.querySelector(".btn-next-question").href = this.getPageURL(i).url;
                    }
                }

                let currentLevelPhrase = document.querySelector(".current-level");
                if (currentLevelPhrase != undefined) {
                    let amount = 0;
                    let solved = 0;
                    for (let i in CurrentGroup.Questions) {
                        if (CurrentGroup.Questions[i] instanceof Question) {
                            amount++;
                            if (CurrentGroup.Questions[i].isSolved()) {
                                solved++;
                            }
                        }
                    }
                    if (endbossDefeat == true) {
                        currentLevelPhrase.innerHTML = amount + " von " + amount;
                    }
                    else {
                        currentLevelPhrase.innerHTML = solved + " von " + amount;
                    }
                }
            }

            sessionStorage.setItem("camefrom", currentQuestion.id);
        }

    }
    getNextQuestionId(questionId) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }
        let returnValue = false;

        let groupKeys = Object.keys(this.QuestionGroups);
        let length = groupKeys.length;
        console.log("get next question id");
        for (let i = 0; i < length; i++) {
            //console.log(this.QuestionGroups[groupKeys[i]].description);
            if (this.QuestionGroups[groupKeys[i]].Questions[questionId] != undefined) {
                let nextStep = this.QuestionGroups[groupKeys[i]].Questions[questionId].isSolved() ? this.QuestionGroups[groupKeys[i]].Questions[questionId].onsuccess : this.QuestionGroups[groupKeys[i]].Questions[questionId].onfailure;
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

    getNextUnsolvedQuestionId(questionId) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }
        do {
            questionId = this.getNextQuestionId(questionId);
            if(questionId == -1) {
                //special handling for very last question
                return questionId;
            }
        } while (this.getQuestion(questionId).isSolved());

        return questionId;
    }

    getPageURL(questionId) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }
        let currQuestion = this.getQuestion(questionId);
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
            sanitizedUrl = plainUrl.slice(0, relPos);
        }

        let pageToReturn = currQuestion.page;
        //pick a random variant if existent
        let numVariants = currQuestion.variants;
        if(numVariants > 1) {
            if(numVariants > currQuestion.solvedVariants.length) {
                let unsolvedVariants = [];
                for(let i=0;i<numVariants;i++) {
                    if(currQuestion.solvedVariants.indexOf(i) == -1) {
                        unsolvedVariants.push(i);
                    }
                }
                console.log("unsolved variants: ", unsolvedVariants);
                let randomPage = pageToReturn+unsolvedVariants[Math.floor(Math.random()*unsolvedVariants.length)];
                /*let randomPage = pageToReturn;
                let match = window.location.href.match(/page=(\d*)/);
                if(match != undefined && match[1] != undefined) {
                    let currentPage = match[1];
                    do {
                        randomPage = pageToReturn+Math.floor(Math.random()*numVariants);
                    } while(randomPage == currentPage);
                }
                else {
                    randomPage = pageToReturn+Math.floor(Math.random()*numVariants);
                }*/
                pageToReturn = randomPage;
            }
            else {
                console.log("all variants solved, give random");
                //If all variants are already solved, pick any of them.
                let randomPage = pageToReturn;
                let currentPage = this.currentPage;
                do {
                    randomPage = pageToReturn+Math.floor(Math.random()*numVariants);
                } while(randomPage == currentPage);
                pageToReturn = randomPage;
            }
        }
        return {page:pageToReturn, url:sanitizedUrl + "&page=" + pageToReturn};
    }

    getNextPageInfo(questionId, forceURL, skipSolved) {
        if (questionId == undefined) {
            questionId = this.currentQuestionId;
        }
        let Question = this.getQuestion(questionId);

        if (forceURL == undefined) {
            forceURL = false;
        }

        let nextPageUrl = "";
        let nextPageLinkText = "";
        let nextQuestionId = skipSolved ? this.getNextUnsolvedQuestionId() : this.getNextQuestionId();
        let nextPageURLInfo = this.getPageURL(nextQuestionId);
        let possibleNextPageUrl = nextPageURLInfo.url;
        let possibleNextPageNumber = nextPageURLInfo.page;

        if (nextQuestionId == -1) {
            //finish
            let finishAttemptElement = document.querySelector(".endtestlink.aalink");
            if (!finishAttemptElement || !finishAttemptElement.href) {
                possibleNextPageUrl = "summary.php";
            } else {
                possibleNextPageUrl = finishAttemptElement.href;
            }
            nextPageLinkText = "Finish";
        }
        else {
            nextPageLinkText = "Next question";
        }

        //actually means a real skip, no right or wrong
        if (Question.askBeforeSkip == true && !forceURL && !Question.isSolved() && document.querySelector(".stackprtfeedback") == undefined) {
            //ask before skip
            nextPageUrl = "javascript:showAskBeforeSkipModal();";
            document.querySelector(".skip-yes").href = possibleNextPageUrl;
        }
        else {
            nextPageUrl = possibleNextPageUrl;
        }
        return {
            url: nextPageUrl,
            linkText: nextPageLinkText,
            id: nextQuestionId,
            page: possibleNextPageNumber
        };
    }
}

class FantasyQuiz extends GamifiedQuiz {
    constructor(quizObject) {
        super(quizObject);
        this.GameElements = {};
        this.monstersCamp;
        this.targetedEnemy;
        this.validationElement;
        this.speechBubbleElement;
        this.notificationBubbleContainer;
        this.notificationBubbleElement;
        this.updateValidationTimerId;
        this.validationLastState;
        this.spiral;
        this.fader;
        this.enterSpellContainer;
        this.inputElement;
        this.formulaContainer;
        this.fairyPlaceHolderAtEnemy;
        this.background;
        this.questionBubbleElement;
        this.fairyFollowSignPost;
        this.nextSceneSignPost;
        this.followPrompt;
        this.manaBadge;
        this.manaScoreTimer;
        this.fairyBadge;
        this.fairyScoreTimer;
        this.Score = { fairies:0, mana:20 }
        let scoreFromStorage = sessionStorage.getItem("score");
        if(scoreFromStorage != undefined) {
            let scoreObject = JSON.parse(scoreFromStorage);
            if(scoreObject != undefined) {
                this.Score.fairies = scoreObject.fairies;
                this.Score.mana = scoreObject.mana;
            }
        }
        this.fairyHome;
        this.fairyModal;
        this.settingsModal;
        this.creditsModal;
        this.freedFairyBoxes = [];
        this.saveStateInput;
        this.preInputField;
        this.postInputField;
        this.finished = false;
        this.contentContainer;
        this.introState = 0;
    }

    init() {
        console.log("init");
        /* CSS-Hacks */
        let style = document.createElement("style");
        style.type = "text/css";
        //.que .outcome background-color is #fcefdc;
        let generalGameCSS = ":root { --background-height:500px; --transformAnimationStart:2s; --speedX:5s; --speedY:10s;} .bubble { /* layout*/ position: absolute; /*max-width: 30em;*/ max-height:500px; /* looks*/ background-color: #fcefdc; padding: 1.125em 1.5em; font-size: 1.25em; border-radius: 1rem; box-shadow:	0 0.125rem 0.5rem rgba(0, 0, 0, .3), 0 0.0625rem 0.125rem rgba(0, 0, 0, .2); /*transition*/ transition:max-height 1s, padding-top 1s, padding-bottom 1s; overflow:visible; z-index:1; } .bubble .bubble-content { /*an additional div to ensure scrollability by simultaneously keep the speech-bubble-arrow visible, which indeed is an overflow*/ overflow-y:scroll; max-height:450px; max-width:100vw; } .bubble.fairy-help { /* not necessary when scene will scroll with exceeding text z-index:50;*/overflow:hidden; width:100%; } .bubble.fairy-help.closed { overflow:hidden; } .bubble.fairy-help.show-overflow { overflow:visible; } .bubble:not(.no-arrow):not(.spell-in-progress)::before { /* layout*/ content: ''; position: absolute; width: 0; height: 0; top: 100%; left: 1.5em; /* offset should move with padding of parent*/ border: .75rem solid transparent; border-bottom: none; /* looks*/ border-top-color: #fcefdc; filter: drop-shadow(0 0.0625rem 0.0625rem rgba(0, 0, 0, .1)); } /*.bubble.middle-arrow {max-width:unset; }*/ .bubble.middle-arrow::before { left:50% !important; } .bubble.closed { max-height:0px; padding-top:0px; padding-bottom:0px; } .bubble.middle-up-arrow::before { left:50% !important; top: unset !important; bottom:100%; /* offset should move with padding of parent*/ border: .75rem solid transparent; border-top: none !important; /* looks*/ border-bottom: .75rem solid #fcefdc !important; filter: none !important; } .bubble.closed { max-height:0px; padding-top:0px; padding-bottom:0px; } .bubble.spell-in-progress { background-color:rgba(255,255,255,0.9); border:1px solid black; border-radius:10%; overflow:hidden; } .exclamation { width:20px; visibility:hidden; text-align:center; opacity:1; color:red; font-weight:bold; transform:rotate(-10deg); font-size:1.2em; } .enter-spell-container.error .exclamation, .exclamation.active { visibility:visible; } .exclamation.temporarily-hidden { opacity:0; } .spiral { width:30px; height:auto; position:absolute; opacity:1; transition:left 1s, bottom 1s, opacity 1s; visibility:hidden; /*filters the black svg to light yellow*/ filter:invert(97%) sepia(61%) saturate(443%) hue-rotate(12deg) brightness(108%) contrast(108%); z-index:1; } .exclamation.reverse { transform:rotate(10deg); }.spiral img { width:100%; height:100%; } .spiral.active { visibility:visible; left:90% !important; opacity:0; } @keyframes fairyMovement { 0% { transform:translate(var(--xoffset), var(--yoffset)); } 100% { transform:translate(0,0); }} .notifying { animation:fairyMovement ease 3s forwards; } .returning { animation:fairyMovement ease 3s forwards; } .fader { z-index:0; position:absolute; width:100%; /*height:var(--background-height);*/ height:100%; background-color:#000000; opacity:0; transition:opacity,1s;} .fader.fade-out { display:block; opacity:1; z-index:10; } .fader.fade-in { display:block; opacity:0; z-index:2; } .content.city .sign-post-container { position:absolute; } .content.city .sign-post-container.point-left { left:5%; } .content.city .sign-post-container.point-right { right:5%; }  .sign-post-container { width:100px; height:auto; bottom: 20%; z-index:1; } .sign-post-container.point-left { /*align-self:flex-start;*/ } .sign-post-container.point-right { /* align-self:flex-end; */ } .sign-post-container .sign-post { width:100%; object-fit:contain; } .sign-post-container.point-left .sign-post { transform:scaleX(-1);} .content:not(.city) .sign-post-container { display:none; }/*hide some elements in city*/ .city input.algebraic, .intro input.algebraic { display:none !important; } .city .spell, .intro .spell, .clearing .spell { display:none; } .content:not(.city):not(.intro) .sign-post-container.standalone-arrow  { display:flex; } .city .enemy-container { display:none; } .formula-container { position:absolute; top:50%; left:50%; overflow:visible; background-color:rgba(255,255,255,0.5); border-radius:10%; transform:translate(-50%,-50%); padding:5px; transition:background-color,1s; z-index:1; } .enemy-container:hover .formula-container, .enemy-container.targeted .formula-container { background-color:rgba(255,255,255,0.9);} .moveable-bg { height:var(--background-height); z-index:0; width:100%; background-size:auto 100%; transform:translateY(-100%); position:relative; background-image:url(https://marvin.hs-bochum.de/~mneugebauer/fantasy/bg-forest1.png); background-repeat:no-repeat; } .content.city~* .moveable-bg { background-image:url(https://marvin.hs-bochum.de/~mneugebauer/fantasy/bg-elven_land4.png); } .content.clearing~* .moveable-bg { background-image:url(https://marvin.hs-bochum.de/~mneugebauer/fantasy/bg-forest4.png); } .city .standalone-arrow, .intro .standalone-arrow { display:none; } .clearing .standalone-arrow.point-right { display:none !important; } .player-container { z-index:2; /* transition for player is defined individually transition:left 3s linear; */} .content.intro:not(.city) .player-container { display:none; } .enemy-container { z-index:1; } .monsters-camp.solved .enemy-container .img-wrapper { filter:grayscale(1); } .content { min-height:/*calc(var(--background-height)*2)*/var(--background-height); max-width:calc(var(--background-height)*1.778); } .air { min-height:100px; } .helper-container { z-index:1; } .enter-spell-container { z-index:1; position:relative; } .battleground { position:relative; } .ground { display:flex; flex-direction:row; width:100%; justify-content:space-between; align-items:center; flex-wrap:wrap; padding-top:1em; } .enemy-container.invisible { display:none; } .targeted { background: linear-gradient(to right, black 4px, transparent 4px) 0 0, linear-gradient(to right, black 4px, transparent 4px) 0 100%, linear-gradient(to left, black 4px, transparent 4px) 100% 0, linear-gradient(to left, black 4px, transparent 4px) 100% 100%, linear-gradient(to bottom, black 4px, transparent 4px) 0 0, linear-gradient(to bottom, black 4px, transparent 4px) 100% 0, linear-gradient(to top, black 4px, transparent 4px) 0 100%, linear-gradient(to top, black 4px, transparent 4px) 100% 100%; background-repeat:no-repeat; background-size: 50px 50px; border-radius:5%; } .monsters-camp { position: relative; float: right; display: flex; flex-direction: row; max-width: 90%; flex-wrap: wrap; justify-content: flex-end; z-index:1; } .monster-analysis-fairy-animation-placeholder { width: 50px; height: 50px; position: absolute; /*border: 4px solid red;*/ z-index: 1; left: 0; top:0; } .monster-analysis-fairy-animation-placeholder.animate { animation:monster-camp-analysis 2s linear 0s 1 normal, switch-foreground-background 5s linear 0s 1 normal; animation-fill-mode:forwards; } @keyframes monster-camp-analysis { 0% { left:0%; top:0%; } 50% { left:100%; top:50%; }/*25% { left:100%; top:25%; } 50% { left:0%; top:50%; } 75% { left:100%; top:75%; }*/ 100% { left:0%; top:100%; } } @keyframes switch-foreground-background { 0% { z-index:1; } 100% { z-index:3; }} .fairy-place-holder-at-enemy { width: 50px; height: 50px; z-index: 2; position: absolute; left: 50%; top: 10%; transform: translate(-50%,-50%); } .monsters-camp .freed { visibility:hidden; z-index:2; align-self:center; top:50%; left:50%; transform:translate(-50%,-50%); } .content.intro .fairy-place-holder-at-enemy { top:50%; } .monsters-camp.transform { z-index:1; animation:transformToZero 3s ease-in 0s 1 normal forwards; } @keyframes transformToZero { 0% { transform:scale(1,1); } 50% { transform:scale(0.5,0.5) } 100% { transform:sacle(1,1); } } .monsters-camp.transform .enemy-container img { animation:monsterBlur 1.5s linear 0s 1 normal forwards; } @keyframes monsterBlur { 0% { filter:blur(0px) saturate(0) brightness(100%); opacity:1; } 16% { filter:blur(1px) saturate(16) brightness(116%); } 33% { filter:blur(3px) saturate(33) brightness(133%); } 50% { filter:blur(0px) saturate(50) brightness(150%); } 76% { filter:blur(3px) saturate(76) brightness(176%); } 83% { filter:blur(6px) saturate(83) brightness(183%); } 100% { filter:blur(10px) saturate(100) brightness(200%); opacity:0; } } .monsters-camp.transform .formula-container, .monsters-camp.appeared .formula-container { opacity:0; } .monsters-camp.appeared .enemy-container { visibility:hidden; } .monsters-camp.appeared .freed { visibility:visible; } .monsters-camp.transform .freed { visibility:visible; animation:fairyAppear 3s ease-in 0s 1 normal forwards; } @keyframes fairyAppear { 0% { opacity:0; } 50% { opacity:1; } 100% { opacity:1; } } .monsters-camp.solved .freed { visibility:hidden; } .monsters-camp.appear .enemy-container { visibility:hidden; } .monsters-camp.appear { animation:transformToFull 4s ease-in 0s 1 normal forwards; } @keyframes transformToFull { 0% { transform:scale(0,0); } 100% { transform:scale(1,1); } } .monsters-camp.appear .formula-container { opacity:0; } .monsters-camp.appear .freed { display:block; } .help-notification-container { position:relative; width:100%; top:-50px; } .freed.leave-scene { transform-origin: 0px 50px;animation:fairy-leave-scene 3s ease-in 0s 1 normal forwards; } .leave-scene.reverse { animation-name:fairy-leave-scene-reverse; } @keyframes fairy-leave-scene-reverse { 0% { transform:rotate(0deg); margin-left:0vw; } 50% { transform:rotate(180deg); margin-left:0vw; } 100% { transform:rotate(180deg); left:110%; margin-left:-55vw; } } @keyframes fairy-leave-scene { 0% { transform:rotate(0deg); margin-left:0vw; } 50% { transform:rotate(-180deg); margin-left:0vw; } 100% { transform:rotate(-180deg); left:110%; margin-left:55vw; } } .content.city .fairy-home { left:50% !important; } .enemy-container { cursor:pointer; } .monsters-camp.transform .enemy-container { cursor:default; } .sign-post-container { cursor:pointer; } .bubble.spell-in-progress { cursor:pointer; } .fairy-img { cursor:pointer; } .enter-spell-container.error .exclamation, .exclamation.active { cursor:pointer; } .fairy-follow-sign-post { display:flex !important; position:absolute; transition:transform 1s ease 0s; transform:scaleY(0); right:0; } .fairy-follow-sign-post.active { transform:scaleY(1); } .fairy-follow-sign-post .fairy-representation { width:40px; position:absolute; opacity:0.9; } .sign-post-container.disabled { /*cursor:not-allowed;*/cursor:pointer; }.sign-post-container.disabled img { filter:grayscale(1); } .que { overflow:hidden; } /*.que.scene-end { overflow:hidden; }*/ .enter-spell-container.error input { border:2px solid red; } .error-info { display:none; color:white; background-color:red; border-radius:50%; height:1.2em; width:1.2em; text-align:center; margin-left:5px; font-weight:bold; font-style:italic; font-family: 'Brush Script MT', cursive; }.enter-spell-container.error .error-info { display:inline-block; } .enter-spell-container .exclamation { display:inline-block; } .fairy-place-holder { transform:translateX(-8px); z-index:2; left:50%; position:absolute; } .player-container.teleport { animation:teleport 3s linear 0s 1 normal forwards; } @keyframes teleport { 0% { filter:blur(0px) drop-shadow(1px 0px 0 #99ccff) drop-shadow(0px 1px 0 #99ccff) drop-shadow(-1px -0px 0 #99ccff) drop-shadow(-0px -1px 0 #99ccff); opacity:1; } 75% { filter:blur(0px) drop-shadow(4px 0px 0 #99ccff) drop-shadow(0px 4px 0 #99ccff) drop-shadow(-4px -0px 0 #99ccff) drop-shadow(-0px -4px 0 #99ccff); opacity:1; }75% { filter:blur(3px) drop-shadow(4px 0px 0 #99ccff) drop-shadow(0px 4px 0 #99ccff) drop-shadow(-4px -0px 0 #99ccff) drop-shadow(-0px -4px 0 #99ccff); opacity:1; } 100% { filter:blur(10px) drop-shadow(8px 0px 0 #99ccff) drop-shadow(0px 8px 0 #99ccff) drop-shadow(-8px -0px 0 #99ccff) drop-shadow(-0px -8px 0 #99ccff); opacity:0; } } .player-container.appear { opacity:0; animation:teleport 2s linear 1s 1 reverse forwards; } .moveable-bg-container { position:relative; width:100%; height:0; overflow:visible; } .new-question-container { display:none; } .fairy-home { position:absolute; z-index:2; } .fairy-img.leave-scene { animation:fairy-leave-scene-right 3s ease-in 0s 1 normal forwards; transform:translate(var(--xoffset), var(--yoffset)); } @keyframes fairy-leave-scene-right { 0% { left:0; } 90% { left:1000px; } 100% { left:2000px; } } .fairy-img.leave-scene.to-top { animation-name:fairy-leave-scene-top; } @keyframes fairy-leave-scene-top { 0% { top:0; } 10% { top:50px; } 90% { top:-1000px; } 100% { top:-2000px; } } .fairy-img.leave-scene.to-left { animation-name:fairy-leave-scene-left; transform-origin: 5px 5px; animation-timing-function:linear; } @keyframes fairy-leave-scene-left { 0% { left:0; transform:rotate(0deg); } 50% { left:0; transform:rotate(360deg);} 90% { left:-1000px; transform:rotate(360deg); } 100% { left:-2000px; transform:rotate(360deg); } } .fairy-home.alerting { animation:fairy-alert 3s 0s infinite; } @keyframes fairy-alert { 0% { transform:translateY(0px); } 10% { transform:translateY(-20px); } 20% { transform:translateY(0px); } 30% { transform:translateY(-20px); } 40% { transform:translateY(0px); } 50% { transform:translateY(-20px); } 60% { transform:translateY(0px); } 100% { transform:translateY(0px); }} .content:not(.city).intro~* .moveable-bg { box-shadow:inset 0px 0px 50px 50px rgba(0,0,0,0.9); } .intro .formula-container { display:none; } .enemy-container.fairy-to-monster .fairy-place-holder-at-enemy { animation:fairyAppear 2s ease-in 2s 1 reverse forwards; animation-delay:var(--transformAnimationStart); } .enemy-container.fairy-to-monster .img-wrapper img { animation:monsterBlur 1.5s linear 2s 1 reverse forwards; animation-delay:var(--transformAnimationStart); } .moveable-bg-container.fantasy-modal { z-index:20; display:none; } .moveable-bg-container.fantasy-modal .moveable-bg { padding:10%; background-color:rgba(0,0,0,0.75); background-image:none; overflow:scroll; height:var(--background-height); } .simple-fairy-representation { display:inline-block; width:40px;height:40px; } .fantasy-modal.active { display:block; } .moving-linear { animation-timing-function:linear; } .moving-quick { animation-duration:1s; } .close-modal-button { cursor:pointer; position:absolute; top:50px; right:50px; color:white; font-weight:bold; font-size:2em; } .close-modal-button:hover { color:#e2001a; } .menu-option { position:relative; display:block; width:200px; text-align:center; margin: 10px auto !important; color:#000000; } .menu-option:hover { background-color:#fcefdc; }/*.menu-option::after, .menu-option::before { box-sizing:content-box; }*/ .credits-modal { color:#ffffff; } /*.idle-freed-fairy-box { position:absolute; height:40px; width:40px; z-index:2; } .idle-freed-fairy-box.x { animation: up-down 2s linear infinite alternate; } @keyframes up-down { 0% { top:0%; } 100% { top:100%; } } .idle-freed-fairy-box .y { animation: left-right 4s linear infinite alternate; } @keyframes left-right { 0% { left:0%; } 100% { left:100%; } }*/ .idle-freed-fairy-box { position:absolute; height:40px; width:40px; z-index:2; opacity:0.5; animation: left-right var(--speedX) linear infinite alternate, up-down var(--speedY) linear infinite alternate; visibility:hidden; } .idle-freed-fairy-box.active { visibility:visible; } @keyframes up-down { 0% { top:0%; } 100% { top:94%; } } @keyframes left-right { 0% { left:0%; } 100% { left:94%; } } .fairy-stop-sign-container { flex: 70%; display: flex; justify-content: center; align-items: center; } .input-surrounding-math { color:#ffffff; display:inline-block; } .clearing .enter-spell-container { display:none; } .clearing .monsters-camp { display:none; } .outcome { display:none; } .matrixtable .selected-entry { font-weight:bold; background: linear-gradient(to right, black 1px, transparent 1px) 0 0, linear-gradient(to right, black 1px, transparent 1px) 0 100%, linear-gradient(to left, black 1px, transparent 1px) 100% 0, linear-gradient(to left, black 1px, transparent 1px) 100% 100%, linear-gradient(to bottom, black 1px, transparent 1px) 0 0, linear-gradient(to bottom, black 1px, transparent 1px) 100% 0, linear-gradient(to top, black 1px, transparent 1px) 0 100%, linear-gradient(to top, black 1px, transparent 1px) 100% 100%; background-repeat:no-repeat; background-size: 4px 10px; border-radius:10%; } .matrixtable td:not(:empty) { min-width:1em; cursor:pointer; text-align:center; } .content.finished .badge.square .badge__label { font-size:100px; } .credits-modal a { font-weight:bold; color:#ffffff; } .hint { display:none; } .hint.show-hint { display:block; }";

        let pulsingPointsCSS = '@keyframes introduceBadge { 0% { opacity: 0; } 100% { opacity: 1; } } @keyframes pulseBadge { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } } @keyframes pulseBadge2 { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } } .badge { animation: introduceBadge 1s linear 0s 1 both; background: rgba(0, 113, 246, 0.7); border-radius: 50%; height: 68px; perspective: 600px; position: relative; width: 68px; z-index:1; } .badge:before, .badge:after { animation: pulseBadge 3s cubic-bezier(0.86, 0, 0.07, 1) 0s infinite both; border: 2px dashed #99ccff; border-radius: inherit; bottom: -8px; content: ""; left: -8px; opacity: 0.6; position: absolute; right: -8px; top: -8px; } .badge:after { animation-name: pulseBadge2; bottom: -16px; left: -16px; opacity: 0.4; right: -16px; top: -16px; } @keyframes introduceLabel { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotateY(-1800deg); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotateY(20deg); } } @keyframes rotateLabel { 0% { transform: translate(-50%, -50%) rotateY(20deg); } 50% { transform: translate(-50%, -50%) rotateY(-20deg); } 100% { transform: translate(-50%, -50%) rotateY(20deg); } } .badge__label { /*animation: introduceLabel 2s cubic-bezier(0.19, 1, 0.22, 1) 1s 1 both, rotateLabel 5s linear 3s infinite;*/ color: #99ccff; font: 900 50px/1 -apple-system, BlinkMacSystemFont; left: 50%; position: absolute; text-align: center; text-shadow: 0px 4px 8px rgba(0, 113, 246, 0.2); top: 50%; transform: translate(-50%, -50%); } .badge.rotate .badge__label { animation:rotateLabel 5s linear 0s infinite; } .badge.appear .badge__label { animation: introduceLabel 2s cubic-bezier(0.19, 1, 0.22, 1) 0s 1 both, rotateLabel 4s linear 2s infinite; } .badge.square { border-radius:0%; } .badges-container { display:flex; justify-content: center; align-items: center; z-index:1; flex-grow:2; gap:3em; } .content.intro .badge { display:none; } .badge { cursor:pointer; }';

        let addCSS = generalGameCSS + " " + pulsingPointsCSS;
        style.innerHTML = addCSS;

        document.getElementsByTagName('head')[0].appendChild(style);

        //assume safe place in the very beginning
        document.querySelector(".que .content").classList.add("city");

        //center fixed width game environment
        try {
            console.log("center now");
            let questionForm = document.getElementById("responseform");
            
            questionForm.style.display = "flex";
            questionForm.style.justifyContent = "center";
            //questionForm.style.alignContent = "stretch";
            questionForm.firstChild.style.flexBasis = "calc(var(--background-height)*1.778)";
        }
        catch (error) {
            console.log("game environment could not be centered:");
            console.log(error);
        }
        

        let questionContainer = document.querySelector(".formulation.clearfix");
        /*let formula = document.querySelector(".formulation.clearfix p");
        formula.classList.add("chosen_formula");
        formula.style.position = "absolute";
        formula.style.top = "50%";
        formula.style.left = "50%";
        formula.style.backgroundColor = "rgba(255,255,255,0.9)";
        formula.style.borderRadius = "10%";
        formula.style.transform = "translate(-50%, -50%)";
        formula.style.padding = "5px";*/

        let object = this;


        let input = document.querySelector(".formulation.clearfix textarea, .formulation.clearfix input[type=text]");
        input.addEventListener("keypress", function(event) {
            if(event.key == "Enter") {
                object.speechBubbleElement.click();
            }
        });
        input.removeAttribute("readonly");
        this.inputElement = input;

        //hide the save state input
        let saveStateInput = questionContainer.querySelector("input.maxima-string");
        if(saveStateInput == undefined) {
            console.log("state can't be saved due to missing save state input field");
        }
        else {
            saveStateInput.style.display = "none";
            let savedStateAsString = saveStateInput.value;
            if(savedStateAsString != "" && savedStateAsString != undefined) {
                let loadedSaveState;
                try {
                    loadedSaveState = JSON.parse(savedStateAsString);

                    let saveStateConvertAsString = localStorage.getItem("saveStateConvert");
                    let saveStateConvert;
                    if(saveStateConvert != undefined) {
                        try {
                            saveStateConvert = JSON.parse(saveStateConvertAsString);
                        }
                        catch(error) {
                            console.log("Error in parsing converted save state");
                        }
                    }
                    console.log("check for conversion condition here");
                    if(loadedSaveState != undefined) {
                        //What's newer? Current process: Overwrite session storage with saved state.
                        if(saveStateConvert != undefined && (loadedSaveState.saveState == undefined ||saveStateConvert.solvedVariants.length >= loadedSaveState.solvedVariants.length)) {
                            console.log("loaded converted solved variants array");
                            loadedSaveState = saveStateConvert;
                        }
                        else {
                            console.log("conditition for converting not met");
                        }
                        this.loadFromSaveState(loadedSaveState);
                    }
                }
                catch(error) {
                    console.log("Save state could not be loaded, possibly due to JSON parse error");
                    console.log(error);
                }
            }
            else {
                //Try conversion.
                console.log("try conversion 2");
                let saveStateConvertAsString = localStorage.getItem("saveStateConvert");
                let saveStateConvert;
                if(saveStateConvertAsString != undefined) {
                    try {
                        saveStateConvert = JSON.parse(saveStateConvertAsString);
                        console.log("loaded converted save state");
                        this.loadFromSaveState(saveStateConvert);
                    }
                    catch(error) {
                        console.log("Error in parsing converted save state");
                        console.log(error)
                    }
                }
            }
        }
        this.saveStateInput = saveStateInput;

        let validation = document.querySelector(".formulation.clearfix .stackinputfeedback");
        validation.style.display = "none";

        this.validationElement = validation;

        let speechBubble = document.createElement("div");
        speechBubble.classList.add("bubble");
        speechBubble.classList.add("spell");
        speechBubble.classList.add("spell-in-progress");

        speechBubble.onclick = function () {
            if (this.classList.contains("spell-in-progress")) {

                this.classList.remove("spell-in-progress")
                //animate player
                //submit answer via ajax
                //process response
                //old version: fetch form from current page let form = document.getElementById("responseform");
                //new version: fetch from from current question saved in question query
                if (nextQuestionQuery == undefined) {
                    return;
                }
                let form = nextQuestionQuery;
                if (form == undefined) {
                    //error handling
                    console.log("no form to submit");
                    return false;
                }
                let formData = new FormData(form);
                let submitButtonData = document.querySelector("input.submit, button.submit");
                if (submitButtonData == undefined) {
                    //error handling
                    //...
                    console.log("no submit button found");
                    return false;
                }
                //let formDataAnswer = structuredClone(formData);
                let formDataAnswer = new FormData(form);
                formDataAnswer.append(submitButtonData.name, submitButtonData.value);


                //Get expected form, fill entered value and give dummy-values (or already correct) for all others.
                let expectedInputs = battleGround.querySelectorAll("input[type=text], textarea");
                if(expectedInputs.length > 1) {
                    if(object.targetedEnemy == undefined) {
                        object.targetEnemy();
                    }
                    /*let targetedInputName = "";
                    if(object.targetedEnemy.container.dataset.matrixinput != undefined) {
                        targetedInputName = object.targetedEnemy.container.dataset.matrixinput;
                    }
                    else {
                        targetedInputName = 
                    }*/
                    expectedInputs.forEach(function(expectedInput) {
                        if(object.targetedEnemy.container.dataset.refer == expectedInput.name) {
                            formDataAnswer.set(expectedInput.name, object.inputElement.value);
                        }
                        else {
                            //insert already correct answer or compute dummy value
                            if(expectedInput.dataset.correctAnswer != undefined) {
                                formDataAnswer.set(expectedInput.name, expectedInput.dataset.correctAnswer);
                            }
                            else {
                                //if numeric
                                formDataAnswer.set(expectedInput.name, "429876543210");
                                //add other cases
                                //...
                            }
                        }
                    });
                }
                else {
                    if(object.targetedEnemy == undefined) {
                        let firstEnemyContainer = document.querySelector(".enemy-container:not(.invisible)");
                        for(let i=0;i<object.GameElements.enemies.length;i++) {
                            if(object.GameElements.enemies[i].container == firstEnemyContainer) {
                                object.targetedEnemy = object.GameElements.enemies[i];
                            }
                        }
                    }
                    //fill input of the current text input into form data
                    let nameOfTextInput = expectedInputs[0].name;
                    formDataAnswer.set(nameOfTextInput, object.inputElement.value);
                }

                fetch(form.action, { method: "POST", body: formDataAnswer })
                    .then(response => {
                        return response.text();
                    })
                    .then(text => {
                        let fetchedPage = object.Parser.parseFromString(text, "text/html");
                        let formFetchedPage = fetchedPage.getElementById("responseform");
                        //form has to be updated to pass sequence check (to prevent out of sequence error, Moodle Error code: submissionoutofsequencefriendlymessage)
                        //nextQuestionQuery = formFetchedPage;

                        let repeatButton = fetchedPage.querySelector(".mod_quiz-redo_question_button");
                        console.log(repeatButton);
                        if (repeatButton == undefined) {
                            let stackinputerrorSpan = fetchedPage.querySelector(".stackinputerror");
                            if(stackinputerrorSpan != undefined) {
                                //Probably an input was submitted despite of an syntax error.
                                nextQuestionQuery.querySelectorAll("[name$=sequencecheck]").forEach(function(sequenceCheckFieldToRaise) {
                                    sequenceCheckFieldToRaise.value = parseInt(sequenceCheckFieldToRaise.value)+1;
                                });
                                throw new Error("Stack input error 1");
                            }
                            //If there is no repeat button, we are probably on a validation page (e. g. "Please answer all parts of the question" or "Please check whether what you entered was intepreted as expected"), which happens for unknown reasons. Submit again to get feedback page.
                            let submitButton = fetchedPage.querySelector("input.submit, button.submit");
                            if(submitButton == undefined) {
                                throw new Error("Error in promise chain: (1) For some reason, question could neither be repeated nor input could be resubmitted. Probably sequence check error (Moodle error code submissionoutofsequencefriendlymessage).");
                            }
                            let matchSubmit = [
                                "",
                                submitButton.name,
                                submitButton.value
                            ];

                            let formDataSubmitValidation = new FormData(formFetchedPage);

                            formDataSubmitValidation.append(matchSubmit[1], matchSubmit[2]);

                            return fetch(formFetchedPage.action, { method: "POST", body: formDataSubmitValidation }).then(response => { return response.text(); }).then(text => { return object.Parser.parseFromString(text, "text/html"); });
                        }
                        else {
                            return fetchedPage;
                        }
                    })
                    .then(fetchedPage => {
                        let saveInfo;
                        //console.log(text);
                        let toAppendToMessage;
                        //let fetchedPage = Parser.parseFromString(text, "text/html");
                        let formFetchedPage = fetchedPage.getElementById("responseform");
                        //form has to be updated to pass sequence check (to prevent out of sequence error, Moodle Error code: submissionoutofsequencefriendlymessage)
                        //nextQuestionQuery = formFetchedPage;

                        //if response is not positive, immediately repeat question
                        //get information about repeat button from response
                        //we look for input.mod_quiz-redo_question_button
                        //let matchRedo = text.match(/input.*?name="(.*?)".*?value="(.*?)".*?class=".*?mod_quiz-redo_question_button.*?/);
                        let repeatButton = fetchedPage.querySelector(".mod_quiz-redo_question_button");

                        //Check again for missing repeat button. It is especially missing, when there is a validation error (e. g. "Please answer all parts of the question").
                        let validationErrorSpan = fetchedPage.querySelector(".validationerror");
                        console.log(validationErrorSpan);
                        if(validationErrorSpan != undefined) {
                            //Raise sequence check to pass sequence check and prevent sequence check error (Moodle error code submissionoutofsequencefriendlymessage).
                            nextQuestionQuery.querySelectorAll("[name$=sequencecheck]").forEach(function(sequenceCheckFieldToRaise) {
                                sequenceCheckFieldToRaise.value = parseInt(sequenceCheckFieldToRaise.value)+2;
                            });
                            throw new Error("Validation error. Probably \"Please answer all parts of the question.\"");
                        }
                        else {
                            //If we had an error, sequencecheck-field has to be reset to stay in the correct sequence.
                            nextQuestionQuery.querySelectorAll("[name$=sequencecheck]").forEach(function(sequenceCheckFieldToReset) {
                                sequenceCheckFieldToReset.value = 1;
                            });
                        }

                        let matchRedo = [
                            "",
                            repeatButton.name,
                            repeatButton.value
                        ];
                        console.log("match redo");
                        console.log(matchRedo);
                        //For feedback, we look for .stackprtfeedback (each of them).
                        //let matchFeedback = text.match(/class=".*?stackprtfeedback.*?".*?><div class="(.*?)">([\d\D]*?)<div class="outcome clearfix/);
                        //console.log(matchFeedback);
                        

                        //console.log(formFetchedPage);

                        let message = "";
                        let lastStroke = false;

                        let possibleVictoryTexts = [
                            "You have made it! Keep up the good work!",
                            "Super! That was right!",
                            "Wonderful! You've made it!"
                        ];

                        if(expectedInputs.length > 1) {
                            let allAnswered = false;
                            console.log("process feedback to multiple questions");
                            //expect feedback in the same order as the input fields appeared
                            //let specificFeedbackFieldEvaluations = fetchedPage.querySelectorAll(".stackprtfeedback .correct, .stackprtfeedback .incorrect, ...");
                            let specificFeedbackFields = fetchedPage.querySelectorAll(".stackprtfeedback");
                            //console.log("Looking for specific feedback field number "+object.targetedEnemy.container.dataset.count);
                            if(specificFeedbackFields[object.targetedEnemy.container.dataset.count] == undefined) {
                                //emergency routine
                                //...
                                throw new Error("no adequate feedback found (error variant 1)");
                            }

                            //Evaluate feedback for targeted enemy.
                            let specificFeedbackFieldEvaluation = specificFeedbackFields[object.targetedEnemy.container.dataset.count].querySelector(".correct, .incorrect, .partiallycorrect");
                            if(specificFeedbackFieldEvaluation == undefined) {
                                //emergency routine
                                //...
                                throw new Error("no adequate feedback evaluation found (error variant 2)");
                            }

                            //Previously, check for special handling on matrix input.
                            console.log("START ANALYSIS");
                            //Find out more in case of matrix input
                            if(object.targetedEnemy.container.dataset.matrixinput != undefined) {
                                /*
                                querySelector won't work, because style of wrong parts is not yet appended.
                                Analyse the real part...
                                '<span class="nolink"><span class="nolink"><span class="MathJax_Preview"><a href="https://moodle.hs-bochum.de/filter/tex/displaytex.php?texexp=%20%5Cleft%28%5Cbegin%7Barray%7D%7Bccc%7D%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B1%7D%7D%7D%20%26%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%26%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%5C%5C%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%26%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%26%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%5C%5C%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%26%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%26%20%7B%5Ccolor%7Bred%7D%7B%5Cunderline%7B429876543210%7D%7D%7D%20%5Cend%7Barray%7D%5Cright%29" id="action_link648326912307e122" class="" title="TeX"><img class="texrender" title=" \\left(\\begin{array}{ccc} {\\color{red}{\\underline{1}}} &amp; {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} \\\\ {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} \\\\ {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} \\end{array}\\right)" alt=" \\left(\\begin{array}{ccc} {\\color{red}{\\underline{1}}} &amp; {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} \\\\ {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} \\\\ {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} &amp; {\\color{red}{\\underline{429876543210}}} \\end{array}\\right)" src="https://moodle.hs-bochum.de/filter/tex/pix.php/09631cdc594f40a1d92784f0a9e9250f.png"></a></span><script type="math/tex"> \\left(\\begin{array}{ccc} {\\color{red}{\\underline{1}}} & {\\color{red}{\\underline{429876543210}}} & {\\color{red}{\\underline{429876543210}}} \\\\ {\\color{red}{\\underline{429876543210}}} & {\\color{red}{\\underline{429876543210}}} & {\\color{red}{\\underline{429876543210}}} \\\\ {\\color{red}{\\underline{429876543210}}} & {\\color{red}{\\underline{429876543210}}} & {\\color{red}{\\underline{429876543210}}} \\end{array}\\right)</script></span></span>'*/
                                /*
                                let wrongParts = specificFeedbackFields[object.targetedEnemy.container.dataset.count].querySelectorAll(".mn[style*='red']");
                                console.log(specificFeedbackFields);
                                console.log(specificFeedbackFields[object.targetedEnemy.container.dataset.count]);
                                console.log(wrongParts);
                                console.log("WRONG PARTS: "+wrongParts.length);*/

                                let amountOfWrongParts = 0;
                                let matchedWrong = [];
                                let latexScript = specificFeedbackFields[object.targetedEnemy.container.dataset.count].querySelector("script");
                                if(latexScript != undefined && latexScript.innerHTML != "" && latexScript.innerHTML != undefined) {
                                    //Have \underline be the criteria for wrong. Could be \color (red) also.
                                    matchedWrong = latexScript.innerHTML.match(/underline/g);
                                    console.log(latexScript.innerHTML);
                                    console.log(matchedWrong);
                                }
                                if(matchedWrong == null) {
                                    console.log("probably already solved whole matrix");
                                    matchedWrong = [];
                                }
                                amountOfWrongParts = matchedWrong.length;
                                if(amountOfWrongParts < object.targetedEnemy.container.dataset.matrixelementstosolve) {
                                    console.log("probably correct");
                                    let relevantInputField = document.querySelector("[name='"+object.targetedEnemy.container.dataset.refer+"']");
                                    relevantInputField.parentNode.querySelector(".input-replacer").innerHTML = object.inputElement.value;//Better: Deep copy of parsed latex math.
                                    relevantInputField.dataset.correctAnswer = object.inputElement.value;
                                    object.targetedEnemy.container.dataset.matrixelementstosolve = parseInt(object.targetedEnemy.container.dataset.matrixelementstosolve)-1;
                                    message = "Well done, keep going!";
                                    if(object.targetedEnemy.container.dataset.matrixelementstosolve == 0) {
                                        //Obviously, the following will not fire, because the question is already registered as solved.
                                        console.log("Will this fire?");
                                        message = "Well done!";
                                    }
                                    //Target next matrix element, if existent.
                                    let matrixTableParent = relevantInputField.closest(".matrixtable");
                                    if(matrixTableParent != undefined) {
                                        let allInputFields = matrixTableParent.querySelectorAll("input");
                                        let currentIndex = -1;
                                        for(let i=0;i<allInputFields.length;i++) {
                                            if(allInputFields[i].isEqualNode(relevantInputField)) {
                                                currentIndex = i;
                                                break;
                                            }
                                        }
                                        let selected = false;
                                        if(currentIndex != -1) {
                                            for(let i = currentIndex+1;i<allInputFields.length;i++) {
                                                if(allInputFields[i].dataset.correctAnswer == undefined) {
                                                    //select this one
                                                    console.log("select "+allInputFields[i].name);
                                                    selected = true;
                                                    let relevantTd = allInputFields[i].closest("td");
                                                    if(relevantTd != undefined) {
                                                        matrixTdSelect(null, relevantTd);
                                                    }
                                                    break;
                                                }
                                            }
                                            //If not selected one in the first loop, loop again from the beginning.
                                            if(!selected) {
                                                for(let i = 0;i<currentIndex;i++) {
                                                    if(allInputFields[i].dataset.correctAnswer == undefined) {
                                                        //select this one
                                                        console.log("select "+allInputFields[i].name+" in second turn");
                                                        selected = true;
                                                        let relevantTd = allInputFields[i].closest("td");
                                                        if(relevantTd != undefined) {
                                                            matrixTdSelect(null, relevantTd);
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    console.log("probably false");
                                    message = specificFeedbackFieldEvaluation.innerHTML;
                                    if(message == "" || message == undefined) {
                                        message = "Leider falsch!";
                                    }
                                }
                                console.log("Wrong parts of matrix: "+amountOfWrongParts);
                                /*}
                                else {
                                    console.log("Could not find Latex Script. Probably solved matrix. (Or error?)");
                                    
                                }*/
                            }
                            else {
                                //console.log("is not matrix input");
                            }
                            console.log("END ANALYSIS");


                            if(specificFeedbackFieldEvaluation.classList.contains("correct")) {
                                //well done
                                lastStroke = true;
                                message = possibleVictoryTexts[Math.floor(Math.random() * possibleVictoryTexts.length)];
                                object.targetedEnemy.container.querySelector("input, textarea").dataset.correctAnswer = object.enterSpellContainer.querySelector("input").value;
                                //check wether all enemies are defeated now

                                //In case of matrix input, the last correct entered matrix element is not yet recognized. Check here.
                                if(object.targetedEnemy.container.dataset.matrixinput != undefined) {

                                }

                                allAnswered = true;
                                expectedInputs.forEach(function(expectedInput){
                                    if(allAnswered == false) {
                                        return;
                                    }
                                    if(expectedInput.dataset.correctAnswer == undefined) {
                                        allAnswered = false;
                                    }
                                });
                                if(allAnswered) {
                                    console.log("all questions are answered correctly now.");
                                    console.log("victory");
                                    object.incrementSolved();

                                    let continueContainer = document.createElement("span");
                                    continueContainer.innerHTML = " ";
                                    let continueLink = document.createElement("a");
                                    continueLink.innerHTML = "Continue into the forest";
                                    continueLink.href = "javascript:;";
                                    continueLink.onclick = function () {
                                        object.goToNextScene(object, true);
                                    };
                                    continueContainer.appendChild(continueLink);
                                    toAppendToMessage = continueContainer;

                                    object.markQuestionAsSolved();

                                    setTimeout(function() { object.animateTransformation(); }, 2000);
                                    //Score raise happens delayed, so saving the state has to be equipped with delay, too.
                                    //setTimeout(function() { object.saveState(); }, 5000);
                                    saveInfo = "Solved all enemies."
                                }
                                else {
                                    saveInfo = "Solved one (of many)."
                                }
                            }
                            //Matrix input is already handled above.
                            else if(object.targetedEnemy.container.dataset.matrixinput == undefined) {
                                if(object.targetedEnemy.container.dataset.matrixinput == undefined && (specificFeedbackFieldEvaluation.classList.contains("partiallycorrect") || specificFeedbackFieldEvaluation.classList.contains("incorrect"))) {
                                    message = specificFeedbackFieldEvaluation.innerHTML;
                                    saveInfo = "Partially or incorrect (one of many) or matrix input.";
                                    
                                }
                                else {
                                    //emergency routine
                                    //...
                                    message = specificFeedbackFieldEvaluation.innerHTML;
                                    console.log("feedback evaluation found, but unsure wether correct, incorrect or partially correct");
                                    saveInfo = "Neither correct, incorrect nor partiallycorrect.";
                                }
                            }
                            this.classList.add("spell-in-progress");

                            //in any case (except everything is solved?), reload the question
                            //if(!allAnswered) {
                                let formDataRetry = new FormData(formFetchedPage);
                                formDataRetry.append(matchRedo[1], matchRedo[2]);
                                fetch(formFetchedPage.action, { method: "POST", body: formDataRetry });
                            //}
                        }
                        else {
                            let generalFeedbackNode = fetchedPage.querySelector(".stackprtfeedback .partiallycorrect, .stackprtfeedback .incorrect, .stackprtfeedback .correct");
                            let feedbackContentNode = fetchedPage.querySelector(".stackprtfeedback");
                            let matchFeedback = [
                                "",
                                generalFeedbackNode.classList.item(0),
                                feedbackContentNode.innerHTML
                            ];

                            if (matchFeedback[1] == "partiallycorrect" || matchFeedback[1] == "incorrect") {
                                message = matchFeedback[2];
                                this.classList.add("spell-in-progress");

                                //get ready for redo
                                let formDataRetry = new FormData(formFetchedPage);
                                formDataRetry.append(matchRedo[1], matchRedo[2]);

                                //return fetch(formFetchedPage.action, {method:"POST", body:formDataRetry});
                                fetch(formFetchedPage.action, { method: "POST", body: formDataRetry });
                                saveInfo = "Partially or incorrect (one enemy).";
                            }
                            else {
                                //correct or undefined
                                console.log("victory");
                                object.incrementSolved();
                                
                                message = possibleVictoryTexts[Math.floor(Math.random() * possibleVictoryTexts.length)];
                                let continueContainer = document.createElement("span");
                                continueContainer.innerHTML = " ";
                                let continueLink = document.createElement("a");
                                continueLink.innerHTML = "Continue into the forest";
                                continueLink.href = "javascript:;";
                                continueLink.onclick = function () {
                                    object.goToNextScene(object, true);
                                };
                                continueContainer.appendChild(continueLink);
                                toAppendToMessage = continueContainer;
                                lastStroke = true;

                                object.markQuestionAsSolved();

                                setTimeout(function() { object.animateTransformation(); }, 2000);

                                let formDataRetry = new FormData(formFetchedPage);
                                formDataRetry.append(matchRedo[1], matchRedo[2]);
                                fetch(formFetchedPage.action, { method: "POST", body: formDataRetry });
                                saveInfo = "Solved (one enemy)."
                            }


                            
                        }
                        object.animateAttack(lastStroke);
                        //show feedback
                        setTimeout(function () { object.processNotification(message, true, undefined, undefined, toAppendToMessage); }, 1000);
                        setTimeout(function() { object.saveState(saveInfo); }, 5000);
                    })
                    .catch(error => {
                        this.classList.add("spell-in-progress");
                        object.saveState("Error"+error);
                        console.log(error);
                    })
                /*
                .then(response => {
                    return response.text();
                })
                .then(text => {
                    //update current form?
                    //let fetchedPage = Parser.parseFromString(text, "text/html");
                    //let formFetchedPage = fetchedPage.getElementById("responseform");
                    console.log(text);

                    //let formDataSubmitValidation = new FormData(formFetchedPage);
                    //console.log(formDataSubmitNextTry);
                    //console.log(formData);

                    //For some unknown reason, fetchedPage is a validation page, so given input has to be sent again.

                    /*for(let pair of formDataSubmitNextTry.entries()) {
                        console.log("changed "+form.elements[pair[0]].value+" in "+pair[0]);
                        form.elements[pair[0]].value = pair[1];
                        console.log("to "+pair[1]);
                        console.log("-------");
                    }
                    
                    formDataSubmitNextTry.append("q684007:17_ans1_val","y=2");
                    formDataSubmitNextTry.append("q684007:17_ans1","y=2");

                    //test submit
                    //return fetch(formFetchedPage.action, {method:"POST", body:formDataSubmitNextTry});

                    console.log(formFetchedPage.querySelector("input[type=submit].submit"));
                    console.log(document.querySelector("input[type=submit].submit"))
                    console.log("chain succeeded");
                })
                //.then(response => { return response.text();})*/
                    ;
            }
            else {
                //bumping speech-bubble just for fun?
            }
        };
        //speechBubble.style.display = "inline";
        this.speechBubbleElement = speechBubble;

        let questionFormulationBubble = document.createElement("p");
        questionFormulationBubble.classList.add("bubble", "no-arrow", "closed", "question-bubble", "fairy-help");
        questionFormulationBubble.style.position = "relative";
        questionFormulationBubble.addEventListener("transitionend", function () {
            if (!this.classList.contains("closed")) {
                this.classList.add("show-overflow");
            }
        });

        let questionFormulationContent = document.createElement("div");
        questionFormulationContent.classList.add("bubble-content");
        questionFormulationBubble.appendChild(questionFormulationContent);

        this.questionBubbleElement = questionFormulationBubble;
        this.questionBubbleContentElement = questionFormulationContent;

        //create and implement fantasy elements
        let enterSpellContainer = document.createElement("div");
        enterSpellContainer.classList.add("enter-spell-container");
        //let enterSpellText = document.createElement("p");
        //let helpContainer = document.createElement("div");

        let errorInfo = document.createElement("div");
        errorInfo.classList.add("exclamation");
        errorInfo.innerHTML = "!";

        errorInfo.onclick = function() { if(this.closest(".enter-spell-container").classList.contains("error")) { object.showNotificationSpeechBubble(); }};

        let helpNotificationContainer = document.createElement("div");
        helpNotificationContainer.classList.add("help-notification-container");
        let helpNotification = document.createElement("p");
        helpNotification.classList.add("bubble", "no-arrow", "closed", "fairy-help", "middle-up-arrow");
        //helpNotification.style.maxHeight = "0px";
        helpNotification.style.position = "absolute";
        //helpNotification.style.overflow = "hidden";
        helpNotification.addEventListener("transitionend", function () {
            if (!this.classList.contains("closed")) {
                this.classList.add("show-overflow");
            }
        });

        let helpNotificationContent = document.createElement("div");
        helpNotificationContent.classList.add("bubble-content");
        helpNotification.appendChild(helpNotificationContent);


        let fairyPlaceHolderBottom = document.createElement("p");
        fairyPlaceHolderBottom.style.width = "0px";
        fairyPlaceHolderBottom.style.height = "0px";
        fairyPlaceHolderBottom.style.top = "-40px"; 
        fairyPlaceHolderBottom.style.position = "relative";
        fairyPlaceHolderBottom.style.zIndex = 1;
        fairyPlaceHolderBottom.classList.add("fairy-place-holder");
        //fairyPlaceHolderBottom.style.marginLeft = "50%";

        helpNotificationContainer.appendChild(fairyPlaceHolderBottom);
        helpNotificationContainer.appendChild(helpNotification);
        this.notificationBubbleElement = helpNotification;
        this.notificationBubbleContainer = helpNotificationContainer;

        let fairyPlaceHolder = document.createElement("p");
        fairyPlaceHolder.style.width = "0px";
        fairyPlaceHolder.style.height = "0px";
        fairyPlaceHolder.style.position = "relative";
        fairyPlaceHolder.style.zIndex = 1;
        fairyPlaceHolder.classList.add("fairy-place-holder");
        //fairyPlaceHolder.style.marginLeft = "50%";
        //fairyPlaceHolder.style.right = "60%";

        let preInputField = document.createElement("div");
        preInputField.classList.add("input-surrounding-math");
        this.preInputField = preInputField;

        let postInputField = document.createElement("div");
        postInputField.classList.add("input-surrounding-math");
        this.postInputField = postInputField;

        //enterSpellText.innerHTML = "Enter your spell here:";
        //enterSpellContainer.appendChild(enterSpellText);
        //enterSpellContainer.appendChild(questionFormulationBubble);
        enterSpellContainer.appendChild(preInputField);
        enterSpellContainer.appendChild(input);
        enterSpellContainer.appendChild(errorInfo);
        enterSpellContainer.appendChild(postInputField);
        //is appended below -- enterSpellContainer.appendChild(helpNotification);
        //is append to air instead -- enterSpellContainer.appendChild(fairyPlaceHolder);

        this.enterSpellContainer = enterSpellContainer;

        /*
        Background specific: Remove "Enter your spell here" (happens above), add background, remove unnecessary elements, add "air".
        */
        document.querySelectorAll(".info").forEach(function (infoNode) {
            infoNode.remove();
        });
        document.querySelectorAll(".que .content").forEach(contentNode => {
            contentNode.style.margin = "0";
            //contentNode.style.height = "500px";
            //contentNode.style.background = "url(https://marvin.hs-bochum.de/~mneugebauer/fantasy/bg-forest1.png)";
            //contentNode.style.background = "url(https://marvin.hs-bochum.de/~mneugebauer/fantasy/bg-elven_land4.png)";
            contentNode.style.backgroundSize = "auto 100%";

            let air = document.createElement("div");
            air.classList.add("air");
            //air.style.height = "100px";
            contentNode.insertBefore(air, contentNode.firstChild);

            air.appendChild(this.questionBubbleElement);
            air.appendChild(fairyPlaceHolder);
            //this.notificationBubbleElement.style.display = "none";

            let fader = document.createElement("div");
            fader.classList.add("fader");
            //document.getElementById("responseform").appendChild(fader);
            contentNode.insertBefore(fader, contentNode.firstChild);

            console.log("add event listener");

            this.fader = fader;

        });
        document.querySelectorAll(".que .content .formulation").forEach(function (formulationNode) {
            console.log("setting border to none");
            console.log(formulationNode.style.border);
            formulationNode.style.setProperty("border", "none", "important");
            console.log(formulationNode.style.border);
        });

        document.querySelectorAll("input[value=Check]").forEach(function (checkButton) {
            checkButton.style.display = "none";
        });


        /*

        */


        let Player = new Elf();
        Player.setSize(Player.Sprites.idle.spriteWidth / 5);
        Player.container.style.left = "40%";
        Player.container.style.bottom = "0px";
        Player.container.classList.add("player-container");

        //Define multiple enemies. Each enemy has a Placeholder for the fairy, several events on click and mouse over / mouse out, a formula container.
        let monstersCamp = document.createElement("div");
        let fairyPlaceHolderMonsterAnalysisAnimation = document.createElement("div");
        fairyPlaceHolderMonsterAnalysisAnimation.classList.add("monster-analysis-fairy-animation-placeholder")
        monstersCamp.appendChild(fairyPlaceHolderMonsterAnalysisAnimation);
        monstersCamp.classList.add("monsters-camp");

        //let Enemy = new Golem(1);
        let Enemy1 = new Troll(1);
        Enemy1.setSize(Enemy1.Sprites.idle.spriteWidth / 3);
        /*Enemy1.container.style.right = "0px";
        Enemy1.container.style.bottom = "0px";*/
        //Other than any other game elements, enemies are automatically positioned with regard to responsiveness.
        Enemy1.container.style.position = "relative";
        Enemy1.container.classList.add("enemy-container", "invisible");

        let Enemy2 = new IceGolem(1);
        Enemy2.setSize(Enemy2.Sprites.idle.spriteWidth / 5);
        /*Enemy2.container.style.right = "200px";
        Enemy2.container.style.bottom = "0px";*/
        Enemy2.container.style.position = "relative";
        Enemy2.container.classList.add("enemy-container", "invisible");

        let Enemy3 = new ForestGolem(1);
        Enemy3.setSize(Enemy2.Sprites.idle.spriteWidth / 5);
        Enemy3.container.style.position = "relative";
        Enemy3.container.classList.add("enemy-container", "invisible");


        let Enemy4 = new ForestGolem(1);
        Enemy4.setSize(Enemy4.Sprites.idle.spriteWidth / 5);
        Enemy4.container.style.position = "relative";
        Enemy4.container.classList.add("enemy-container", "invisible");

        let Enemy5 = new IceGolem(1);
        Enemy5.setSize(Enemy5.Sprites.idle.spriteWidth / 5);
        /*Enemy2.container.style.right = "200px";
        Enemy2.container.style.bottom = "0px";*/
        Enemy5.container.style.position = "relative";
        Enemy5.container.classList.add("enemy-container", "invisible");

        let Enemy6 = new Troll(1);
        Enemy6.setSize(Enemy6.Sprites.idle.spriteWidth / 3);
        /*Enemy2.container.style.right = "200px";
        Enemy2.container.style.bottom = "0px";*/
        Enemy6.container.style.position = "relative";
        Enemy6.container.classList.add("enemy-container", "invisible");

        

        //let trolls be added in the end
        let Enemies = [Enemy4, Enemy2, Enemy3, Enemy5, Enemy6, Enemy1];

        Enemies.forEach(function(Enemy) {
            Enemy.container.addEventListener("click", function(event) {
                //event.stopPropagation();
                //target enemy
                Enemies.forEach(function(EnemyToUntarget) {
                    EnemyToUntarget.container.classList.remove("targeted");
                });
                Enemy.container.classList.add("targeted");

                //Add information before and after the input field
                object.targetedEnemy = Enemy;
                object.updateInputSurroundingMath(object);
            });

            Enemy.container.onmouseover = function () {
                if(videoAnimation == true) { return; }
                object.GameElements.helper.sendTo(Enemy.fairyPlaceHolder);
            };

            Enemy.container.onmouseout = function () {
                if(videoAnimation == true) { return; }
                object.GameElements.helper.sendBack();
            };

            monstersCamp.appendChild(Enemy.container);
        });
        this.monstersCamp = monstersCamp;


        

        /*let formulaContainer = document.createElement("div");
        formulaContainer.classList.add("formula-container");
        Enemy.container.appendChild(formulaContainer);
        this.formulaContainer = formulaContainer;*/

        let fairyHome = document.createElement("div");
        fairyHome.classList.add("fairy-home");
        let Helper = new Fairy();
        Helper.setSize(Helper.Sprites.idle.spriteWidth / 3);
        fairyHome.style.left = Player.container.style.left;
        fairyHome.style.bottom = (Player.Sprites.idle.spriteHeight / 5 + 10) + "px";
        //Helper.container.style.left = Player.container.style.left;
        //Helper.container.style.bottom = (Player.Sprites.idle.spriteHeight / 5 + 10) + "px";
        //add place for exclamations
        Helper.node.classList.add("fairy-img");
        Helper.node.style.height = "40px";
        Helper.node.style.position = "absolute";
        //Helper.container.style.height = Helper.Sprites.idle.spriteHeight / 3 * 2 + "px";
        fairyHome.style.height = Helper.Sprites.idle.spriteHeight / 3 * 2 + "px";
        let exclamation = document.createElement("div");
        exclamation.style.height = Helper.Sprites.idle.spriteHeight / 3;
        exclamation.innerHTML = "!";
        exclamation.classList.add("exclamation");
        exclamation.onclick = function() { if(this.classList.contains("active")) { object.showNotificationSpeechBubble(); }};
        Helper.container.style.overflow = "visible";
        Helper.container.insertBefore(exclamation, Helper.node);
        Helper.container.classList.add("helper-container");
        Helper.container.onclick = function () { if(object.introState == 1) { object.introState = 2; } object.showNotificationSpeechBubble(); };
        fairyHome.appendChild(exclamation);
        fairyHome.appendChild(Helper.container);
        this.fairyHome = fairyHome;

        let Freed = new Fairy("https://marvin.hs-bochum.de/~mneugebauer/fantasy/fairy-black.svg");
        Freed.setSize(Freed.Sprites.idle.spriteWidth / 3);
        Freed.node.style.height = "40px";
        Freed.node.style.position = "absolute";
        Freed.container.style.overflow = "visible";
        Freed.container.classList.add("freed");
        this.GameElements.freed = Freed;
        monstersCamp.insertBefore(Freed.container, monstersCamp.firstChild);

        let followPrompt = document.createElement("span");
        followPrompt.innerHTML = " ";
        let followLink = document.createElement("a");
        followLink.innerHTML = "Follow";
        followLink.href = "javascript:;";
        followLink.onclick = function() { object.goToNextScene(object, false); };
        followPrompt.appendChild(followLink);
        this.followPrompt = followPrompt;

        this.GameElements.player = Player;
        //this.GameElements.enemy = Enemy;
        //this.GameElements.enemy2 = Enemy2;
        this.GameElements.enemies = Enemies;
        this.GameElements.helper = Helper;

        let battleGround = document.createElement("div");
        battleGround.classList.add("battleground");
        battleGround.style.height = "194px";
        //battleGround.style.height = Enemy.Sprites.idle.spriteHeight/3+"px";
        //battleGround.appendChild(validation);

        let signPostImgHref = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/sign-post.png";
        let signPostRightContainer = document.createElement("div");
        signPostRightContainer.classList.add("sign-post-container", "point-left");
        let signPostRight = document.createElement("img");
        signPostRight.classList.add("sign-post");
        signPostRight.src = signPostImgHref;
        let fairyPlaceHolderAtSignpost = document.createElement("div");
        fairyPlaceHolderAtSignpost.classList.add("fairy-place-holder");
        signPostRightContainer.appendChild(fairyPlaceHolderAtSignpost);
        signPostRightContainer.appendChild(signPostRight);
        //already declared above? let object = this;

        let signPostLeftContainer = signPostRightContainer.cloneNode(true);
        signPostRightContainer.classList.remove("point-left");
        signPostRightContainer.classList.add("point-right");


        let signPostContainers = [signPostLeftContainer, signPostRightContainer];

        signPostContainers.forEach(function (signPostContainer) {
            signPostContainer.onmouseover = function() {
                if(videoAnimation) { return; }
                console.log("mouse in");
                object.GameElements.helper.sendTo(this.querySelector(".fairy-place-holder"));
            };

            signPostContainer.onmouseout = function () {
                if(videoAnimation) { return; }
                console.log("mouse out");
                object.GameElements.helper.sendBack();
            };

            signPostContainer.onclick = function() { /*object.goToNextScene.bind(null, object, true);*/ if(videoAnimation == true) { if(object.contentContainer.classList.contains("intro")) { object.GameElements.helper.node.click(); } return; } object.goToNextScene(object, true, undefined, false); };
            /*signPostContainer.onclick = function() {
                //let object = this;
                waitingForNextQuestion = true;
                nextQuestionQuery = undefined;
                //fetch next question and reset scene to next question
                let nextQuestionLink = object.getNextPageInfo(undefined, true).url;
                if(nextQuestionLink == undefined) {
                    console.log("no next question found");
                    return;
                }
                object.fader.addEventListener("transitionend", buildNewScene.bind(null, object), {once:true});
                object.sceneEnd();
                fetch(nextQuestionLink).then(function(response) {
                    console.log("fetched next question");
                    //console.log(response);
                    return response.text();
                })
                .then(function(responseText) {
                    //extract exercise from response
                    let fetchedDoc = object.Parser.parseFromString(responseText, "text/html");
                    let questionDiv = fetchedDoc.querySelector("#responseform");
                    nextQuestionQuery = questionDiv;
                    console.log(questionDiv);
        
                    let newQuestionContainer = document.querySelector(".new-question-container");
                    if(newQuestionContainer == undefined) {
                        newQuestionContainer = document.createElement("div");
                        newQuestionContainer.classList.add("new-question-container");
                        document.querySelector("div[role=main]").appendChild(newQuestionContainer);
                    }
                    while(newQuestionContainer.firstChild) {
                        newQuestionContainer.removeChild(newQuestionContainer.firstChild);
                    }
                    newQuestionContainer.appendChild(questionDiv);
                    MathJax.Hub.Typeset();
                    
                    
                })
                .catch(function(error) {
                    console.log("error in promise chain fetching next question");
                    console.log(error);
                });
            }*/
        });

        
        //sign post info
        let signPostInfoHref = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/wooden-sign-posts-info.png";
        let signPostInfoContainer = document.createElement("div");
        signPostInfoContainer.classList.add("sign-post-container", "point-left");
        let signPostInfo = document.createElement("img");
        signPostInfo.classList.add("sign-post");
        signPostInfo.src = signPostInfoHref;
        signPostInfoContainer.appendChild(signPostInfo);

        signPostInfoContainer.onclick = object.showSettings.bind(null, object);

        let signPostStandaloneArrowImgHref = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/wooden-sign-post-standalone-right.png";
        let signPostStandaloneArrowRightContainer = document.createElement("div");
        signPostStandaloneArrowRightContainer.classList.add("sign-post-container", "point-left", "standalone-arrow");
        let signPostStandaloneArrowRight = document.createElement("img");
        signPostStandaloneArrowRight.classList.add("sign-post");
        signPostStandaloneArrowRight.src = signPostStandaloneArrowImgHref;
        signPostStandaloneArrowRightContainer.appendChild(signPostStandaloneArrowRight);
        //already declared above? let object = this;

        let signPostStandaloneArrowLeftContainer = signPostStandaloneArrowRightContainer.cloneNode(true);
        signPostStandaloneArrowRightContainer.classList.remove("point-left");
        signPostStandaloneArrowRightContainer.classList.add("point-right");
        let signPostStandAloneArrowRightContainerFollowFairy = signPostStandaloneArrowRightContainer.cloneNode(true);
        signPostStandaloneArrowRightContainer.classList.add("disabled");

        this.nextSceneSignPost = signPostStandaloneArrowRightContainer;

        let signPostStandaloneArrowContainers = [signPostStandaloneArrowLeftContainer, signPostStandaloneArrowRightContainer];
        /*signPostStandaloneArrowContainers.forEach(function(signPostStandaloneArrowContainer) {
            signPostStandaloneArrowContainer.onclick = function() {
                console.log("clicked sign post standalone arrow");
            };
        });*/
        signPostStandaloneArrowLeftContainer.onclick = function () {
            if(videoAnimation == true) { return; }
            object.goBackToCity();
        };

        signPostStandaloneArrowRightContainer.onclick = function() {
            if(videoAnimation == true) { return; }
            let currQuestion = object.getQuestion();
            if(currQuestion.isSolved() || currQuestion.id == "start") {
                object.goToNextScene();
            }
            else {
                //let neededMana = 5;
                object.teleportDialog(object, undefined/*, neededMana*/);
            }
        };
        //manipulate next question button to not really send the player to the next question page, but initiate game environment to load next question
        document.getElementById("mod_quiz-next-nav").onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();

            signPostStandaloneArrowRightContainer.click();
        };

        signPostStandAloneArrowRightContainerFollowFairy.classList.add("fairy-follow-sign-post");
        /*let signPostImg = signPostStandAloneArrowRightContainerFollowFairy.querySelector("img");
        if(signPostImg != undefined) {
            //signPostImg.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/wooden-sign-posts-cropped-bnw.png";
            signPostImg.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/wooden-sign-post-standalone-right.png";
            //signPostImg.style.filter = "invert(37%) sepia(88%) saturate(1564%) hue-rotate(166deg) brightness(102%) contrast(103%)";
        }
        else {
            console.log("unable to change color of fairy follow signpost");
        }*/
        signPostStandAloneArrowRightContainerFollowFairy.onclick = function() {
            object.goToNextScene(object, false);
        };



        let fairyStopSignContainer = document.createElement("div");
        fairyStopSignContainer.classList.add("fairy-stop-sign-container");

        let test = document.createElement("img");
        test.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/wooden-sign-post-stop.png";
        test.classList.add("sign-post");

        let fairyRepresentation = document.createElement("img");
        fairyRepresentation.classList.add("fairy-representation");
        fairyRepresentation.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/fairy-black-paused.svg";

        fairyStopSignContainer.appendChild(test);
        fairyStopSignContainer.appendChild(fairyRepresentation);

        signPostStandAloneArrowRightContainerFollowFairy.appendChild(fairyStopSignContainer);

        this.fairyFollowSignPost = signPostStandAloneArrowRightContainerFollowFairy;
        enterSpellContainer.appendChild(signPostStandAloneArrowRightContainerFollowFairy);

        //Background, that stays in its position when the speech bubble does not extend a given height, but will move down with all other elements, when height is exceeded.
        let moveableBgContainer = document.createElement("div");
        moveableBgContainer.classList.add("moveable-bg-container");
        let moveableBg = document.createElement("div");
        moveableBg.classList.add("moveable-bg");
        moveableBgContainer.appendChild(moveableBg);
        this.background = moveableBgContainer;
        //let moveableBg = document.createElement("img");
        //moveableBgContainer.appendChild(moveableBg);

        let ground = document.createElement("div");
        ground.classList.add("ground");
        signPostStandaloneArrowContainers.forEach(function (signPostStandaloneArrowContainer) {
            ground.appendChild(signPostStandaloneArrowContainer);
        });
        //console.log(formula);

        let badgesContainer = document.createElement("div");
        badgesContainer.classList.add("badges-container");
        let badgeFairies = document.createElement("div");
        badgeFairies.classList.add("badge");
        let badgeFairiesLabel = document.createElement("div");
        badgeFairiesLabel.innerHTML = this.Score.fairies;
        badgeFairiesLabel.classList.add("badge__label");
        badgeFairies.appendChild(badgeFairiesLabel);

        badgeFairies.onclick = function() {
            object.fairyModal.classList.add("active");
        };

        let badgeMana = badgeFairies.cloneNode(true);
        badgeMana.classList.add("square");
        badgeMana.querySelector(".badge__label").innerHTML = this.Score.mana;

        badgeMana.onclick = function() {
            if(videoAnimation == true) {
                return;
            }
            let mapLink = object.getPointToMapLink(object, "a place in the forest");
            let textPassageContainer = document.createElement("span");

            let textPassagePre = document.createElement("span"); textPassagePre.innerHTML = "Choose ";
            let textPassagePost = document.createElement("span"); textPassagePost.innerHTML = " to which you would like to teleport.";

            textPassageContainer.appendChild(textPassagePre);
            textPassageContainer.appendChild(mapLink);
            textPassageContainer.appendChild(textPassagePost);
            object.processNotification("", true, undefined, undefined, textPassageContainer);
        };

        badgesContainer.appendChild(badgeFairies);
        badgesContainer.appendChild(badgeMana);

        this.manaBadge = badgeMana;
        this.fairyBadge = badgeFairies;

        let fairyModalContainer = document.createElement("div");
        fairyModalContainer.classList.add("moveable-bg-container");
        fairyModalContainer.classList.add("fantasy-modal");
        fairyModalContainer.onclick = function() {
            this.classList.remove("active");
        };

        let defaultbox = document.createElement("img");
        defaultbox.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/fairy-black.svg";
        defaultbox.classList.add("idle-freed-fairy-box");

        //find out question with largest amount of variants
        let variantsMax = 0;
        for(let j in this.QuestionGroups) {
            for(let i in this.QuestionGroups[j].Questions) {
                if(this.QuestionGroups[j].Questions[i].variants > variantsMax) {
                    variantsMax = this.QuestionGroups[j].Questions[i].variants;
                }
            }
        }
        for(let i=0;i<variantsMax;i++) {
            let freedFairyBox = defaultbox.cloneNode(true);
            //set animation time between 5 and 10 in 0.5 steps
            freedFairyBox.style.setProperty("--speedX", (5+(Math.floor(Math.random()*10)/2))+"s");
            freedFairyBox.style.setProperty("--speedY", (5+(Math.floor(Math.random()*10)/2))+"s");
            this.background.querySelector(".moveable-bg").appendChild(freedFairyBox);
            this.freedFairyBoxes.push(freedFairyBox);
        }        

        let modal = document.createElement("div");
        modal.classList.add("moveable-bg");
        fairyModalContainer.appendChild(modal);

        let settingsModalContainer = fairyModalContainer.cloneNode(true);

        let closeButtonSettings = document.createElement("span");
        closeButtonSettings.classList.add("close-modal-button");
        closeButtonSettings.innerHTML = "&times;";
        let settingsModalContent = settingsModalContainer.querySelector(".moveable-bg");
        settingsModalContent.appendChild(closeButtonSettings);

        let creditsModalContainer = settingsModalContainer.cloneNode(true);

        let funcIntro = function() {
            object.settingsModal.classList.remove("active");
            object.fader.addEventListener("transitionend", function() {
                object.animateIntro();
                object.fadeSceneIn();
            }, {once:true});
            object.fadeSceneOut();
        };

        let funcCredits = function() {
            this.closest(".fantasy-modal").classList.remove("active");
            object.creditsModal.classList.add("active");
        };

        let funcClose = function() {
            this.closest(".fantasy-modal").classList.remove("active");
        };

        closeButtonSettings.onclick = funcClose;

        let options = [
            {text:"Intro", func:funcIntro},
            {text:"Credits", func:funcCredits},
            {text:"Back", func:funcClose}
        ];

        options.forEach(function(option) {
            let optionContainer = object.createSettingsOptionsContainer(option.text, option.func);

            settingsModalContent.appendChild(optionContainer);
        });


        creditsModalContainer.querySelector(".close-modal-button").onclick = funcClose;

        let creditsModalContent = creditsModalContainer.querySelector(".moveable-bg");
        let creditsSection = document.createElement("div");
        creditsSection.innerHTML = "All graphics are from free sources.<br />Sorcerer Elve, Trolls, Golems, Backgrounds: <a href=\"https://craftpix.net/\" target=\"_blank\">Craftpix team</a> on <a href=\"https://craftpix.net/\" target=\"_blank\">craftpix.net</a>.<br />Wooden sign posts: <a href=\"https://www.freepik.com/author/pch-vector\" target=\"_blank\">pch.vector</a> on <a href=\"https://www.freepik.com/\" target=\"_blank\">freepik.com</a><br />Special &#9829; to <a href=\"https://codepen.io/sosuke/\" target=\"_blank\">Barrett Sonntag</a> and <a href=\"https://codepen.io/simonwuyts/\" target=\"_blank\">Simon Wuyts</a> for their code snippets on <a href=\"https://codepen.io/\" target=\"_blank\">codepen.io</a>.<br />Special &#9749; to the teams from <a href=\"https://www.hochschule-bochum.de/en/\" target=\"_blank\">University of applied sciences (UAS) Bochum</a> and <a href=\"https://www.en.w-hs.de/\" target=\"_blank\">Westphalian UAS</a>.<br /><br />Published under MIT Licence by Malte Neugebauer from UAS Bochum.<br />Find the code for your Learning Management System here: <a href=\"https://bit.ly/3HRpyu0\" target=\"_blank\">Project repository</a>.<br /><br />In whatever way you reproduce this product, please preserve these lines.";
        let creditsBackButton = this.createSettingsOptionsContainer("Back", function() { this.closest(".fantasy-modal").classList.remove("active"); object.settingsModal.classList.add("active"); });

        creditsModalContent.appendChild(creditsSection);
        creditsModalContent.appendChild(creditsBackButton);


        fairyModalContainer.classList.add("fairy-modal");
        creditsModalContainer.classList.add("credits-modal");
        settingsModalContainer.classList.add("settings-modal");

        //Loop through questions and visualize solved and unsolved variants in fairy modal.
        let simpleFairyRepresentation = document.createElement("img");
        simpleFairyRepresentation.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/fairy-black-paused.svg";
        simpleFairyRepresentation.classList.add("simple-fairy-representation");

        for(let j in this.QuestionGroups) {
            for(let i in this.QuestionGroups[j].Questions) {
                if(this.QuestionGroups[j].Questions[i].id == "start") {
                    continue;
                }
                let l = 0;
                //let solvedVariantsAmount = this.QuestionGroups[j].Questions[i].solvedVariants.length;
                for(let k=0;k<this.QuestionGroups[j].Questions[i].variants;k++) {
                    let representation = simpleFairyRepresentation.cloneNode(true);
                    representation.dataset.represents = this.QuestionGroups[j].Questions[i].page+k;
                    modal.appendChild(representation);
                    if(this.QuestionGroups[j].Questions[i].solvedVariants.indexOf(k) > -1) {
                        representation.style.filter = this.QuestionGroups[j].Questions[i].filter;
                    }
                    else {
                        representation.style.filter = "invert(100%) sepia(1%) saturate(7496%) hue-rotate(88deg) brightness(106%) contrast(101%)";
                    }
                    l++;
                }
            }
        }

        modal.appendChild(this.createSettingsOptionsContainer("Back"));

        this.fairyModal = fairyModalContainer;
        this.settingsModal = settingsModalContainer;
        this.creditsModal = creditsModalContainer;

        //-------------------APPEND EVERYTHING-------------------
        ground.insertBefore(badgesContainer, signPostStandaloneArrowRightContainer);
        //ground.insertBefore(badgeFairies, signPostStandaloneArrowRightContainer);
        //ground.insertBefore(badgeMana, signPostStandaloneArrowRightContainer);

        battleGround.appendChild(Player.container);
        //battleGround.appendChild(validation);
        /*Enemies.forEach(function(Enemy) {
            battleGround.appendChild(Enemy.container);
        });*/
        battleGround.appendChild(monstersCamp);
        battleGround.appendChild(speechBubble);
        //battleGround.appendChild(Helper.container);
        battleGround.appendChild(fairyHome);

        //battleGround.appendChild(signPostLeftContainer);
        battleGround.appendChild(signPostRightContainer);
        battleGround.appendChild(signPostInfoContainer);

        questionContainer.appendChild(enterSpellContainer);
        questionContainer.appendChild(battleGround);

        //battleGround.parentNode.appendChild(helpNotificationContainer);

        if (battleGround.nextSibling != undefined) {
            battleGround.parentNode.insertBefore(ground, battleGround.nextSibling);
        }
        else {
            battleGround.parentNode.appendChild(ground);
        }

        let contentContainer = document.querySelector(".que .content");
        this.contentContainer = contentContainer;

        if (contentContainer.nextSibling != undefined) {
            contentContainer.parentNode.insertBefore(moveableBgContainer, contentContainer.nextSibling);
            //contentContainer.parentNode.insertBefore(helpNotificationContainer, contentContainer.nextSibling);
        }
        else {
            contentContainer.parentNode.appendChild(moveableBgContainer);
            //contentContainer.parentNode.appendChild(helpNotificationContainer);
        }
        contentContainer.parentNode.insertAdjacentElement("afterend", helpNotificationContainer);

        this.background.parentNode.insertBefore(fairyModalContainer, this.background);
        this.background.parentNode.insertBefore(settingsModalContainer, this.background);
        this.background.parentNode.insertBefore(creditsModalContainer, this.background);
        //--------------------------------APPEND END-----------------------------

        //After loading, if last question is solved, give full access to all exercises.
        let questionGroupsKeys = Object.keys(this.QuestionGroups);
        let LastQuestionGroup = this.QuestionGroups[questionGroupsKeys[questionGroupsKeys.length-1]];
        let LastQuestionsKeys = Object.keys(LastQuestionGroup.Questions);
        let VeryLastQuestion = LastQuestionGroup.Questions[LastQuestionsKeys[LastQuestionsKeys.length-1]];
        console.log(VeryLastQuestion);
        if(VeryLastQuestion.isSolved() == true) {
            console.log("solved everything");
            this.finished = true;
            this.contentContainer.classList.add("finished");
            this.manaBadge.querySelector(".badge__label").innerHTML = "&infin;";
            this.manaBadge.classList.add("appear");
        }


        this.updateValidationTimerId = setInterval(this.updateValidation, 1500, this);

        //preload spiral
        let img = new Image();
        img.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/oily-spiral-svgrepo-com.svg";

        let spiralContainer = document.createElement("div");
        spiralContainer.classList.add("spiral");
        spiralContainer.style.left = this.GameElements.player.container.style.width;
        spiralContainer.style.bottom = "calc(" + this.GameElements.player.container.style.height + "/2)";
        spiralContainer.addEventListener("transitionend", function () {
            this.classList.remove("active");
        });

        let spiral = document.createElement("img");
        spiral.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/oily-spiral-svgrepo-com.svg";

        spiralContainer.appendChild(spiral);
        battleGround.appendChild(spiralContainer);

        //console.log("calc("+this.GameElements.player.container.style.height+"/2)");

        this.spiral = spiralContainer;

        this.updateNavigation();

        if(this.solvedVariants.length == 0) {
            this.animateIntro();
        }
        else {
            this.resetFairyBubbleToDefault();
        }
    }

    showSettings(object) {
        console.log("show settings");
        if(object == undefined) {
            object = this;
        }
        object.settingsModal.classList.add("active");
    };

    createSettingsOptionsContainer(innerHTML, func) {
        let optionContainer = document.createElement("p");
        optionContainer.classList.add("menu-option");
        optionContainer.classList.add("bubble");
        optionContainer.classList.add("spell-in-progress");
        optionContainer.innerHTML = innerHTML;
        if(func != undefined) {
            optionContainer.onclick = func;
        }
        return optionContainer;
    }

    loadFromSaveState(SaveStateObject) {
        this.Score = SaveStateObject.score;
        sessionStorage.setItem("solved", JSON.stringify(SaveStateObject.solved));
        for(let i in this.QuestionGroups) {
            for(let j in this.QuestionGroups[i].Questions) {
                if(SaveStateObject.solved.indexOf(this.QuestionGroups[i].Questions[j].id) != -1) {
                    this.QuestionGroups[i].Questions[j].solved = this.QuestionGroups[i].Questions[j].needs;
                }
            }
        }
        this.solvedVariants = SaveStateObject.solvedVariants;
        sessionStorage.setItem("solvedVariants", JSON.stringify(SaveStateObject.solvedVariants));
    }

    updateInputSurroundingMath(object, Enemy) {
        if(object == undefined) {
            object = this;
        }

        while(object.preInputField.firstChild) {
            object.preInputField.removeChild(object.preInputField.firstChild);
        }
        while(object.postInputField.firstChild) {
            object.postInputField.removeChild(object.postInputField.firstChild);
        }

        if(Enemy == undefined) {
            Enemy = this.targetedEnemy;
        }
        if(Enemy == undefined) {
            console.log("no enemy targeted to update input surrounding math");
            return;
        }
        let questionMarkNode = Enemy.container.querySelector(".input-replacer");
        Enemy.container.querySelectorAll(".formula-container .nolink").forEach(function(mathInFormulaContainer) {
            let clone = mathInFormulaContainer.cloneNode(true);
            if(mathInFormulaContainer.compareDocumentPosition(questionMarkNode) == Node.DOCUMENT_POSITION_PRECEDING) {
                //If question mark comes before the math, put math in the end.
                object.postInputField.appendChild(clone);
            }
            else {
                //In any toher case: Put it in the beginning.
                object.preInputField.appendChild(clone);
            }
        });
        /*
        window.addEventListener("keydown", function(event) {
            if(event.defaulPrevented) {
                return;
            }

            switch(event.key) {
                case "Enter":
                    console.log("enter pressed");
                    break;
                case "Tab":
                    console.log("tab pressed");
                    break;
                default:
                    return;
            }
            event.preventDefault();
        }, true);*/
    }

    changeScore(target, amount) {
        if(target == undefined) {
            target = this.fairyBadge;
        }
        if(amount == undefined) {
            amount = 1;
        }
        let currentScore;
        if(target == this.fairyBadge) {
            currentScore = this.Score.fairies;
            this.Score.fairies += amount;
        }
        else if(target == this.manaBadge) {
            currentScore = this.Score.mana;
            this.Score.mana += amount;
        }
        else {
            return;
        }

        clearInterval(target.dataset.intervaldId);
        target.querySelector(".badge__label").innerHTML = currentScore;

        let object = this;
        let points = amount;
        let badgeLabel = target.querySelector(".badge__label");
        let from = parseInt(badgeLabel.innerHTML, 10);
        if(amount > 0) {
            badgeLabel.innerHTML = "+"+points;
            target.classList.add("appear");
            setTimeout(function() {
                target.classList.remove("appear");
                badgeLabel.innerHTML = from;
                object.animatePointRaise(target, from+points);
                //badgeLabel.innerHTML = parseInt(badgeLabel.innerHTML, 10)+points;
            }, 4000);
        }
        if(amount < 0) {
            this.animatePointLoose(target, from+points);
        }
    }
    animatePointRaise(target, points) {
        if(points == undefined) {
            points = 10;
        }
        let intervalId;
        let object = this;
        target.dataset.intervaldId = setInterval(function() { object.pointRaise(target, points, intervalId); }, 250);
    }

    pointRaise(target, limit, intervalId) {
        let badgeLabel = target.querySelector(".badge__label");
        let currentPoints = parseInt(badgeLabel.innerHTML, 10);
        if(currentPoints >= limit) {
            clearInterval(target.dataset.intervaldId);
            return;
        }
        badgeLabel.innerHTML = currentPoints+1;
    }

    animatePointLoose(target, points) {
        if(points == undefined) {
            points = 10;
        }
        let intervalId;
        let object = this;
        intervalId = setInterval(function() { object.pointLoose(target, points, intervalId); }, 250);
    }

    pointLoose(target, limit, intervalId) {
        let badgeLabel = target.querySelector(".badge__label");
        let currentPoints = parseInt(badgeLabel.innerHTML, 10);
        if(currentPoints <= limit || currentPoints <= 0) {
            clearInterval(intervalId);
            return;
        }
        badgeLabel.innerHTML = currentPoints-1;
    }

    goToNextScene(object, proceed, questionId, animateTeleport) {
        /*
        proceed: boolean. Defines whether to go to next question (true) or to give another variant of the current question (false).
        */
        if (object == undefined) {
            object = this;
        }
        if(proceed == undefined) {
            proceed = true;
        }
        if(animateTeleport == undefined) {
            if(questionId == undefined) {
                animateTeleport = false;
            }
            else {
                animateTeleport = true;
            }
        }
        waitingForNextQuestion = true;
        nextQuestionQuery = undefined;

        object.untargetEnemy();

        let nextQuestionLink;
        if(questionId == undefined) {
            //fetch next unsolved question and reset scene to next question
            if(proceed == true) {
                let nextPageInfo = object.getNextPageInfo(undefined, true, true);
                console.log(nextPageInfo);
                if (nextPageInfo == undefined) {
                    console.log("no next question found");
                    return;
                }

                nextQuestionLink = nextPageInfo.url;
                object.setCurrentQuestionId(nextPageInfo.id)
                object.currentPage = nextPageInfo.page;
            }
            else {
                let nextPageURLInfo = object.getPageURL();
                nextQuestionLink = nextPageURLInfo.url;
                object.currentPage = nextPageURLInfo.page;
                //currentQuestionId stays the same
            }
        }
        else {
            let nextPageURLInfo = object.getPageURL(questionId);
            nextQuestionLink = nextPageURLInfo.url;
            object.setCurrentQuestionId(questionId);
            object.currentPage = nextPageURLInfo.page;
        }
        
        console.log(nextQuestionLink);
        object.sceneEnd(animateTeleport);

        if(object.currentQuestionId == -1) {
            //FINISH!
            console.log("build victory scene");
            object.fader.addEventListener("transitionend", object.buildVictoryScene.bind(null, object), { once: true });
            return null;
        }
        else {
            object.fader.addEventListener("transitionend", buildNewScene.bind(null, object), { once: true });
        }
        fetch(nextQuestionLink).then(function (response) {
            console.log("fetched next question");
            //console.log(response);
            return response.text();
        })
        .then(function (responseText) {
            if(responseText != null) {
                //extract exercise from response
                let fetchedDoc = object.Parser.parseFromString(responseText, "text/html");
                let questionDiv = fetchedDoc.querySelector("#responseform");
                questionDiv.id = "responseform_clone";
                nextQuestionQuery = questionDiv;
                console.log(questionDiv);

                let newQuestionContainer = document.querySelector(".new-question-container");
                if (newQuestionContainer == undefined) {
                    newQuestionContainer = document.createElement("div");
                    newQuestionContainer.classList.add("new-question-container");
                    document.querySelector("div[role=main]").appendChild(newQuestionContainer);
                }
                while (newQuestionContainer.firstChild) {
                    newQuestionContainer.removeChild(newQuestionContainer.firstChild);
                }
                newQuestionContainer.appendChild(questionDiv);

                //MathJax.Hub.Typeset();

                //Probably, scene did not fade out yet. If so, wait for scene to be built up handled by transition event listeners. Only if not, build scene here.
                if(object.fader.classList.contains("fade-out")) {
                    buildNewScene(object);
                }

                //save state to save timestamp of starting new question and to ensure that user always starts at start element by having the start element always fetched last.
                //object.saveState("start "+object.currentQuestionId);
            }
        })
        .catch(function (error) {
            console.log("error in promise chain fetching next question");
            console.log(error);
        });
    }

    getDistanceFromLastSolved(questionId, includeCurrent) {
        if(includeCurrent == undefined) {
            includeCurrent = true;
        }
        let found = false;
        let dist = 0;
        let groupKeys = Object.keys(this.QuestionGroups);
        let numQuestionGroups = groupKeys.length;
        for(let j=numQuestionGroups-1;j>=0;j--) {
            let questionKeys = Object.keys(this.QuestionGroups[groupKeys[j]].Questions);
            let numQuestions = questionKeys.length;
            for(let i=numQuestions-1;i>=0;i--) {
                if(found == true) {
                    dist+=1;
                    if(this.QuestionGroups[groupKeys[j]].Questions[questionKeys[i]].isSolved() || this.QuestionGroups[groupKeys[j]].Questions[questionKeys[i]].id == "start" || (includeCurrent == true && this.QuestionGroups[groupKeys[j]].Questions[questionKeys[i]].id == this.currentQuestionId)) {
                        return dist;
                    }
                }
                else {
                    if(this.QuestionGroups[groupKeys[j]].Questions[questionKeys[i]].id == questionId) {
                        found = true;
                    }
                }
            }
        }
        return false;
    }

    teleportDialog(object, questionId, neededMana) {
        if(object == undefined) {
            object = this;
        }
        let nextEnemyPhrase = "";
        let manaPhrase = "";
        if(neededMana == undefined) {
            if(questionId != undefined) {
                neededMana = 10*this.getDistanceFromLastSolved(questionId)-10;
            }
            else {
                neededMana = 10;
            }
        }
        if(!object.finished) {
            manaPhrase = " for "+neededMana+" energy points";
        }
        if(questionId == undefined) {
            nextEnemyPhrase = " to the next opponent";
        }
        else {
            nextEnemyPhrase = " here ";
        }
        let confirmLink = document.createElement("a");
        confirmLink.classList.add(".confirm-link");
        confirmLink.href = "javascript:;";
        confirmLink.innerHTML = "Yes";
        confirmLink.onclick = function() {
            if(neededMana == 0 || object.finished == true) {
                object.goToNextScene(object, true, questionId);
            }
            else if(object.Score.mana >= neededMana) {
                object.changeScore(object.manaBadge, -neededMana);
                object.goToNextScene(object, true, questionId, true);
            }
            else {
                object.processNotification("You don't have enough energy points to jump "+nextEnemyPhrase+". Master other opponents first.", true);
            }
        };
        object.processNotification("Do you want to jump"+nextEnemyPhrase+manaPhrase+"? ", true, object.notificationBubbleElement, object.GameElements.helper, confirmLink);        
    }

    resetValidation(object) {
        if (object == undefined) {
            object = this;
        }
        object.inputElement.value = "";
        object.inputElement.dispatchEvent(new Event("input"));
        return true;
    }

    updateValidation(object) {
        if (object == undefined) {
            object = this;
        }

        let workingValidationElement = object.validationElement.cloneNode(true);
        workingValidationElement.id = workingValidationElement.id + "_clone";
        workingValidationElement.style.display = "";
        workingValidationElement.style.background = "none";
        workingValidationElement.style.border = "none";

        //has changed?
        if (!object.validationLastState) {
            //probably an update is needed
        }
        else {
            let presentationElementClone = workingValidationElement.querySelector("[role=presentation]");
            if (presentationElementClone == undefined) {
                //console.log("nothing to display or error");
                if (workingValidationElement.classList.contains("error")) {
                    //console.log("error");
                    //same error as last time?
                    let stackinputerrorElementLast = object.validationLastState.querySelector(".stackinputerror");
                    //console.log(stackinputerrorElementLast);
                    let stackinputerrorElementCurrent = workingValidationElement.querySelector(".stackinputerror");
                    //console.log(stackinputerrorElementCurrent);
                    /*if(stackinputerrorElementLast != undefined && stackinputerrorElementCurrent != undefined) {
                        console.log(stackinputerrorElementLast.isEqualNode(stackinputerrorElementCurrent));
                    }*/
                    if (stackinputerrorElementLast != undefined && stackinputerrorElementCurrent != undefined && stackinputerrorElementLast.isEqualNode(stackinputerrorElementCurrent)) {
                        //nothing changed
                        console.log("nothing to change (same error)");
                        return false;
                    }
                    //else continue below
                }
                else if(workingValidationElement.classList.contains("empty")) {
                    //console.log("nothing to parse");
                    if(object.validationLastState.classList.contains("empty")) {
                        console.log("nothing to change (same nothing)");
                        return false;
                    }
                }
                else {
                    console.log("nothing to change");
                    return false;
                }
            }
            else {
                let presentationElementLast = object.validationLastState.querySelector("[role=presentation]");
                if (presentationElementClone.isEqualNode(presentationElementLast)) {
                    //console.log("no update neccessary")
                    return false;
                }
            }
        }


        //check state
        if (workingValidationElement.classList.contains("error")) {
            console.log("error");
            //error routine
            object.fairyHome.querySelector(".exclamation").classList.add("active");
            object.enterSpellContainer.classList.add("error");
            object.speechBubbleElement.style.color = "#999999";

            //guess error type
            let errType;
            let errorTextElement = workingValidationElement.querySelector(".stackinputerror");
            if (!errorTextElement) {
                errType = "unknown_error";
            }
            else {
                let errorText = errorTextElement.innerHTML;
                //console.log(errorText);
                if (errorText.indexOf("missing * characters") != -1) {
                    errType = "multiplication_dot_missing";
                }
                else if (errorText.indexOf("invalid final character") != -1) {
                    errType = "invalid_final_char";
                }
                else if (errorText.indexOf("listing the values") != -1) {
                    errType = "invalid_value_listing";
                }
                else {
                    errType = "unknown_error"
                }
            }
            console.log(errType);
            object.processError(errType);
            //return false;
        }
        else if (workingValidationElement.classList.contains("loading")) {
            console.log("wait a moment and try again in some seconds");
        }
        else {
            //if a previously detected error
            object.GameElements.helper.container.parentNode.querySelector(".exclamation").classList.remove("active");
            object.enterSpellContainer.classList.remove("error");
            //Where is our fairy? If user is currently notified by speech bubble due to error, send back!
            let helperNode = document.querySelector(".fairy-place-holder img");
            if (helperNode != undefined) {
                hideNotificationSpeechBubble();
            }

            object.speechBubbleElement.style.color = "";

            //clean speeach bubble and insert into speech bubble
            while (object.speechBubbleElement.lastChild) {
                object.speechBubbleElement.removeChild(object.speechBubbleElement.lastChild);
            }
            object.speechBubbleElement.appendChild(workingValidationElement);
        }
        //console.log("reached end of updateVali");

        object.validationLastState = workingValidationElement;

        return true;
    }

    killUpdateValidationTimer() {
        clearTimeout(this.updateValidationTimerId);
    }

    processError(errType) {
        if (errType == undefined) {
            errType = "unknown_error";
        }
        let texts = {
            multiplication_dot_missing: [
                "Mind to cast your spell with stars * for multiplications!",
                "Mind the *!",
                "Don't forget to use stars * for your multiplications!"
            ],
            invalid_final_char: [
                "This spell can't be casted, because it is not allowed to end like this.",
                "Your spell ends invalid.",
                "No, like this the spell can't be casted because of the final character."
            ],
            invalid_value_listing: [
                "Two give more than one solution, cast your spell like this: y = ? or y = ?"
            ],
            unknown_error: [
                "Something is wrong with your spell, try again!",
                "This spell can't be casted. Maybe you misspelled something?",
                "This won't work and I don't know why. Please try again!"
            ]
        };
        let possibleTexts = texts[errType];
        let text = "";
        if (possibleTexts == undefined) {
            possibleTexts = texts.unknown_error;
        }
        text = possibleTexts[Math.floor(Math.random() * possibleTexts.length)];
        //this.notificationBubbleElement.innerHTML = text;
        this.processNotification(text, false);
        console.log(text);
    }

    processNotification(message, autoShowSpeechBubble, target, fairyToSend, elementToAppend, scrollInView) {
        if (message == undefined) {
            console.log("no message to process");
            return false;
        }
        if (autoShowSpeechBubble == undefined) {
            autoShowSpeechBubble = false;
        }
        if(target == undefined) {
            target = this.notificationBubbleElement;
        }

        if(fairyToSend == undefined) {
            fairyToSend = this.GameElements.helper;
        }

        if(scrollInView == undefined) {
            if(target == this.notificationBubbleElement) {
                //console.log("scroll in view is set to true by default");
                scrollInView = true;
            }
            else {
                scrollInView = false;
            }
        }

        //If speech bubble is already opened, close it first, then rerun function to process message.
        let object = this;
        if(!target.classList.contains("closed")) {
            target.addEventListener("transitionend", function() {
                object.processNotification(message, autoShowSpeechBubble, target, fairyToSend, elementToAppend, scrollInView);
            }, {once:true});
            target.classList.add("closed");
            target.classList.remove("show-overflow");
            return;
        }
        target.querySelector(".bubble-content").innerHTML = message;

        if(elementToAppend != undefined) {
            target.querySelector(".bubble-content").appendChild(elementToAppend);
        }

        if (autoShowSpeechBubble) {
            this.showNotificationSpeechBubble(target, fairyToSend, scrollInView);
        }

        //Special handling in case of math formulas in the helper bubble
        if(target == this.notificationBubbleElement/* && message.indexOf("<script type=\"math/tex") != -1*/) {
            try {
                MathJax.Hub.Typeset(target)
            }
            catch(error) {
                console.log("error using MathJax");
                console.log(error);
            }
        }
    }

    showNotificationSpeechBubble(target, fairyToSend, scrollInView) {
        console.log("show speech bubble");
        if(target == undefined) {
            target = this.notificationBubbleElement;
        }
        if(fairyToSend == undefined) {
            fairyToSend = this.GameElements.helper;
        }

        if(scrollInView == undefined) {
            if(target == this.notificationBubbleElement) {
                //console.log("scroll in view is set to true by default");
                scrollInView = true;
            }
            else {
                scrollInView = false;
            }
        }

        //console.log("auto show speech bubble");
        //let helpSpeechBubble = document.querySelector(".fairy-help");
        let helpSpeechBubble = target;

        helpSpeechBubble.classList.remove("closed", "no-arrow");
        if(target == this.notificationBubbleElement) {
            helpSpeechBubble.classList.add("middle-up-arrow");
        }
        else {
            helpSpeechBubble.classList.add("middle-arrow");
        }
        //helpSpeechBubble.style.maxHeight = "500px";

        let fairyPlaceHolder = target.parentNode.querySelector(".fairy-place-holder");
        /*let helperNode = document.querySelector(".helper-container img");

        //compute distance between container and (future) node
        let rectHelperNode = helperNode.getBoundingClientRect();
        let rectContainer = fairyPlaceHolder.getBoundingClientRect();
        let xoffset = rectHelperNode.x-rectContainer.x;
        let yoffset = rectHelperNode.y-rectContainer.y;
        helperNode.style.setProperty("--xoffset",xoffset+"px");
        helperNode.style.setProperty("--yoffset",yoffset+"px");

        helperNode.classList.add("notifying");
        helperNode.classList.remove("returning");
        fairyPlaceHolder.style.maxHeight = "40px";
        fairyPlaceHolder.appendChild(helperNode);

        let exclamationContainer = document.querySelector(".exclamation");
        //exclamationContainer.classList.remove("active");
        exclamationContainer.classList.add("temporarily-hidden");*/
        if(fairyPlaceHolder != undefined && fairyToSend != undefined) {
            fairyToSend.sendTo(fairyPlaceHolder);
            fairyPlaceHolder.style.maxHeight = "40px";
            document.addEventListener("click", hideNotificationSpeechBubble);
        }
        if(scrollInView == true) {
            //TODO: Find a solution for scrolling more smoothly into the just opening bubble.
            target.querySelector(".bubble-content").scrollIntoView({behavior:"smooth", block:"center"});
        }
    }

    //following function is declared below as global function
    hideNotificationSpeechBubble(event) {
        hideNotificationSpeechBubble(event);
    }

    animateAttack(finalStroke) {
        if (finalStroke == undefined) {
            finalStroke = false;
        }
        //animate spiral in the middle of attack animation
        this.GameElements.player.setState("attack", "once");
        this.spiral.style.transitionDelay = (this.GameElements.player.Sprites.attack.frameAmount / 2 * this.GameElements.player.Sprites.attack.animationInterval) + "ms";
        //console.log(this.spiral.style.transitionDelay);
        this.spiral.classList.add("active");

        if(this.targetedEnemy == undefined) {
            //Assume an unsolved enemy to be dying now.
            //object.targetEnemy();
            console.log("no enemy to be hit targeted");
            return;
        }
        if (!finalStroke) {
            setTimeout(function (object) { object.targetedEnemy.setState("hurt", "once"); }, 750, this);
        }
        else {
            console.log(this.targetedEnemy.container, " shall die now");
            setTimeout(function (object) { object.targetedEnemy.setState("die", "toend", undefined, object.untargetEnemy.bind(null, object)); }, 750, this);
        }
    }

    fadeSceneIn() {
        this.fader.classList.remove("fade-out");
        this.fader.addEventListener("transitionend", removeFaderAfterFadingIn);
        this.fader.classList.add("fade-in");
    }

    fadeSceneOut() {
        this.fader.classList.remove("fade-in");
        this.fader.removeEventListener("transitionend", removeFaderAfterFadingIn);
        this.fader.classList.add("fade-out");
    }

    fadeScene() {
        if (this.fader.classList.contains("fade-in") || (!this.fader.classList.contains("fade-in") && !this.fader.classList.contains("fade-out"))) {
            this.fadeSceneOut();
            return true;
        }
        this.fadeSceneIn();
        return true;
    }

    sceneEnd(teleport) {
        let object = this;
        if(teleport == undefined) {
            teleport = false;
        }
        videoAnimation = true;
        if(!teleport) {
            if (this.GameElements.player != undefined) {
                this.GameElements.player.setState("run");
                this.GameElements.player.container.style.transition = "left 3s linear";
                this.GameElements.player.container.style.left = "110%";
                //this.GameElements.player.container.style.zIndex = "1";

                
            }


            if(this.GameElements.helper != undefined) {
                //on transitioning or animation, compute distance to target und offset to ensure fluent animation
                
                if(this.GameElements.helper.isCurrentlyMoving() == true) {
                    //Send home to calc offset, but immediately stop normal fairy movement animation by adding the new one.
                    this.GameElements.helper.sendBack();
                }
                this.GameElements.helper.node.classList.add("leave-scene", "to-right");
            }
        }
        else {
            console.log("teleport animation");
            if (this.GameElements.player != undefined) {
                this.GameElements.player.setState("attack", "once");
                //this.GameElements.player.container.style.transition = "left 3s linear";
                //this.GameElements.player.container.style.left = "110%";
                //this.GameElements.player.container.style.zIndex = "1";

                this.GameElements.player.container.classList.add("teleport");

                this.GameElements.player.container.addEventListener("animationend", function () {
                    console.log("player arrived");
                    object.fadeSceneOut();
                }, { once: true });
                console.log("added event listener \"player arrived\".")
            }

            if(this.GameElements.helper != undefined) {
                if(this.GameElements.helper.isCurrentlyMoving() == true) {
                    //Send home to calc offset, but immediately stop normal fairy movement animation by adding the new one.
                    this.GameElements.helper.sendBack();
                }
                this.GameElements.helper.node.classList.add("leave-scene", "to-top");
            }
        }

        this.GameElements.player.container.addEventListener("transitionend", function () {
            console.log("player arrived");
            object.fadeSceneOut();
        }, { once: true });
        console.log("added event listener \"player arrived\".")

        if (this.speechBubbleElement != undefined) {
            this.speechBubbleElement.classList.add("spell-in-progress");
            this.speechBubbleElement.classList.add("closed");
        }

        this.GameElements.enemies.forEach(function(Enemy) {
            if (Enemy != undefined) {
                Enemy.container.style.zIndex = "1";
            }
        });

        //As long as overflow-x and overflow-y don't work properly together, we have to time the overflow property of the environment properly to have the environment clip the player's character but does not clip the bottom speech bubble.
        /*if(!this.notificationBubbleElement.classList.contains("closed")) {
            this.notificationBubbleElement.addEventListener("transitionend", function() {
                document.querySelector(".que").classList.add("scene-end");
            }, {once:true});
        }
        else {
            document.querySelector(".que").classList.add("scene-end");
        }*/

        this.questionBubbleElement.classList.add("closed", "no-arrow");
        this.questionBubbleElement.classList.remove("middle-arrow");
        this.questionBubbleElement.classList.remove("show-overflow");

        this.notificationBubbleElement.classList.add("closed", "no-arrow");
        this.notificationBubbleElement.classList.remove("middle-arrow");
        this.notificationBubbleElement.classList.remove("show-overflow");

        if(this.GameElements.freed != undefined) {
            this.GameElements.freed.node.classList.add("leave-scene");
        }

        this.fairyFollowSignPost.classList.remove("active");
    }

    pseudoEverythingBackToStart() {
        videoAnimation = false;
        this.GameElements.player.setState("idle");
        this.GameElements.player.container.style.transition = "none";
        this.GameElements.player.container.style.left = "0px";

        this.GameElements.player.container.classList.remove("teleport");

        //this.GameElements.helper.node.style.left = "0px";
        this.fairyHome.style.left = "0px";
        this.GameElements.helper.node.classList.remove("notifying");
        this.GameElements.helper.node.classList.remove("returning");
        this.GameElements.helper.node.classList.remove("leave-scene");
        this.GameElements.helper.node.classList.remove("to-right");
        this.GameElements.helper.node.classList.remove("to-top");
        this.GameElements.helper.node.classList.remove("to-left");
        this.GameElements.helper.node.classList.remove("moving-linear");
        this.GameElements.helper.node.classList.remove("moving-quick");
        this.GameElements.helper.container.appendChild(this.GameElements.helper.node);

        this.GameElements.enemies.forEach(function(Enemy) {
            Enemy.setState("idle");
            Enemy.container.style.zIndex = 1;
        });

        this.monstersCamp.classList.remove("transform", "appeared");

        this.inputElement.value = "";

        this.speechBubbleElement.classList.add("spell-in-progress");
        this.speechBubbleElement.innerHTML = "";
        this.speechBubbleElement.classList.remove("closed");

        this.GameElements.freed.node.classList.remove("leave-scene");
        this.GameElements.freed.node.classList.remove("reverse");
        this.GameElements.freed.container.appendChild(this.GameElements.freed.node);
        this.GameElements.freed.node.style.filter = this.getQuestion().filter;

        this.resetValidation();

        let currentVisibleEnemies = this.monstersCamp.querySelectorAll(".enemy-container:not(.invisible)");
        let prePhrase;
        if(currentVisibleEnemies == undefined || currentVisibleEnemies.length == 1) {
            prePhrase = "C";
        }
        else {
            prePhrase = "Select your opponent (click) and c"
        }
        this.notificationBubbleContainer.querySelector(".bubble-content").innerHTML = prePhrase+"ast your spell (enter or click on the formula) to transform the fairy back.";

        //document.querySelector(".que").classList.remove("scene-end");

        //reset free bouncing fairies
        this.freedFairyBoxes.forEach(function(freedFairyBox) {
            freedFairyBox.classList.remove("active");
        });
        let currQuestion = this.getQuestion();
        if(!!currQuestion) {
            //Especially for the finish part (question id is -1) there is no question.
            if(currQuestion.id != "start") {
                for(let i=0;i<currQuestion.solvedVariants.length;i++) {
                    this.freedFairyBoxes[i].classList.add("active");
                    this.freedFairyBoxes[i].style.filter = currQuestion.filter;
                }
            }
            if(currQuestion.isSolved() == false) {
                this.nextSceneSignPost.classList.add("disabled");
            }
        }
        else {
            this.nextSceneSignPost.classList.remove("disabled");
        }
        this.monstersCamp.classList.remove("solved");
    }

    pseudoEndAndReset() {
        let object = this;
        this.GameElements.player.container.addEventListener("transitionend", function () {
            console.log("player arrived");
            object.fader.addEventListener("transitionend", function () {
                console.log("faded out");
                object.pseudoEverythingBackToStart();
                //object.
                object.fadeSceneIn();
            }, { once: true });
            object.fadeSceneOut();

        }, { once: true });
        this.pseudoSceneEnd();
    }

    animateIntro() {
        videoAnimation = true;
        let object = this;
        let exclamation = document.querySelector(".fairy-home .exclamation");
        exclamation.innerHTML = "!!!";

        object.contentContainer.classList.add("intro");
        this.introState = 1;        
        
        this.contentContainer.parentNode.addEventListener("click", proceedIntroOnClick);

        object.GameElements.helper.node.style.setProperty("--yoffset", "0px");
        object.GameElements.helper.node.style.setProperty("--xoffset", "500px");
        object.GameElements.helper.node.classList.add("notifying");
        object.GameElements.helper.container.appendChild(object.GameElements.helper.node);

        /*object.GameElements.helper.node.addEventListener("animationend", function() {
            exclamation.classList.add("active");
            exclamation.classList.add("reverse");
            object.fairyHome.classList.add("alerting");
            object.fairyHome.addEventListener("click", function() { object.fairyHome.classList.remove("alerting"); }, {once:true});
        },  {once:true});*/

        object.GameElements.helper.node.addEventListener("animationend", object.animateFairyAlert, {once:true});
        object.GameElements.helper.node.addEventListener("click", function() { this.removeEventListener("animationend", object.animateFairyAlert); }, {once:true});
        
        let actionSpace = document.createElement("span");

        let confirmLink = document.createElement("a");
        confirmLink.innerHTML = "Ok";
        confirmLink.href = "javascript:;";

        let orSpace = document.createElement("span");
        orSpace.innerHTML = " or ";
        let skipLink = document.createElement("a");
        skipLink.innerHTML = "skip";
        skipLink.href = "javascript:;";
        skipLink.onclick = function() {
            object.introCleanUp();
            object.processNotification("Click on the signpost (right) to get started. Turn the monsters back into fairies by solving the riddles and unravel the mystery by reaching the final destination.", true);
        };

        actionSpace.appendChild(confirmLink);
        actionSpace.appendChild(orSpace);
        actionSpace.appendChild(skipLink);

        let colors = ["invert(75%) sepia(32%) saturate(1024%) hue-rotate(352deg) brightness(102%) contrast(97%)", "invert(31%) sepia(93%) saturate(4185%) hue-rotate(7deg) brightness(105%) contrast(110%)", "invert(94%) sepia(80%) saturate(1438%) hue-rotate(304deg) brightness(109%) contrast(101%)", "invert(88%) sepia(22%) saturate(727%) hue-rotate(38deg) brightness(103%) contrast(107%)", "invert(96%) sepia(97%) saturate(787%) hue-rotate(29deg) brightness(100%) contrast(108%)", "invert(67%) sepia(72%) saturate(618%) hue-rotate(43deg) brightness(110%) contrast(103%)", "invert(79%) sepia(18%) saturate(3453%) hue-rotate(45deg) brightness(97%) contrast(91%)", "invert(54%) sepia(21%) saturate(1222%) hue-rotate(49deg) brightness(99%) contrast(83%)", "invert(76%) sepia(34%) saturate(6604%) hue-rotate(231deg) brightness(102%) contrast(98%)", "invert(37%) sepia(85%) saturate(3762%) hue-rotate(272deg) brightness(104%) contrast(97%)", "invert(26%) sepia(92%) saturate(2035%) hue-rotate(275deg) brightness(86%) contrast(153%)"];
        confirmLink.onclick = function() {
            object.introState = 3;
            object.fader.addEventListener("transitionend", function() {
                object.contentContainer.classList.remove("city");
                let i=0;
                /*object.contentContainer.querySelectorAll(".enemy-container").forEach(function(enemyContainer) {
                    enemyContainer.classList.remove("invisible");
                    enemyContainer.classList.add("fairy-to-monster");
                    enemyContainer.style.setProperty("--transformAnimationStart", 1+i*0.5+"s");
                    enemyContainer.querySelector("img").style.opacity = "0";
                    let defaultFairy = document.createElement("img");
                    defaultFairy.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/fairy-black.svg";
                    defaultFairy.style.filter = colors[Math.floor(Math.random()*colors.length)];
                    enemyContainer.querySelector(".fairy-place-holder-at-enemy").appendChild(defaultFairy);

                    i++;
                });*/
                object.GameElements.enemies.forEach(function(Enemy) {
                    if(Enemy instanceof IceGolem || Enemy instanceof ForestGolem) {
                        Enemy.container.classList.remove("invisible");
                        Enemy.container.classList.add("fairy-to-monster");
                        Enemy.container.style.setProperty("--transformAnimationStart", 1+i*0.5+"s");
                        Enemy.container.querySelector("img").style.opacity = "0";
                        let defaultFairy = document.createElement("img");
                        defaultFairy.src = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/fairy-black.svg";
                        defaultFairy.style.filter = colors[Math.floor(Math.random()*colors.length)];
                        Enemy.container.querySelector(".fairy-place-holder-at-enemy").appendChild(defaultFairy);

                        i++;
                    }
                });

                /*let confirmLink2 = document.createElement("a");
                confirmLink2.innerHTML = "Ok";
                confirmLink2.href = "javascript:;";*/

                confirmLink.onclick = function() {
                    object.introState = 4;
                    object.fadeScene();
                    object.fader.addEventListener("transitionend", function() {
                        //back to city
                        object.fairyHome.querySelector(".exclamation").classList.remove("active");
                        object.GameElements.helper.sendTo(object.GameElements.helper.container);

                        object.fader.addEventListener("transitionend", function() {
                            //object.GameElements.helper.sendTo(object.GameElements.fairyBadge);
                            object.contentContainer.classList.add("city");

                            object.fairyBadge.style.display = "block";

                            object.processNotification("Here you can see how many fairies you have already rescued. ", true, undefined, undefined, confirmLink);
                            confirmLink.onclick = function() {
                                object.introState = 5;
                                confirmLink.onclick = function() {
                                    object.introState = 0;
                                    let goalLink = object.getPointToMapLink(object, "final destination (click)", document.querySelector("span.section-wrapper:last-child .qnbutton:last-child"), document.querySelector(".sign-post-container.point-right:not(.fairy-follow-sign-post) .fairy-place-holder")); /*document.createElement("a");
                                    goalLink.innerHTML = "Ziel (klick)";
                                    
                                    goalLink.href = "javascript:;";
                                    goalLink.onclick = function() {
                                        let navDrawer = document.querySelector(".qnbutton").closest(".drawer");
                                        if(!navDrawer) {
                                            return;
                                        }
                                        if(!navDrawer.classList.contains("show")) {
                                            if(document.querySelector('.qnbutton').closest('.drawer.show') == undefined) {
                                                document.querySelector('[data-target='+navDrawer.id+']:not([data-action="closedrawer"])').click();
                                            }
                                        }

                                        //toggle some switches to ensure fairy movement to last element is visible
                                        navDrawer.style.zIndex = "1050";
                                        let navDrawerContent = navDrawer.querySelector(".drawercontent");
                                        navDrawerContent.style.overflowY = "visible";

                                        object.GameElements.helper.sendTo(document.querySelector("span.section-wrapper:last-child .qnbutton:last-child"));

                                        let comeBackAfterGoalTourAnimation = function(event) {
                                            if(event.target != undefined && (event.target.closest(".fairy-img") != undefined || event.target.closest(".bubble") != undefined)) {
                                                return;
                                            }

                                            if(event.target.closest(".drawer") != undefined) {
                                                //close drawer if player clicked into it
                                                navDrawer.querySelector(".drawertoggle").click();
                                            }

                                            navDrawer.style.zIndex = "";
                                            navDrawerContent.style.overflowY = "";

                                            //object.GameElements.helper.sendBack();
                                            object.GameElements.helper.sendTo(document.querySelector(".sign-post-container.point-right:not(.fairy-follow-sign-post) .fairy-place-holder"));

                                            /*navDrawer.querySelector(".drawertoggle").removeEventListener("click", comeBackAfterGoalTourAnimation);

                                            document.querySelector(".modal-backdrop").removeEventListener("click", comeBackAfterGoalTourAnimation);

                                            document.removeEventListener("click", comeBackAfterGoalTourAnimation);
                                        };

                                        document.addEventListener("click", comeBackAfterGoalTourAnimation);

                                        /*navDrawer.querySelector(".drawertoggle").addEventListener("click", comeBackAfterGoalTourAnimation);
                                        document.querySelector(".modal-backdrop").addEventListener("click", comeBackAfterGoalTourAnimation);


                                    };*/

                                    let textPassageContainer = document.createElement("span");

                                    let textPassagePre = document.createElement("span"); textPassagePre.innerHTML = "Reach the ";
                                    let textPassagePost = document.createElement("span"); textPassagePost.innerHTML = " before it is too late and the forest falls into complete darkness. Save as many fairies as possible along the way. Now follow me to the right into the forest by clicking on the signpost.";

                                    //textPassageContainer.innerHTML = textPassagePre;
                                    textPassageContainer.appendChild(textPassagePre);
                                    textPassageContainer.appendChild(goalLink);
                                    textPassageContainer.appendChild(textPassagePost);
                                    //textPassageContainer.innerHTML += textPassagePost;
                                    /*confirmLink.onclick = function() {

                                    };*/
                                    object.processNotification("", true, undefined, undefined, textPassageContainer);
                                    videoAnimation = false;

                                    document.addEventListener("click", object.introCleanUp.bind(object), {once:true});
                                };
                                object.processNotification("And here is how many energy points you have. You can use energy points to teleport to places in the forest. Every enemy you defeat gives you energy points. If you save all the fairies of one color, you get extra energy points. ", true, undefined, undefined, confirmLink);
                                object.manaBadge.style.display = "block";


                            };
                        }, {once:true});
                        object.fadeScene();
                    }, {once:true});
                    
                };

                object.processNotification("Something has turned all my friends into monsters. Only you can turn them back and find out what happend. ", true, undefined, undefined, confirmLink);

                object.fadeScene();
            }, {once:true});
            object.fadeScene();
        };
        this.processNotification("Hey, something terrible has happened. Please listen to me. ", false, undefined, undefined, actionSpace, false);

    }

    animateFairyAlert() {
        let object = this;
        let exclamation = document.querySelector(".fairy-home .exclamation");
        let fairyHome = document.querySelector(".fairy-home");
        fairyHome.classList.add("alerting");
        exclamation.classList.add("active");
        exclamation.classList.add("reverse");
        fairyHome.addEventListener("click", function() { this.classList.remove("alerting"); }, {once:true});
    }

    introCleanUp() {
        let object = this;
        videoAnimation = false;
        object.contentContainer.classList.remove("intro");

        let exclamation = document.querySelector(".fairy-home .exclamation");
        exclamation.innerHTML = "!";
        exclamation.classList.remove("reverse");
        exclamation.classList.remove("active");

        object.fairyHome.classList.remove("alerting");
        object.introState = 0;
        object.contentContainer.parentNode.removeEventListener("click", proceedIntroOnClick);

        object.contentContainer.querySelectorAll(".enemy-container").forEach(function(enemyContainer) {
            enemyContainer.classList.add("invisible");
            enemyContainer.classList.remove("fairy-to-monster");
            enemyContainer.style.removeProperty("--transformAnimationStart");
            enemyContainer.querySelector("img").style.opacity = "";
            let fairyPlaceholderAtEnemy = enemyContainer.querySelector(".fairy-place-holder-at-enemy");
            if(fairyPlaceholderAtEnemy != undefined) {
                while(fairyPlaceholderAtEnemy.firstChild != undefined) {
                    fairyPlaceholderAtEnemy.removeChild(fairyPlaceholderAtEnemy.firstChild);
                }
            }
        });
    }

    getPointToMapLink(object, innerHTML, targetQuestionNode, targetAfterNode) {
        if(object == undefined) {
            object = this;
        }
        let link = document.createElement("a");
        if(innerHTML == undefined) {
            innerHTML = "Karte";
        }
        link.innerHTML = innerHTML;

        if(targetQuestionNode == undefined) {
            targetQuestionNode = document.querySelector(".section-wrapper .qnbutton");
        }

        if(targetAfterNode == undefined) {
            targetAfterNode = object.fairyHome;
        }
        
        link.href = "javascript:;";
        link.onclick = function() {
            let navDrawer = document.querySelector(".qnbutton").closest(".drawer");
            if(!navDrawer) {
                return;
            }
            if(!navDrawer.classList.contains("show")) {
                if(document.querySelector('.qnbutton').closest('.drawer.show') == undefined) {
                    document.querySelector('[data-target='+navDrawer.id+']:not([data-action="closedrawer"])').click();
                }
            }

            //toggle some switches to ensure fairy movement to last element is visible
            navDrawer.style.zIndex = "1050";
            let navDrawerContent = navDrawer.querySelector(".drawercontent");
            navDrawerContent.style.overflowY = "visible";

            object.GameElements.helper.sendTo(targetQuestionNode);

            let comeBackAfterGoalTourAnimation = function(event) {
                if(event.target != undefined && (event.target.closest(".fairy-img") != undefined || event.target.closest(".bubble") != undefined)) {
                    return;
                }

                if(event.target.closest(".drawer") != undefined) {
                    //close drawer if player clicked into it
                    navDrawer.querySelector(".drawertoggle").click();
                }

                navDrawer.style.zIndex = "";
                navDrawerContent.style.overflowY = "";
                object.GameElements.helper.sendTo(targetAfterNode);
                document.removeEventListener("click", comeBackAfterGoalTourAnimation);
            };

            document.addEventListener("click", comeBackAfterGoalTourAnimation);
        };

        return link;
    }

    goBackToCity() {
        let object = this;
        console.log("go back to city");
        videoAnimation = true;
        this.GameElements.player.container.style.transition = "left 2.5s linear";
        this.GameElements.player.setOrientation(1);
        this.GameElements.player.setState("run");
        this.GameElements.player.container.style.left = "-20%";

        this.GameElements.player.container.addEventListener("transitionend", this.cityReturnAnimation.bind(null, this), { once: true });

        if(this.GameElements.helper.isCurrentlyMoving() == true) {
            //Send home to calc offset, but immediately stop normal fairy movement animation by adding the new one.
            this.GameElements.helper.sendBack();
            this.GameElements.helper.node.classList.add("moving-linear", "moving-quick");
            this.GameElements.helper.node.addEventListener("animationend", function() { object.GameElements.helper.node.classList.add("leave-scene", "to-left"); }, {once:true});
        }
        else {
            this.GameElements.helper.node.classList.add("leave-scene", "to-left");
        }

        /*if(!this.notificationBubbleElement.classList.contains("closed")) {
            this.notificationBubbleElement.addEventListener("transitionend", function() {
                document.querySelector(".que").classList.add("scene-end");
            }, {once:true});
        }
        else {
            document.querySelector(".que").classList.add("scene-end");
        }*/

        this.questionBubbleElement.classList.add("closed", "no-arrow");
        this.questionBubbleElement.classList.remove("middle-arrow");
        this.questionBubbleElement.classList.remove("show-overflow");

        this.notificationBubbleElement.classList.add("closed", "no-arrow");
        this.notificationBubbleElement.classList.remove("middle-arrow");
        this.notificationBubbleElement.classList.remove("show-overflow");


        this.GameElements.freed.node.classList.add("leave-scene", "reverse");
        this.fairyFollowSignPost.classList.remove("active");

        this.untargetEnemy();
    }

    cityReturnAnimation(object) {
        //Screen is black and player comes from origin point (probably right) to the middle.
        if (object == undefined) {
            object = this;
        }
        object.GameElements.player.container.style.transition = "none";
        let orientation = object.GameElements.player.getOrientation();
        if (orientation == 1) {
            //Player comes from the right
            object.GameElements.player.container.style.left = "120%";
        }
        else {
            //Player comes from the left
            object.GameElements.player.container.style.left = "-20%";
        }
        object.fadeSceneOut();
        object.fader.addEventListener("transitionend", function () {
            object.fadeSceneIn();

            object.GameElements.helper.node.classList.remove("notifying");
            object.GameElements.helper.node.classList.remove("returning");
            object.GameElements.helper.node.classList.remove("leave-scene");
            object.GameElements.helper.node.classList.remove("to-right");
            object.GameElements.helper.node.classList.remove("to-top");
            object.GameElements.helper.node.classList.remove("to-left");
            object.GameElements.helper.node.classList.remove("moving-linear");
            object.GameElements.helper.node.classList.remove("moving-quick");

            object.GameElements.helper.node.style.setProperty("--yoffset", "0px");
            object.GameElements.helper.node.style.setProperty("--xoffset", "500px");
            object.GameElements.helper.node.classList.add("notifying");
            object.GameElements.helper.container.appendChild(object.GameElements.helper.node);

            //object.GameElements.helper.node.style.left = "120%";
            //object.GameElements.helper.sendBack();

            //object.GameElements.helper.container.appendChild(object.GameElements.helper.node);

            object.freedFairyBoxes.forEach(function(freedFairyBox) {
                freedFairyBox.classList.remove("active");
            });

            let contentElement = document.querySelector(".que .content")
            contentElement.classList.add("city");
            contentElement.classList.remove("clearing");
            object.GameElements.player.container.style.transition = "left 2.5s linear";
            object.GameElements.player.container.style.left = "50%";
            /*object.GameElements.player.container.addEventListener("transitionend", function() {
                document.querySelector(".que").classList.remove("scene-end");
            }, {once:true});*/
            object.GameElements.player.container.addEventListener("transitionend", function () { object.GameElements.player.setOrientation(0); object.GameElements.player.setState("idle"); videoAnimation = false; }, { once: true });
            object.setCurrentQuestionId("start");
            object.currentPage = 0;

            object.resetFairyBubbleToDefault();
        }, { once: true });
    }

    resetFairyBubbleToDefault() {
        let object = this;
        let optionTeleportPhrase;
        let navDrawer = document.querySelector(".qnbutton").closest(".drawer");
        if(navDrawer == undefined || navDrawer.classList.contains("show")) {
            optionTeleportPhrase =  "teleport to any point in the forest (left)";
        }
        else {
            let clickOpenDrawerFunction = "if(document.querySelector('.qnbutton').closest('.drawer.show') == undefined) { document.querySelector('[data-target=\\'"+navDrawer.id+"\\']:not([data-action=\\'closedrawer\\'])').click(); }";
            optionTeleportPhrase = "<a href=\"javascript:;\" onclick=\""+clickOpenDrawerFunction+"\">teleport to any point in the forest</a>";
        }
        object.notificationBubbleContainer.querySelector(".bubble-content").innerHTML = "From here, you can <a href=\"javascript:void(0);\" onclick=\"ALQuiz.goToNextScene();\">go to the next opponent</a> or "+optionTeleportPhrase+".";
    }

    buildVictoryScene(object) {
        if(object == undefined) {
            object = this;
        }
        object.pseudoEverythingBackToStart();
        object.fadeSceneIn();
        object.fader.addEventListener("transitionend", function() {
            object.processNotification("You have reached your destination. The forest is saved! Now you can teleport freely through the forest without having to invest energy points. But not all the fairies have been saved yet. Jump to the enemies (including those already defeated) and let the fairies show you the way to their friends!", true);
            //Alle Feen, die du rettest, erscheinen hier auf der Lichtung, um dir zu danken. 
        }, {once:true});
        if(!object.finished) {
            object.finished = true;
            object.manaBadge.querySelector(".badge__label").innerHTML = "&infin;";
            object.contentContainer.classList.add("finished");
            object.manaBadge.classList.add("appear");
        }
        object.contentContainer.classList.add("clearing");
        object.contentContainer.classList.remove("city");
    }

    incrementSolved(id) {
        if (id == undefined) {
            id = this.currentQuestionId;
        }
        let currQuestion = this.getQuestion(id);
        currQuestion.solved++;
        currQuestion.currentlySolved++;

        if (currQuestion.isSolved()) {

            if(currQuestion.solvedVariants.indexOf(this.currentPage-currQuestion.page) == -1) {
                currQuestion.solvedVariants.push(this.currentPage-currQuestion.page);
            }
            if(this.solvedVariants.indexOf(this.currentPage) == -1) {
                this.solvedVariants.push(this.currentPage);
            }

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

            /*let solvedVariantsAsString = sessionStorage.getItem("solvedVariants");
            if (solvedVariantsAsString != undefined) {
                let solvedVariants = JSON.parse(solvedVariantsAsString);
                if (solvedVariants != undefined) {
                    if (solvedVariants.indexOf(this.currentPage) == -1) {
                        solvedVariants.push(this.currentPage);*/
                        sessionStorage.setItem("solvedVariants", JSON.stringify(this.solvedVariants));
                    /*}
                }
            }*/

            //update saved fairies overview
            let fairyRepresentation = this.fairyModal.querySelector("[data-represents='"+this.currentPage+"']");
            if(fairyRepresentation != undefined) {
                fairyRepresentation.style.filter = currQuestion.filter;
            }
        }

    }

    animateMonsterAnalysis(completelySolved, hintNodes) {
        /*
        * completelySolved: Boolean, that defines how to animate. If all variants are already solved, the animation differs.
        */
       if(completelySolved == undefined) {
        completelySolved = false;
       }

        videoAnimation = true;
        let object = this;
        let monsterAnalysisAnimationFrame = document.querySelector(".monster-analysis-fairy-animation-placeholder");
        let helperNode = object.GameElements.helper.node;
        helperNode.classList.add("moving-linear");
        helperNode.classList.add("moving-quick");
        /*let rectHelperNode = helperNode.getBoundingClientRect();
        let rectContainer = monsterAnalysisAnimationFrame.getBoundingClientRect();
        //console.log(rectContainer);
        let xoffset = rectHelperNode.x - rectContainer.x;
        let yoffset = rectHelperNode.y - rectContainer.y;
        monsterAnalysisAnimationFrame.style.setProperty("--x2offset", xoffset + "px");
        monsterAnalysisAnimationFrame.style.setProperty("--y2offset", yoffset + "px");

        helperNode.classList.remove("notifying");
        monsterAnalysisAnimationFrame.classList.remove("animate");
        monsterAnalysisAnimationFrame.classList.add("animate");
        monsterAnalysisAnimationFrame.appendChild(helperNode);*/
        helperNode.addEventListener("animationend", function(event) {
            event.stopPropagation();
            monsterAnalysisAnimationFrame.classList.add("animate");
            monsterAnalysisAnimationFrame.addEventListener("animationend", function() {
                console.log("animation ends now");
                object.GameElements.helper.node.addEventListener("animationend", function() {
                    helperNode.style.setProperty("--xoffset", "0px");
                    helperNode.style.setProperty("--yoffset", "0px");
                    helperNode.classList.remove("moving-linear", "moving-quick");
                    if(completelySolved == false) {
                        videoAnimation = false;
                        let preText = "";
                        //if no single variant is solved, give an explanation
                        if(object.solvedVariants == undefined || object.solvedVariants.length == 0) {
                            preText = "Use the text field to formulate your spell and click on the formula to execute it. Or use the Enter key.";
                            //object.processNotification("Nutze das Textfeld, um deinen Zauber zu formulieren und klicke auf die Formel, um ihn auszuf&uuml;ren. Oder benutze die Enter-Taste.", true);
                            /*object.GameElements.helper.node.addEventListener("animationend", function() {
                                videoAnimation = false;
                            }, {once:true});*/
                        }
                        else if(document.querySelectorAll(".monsters-camp .enemy-container:not(.invisible)").length > 1) {
                            //Multiple monsters information if not yet killded any in the first world.
                            let multipleMonstersVariants = [];
                            for(let i=5;i<17;i++) {
                                multipleMonstersVariants.push(i);
                            }
                            if(!object.solvedVariants.some(r => multipleMonstersVariants.indexOf(r) >= 0)) {
                                //object.processNotification("Ziele auf das Monster, das du verwandeln m&ouml;chtest, indem du es anklickst.", true);
                                preText = "Aim at the monster you want to transform by clicking on it.";
                                /*object.GameElements.helper.node.addEventListener("animationend", function() {
                                    videoAnimation = false;
                                }, {once:true});*/
                            }
                        }
                        if(preText != "" || (hintNodes != undefined && hintNodes.length > 0)) {
                            let hintNodesDiv = document.createElement("div");
                            hintNodes.forEach(function(hintNode) {
                                hintNode.classList.add("show-hint");
                                hintNodesDiv.append(hintNode);
                            });

                            object.processNotification(preText, true, undefined, undefined, hintNodesDiv);
                            object.GameElements.helper.node.addEventListener("animationend", function() {
                                videoAnimation = false;
                            }, {once:true});
                        }
                    }
                    else {
                        object.processNotification("You have already saved all the fairies here. You can continue practicing here, but you will receive fewer points.", true);
                        object.GameElements.helper.node.addEventListener("animationend", function() {
                            videoAnimation = false;
                        }, {once:true});
                    }
                }, {once:true});
                object.showNotificationSpeechBubble(object.questionBubbleElement);
                monsterAnalysisAnimationFrame.classList.remove("animate");
            }, {once:true}); }, {once:true});
        object.GameElements.helper.sendTo(monsterAnalysisAnimationFrame);
        /*this.GameElements.helper.node.addEventListener("animationend", function() { monsterAnalysisAnimationFrame.classList.add("animate"); }, {once:true});*/
        //monsterAnalysisAnimationFrame.addEventListener("animationend", function() {  object.GameElements.helper.sendBack(); }, {once:true});
        //this.GameElements.helper.sendTo(monsterAnalysisAnimationFrame);
    }

    animateTransformation() {
        let object = this;
        let currQuestion = object.getQuestion();
        let completelySolved = (currQuestion.solvedVariants.length == currQuestion.variants);
        let completelySolvedBefore = object.monstersCamp.classList.contains("solved");
        this.monstersCamp.addEventListener("animationend", function(event) {
            object.monstersCamp.classList.add("appeared");
            object.monstersCamp.classList.remove("transform");
            if(!completelySolvedBefore) {
                object.changeScore(object.fairyBadge, 1);
            }
            /*setTimeout(function() { object.monstersCamp.addEventListener("animationend", function(e) {
                console.log("send freed fairy to say thanks");

                //setTimeout(function() { object.GameElements.freed.sendTo(object.questionBubbleElement.parentNode.querySelector(".fairy-place-holder")); }, 3000);

                object.processNotification("Danke, dass du mich gerettet hast! Bitte, bevor du tiefer in den Wald gehst, verwandle auch meine Freunde zur&uuml;ck! Folgen", true, object.questionBubbleElement, object.GameElements.freed);
            }, {once:true}); }, 50);*/
            setTimeout(function() {    
                let message = "";
                let toAppendToMessage = undefined;
                if(completelySolvedBefore) {
                    if(!object.finished) {
                        object.changeScore(object.manaBadge, 5);
                    }
                }
                else {
                    if(completelySolved == true) {
                        message = "Thank you, you saved all my friends of the same color! Go deeper into the forest and save all the others!";
                        if(!object.finished) {
                            object.changeScore(object.manaBadge, 30);
                        }
                    }
                    else {
                        message = "Thank you for saving me! Please, before you go deeper into the forest, turn my friends back too! ("+currQuestion.solvedVariants.length+" of "+currQuestion.variants+")";
                        object.fairyFollowSignPost.classList.add("active");
                        toAppendToMessage = object.followPrompt;
                        if(!object.finished) {
                            object.changeScore(object.manaBadge, 10);
                        }
                    }
                    object.processNotification(message, true, object.questionBubbleElement, object.GameElements.freed, toAppendToMessage);
                }
                object.nextSceneSignPost.classList.remove("disabled");
                //object.saveState(); -- Saving should work independent of animation. But it still has to take the time offset of raised score in account. It's moved to promise chain and equipped with delay.
                //object.questionBubbleElement.appendChild(object.followPrompt);
            }, 500);

            //object.monstersCamp.classList.remove("transform");
        }, {once:true});
        this.monstersCamp.classList.add("transform");
    }

    animateThanks() {

    }

    targetEnemy(object) {
        if(object == undefined) {
            object = this;
        }
        for(let i=0;i<object.GameElements.enemies.length;i++) {
            let inputFieldOfEnemyToTarget = object.GameElements.enemies[i].container.querySelector("input, textarea");
            if(inputFieldOfEnemyToTarget != undefined && inputFieldOfEnemyToTarget.dataset.correctAnswer == undefined) {
                object.targetedEnemy = object.GameElements.enemies[i];
                break;
            }
        }
        //if still undefined: error
        if(object.targetedEnemy == undefined) {
            throw new Error("No enemy could be targeted, because all seem to be solved already.")
        }
    }

    untargetEnemy(object) {
        if(object == undefined) {
            object = this;
        }

        //clear pre and post input fields
        while(object.preInputField.firstChild) {
            object.preInputField.removeChild(object.preInputField.firstChild);
        }
        while(object.postInputField.firstChild) {
            object.postInputField.removeChild(object.postInputField.firstChild);
        }

        if(object.targetedEnemy == undefined) {
            return;
        }
        object.targetedEnemy.container.classList.remove("targeted");
        object.targetedEnemy = undefined;

    }

    saveState(info) {
        //ino: string, info is added to the default save state JSON as additional member.
        let object = this;
        if(this.saveStateInput == undefined) {
            console.log("Tried to save, but failed due to undefined saveStateInput member.")
            return;
        }
        //get current form
        let firstForm = document.querySelector("#responseform");
        console.log(firstForm);

        //Instead of immediately reload a question, regarding safe state, a redo is done before new input, to ensure the old save state is still presented on re-attempting the quiz.
        let repeatButton = firstForm.querySelector(".mod_quiz-redo_question_button");
        let prePromiseChain = async function(input) {
            return input;
        };
        if(repeatButton == undefined && (this.saveStateInput.value == "" || this.saveStateInput.value == undefined)) {
            //initial save - do nothing, no conflict with already saved state expected.
        }
        else {
            //Page not yet reloaded (which leads to no present opportunity to repeat) or repeat button is there, but has to be refetched (because name of redo button input changes over re-attempting). Fetch current state of start page and return to save promise chain.
            prePromiseChain = async function(input) {
                let urlOfStartPage = object.getPageURL("start").url;
                return fetch(urlOfStartPage).then(function(response) {
                    return response.text();
                })
                .then(text => {
                    let fetchedPage = object.Parser.parseFromString(text, "text/html");
                    let formFetchedPage = fetchedPage.getElementById("responseform");

                    let redoButton = formFetchedPage.querySelector(".mod_quiz-redo_question_button");
                    if(redoButton == undefined) {
                        throw new Error("Redo Button not found, despite fetching page.")
                    }
                    let redoFormData = new FormData(formFetchedPage);
                    redoFormData.append(redoButton.name, redoButton.value);

                    return fetch(formFetchedPage.action, { method: "POST", body: redoFormData }).then(response => {
                        if(response.status == 200) {
                            console.log("everything seems to be fine with save");
                        }
                        else {
                            throw new Error("something seems to went wrong with save");
                        }
                        return response.text();
                    }).catch(error => {
                        console.log("error in promise chain trying to reload question to save new state");
                        console.log(error);
                    });
                })
                .catch(error => {
                    console.log("error in fetching redo button");
                    console.log(error);
                });
            };
        }
        //The following would be nice in case of the redo-button is there but the page hasn't reloaded yet: Reload question normally before saving. But unfortunately, we have to fetch the start page again to get the right name of input.mod_quiz-redo_question_button (redoslot1, redoslot2, ...).
            /*prePromiseChain = async function(input) {
                //Reset sequencecheck
                firstForm.querySelectorAll("input[name$=sequencecheck]:not(.bubble input)").forEach(function(sequenceCheckFieldToReset) {
                    sequenceCheckFieldToReset.value = 1;
                });
                let redoFormData = new FormData(firstForm);
                
                redoFormData.append(repeatButton.name, repeatButton.value);

                return fetch(firstForm.action, { method: "POST", body: redoFormData }).then(response => {
                    if(response.status == 200) {
                        console.log("everything seems to be fine with save question reload.");
                    }
                    else {
                        throw new Error("something seems to went wrong with save question reload.");
                    }
                    return response.text();
                }).catch(error => {
                    console.log("error in promise chain trying to reload question to save new state (page already reloaded after initial start)");
                    console.log(error);
                });
            };*/

        let solved = [];
        let solvedJSONString = sessionStorage.getItem("solved");
        if(solvedJSONString != undefined) {
            solved = JSON.parse(solvedJSONString);
            if(solved == undefined) {
                solved = [];
            }
        }
        let currentState = new SaveState(Date.now(), solved, this.solvedVariants, this.Score);
        if(info != undefined) {
            currentState.info = info;
        }
        object.saveStateInput.value = currentState.asString();
        console.log("save state:");
        console.log(this.saveStateInput.value);

        //Reset sequencecheck
        /*firstForm.querySelectorAll("input[name$=sequencecheck]:not(.bubble input)").forEach(function(sequenceCheckFieldToReset) {
            sequenceCheckFieldToReset.value = 1;
        });*/

        let formDataSave = new FormData(firstForm);
        let algebraicInput = firstForm.querySelector("input.algebraic:not(.formula-container input)");
        if(algebraicInput == undefined) {
            throw new Error("Save not possible because algebraic input element not found");
        }
        formDataSave.delete(algebraicInput.name);
        formDataSave.append(algebraicInput.name, "x=42");
        
        prePromiseChain(undefined).then(function(responsetext) {
            let submitButton;
            if(responsetext != undefined) {
                let fetchedPage = object.Parser.parseFromString(responsetext, "text/html");
                let formFetchedPage = fetchedPage.getElementById("responseform");
                submitButton = formFetchedPage.querySelector("input:not(.bubble input)[type='submit'][name$='submit'],button:not(.bubble button)[type='submit'][name$='submit']");

                let sequenceCheck = fetchedPage.querySelector("input[name$=sequencecheck]:not(.bubble input)");
                console.log("save sequence check value: "+sequenceCheck.value);
                
                formDataSave.set(sequenceCheck.name, sequenceCheck.value);
            }
            else {
                submitButton = firstForm.querySelector("input:not(.bubble input)[type='submit'][name$='submit'],button:not(.bubble button)[type='submit'][name$='submit']");
            }
            if(submitButton == undefined) {
                throw new Error("save couldn't be performed due to missing submit button");
            }
            //Append submit
            formDataSave.append(submitButton.name, submitButton.value);

            

            fetch(firstForm.action, { method: "POST", body: formDataSave })
            .then(response => {
                return response.text();
            })
            .then(text => {
                let fetchedPage = object.Parser.parseFromString(text, "text/html");
                let formFetchedPage = fetchedPage.getElementById("responseform");

                let repeatButton = fetchedPage.querySelector(".mod_quiz-redo_question_button");
                console.log(repeatButton);
                if (repeatButton == undefined) {
                    let stackinputerrorSpan = fetchedPage.querySelector(".stackinputerror");
                    if(stackinputerrorSpan != undefined) {
                        //Probably an input was submitted despite of an syntax error.
                        /*nextQuestionQuery.querySelectorAll("[name$=sequencecheck]").forEach(function(sequenceCheckFieldToRaise) {
                            sequenceCheckFieldToRaise.value = parseInt(sequenceCheckFieldToRaise.value)+2;
                        });*/
                        throw new Error("Stack input error 2");
                    }
                    //If there is no repeat button, we are probably on a validation page (e. g. "Please answer all parts of the question" or "Please check whether what you entered was intepreted as expected"), which happens for unknown reasons. Submit again to get feedback page.
                    let submitButton = fetchedPage.querySelector("input.submit, button.submit");
                    if(submitButton == undefined) {
                        throw new Error("Error in promise chain: (2) For some reason, question could neither be repeated nor input could be resubmitted. Probably sequence check error (Moodle error code submissionoutofsequencefriendlymessage).");
                    }
                    let matchSubmit = [
                        "",
                        submitButton.name,
                        submitButton.value
                    ];

                    //set sequencecheck to 1 to prevent "submissionoutofsequencefriendlymessage".


                    let formDataSubmitValidation = new FormData(formFetchedPage);

                    formDataSubmitValidation.append(matchSubmit[1], matchSubmit[2]);

                    return fetch(formFetchedPage.action, { method: "POST", body: formDataSubmitValidation }).then(response => {
                        //Reset sequencecheck
                        /*firstForm.querySelectorAll("input[name$=sequencecheck]:not(.bubble input)").forEach(function(sequenceCheckFieldToReset) {
                            sequenceCheckFieldToReset.value = 1;
                        });*/
                        return response.text();
                    }).then(text => { return object.Parser.parseFromString(text, "text/html"); });
                }
                else {
                    return fetchedPage;
                }
            })
            .catch(function(error) {
                console.log("Error during saving.")
                console.log(error);
            });
        });
    }

    rearrangeMath() {
        if (MathJax != undefined) {
            //Interestingly, the input replacer ("?") in the enemies bar seems to irritate MathJax, concluding to line breaks in between formulas. Setting display to "none" prevents it.
            let temp = document.createElement("div");
            document.querySelectorAll(".input-replacer").forEach(function(inputReplacer) {
                inputReplacer.innerHTML = "";
                //temp.appendChild(inputReplacer);
            });
            //setTimeout(MathJax.Hub.Typeset(), 2500);
            MathJax.Hub.Typeset()
            setTimeout(
                function() {
                    document.querySelectorAll(".input-replacer").forEach(function(inputReplacer) {
                        inputReplacer.innerHTML = "?";
                    });
                }
                ,
                1000
            );
        }
        else {
            console.log("no mathjax object found");
        }
    }
}

class MatrixObject {
    constructor(id, node) {
        this.id = id;
        this.node = node;
        if(node == undefined) {
            this.node = document.getElementById(id)
        }
    }

    selectElement(name) {
        this.node.querySelectorAll("input").forEach(function(inputElement) {
            let inputReplacerNode = inputElement.parentNode.querySelector(".input-replacer");
            inputReplacerNode.classList.remove("selected");
        });
        let elementNode = this.node.querySelector("name='"+name+"'");
        if(elementNode == undefined) {
            return;
        }
        elementNode.classList.add("selected");
    }
}

class SaveState {
    constructor(timestamp, solved, solvedVariants, score) {
        this.timestamp = timestamp;
        this.solved = solved;
        this.solvedVariants = solvedVariants;
        this.score = score;
    }

    asString() {
        return JSON.stringify(this);
    }
}

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

class Instruction {
    constructor(id, description, page, onsuccess, onfailure, BubbleInfo, questionsOnPage) {
        this.id = id;
        this.page = page;
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
    constructor(id, description, page, needs, BubbleInfo, onsuccess, onfailure, askBeforeSkip, questionsOnPage, variants, color, filter) {
        super(id, description, page, onsuccess, onfailure, BubbleInfo, questionsOnPage);
        this.needs = needs == undefined ? 1 : needs;
        this.solved = 0;
        /*solved means: solved at least once in this attempt, currentlySolved means: solved actually now in the current scope of js variables*/
        this.currentlySolved = 0;
        this.askBeforeSkip = askBeforeSkip == undefined ? false : askBeforeSkip;

        this.variants = variants == undefined ? 1 : variants;
        this.solvedVariants = [];

        this.color = color;
        this.filter = filter;
    }

    isSolved(onlyOnCurrentlySolved) {
        if (onlyOnCurrentlySolved == undefined) {
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

class GameSprite {
    constructor(src, spriteWidth, spriteHeight, xEndOfSpritesheet, animationInterval, frameAmount, height) {
        this.src = src;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight
        this.height = height == undefined ? spriteHeight : height;
        this.xEndOfSpritesheet = xEndOfSpritesheet;

        this.frameAmount = frameAmount;

        this.curPos;
        this.curFrame = 0;
        //animationInterval is interval in milliseconds
        this.animationInterval = animationInterval;

        this.timerId;

        //Preload image, especially for short animations (e. g. attack) to be shown promptly.
        let img = new Image();
        img.src = src;
        let invisibleContainer = document.createElement("div");
        invisibleContainer.style.display = "none";
        invisibleContainer.appendChild(img);
        document.body.appendChild(invisibleContainer);
    }

    getSrc() {
        return this.src;
    }

}

class GameElement {
    constructor(SpritesObject, orientation, state) {
        this.Sprites = SpritesObject;
        this.state = state == undefined ? "idle" : state;
        this.orientation = orientation;
        this.node;
        this.container;
        this.createDOMNode();
        this.startAnimation();
    }

    createDOMNode() {
        let container = document.createElement("div");
        container.style.width = this.Sprites[this.state].spriteWidth + "px";
        container.style.height = this.Sprites[this.state].spriteHeight + "px";
        container.style.overflow = "hidden";
        container.style.position = "absolute";
        let node = document.createElement("img");
        node.style.width = "auto";
        node.style.height = "100%";
        //node.style.transform = "translateX(0px)";
        if (!!this.orientation) {
            node.style.transform = "scaleX(-1);"
        }
        node.src = this.Sprites[this.state].src;

        container.appendChild(node);

        this.node = node;
        this.container = container;

        return container;
    }

    startAnimation(repeat, backto, callback) {
        //console.log("start animation "+this.state);
        if (repeat == undefined) {
            repeat = "infinite";
        }
        //assume node.src is already set
        this.Sprites[this.state].timerId = setInterval(this.nextAnimation, this.Sprites[this.state].animationInterval, this, repeat, backto, callback);
    }

    nextAnimation(object, repeat, backto, callback) {
        if (object == undefined) {
            object = this;
        }
        if (repeat == undefined) {
            repeat = "infinite";
        }
        if (backto == undefined) {
            backto = "idle";
        }
        if (object.Sprites[object.state].curFrame < object.Sprites[object.state].frameAmount - 1) {
            object.Sprites[object.state].curFrame++;
        }
        else {
            object.Sprites[object.state].curFrame = 0;
            if (repeat == "once") {
                object.setState(backto);
            }
            else if (repeat == "toend") {
                object.stopAnimation();
                object.Sprites[object.state].curFrame = object.Sprites[object.state].frameAmount - 1;
                if(callback != undefined) {
                    callback();
                }
            }
        }
        let sign = "";
        let frameNum = object.Sprites[object.state].curFrame;
        if (!!object.orientation) {
            object.node.style.transform = "scaleX(-1) ";
            frameNum = object.Sprites[object.state].frameAmount - frameNum - 1;
        }
        else {
            object.node.style.transform = "";
            sign = "-"
        }
        object.node.style.transform += "translateX(" + sign + (frameNum / object.Sprites[object.state].frameAmount) * 100 + "%)";

    }

    setState(state, repeat, backto, callback) {
        if (state == undefined) {
            state = "idle";
        }
        if (repeat == undefined) {
            repeat = "infinite";
        }
        if (backto == undefined) {
            backto = this.state;
        }
        if (this.Sprites[state] == undefined) {
            console.log("undefined state");
            return false;
        }

        this.stopAnimation();

        this.state = state;
        this.node.src = this.Sprites[this.state].src;
        this.startAnimation(repeat, backto, callback);
    }

    stopAnimation() {
        clearInterval(this.Sprites[this.state].timerId);
        this.Sprites[this.state].timerId = null;
        this.Sprites[this.state].curFrame = 0;
    }

    setSize(width, height) {
        /*
         *  Set width and/or height in pixels. Auto adjust pixel-size for undefined value.
         */
        if (width == undefined && height == undefined) {
            console.log("no size given to set")
            return;
        }
        if (height == undefined) {
            height = this.Sprites[this.state].spriteHeight / (this.Sprites[this.state].spriteWidth / width);
        }
        else if (width == undefined) {
            width = this.Sprites[this.state].spriteWidth / (this.Sprites[this.state].spriteHeight / height);
        }
        this.container.style.width = width + "px";
        this.container.style.height = height + "px";
    }

    setOrientation(orientation, object) {
        if (object == undefined) {
            object = this;
        }
        object.orientation = orientation;
    }

    getOrientation() {
        return this.orientation;
    }
}

class GameElementWithFormula extends GameElement {
    constructor(SpritesObject, orientation, state) {
        super(SpritesObject, orientation, state);
        
        this.formulaContainer = document.createElement("div");
        this.formulaContainer.classList.add("formula-container");
        this.container.appendChild(this.formulaContainer);

        let imgWrapper = document.createElement("div");
        imgWrapper.style.width = "100%";
        imgWrapper.style.height = "100%";
        imgWrapper.style.overflow = "hidden";
        imgWrapper.classList.add("img-wrapper");

        this.container.style.overflow = "visible";
        imgWrapper.appendChild(this.node);

        this.container.appendChild(imgWrapper);

        let fairyPlaceHolderAtEnemy = document.createElement("div");
        /*fairyPlaceHolderAtEnemy.style.width = "50px";
        fairyPlaceHolderAtEnemy.style.height = "50px";
        //fairyPlaceHolderAtEnemy.style.right = this.container.style.right;
        //fairyPlaceHolderAtEnemy.style.bottom = this.container.style.bottom;
        //fairyPlaceHolderAtEnemy.style.transform = "translate(calc(-" + this.container.style.width + "/2),calc(-" + this.container.style.height + "/2))";
        //fairyPlaceHolderAtEnemy.style.position = "absolute";
        fairyPlaceHolderAtEnemy.style.zIndex = 1;*/
        fairyPlaceHolderAtEnemy.classList.add("fairy-place-holder-at-enemy");
        this.fairyPlaceHolder = fairyPlaceHolderAtEnemy;
        this.container.appendChild(fairyPlaceHolderAtEnemy);
    }

    clearFormulas() {
        if(this.formulaContainer == undefined) {
            return;
        }
        while (this.formulaContainer.firstChild != undefined) {
            this.formulaContainer.removeChild(this.formulaContainer.firstChild);
        }
    }
}

class Elf extends GameElement {
    constructor(orientation) {
        super(
            {
                idle: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Elf_03__IDLE_spritesheet.png", 450, 580, 4500, 75, 10),
                attack: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Elf_03__ATTACK_spritesheet.png", 450, 580, 4500, 75, 10),
                run: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Elf_03__RUN_spritesheet.png", 465, 580, 4650, 75, 10)
            },
            orientation)
    }
}

class Troll extends GameElementWithFormula {
    constructor(orientation) {
        super(
            {
                idle: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Troll_01_1_IDLE_spritesheet.png", 750, 580, 7500, 90, 10),
                hurt: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Troll_01_1_HURT_spritesheet.png", 770, 580, 7700, 90, 10),
                die: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Troll_01_1_DIE_spritesheet.png", 1010, 580, 10100, 90, 10),
                walk: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Troll_01_1_WALK_spritesheet.png", 775, 580, 7750, 90, 10),
                attack: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Troll_01_1_ATTACK_spritesheet.png", 900, 830, 9000, 90, 10)
            },
            orientation
        )
    }
}

class IceGolem extends GameElementWithFormula {
    constructor(orientation) {
        super(
            {
                idle: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_01_1_IDLE_spritesheet.png", 700, 750, 12600, 50, 18),
                hurt:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_01_1_HURT_spritesheet.png", 700, 750, 8400, 50, 12),
                die:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_01_1_DIE_spritesheet.png", 700, 750, 10500, 50, 15)/*,
                walk:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_01_1_WALK_spritesheet.png", 775, 580, 7750, 90, 10),
                attack:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_01_1_ATTACK_spritesheet.png", 900, 830, 9000, 90, 10)*/
            },
            orientation
        )
    }
}

class ForestGolem extends GameElementWithFormula {
    constructor(orientation) {
        super(
            {
                idle: new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_02_1_IDLE_spritesheet.png", 700, 750, 12600, 40, 18),
                hurt:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_02_1_HURT_spritesheet.png", 700, 750, 8400, 40, 12),
                die:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_02_1_DIE_spritesheet.png", 700, 750, 10500, 40, 15)/*,
                walk:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_01_1_WALK_spritesheet.png", 775, 580, 7750, 90, 10),
                attack:new GameSprite("https://marvin.hs-bochum.de/~mneugebauer/fantasy/Golem_01_1_ATTACK_spritesheet.png", 900, 830, 9000, 90, 10)*/
            },
            orientation
        )
    }
}

class Fairy extends GameElement {
    constructor(imgsrc) {
        if(imgsrc == undefined) {
            imgsrc = "https://marvin.hs-bochum.de/~mneugebauer/fantasy/fairy.svg";
        }
        super({ idle: new GameSprite(imgsrc, 60, 60, 60) })
    }

    sendTo(targetNode) {
        //let homeNode = document.querySelector(".helper-container");
        let homeNode = this.container;
        if (targetNode == undefined) {
            targetNode = homeNode;
        }

        
        //probably the speech bubble arrows have to be removed
        /*if(targetNode.classList.contains(".fairy-place-holder")) {
            
        }*/
        let speechBubbleElements = document.querySelectorAll(".bubble");
        speechBubbleElements.forEach(function(bubble) {
            let relatedFairyPlaceHolder = bubble.parentNode.querySelector(".fairy-place-holder");
            if(relatedFairyPlaceHolder != undefined) {
                bubble.classList.remove("show-overflow");
            }
        });
        /*speechBubbleElementsWFairy.forEach(function(speechBubbleElementWFairy) {
            let relatedBubble = speechBubbleElementWFairy.closest(".bubble");
            relatedBubble.classList.add("no-arrow");
        });*/

        //console.log(targetNode);
        let helperNode = this.node;
        let fairyPlaceHolder = targetNode;
        let helpSpeechBubble = document.querySelector(".fairy-help");

        let rectHelperNode = helperNode.getBoundingClientRect();
        let rectContainer = fairyPlaceHolder.getBoundingClientRect();
        //console.log(rectContainer);
        let xoffset = rectHelperNode.x - rectContainer.x;
        let yoffset = rectHelperNode.y - rectContainer.y;
        helperNode.style.setProperty("--xoffset", Math.floor(xoffset) + "px");
        helperNode.style.setProperty("--yoffset", Math.floor(yoffset) + "px");

        //console.log(xoffset, yoffset);

        helperNode.classList.add("notifying");
        helperNode.classList.remove("returning");
        //fairyPlaceHolder.style.maxHeight = "40px";
        fairyPlaceHolder.appendChild(helperNode);
        /*helperContainer.style.left = "50%";
        helperContainer.style.bottom = "";
        helperContainer.style.position = "relative";*/

        //let exclamationContainer = document.querySelector(".helper-container .exclamation");
        let exclamationContainer = document.querySelector(".fairy-home .exclamation");
        //exclamationContainer.classList.remove("active");
        if(targetNode == homeNode) {
            exclamationContainer.classList.remove("temporarily-hidden");
        }
        else {
            exclamationContainer.classList.add("temporarily-hidden");
        }
    }

    sendBack() {
        //leaving target node empty will send fairy back to player
        this.sendTo();
    }

    isCurrentlyMoving() {
        let targetRect = this.node.parentNode.getBoundingClientRect();
        let currentRect = this.node.getBoundingClientRect();
        let diffX = targetRect.x-currentRect.x;
        let diffY = targetRect.y-currentRect.y;

        return (diffX != 0 && diffY != 0);
    }
}

function __(htmlId) {
    let toFind = document.getElementById(htmlId);
    if (!toFind) {
        console.log(htmlId + " not found with __");
    }
    return toFind;
}

function ___(htmlSelector) {
    let toFind = document.querySelector(htmlSelector);
    if (!toFind) {
        console.log(htmlSelector + " not found with ___");
    }
    return toFind;
}

function ____(htmlSelector) {
    let toFind = document.querySelectorAll(htmlSelector);
    if (!toFind) {
        console.log(htmlSelector + " not found with ____");
    }
    return toFind;
}

function hideNotificationSpeechBubble(event) {
    console.log("try to return fairy");
    if(this.introState > 0) {
        return;
    }
    if (event == undefined || (event.target.closest(".enter-spell-container") == undefined && event.target != document.querySelector(".fairy-img") && event.target.closest(".bubble") == undefined && event.target.closest(".fairy-home") == undefined && event.target.closest(".sign-post-container") == undefined && event.target != document.querySelector(".confirm-link")  && event.target.closest(".badge") == undefined)) {
        console.log("return fairy");
        //helperContainer.style.position = "absolute";
        //helperContainer.style.left = playerContainer.style.left;
        //helperContainer.style.bottom = playerContainer.style.height;

        let helperContainer = document.querySelector(".helper-container");
        let helperNode = document.querySelector(".fairy-img");
        let fairyPlaceHolder = document.querySelector(".fairy-place-holder");
        let helpSpeechBubble = document.querySelector(".fairy-help:not(.question-bubble)");
        let exclamationContainer = document.querySelector(".exclamation");

        if (helperNode == undefined) {
            console.log("no fairy here to return");
            showExclamationMarkAfterReturnAnimation();
        }
        else {
            //compute distance between container and (future) node
            let rectHelperNode = helperNode.getBoundingClientRect();
            let rectContainer = helperContainer.getBoundingClientRect();
            let xoffset = rectHelperNode.x - rectContainer.x;
            let yoffset = rectHelperNode.y - rectContainer.y;
            helperNode.style.setProperty("--xoffset", Math.floor(xoffset) + "px");
            helperNode.style.setProperty("--yoffset", Math.floor(yoffset) + "px");
            console.log(xoffset, yoffset);
            //this.GameElements.helper.sendBack();
            helperNode.classList.remove("notifying");
            helperNode.classList.add("returning");
            helperContainer.appendChild(helperNode);
            helperNode.addEventListener("animationend", showExclamationMarkAfterReturnAnimation);
        }
        helpSpeechBubble.classList.add("closed", "no-arrow");
        helpSpeechBubble.classList.remove("middle-arrow");
        helpSpeechBubble.classList.remove("show-overflow");

        fairyPlaceHolder.style.maxHeight = "0px";

        document.removeEventListener("click", hideNotificationSpeechBubble);
    }
}

function showExclamationMarkAfterReturnAnimation() {
    let exclamationContainer = document.querySelector(".fairy-home .exclamation");
    exclamationContainer.classList.remove("temporarily-hidden");
    document.querySelector(".fairy-img").removeEventListener("animationend", showExclamationMarkAfterReturnAnimation);
}

function removeFaderAfterFadingIn() {
    this.classList.remove("fade-in");
}

function proceedIntroOnClick(event) {
    console.log("Try to proceed intro on click");
    if(ALQuiz == undefined) {
        return;
    }
    if(event.target.closest(".bubble.fairy-help") == undefined && event.target.closest(".fairy-img") == undefined && event.target.closest(".badges-container") == undefined && event.target.closest(".sign-post-container.point-left") == undefined) {
        let toClick;
        event.preventDefault();
        event.stopPropagation();
        switch(ALQuiz.introState) {
            case 0:
                //do nothing
            break;
            case 1:
                toClick = document.querySelector(".fairy-img");
            break;
            default:
                toClick = document.querySelector(".bubble.fairy-help a");
            break;
        }
        if(toClick != undefined) {
            toClick.click();
        }
    }
    else {
        console.log("we are in else routine");
    }
}

function matrixTdSelect(event, node) {
    if(node == undefined) {
        node = this;
    }
    if(node == undefined) {
        console.log("undefined node in matrixTdSelect");
        return;
    }
    let matrixTableNode = node.closest(".matrixtable");
    if(matrixTableNode == undefined) {
        return;
    }
    matrixTableNode.querySelectorAll("input").forEach(function(inputElement) {
        let closestTd = inputElement.closest("td");
        closestTd.classList.remove("selected-entry");
    });
    node.classList.add("selected-entry");
    let selectedInputName = node.querySelector("input").name;
    node.closest(".enemy-container").dataset.refer = selectedInputName;
    console.log("REFER: "+node.closest(".enemy-container").dataset.refer);
}

function buildNewScene(object) {
    //console.log(this);
    //doesn't work properly., so a check function is needed document.querySelector(".fader").removeEventListener("transitionend", buildNewScene.bind(null, object));
    console.log("faded out");

    //let currQuestion = object.getQuestion();

    //rest speechbubble element
    //this.speechBubbleElement.classList.remove("no-arrow");

    /*if(object.fader.classList.contains("fade-out")) {
        //okay, reload is desired
        console.log("reload is desired");
    }*/

    if (nextQuestionQuery == undefined) {
        //do nothing, wait for the promise to resolve
        console.log("do nothing, wait for the promise to resolve");
        //show loading animation
        //...
    }
    else {
        console.log("next question is already there");
        waitingForNextQuestion = false;

        //arrange enemies etc.

        //identify input fields
        let matriceTableNames = [];
        let matriceTableInfoObjects = {};
        let matriceTables = nextQuestionQuery.querySelectorAll(".que .formulation .matrixtable");
        matriceTables.forEach(function(matriceTable) {
            let matriceTableInfoObject = {};
            matriceTableInfoObject.table = matriceTable;
            matriceTableInfoObject.tablewbrackets = matriceTable.closest(".matrixroundbrackets");
            matriceTableInfoObject.appended = false;
            //Find out shape and prepare table.
            matriceTableInfoObjects[matriceTable.id] = matriceTableInfoObject;
        });
        console.log(matriceTableNames);

        //check amount of enemies
        let inputs = nextQuestionQuery.querySelectorAll(".que .formulation input:not([type=hidden]):not([type=submit])");

        //remove all formula elements from all enemies
        /*while (object.formulaContainer.firstChild != undefined) {
            object.formulaContainer.removeChild(object.formulaContainer.firstChild);
        }*/

        /*document.querySelectorAll(".formula-container").forEach(formulaContainer => {
            while (formulaContainer.firstChild != undefined) {
                formulaContainer.removeChild(formulaContainer.firstChild);
            }
        });*/
        object.GameElements.enemies.forEach(function(Enemy) {
            Enemy.clearFormulas();
        });

        let allEnemies = document.querySelectorAll(".enemy-container");
        allEnemies.forEach(enemyContainer => {
            enemyContainer.classList.add("invisible")
            enemyContainer.removeAttribute("data-refer");
            enemyContainer.removeAttribute("data-count");
            enemyContainer.removeAttribute("data-matrixinput")
            enemyContainer.removeAttribute("data-matrixelementstosolve");
        });

        //For each input field, pick a random enemy and attach paragraph to it
        let i = 0;
        inputs.forEach(inputField => {
            let matriceId = undefined;
            let target = undefined;
            let potentialMatriceTableContainer = inputField.closest(".matrixtable");
            if(potentialMatriceTableContainer != undefined) {
                //Special handling for matrice inputs.
                //Append formula container to be targeted here.
                matriceId = potentialMatriceTableContainer.id;
                if(matriceId != undefined && matriceTableInfoObjects[matriceId] != undefined) {
                    if(matriceTableInfoObjects[matriceId].appended == true) {
                        //Append matrice to enemy.
                        target = matriceTableInfoObjects[matriceId].table.closest(".enemy-container");
                        //target = chosenEnemy;
                        target.dataset.matrixelementstosolve = parseInt(target.dataset.matrixelementstosolve)+1;
                    }
                }
            }
            
            console.log(inputField);
            if(target == undefined) {
                let allInactiveEnemies = document.querySelectorAll(".enemy-container.invisible");
                let randomEnemy = allInactiveEnemies[Math.floor(Math.random()*allInactiveEnemies.length)];

                if(randomEnemy == undefined) {
                    //console.log(allInactiveEnemies);
                    console.log("unable to choose enemy");
                    return false;
                }
                randomEnemy.classList.remove("invisible");
                console.log("invisible class is removed here for enemy");
                target = randomEnemy;
            }

            let relevantParagraph = undefined;
            if(matriceId == undefined) {
                relevantParagraph = inputField.closest("p");
            }
            else {
                if(matriceTableInfoObjects[matriceId].appended == false) {
                    relevantParagraph = matriceTableInfoObjects[matriceId].tablewbrackets == undefined ? matriceTableInfoObjects[matriceId].table : matriceTableInfoObjects[matriceId].tablewbrackets;
                    matriceTableInfoObjects[matriceId].appended = true;
                    matriceTableInfoObjects[matriceId].object = new MatrixObject(matriceId)
                    target.dataset.matrixinput = true;
                    target.dataset.count = i;
                    i++;
                    target.dataset.matrixelementstosolve = 1;
                    //Replace the whole matrices div with question mark.
                    //...
                }
            }
            //Remove or replace with question mark
            let questionMark = document.createElement("span");
            questionMark.classList.add("input-replacer");
            questionMark.innerHTML = "";
            inputField.parentNode.insertBefore(questionMark, inputField);
            inputField.style.display = "none";
            console.log("relevantParagraph2: ");
            console.log(relevantParagraph);
            if (relevantParagraph != undefined) {
                /*relevantParagraph.childNodes.forEach(function (inParagraph) {
                    randomEnemy.querySelector(".formula-container").appendChild(inParagraph);
                });*/
                target.querySelector(".formula-container").appendChild(relevantParagraph);
            }
            else {
                console.log("no formula found");
            }

            if(matriceId != undefined) {
                //Add extra field to append it.
            }

            //First enemy is the auto-targeted one. Fill input surrounding divs with math.
            if(i == 0) {
                let FirstEnemyObject;
                for(let j in object.GameElements.enemies) {
                    if(object.GameElements.enemies[j].container == target) {
                        FirstEnemyObject = object.GameElements.enemies[j];
                        break;
                    }
                }
                if(FirstEnemyObject == undefined) {
                    console.log("error in finding default enemy");
                }
                else {
                    object.targetedEnemy = FirstEnemyObject;
                    object.updateInputSurroundingMath(object);
                }
            }

            target.dataset.refer = inputField.name;
            if(matriceId == undefined) {
                target.dataset.count = i;
                i++;
            }
            else {
                let relevantTd = inputField.closest("td");
                relevantTd.addEventListener("click", matrixTdSelect);/*function() {
                    let matrixTableNode = this.closest("matrixtable");
                    if(matrixTableNode == undefined) {
                        return;
                    }
                    matrixTableNode.querySelectorAll("input").forEach(function(inputElement) {
                        let closestTd = inputElement.closest("td");
                        closestTd.classList.remove("selected-entry");
                    });
                    this.classList.add("selected-entry");
                    let selectedInputName = this.querySelector("input").name;
                    this.closest(".enemy-container").dataset.refer = selectedInputName;
                    console.log("REFER: "+this.closest(".enemy-container").dataset.refer);
                };*/
            }
        });
        //just to go for sure: remove invisible-class again (in some rare moments, enemies stayed invisible for unknown reasons)
        document.querySelectorAll(".enemy-container[data-refer]").forEach(function(enemyContainer) {
            enemyContainer.classList.remove("invisible");
        });

        //Parse question text into speech bubble.
        let questionContent = nextQuestionQuery.querySelector(".formulation");
        if (questionContent == undefined) {
            console.log("no question content in query found");
            return;
        }
        questionContent.querySelectorAll("input, .im-controls, .stackinputfeedback").forEach(function (nodeToRemove) {
            //nodeToRemove.parentNode.removeChild(nodeToRemove);
            nodeToRemove.style.display = "none";
        });

        let hintNodes = [];
        questionContent.querySelectorAll(".hint").forEach(function (hintNode) {
            //nodeToRemove.parentNode.removeChild(nodeToRemove);
            hintNodes.push(hintNode);
        });
        //console.log(questionContent.innerHTML, questionContent);
        object.processNotification(questionContent.innerHTML, false, object.questionBubbleElement);

        //and add new on his representation
        //old version: all possible
        /*let formulas = nextQuestionQuery.querySelectorAll(".nolink");
        formulas.forEach(function(formula) {
            let plainDiv = document.createElement("div");
            plainDiv.appendChild(formula);
            object.formulaContainer.appendChild(plainDiv);
        });*/

        //new version: only one
        //try to find relevant quantity
        /*let inputField = nextQuestionQuery.querySelector("input.algebraic, textarea");
        //console.log(inputField);
        //expect input field to be embedded in a paragraph
        let relevantParagraph = inputField.closest("p");
        //console.log(relevantParagraph);
        //Remove or replace with question mark
        let questionMark = document.createElement("span");
        questionMark.innerHTML = "?";
        inputField.parentNode.insertBefore(questionMark, inputField);
        inputField.style.display = "none";
        if (relevantParagraph != undefined) {
            relevantParagraph.childNodes.forEach(function (inParagraph) {
                object.formulaContainer.appendChild(inParagraph);
            });
        }
        else {
            console.log("no formula found");
        }*/

        object.rearrangeMath()
        
        /*formula.classList.add("chosen_formula");
        formula.style.position = "absolute";
        formula.style.top = "50%";
        formula.style.left = "50%";
        formula.style.backgroundColor = "rgba(255,255,255,0.9)";
        formula.style.borderRadius = "10%";
        formula.style.transform = "translate(-50%, -50%)";
        formula.style.padding = "5px";
        console.log(formula);*/

        //this.notificationBubbleElement.style.display = "block";

        //battleGround.appendChild(validation);
        //battleGround.appendChild(Enemy.container);
        //battleGround.appendChild(object.speechBubbleElement);

        //questionContainer.appendChild(object.enterSpellContainer);
        //object.updateValidationTimerId = setInterval(object.updateValidation, 1500, object);

        //object.GameElements.enemy.container.appendChild(formula);

        /*document.querySelectorAll(".sign-post-container").forEach(function(signPostContainer) {
            signPostContainer.style.display="none";
        });*/

        //Is safe place? If yes: Adjust overall object display (block/none) with .city CSS class.
        let contentElement = document.querySelector(".que .content");
        contentElement.classList.remove("city");
        contentElement.classList.remove("clearing");

        //Handle completely solved questions differently.

        let currQuestion = object.getQuestion();
        if(!!currQuestion) {
            object.fairyFollowSignPost.querySelector(".fairy-representation").style.filter = currQuestion.filter;
        }
        let completelySolved = (currQuestion.variants == currQuestion.solvedVariants.length);

        object.pseudoEverythingBackToStart();
        object.fader.addEventListener("transitionend", function() {
            object.GameElements.helper.node.classList.add("notifying");
            object.animateMonsterAnalysis(completelySolved, hintNodes);
        }, {once:true});
        object.fadeSceneIn();

        if(completelySolved == true) {
            object.monstersCamp.classList.add("solved");
        }
    }
}

//////////////////////////////MAIN ROUTINE/////////////////////////////////////////
//nextQuestionQuery: Global var that contains information about the next question. It helps to check, whether the promise, that fetches the next question, is already resolved. If it is undefined, the next question wasn't yet fetched. If it contains a question, the next scene can be filled with the contained information.
var nextQuestionQuery;

var testVar;

//videoAnimation: Global var, boolean, if true, interactions are blocked, so that a currently running animation can't be interrupted and gains the total attention of the user.
var videoAnimation;

//waitingForNextQuestion: Global var, boolean, that tells, whether the new scene can already be parsed, when the fader transition ended, because we are not waiting, or if we should keep the screen black and wait for the promise to be resolved.
var waitingForNextQuestion;

//inOtherTheme: Global var, boolean. If not in BO theme, classic is assumed. Some things have to be handled differently.
var inOtherTheme;

//IDEA (is currently handled in FantasyQuiz::init()): initialLoad: Global var, boolean, is true on new page load and set to false after all initial processes are done, especially loading save state from first question.
//var initialLoad = true;

//solved: Array, that consists of the solved exercises-
/*let solvedQuestionsAsString = sessionStorage.getItem("solved");
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
}*/

/*let ALQuiz = new FantasyQuiz();
let Parser = new DOMParser();
let quizObject = ALQuiz;

//let navBlock = __("mod_quiz_navblock");


//Current version includes questions from first element.
document.addEventListener("DOMContentLoaded", function() {
    let linkToLastQuizItem = ___("#mod_quiz_navblock a:last-child");
    if(linkToLastQuizItem != undefined && linkToLastQuizItem.href != undefined) {
        //console.log(linkToLastQuizItem.href)
    }
    else {
        //throw clean error
        return;
    }
    fetch(linkToLastQuizItem.href).then(function(response) {
        return response.text();
    })
    .then(function(htmlText) {

        let regexresult = htmlText.match(/class=".*?qtext.*?">([\d\D]*?)<\/div>/);
        if(!regexresult) {
            //throw clean error
            return false;
        }
        let firstBrace = regexresult[0].indexOf('{');
        let lastBrace = regexresult[0].lastIndexOf('}');

        let jsonString = regexresult[0].slice(firstBrace, lastBrace+1);

        let quizObject = JSON.parse(jsonString);
        ALQuiz = new FantasyQuiz(quizObject);

        //console.log(JSON.parse(jsonString));
        //If everything went fine up to here, the last element of the quiz contained the configuration and is to be hidden.
        linkToLastQuizItem.style.display = "none";

        ALQuiz.updateNavigation();

        //implement fantasy
        ALQuiz.init();

        return true;
    });
});*/
//setTimeout(function() { }, 500);