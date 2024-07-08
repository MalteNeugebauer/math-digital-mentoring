//Include chart library previously by script tag.

//console.log(quizzes_overview_url);
class LA_LMS_Analyzer {
    constructor(options) {

        this.Quizzes = [];
        this.Language;
        this.predictionStartAnalysisButtonContainer;
        this.loadOverviewButtonContainer;
        this.selectionTraining;
        this.selectionPrediction;
        this.selectionOverview;
        this.test;
        this.storage_object = {};
        this.Parser;

        this.Language = German;
        /*if(options.lang != undefined) {
            if(typeof options.lang == "string") {
                switch(options.lang) {
                    case "en":
                        this.Language = English;
                        break;
                    case "de":
                    default:
                        this.Language = German;
                }
            }
            else if(options.lang instanceOf LanguagePack) {
                this.Language = options.lang;
            }
            else {
                this.Language = German;
            }
        }*/

        this.LALMSVisualizer = new LA_LMS_Visualizer(this.Language);

        if(options.url != undefined) {
            this.url = options.url;
        }
        else {
            this.url = window.location.href;
        }
        if(this.url == undefined) {
            //error 1
            return;
        }

        if(options.Parser != undefined) {
            this.Parser = options.Parser;
        }
        else {
            this.Parser = new DOMParser();
        }
        if(this.Parser == undefined) {
            //error 4
            return;
        }

        let course_id_match = this.url.match(/id=(.*?)(?:$|[\&])/);
        if(course_id_match == null || course_id_match[1] == "") {
            //error 2
            return;
        }
        this.course_id = course_id_match[1];

        let base_url = window.location.origin;
        if(base_url == undefined || base_url == "") {
            //error 3
            return;
        }
        this.base_url = base_url;

        let quizzes_overview_url = base_url + "/mod/quiz/index.php?id="+this.course_id;

        fetch(quizzes_overview_url).then(response => {
            return response.text();
        })
        .then(response_text => {
            let fetchedDocumentNode = Parser.parseFromString(response_text, "text/html");
            //console.log(documentNode);

            //Get column number identifier of that column, that contains the names and the attempts.
            let quiz_table = fetchedDocumentNode.querySelector("[role=main] table");
            //"[role=main] .generaltable" could also be a good choice
            if(quiz_table == undefined) {
                //error 5
                return;
            }
            this.quiz_table = quiz_table;
            let name_col_identifier = this.getColIdentifierFromHeaderText("Name");
            if(!name_col_identifier) {
                //error 6/7
                return;
            }
            let attempts_col_identifier = this.getColIdentifierFromHeaderText(["Attempts", "Versuche"]);
            if(!attempts_col_identifier) {
                //error 6/7
                return;
            }
            
            //Loop through rows and extract name and attempts url information.
            let rows = this.quiz_table.querySelectorAll("tr");
            for(let i=0;i<rows.length;i++) {
                let quiz_name_node = rows[i].querySelector("td."+name_col_identifier+" a");
                if(quiz_name_node == undefined || quiz_name_node.innerHTML == "") {
                    //error 8
                    console.log("error8");
                    continue;
                }
                let quiz_name = quiz_name_node.innerHTML;

                let attempts_node = rows[i].querySelector("td."+attempts_col_identifier+" a");
                if(attempts_node == undefined || attempts_node.href == "") {
                    //error 9
                    console.log("error9");
                    continue;
                }
                let attempts_url = attempts_node.href;
                if(attempts_url == undefined) {
                    continue;
                }
                
                let quiz_id_match = attempts_url.match(/id=(.*?)(?:$|[\&])/);
                if(quiz_id_match == null || quiz_id_match[1] == "") {
                    //error 10
                    continue;
                }
                let quiz_id = quiz_id_match[1];

                this.Quizzes.push(new Quiz(quiz_name, quiz_id, attempts_url));
            }

            let quizObject = {}
            for(let i=0;i<this.Quizzes.length;i++) {
                quizObject[this.Quizzes[i].id] = this.Quizzes[i].name;
            }

            //--------------VISUALIZATIONS------------------------------------
            //Visualizations: For multiple options
            let quizzesAmountBlock = this.LALMSVisualizer.addBlock(this.Language.get("quizzes_overview", this.Quizzes.length));
            quizzesAmountBlock.classList.add("menu", "menu_prediction", "menu_quiz_overview", "inactive");


            //Visualizations: Prediction--------------------------------------

            let choose_block = this.LALMSVisualizer.addBlock(this.Language.get("quizzes_choose_prediction"));
            choose_block.classList.add("menu", "menu_prediction", "inactive");

            choose_block.appendChild(this.LALMSVisualizer.createMoveableMultiSelect(quizObject, 2, "quiz_list", "training_list", this.Language.get("train_with"), "prediction_list", this.Language.get("prediction_of")));
            this.selectionTraining = this.LALMSVisualizer.documentNode.getElementById("training_list");
            this.selectionPrediction = this.LALMSVisualizer.documentNode.getElementById("prediction_list");

            let showOptionsButtonContainer = this.LALMSVisualizer.documentNode.createElement("div");
            let showOptionsButton = this.LALMSVisualizer.documentNode.createElement("button");
            //Moodle specific styles
            showOptionsButton.classList.add("btn", "btn-primary");

            let showOptionsTextNode = this.LALMSVisualizer.documentNode.createElement("div");
            showOptionsTextNode.classList.add("default-text");
            showOptionsTextNode.innerHTML = this.Language.get("show_options");
            let showOptionsAltNode = this.LALMSVisualizer.documentNode.createElement("div");
            showOptionsAltNode.classList.add("alt-text");
            showOptionsAltNode.innerHTML = this.Language.get("hide_options");

            showOptionsButton.appendChild(showOptionsTextNode);
            showOptionsButton.appendChild(showOptionsAltNode);

            let optionsDiv = this.LALMSVisualizer.documentNode.createElement("div");
            optionsDiv.classList.add("prediction-options")
            optionsDiv.innerHTML = "<label for=\"percentage_breakpoint\">"+this.Language.get("breakpoint")+"</label><input type=\"number\" min=\"1\" max=\"100\" id=\"percentage_breakpoint\" name=\"percentage_breakpoint\" value=\"80\" /><label for=\"num_trees\">"+this.Language.get("num_trees")+"</label><input type=\"number\" min=\"1\" id=\"percentage_breakpoint\" id=\"num_trees\" name=\"num_trees\" value=\"10\">";

            showOptionsButton.onclick = function() {
                this.classList.toggle("active");
                optionsDiv.classList.toggle("active");
            };

            showOptionsButtonContainer.appendChild(showOptionsButton);

            let startAnalysisButtonContainer = this.LALMSVisualizer.getStartAnalysisButtonContainer(this.rollQuizSuccessPrediction.bind(this));
            this.predictionStartAnalysisButtonContainer = startAnalysisButtonContainer;

            let startButtonDiv = this.LALMSVisualizer.documentNode.createElement("div");
            startButtonDiv.style.textAlign = "center";
            startButtonDiv.style.padding = "5px";

            startButtonDiv.appendChild(showOptionsButtonContainer);
            startButtonDiv.appendChild(optionsDiv);
            startButtonDiv.appendChild(startAnalysisButtonContainer);

            choose_block.appendChild(startButtonDiv);

            /*this.startAnalysisButton = startAnalysisButtonContainer.querySelector("button");
            if(!this.startAnalysisButton) {
                console.log("Error: No button to start analysis found.");
            }
            this.startAnalysisButton.onclick = this.rollQuizSuccessPrediction.bind(this);*/

            //----------------------------------------------------------------

            //Visualizations: Quiz Dashboard----------------------------------
            let choose_block_overview = this.LALMSVisualizer.addBlock(this.Language.get("quizzes_choose_overview"));
            choose_block_overview.classList.add("menu", "menu_quiz_overview", "inactive");

            let main_select = this.LALMSVisualizer.documentNode.createElement("select");
            main_select.classList.add("main-select");
            main_select.id = "quiz_overview_select";
            main_select.name = main_select.id;
            this.selectionOverview = main_select;

            for(let key in quizObject) {
                let option = this.LALMSVisualizer.documentNode.createElement("option");
                option.value = key;
                option.innerHTML = quizObject[key];
                main_select.appendChild(option);
            }

            

            let loadOverviewButtonContainer = this.LALMSVisualizer.getStartAnalysisButtonContainer(this.rollQuizOverviewInterface.bind(this), "start_overview_load", "load_overview_running");
            this.loadOverviewButtonContainer = loadOverviewButtonContainer;

            let overviewButtonsDiv = this.LALMSVisualizer.documentNode.createElement("div");
            overviewButtonsDiv.style.textAlign = "center";
            overviewButtonsDiv.style.padding = "5px";
            overviewButtonsDiv.appendChild(loadOverviewButtonContainer);

            choose_block_overview.appendChild(main_select);
            choose_block_overview.appendChild(overviewButtonsDiv);
        })
        .catch(error => {
            console.log("Error in promise chain.")
            console.log(error);
        });
    }

    async rollQuizSuccessPrediction() {
        console.log("start quiz success prediction routine");
        let startAnalysisButton = this.predictionStartAnalysisButtonContainer.querySelector("button");
        if(!!startAnalysisButton) {
            startAnalysisButton.classList.add("load");
            startAnalysisButton.disabled = "disabled";
        }

        let loadingBlock = this.LALMSVisualizer.addLoadingBlock();
        loadingBlock.classList.add("loading-info-block");

        let quizIdsForTraining = [...this.selectionTraining.options].map(function(optionElement) { return optionElement.value; });
        let quizIdsToPredict = [...this.selectionPrediction.options].map(function(optionElement) { return optionElement.value; });
        //console.log(quizIdsToPredict);

        //Download data. Start with JSON.
        // for(let i=0;i<quizIdsForTraining.length;i++) {
        //     let urlToFetch = "";
        //     for(let j=0;j<this.Quizzes.length;j++) {
        //         if(this.Quizzes[j].id == quizIdsForTraining[i]) {
        //             urlToFetch = this.Quizzes[j].attempts_url;
        //             break;
        //         }
        //     }
        //     if(urlToFetch == undefined || urlToFetch == "") {
        //         //error 12
        //         console.log("error 12");
        //         continue;
        //     }            
        // }

        //console.log(quizIdsForTraining);
        //console.log(quizIdsToPredict);
        let infoNodesTrainData = this.LALMSVisualizer.createInfoNode(this.Language.get("load_data", 0, quizIdsForTraining.length));
        infoNodesTrainData.prefix.innerHTML = this.Language.get("training")+": ";
        loadingBlock.appendChild(infoNodesTrainData.container);
        infoNodesTrainData.main.scrollIntoView({behavior:"smooth"});
        let rawDataTraining = {};
        await this.downloadQuizDataChain(quizIdsForTraining, 0, infoNodesTrainData.main, infoNodesTrainData.suffix, rawDataTraining);
        //console.log(rawDataTraining);

        let infoNodesPredictData = this.LALMSVisualizer.createInfoNode(this.Language.get("load_data", 0, quizIdsToPredict.length));
        infoNodesPredictData.prefix.innerHTML = this.Language.get("prediction")+": ";
        loadingBlock.appendChild(infoNodesPredictData.container);
        infoNodesPredictData.main.scrollIntoView({behavior:"smooth"});
        let rawDataPrediction = {};
        await this.downloadQuizDataChain(quizIdsToPredict, 0, infoNodesPredictData.main, infoNodesPredictData.suffix, rawDataPrediction);

        let label_condition_percentage = 0.8;
        let label_condition_percentage_input = this.LALMSVisualizer.documentNode.getElementById("percentage_breakpoint");
        if(label_condition_percentage_input != undefined && label_condition_percentage_input.value != undefined && label_condition_percentage_input.value != "") {
            label_condition_percentage = parseFloat(label_condition_percentage_input.value.replace(",", "."))/100;
            if(label_condition_percentage < .01) {
                label_condition_percentage = .01;
            }
            else if(label_condition_percentage > 1) {
                label_condition_percentage = 1;
            }
        }

        let num_trees = 4;
        let num_trees_input = this.LALMSVisualizer.documentNode.getElementById("num_trees");
        if(num_trees_input != undefined && num_trees_input.value != undefined && num_trees_input.value != "") {
            if(num_trees_input.value < 1) {
                num_trees = 1;
            }
            else {
                num_trees = parseInt(num_trees_input.value);
            }
        }

        let sanitizedData = this.preprocessData(rawDataTraining, rawDataPrediction, label_condition_percentage);
        //console.log(sanitizedData);

        let split_data = this.train_test_split(sanitizedData);
        //console.log(split_data);

        //split_data to array
        let data = {};
        for(let purpose in split_data) {
            data[purpose] = {values:[], labels:[]};
            for(let user_id in split_data[purpose]) {
                data[purpose].values.push(split_data[purpose][user_id].values);
                data[purpose].labels.push(split_data[purpose][user_id].label);
            }
        }
        console.log(data);

        
        let Forest = new forestjs.RandomForest();
        //Even for random labels the algorihm gives a prediction probability of greater than 1. Why?
        /*let random_array = [];
        for(let i=0;i<data.train.values.length;i++) {
            random_array.push(Math.random() > 0.5 ? 1 : -1);
        }*/

        let infoNodesCalculate = this.LALMSVisualizer.createInfoNode(this.Language.get("calculate", "Random Forest"));
        loadingBlock.appendChild(infoNodesCalculate.container);
        infoNodesCalculate.suffix.innerHTML = "...";

        let options = {};
        options.numTrees = num_trees;
        options.maxDepth = 4;
        options.numTries = 10;
        //options.type = 1; choose this for weak learning
        Forest.train(data.train.values, /*random_array*/data.train.labels, options);
        /*for(let i=0;i</*data.test.values*/5/*;i++) {
            let probability = Forest.predictOne(data.test.values[i]);
            console.log("Probability of "+probability+" to predict "+data.test.labels[i]);
            console.log(probability);
        }*/
        
        let probabilities = Forest.predict(data.test.values);
        let right_positive = 0;
        let right_negative = 0;
        let false_positive = 0;
        let false_negative = 0;
        let error = 0;
        for(let i=0;i<probabilities.length;i++) {
            switch((probabilities[i] > 0.5 ? 1 : -1)+","+data.test.labels[i]) {
                case "1,1":
                    right_positive++;
                break;
                case "-1,-1":
                    right_negative++;
                break;
                case "1,-1":
                    false_positive++;
                break;
                case "-1,1":
                    false_negative++;
                break;
                default:
                    error++;
                break;
            }
        }
        console.log("Right positive: "+right_positive+" ("+right_positive/probabilities.length+"%)");
        console.log("Right negative: "+right_negative+" ("+right_negative/probabilities.length+"%)");
        console.log("False positive: "+false_positive+" ("+false_positive/probabilities.length+"%)");
        console.log("False negative: "+false_negative+" ("+false_negative/probabilities.length+"%)");
        console.log("Errors: "+error+" ("+error/probabilities.length+"%)");

        let accuracy = (right_positive+right_negative)/probabilities.length;
        console.log("Accuracy: "+accuracy);

        infoNodesCalculate.suffix.innerHTML = " &mdash; "+this.Language.get("finished");

        if(!!startAnalysisButton) {
            startAnalysisButton.classList.remove("load");
            startAnalysisButton.disabled = undefined;
        }
        loadingBlock.parentNode.removeChild(loadingBlock);

        let resultBlock = this.LALMSVisualizer.addBlock("<p>"+this.Language.get("student_amount", Object.keys(sanitizedData).length)+"</p><p>"+this.Language.get("accuracy_is", (accuracy*100).toFixed(2)+"%")+"</p>");
        resultBlock.classList.add("menu", "menu_prediction");
        let confusionMatrix = this.LALMSVisualizer.documentNode.createElement("table");
        confusionMatrix.classList.add("confusion-matrix");
        let rows = [];
        let cells = [];
        for(let i=0;i<4;i++) {
            rows[i] = this.LALMSVisualizer.documentNode.createElement("tr");
            for(let j=0;j<4;j++) {
                let tag = "td";
                if(j<2 || i>=2) {
                    tag = "th";
                }
                cells[4*i+j] = this.LALMSVisualizer.documentNode.createElement(tag);
                rows[i].appendChild(cells[4*i+j]);
            }
            confusionMatrix.appendChild(rows[i]);
        }
        
        cells[0].innerHTML = "";
        cells[1].innerHTML = 1;
        cells[2].innerHTML = (right_positive/probabilities.length).toFixed(2);
        cells[3].innerHTML = (false_negative/probabilities.length).toFixed(2);

        cells[4].innerHTML = this.Language.get("real");
        cells[5].innerHTML = -1;
        cells[6].innerHTML = (false_positive/probabilities.length).toFixed(2);
        cells[7].innerHTML = (right_negative/probabilities.length).toFixed(2);

        cells[8].innerHTML = "";
        cells[9].innerHTML = "";
        cells[10].innerHTML = 1;
        cells[11].innerHTML = -1;

        cells[12].innerHTML = "";
        cells[13].innerHTML = "";
        cells[14].innerHTML = this.Language.get("predicted");;
        cells[15].innerHTML = "";

        resultBlock.appendChild(confusionMatrix);

        //Following line: Emergency re-enable start button.
        setTimeout(function() { if(!!startAnalysisButton) { startAnalysisButton.classList.remove("load"); startAnalysisButton.disabled = undefined; } if(loadingBlock != undefined && loadingBlock.parentNode != undefined) { loadingBlock.parentNode.removeChild(loadingBlock); } }, 120000);
    }

    async rollQuizOverviewInterface() {
        console.log("start");

        let startAnalysisButton = this.loadOverviewButtonContainer.querySelector("button");
        if(!!startAnalysisButton) {
            startAnalysisButton.classList.add("load");
            startAnalysisButton.disabled = "disabled";
        }

        let selectedQuizId = this.selectionOverview.value;
        
        if(!selectedQuizId) {
            //User error handling.
            //...
            throw new Error("Bad quiz id 1 (none selected).");
        }

        let urlToFetch;
        for(let j=0;j<this.Quizzes.length;j++) {
            if(this.Quizzes[j].id == selectedQuizId) {
                urlToFetch = this.Quizzes[j].attempts_url;
                break;
            }
        }

        let QuizOverviewAnalyzer = new Quiz_Overview_Analyzer(selectedQuizId);
        console.log(QuizOverviewAnalyzer);
        await QuizOverviewAnalyzer.init(urlToFetch).then(response => {
            return QuizOverviewAnalyzer.loadUsers();
            //return QuizOverviewAnalyzer.loadUsers(0,5);
        }).then(loadResult => {
            console.log("Fully loaded?");
            QuizOverviewAnalyzer.getFetchState();

            for(let id in QuizOverviewAnalyzer.Users) {
                QuizOverviewAnalyzer.Users[id].sanitizeAttempts(true, true, true, true, true, true, true);
            }
        });

        //Some information to test
        let infoObject = {};
        infoObject.userAmount = Object.keys(QuizOverviewAnalyzer.Users).length;
        infoObject.attemptsAmount = 0;
        for(let ukey in QuizOverviewAnalyzer.Users) {
            infoObject.attemptsAmount += QuizOverviewAnalyzer.Users[ukey].QuestionAttempts.length;
        }
        let questionRepetitionsByQuestion = {};
        let questionAttemptsByQuestion = {};
        for(let qkey in QuizOverviewAnalyzer.quizObject.questions) {
            questionRepetitionsByQuestion[qkey] = 0;
            questionAttemptsByQuestion[qkey] = 0;
            for(let ukey in QuizOverviewAnalyzer.Users) {
                let RelevantQuestionAttempts = QuizOverviewAnalyzer.Users[ukey].QuestionAttempts.filter(QuestionAttempt => { return QuestionAttempt.questionId == qkey });
                questionAttemptsByQuestion[qkey] += RelevantQuestionAttempts.length;
                questionRepetitionsByQuestion[qkey] += (RelevantQuestionAttempts.length-1 > 0 ? RelevantQuestionAttempts.length-1 : 0);
            }
        }
        infoObject.repetitions = questionRepetitionsByQuestion;
        infoObject.attemptAmounts = questionAttemptsByQuestion;
        console.log(infoObject);

        //Transition calculations.
        let transition_metric = {};
        let states = ["w", "c", "p"];
        let types = ["overall", "sequential", "non_sequential", "repetition", "finish"];
        types.forEach(function(type) {
            states.forEach(function(state) {
                transition_metric[type+"_"+state] = 0;
            });
        });

        let questionIdsSorted = Object.keys(QuizOverviewAnalyzer.quizObject.questions);
        questionIdsSorted.push("_finish");

        for(let ukey in QuizOverviewAnalyzer.Users) {
            for(let akey in QuizOverviewAnalyzer.Users[ukey].QuestionAttempts) {
                let state = states[QuizOverviewAnalyzer.Users[ukey].QuestionAttempts[akey].outcome_as_int];
                if(state == undefined) {
                    console.log("unhandled state found here: "+state+"-"+states[state]);
                    console.log(QuizOverviewAnalyzer.Users[ukey].QuestionAttempts[akey]);
                    console.log(QuizOverviewAnalyzer.Users[ukey]);
                }
                let type = undefined;

                //Always add one overall movement.
                transition_metric["overall_"+state] += 1;

                let curPos = questionIdsSorted.indexOf(QuizOverviewAnalyzer.Users[ukey].QuestionAttempts[akey].questionId);
                let nextPos = questionIdsSorted.indexOf(QuizOverviewAnalyzer.Users[ukey].QuestionAttempts[akey].next_questionId);

                if(curPos == -1 || nextPos == -1) {
                    console.log("Bad position detected: From "+QuizOverviewAnalyzer.Users[ukey].QuestionAttempts[akey].questionId+" to "+QuizOverviewAnalyzer.Users[ukey].QuestionAttempts[akey].next_questionId);
                    continue;
                }

                if(curPos == nextPos) {
                    type = "repetition";
                }
                else if(nextPos >= questionIdsSorted.length-1) {
                    type = "finish";
                }
                else if(curPos+1 == nextPos) {
                    type = "sequential";
                }
                else {
                    type = "non_sequential";
                }

                transition_metric[type+"_"+state] += 1;
            }
        }

        console.log(transition_metric);

        let resultBlock = this.LALMSVisualizer.addBlock();
        resultBlock.classList.add("menu", "menu_quiz_overview");

        let chartsParent = this.LALMSVisualizer.documentNode.createElement("div");
        chartsParent.classList.add("lalmsviz-charts-parent");

        let chart = this.LALMSVisualizer.documentNode.createElement("div");
        chart.classList.add("lalmsviz-chart-tile");

        let repetitionChart = chart.cloneNode(true);
        repetitionChart.id = "jxg_chart_attempt_amounts";
        repetitionChart.classList.add("jxg_chart_attempt_amounts");

        // Alternative structuring below - may be more responsive.
        // let repetitionChart = chart.cloneNode(true);
        // let repetitionChartJXGContainer = this.LALMSVisualizer.documentNode.createElement("div");

        // repetitionChartJXGContainer.id = "jxg_chart_attempt_amounts";
        // repetitionChartJXGContainer.classList.add("jxg_chart_attempt_amounts");
        // repetitionChart.appendChild(repetitionChartJXGContainer)

        let transitionsChart = chart.cloneNode(true);

        chartsParent.appendChild(transitionsChart);
        chartsParent.appendChild(repetitionChart);
        resultBlock.appendChild(chartsParent);

        //let transitionsChartSVG = this.LALMSVisualizer.documentNode.createElement("svg");
        //removed in svg options: width="112.563pt" height="70.055pt"
        transitionsChart.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 112.563 70.055" version="1.1"><defs><g><symbol overflow="visible" id="glyph0-0"><path style="stroke:none;" d=""/></symbol><symbol overflow="visible" id="glyph0-1" class="transit-chart-node node-t"><path style="stroke:none;" d="M 6.640625 -6.75 L 0.546875 -6.75 L 0.359375 -4.5 L 0.609375 -4.5 C 0.75 -6.109375 0.890625 -6.4375 2.40625 -6.4375 C 2.578125 -6.4375 2.84375 -6.4375 2.9375 -6.421875 C 3.15625 -6.375 3.15625 -6.265625 3.15625 -6.046875 L 3.15625 -0.78125 C 3.15625 -0.453125 3.15625 -0.3125 2.109375 -0.3125 L 1.703125 -0.3125 L 1.703125 0 C 2.109375 -0.03125 3.125 -0.03125 3.59375 -0.03125 C 4.046875 -0.03125 5.078125 -0.03125 5.484375 0 L 5.484375 -0.3125 L 5.078125 -0.3125 C 4.03125 -0.3125 4.03125 -0.453125 4.03125 -0.78125 L 4.03125 -6.046875 C 4.03125 -6.234375 4.03125 -6.375 4.21875 -6.421875 C 4.328125 -6.4375 4.59375 -6.4375 4.78125 -6.4375 C 6.296875 -6.4375 6.4375 -6.109375 6.578125 -4.5 L 6.828125 -4.5 Z M 6.640625 -6.75 "/></symbol><symbol overflow="visible" id="glyph0-2" class="transit-chart-node node-r"><path style="stroke:none;" d="M 2.234375 -3.515625 L 2.234375 -6.09375 C 2.234375 -6.328125 2.234375 -6.453125 2.453125 -6.484375 C 2.546875 -6.5 2.84375 -6.5 3.046875 -6.5 C 3.9375 -6.5 5.046875 -6.453125 5.046875 -5.015625 C 5.046875 -4.328125 4.8125 -3.515625 3.34375 -3.515625 Z M 4.34375 -3.390625 C 5.296875 -3.625 6.078125 -4.234375 6.078125 -5.015625 C 6.078125 -5.96875 4.9375 -6.8125 3.484375 -6.8125 L 0.34375 -6.8125 L 0.34375 -6.5 L 0.59375 -6.5 C 1.359375 -6.5 1.375 -6.390625 1.375 -6.03125 L 1.375 -0.78125 C 1.375 -0.421875 1.359375 -0.3125 0.59375 -0.3125 L 0.34375 -0.3125 L 0.34375 0 C 0.703125 -0.03125 1.421875 -0.03125 1.796875 -0.03125 C 2.1875 -0.03125 2.90625 -0.03125 3.265625 0 L 3.265625 -0.3125 L 3.015625 -0.3125 C 2.25 -0.3125 2.234375 -0.421875 2.234375 -0.78125 L 2.234375 -3.296875 L 3.375 -3.296875 C 3.53125 -3.296875 3.953125 -3.296875 4.3125 -2.953125 C 4.6875 -2.609375 4.6875 -2.296875 4.6875 -1.625 C 4.6875 -0.984375 4.6875 -0.578125 5.09375 -0.203125 C 5.5 0.15625 6.046875 0.21875 6.34375 0.21875 C 7.125 0.21875 7.296875 -0.59375 7.296875 -0.875 C 7.296875 -0.9375 7.296875 -1.046875 7.171875 -1.046875 C 7.0625 -1.046875 7.0625 -0.953125 7.046875 -0.890625 C 6.984375 -0.171875 6.640625 0 6.390625 0 C 5.90625 0 5.828125 -0.515625 5.6875 -1.4375 L 5.546875 -2.234375 C 5.375 -2.875 4.890625 -3.203125 4.34375 -3.390625 Z M 4.34375 -3.390625 "/></symbol><symbol overflow="visible" id="glyph0-3" class="transit-chart-node node-c"><path style="stroke:none;" d="M 1.171875 -2.171875 C 1.171875 -3.796875 1.984375 -4.21875 2.515625 -4.21875 C 2.609375 -4.21875 3.234375 -4.203125 3.578125 -3.84375 C 3.171875 -3.8125 3.109375 -3.515625 3.109375 -3.390625 C 3.109375 -3.125 3.296875 -2.9375 3.5625 -2.9375 C 3.828125 -2.9375 4.03125 -3.09375 4.03125 -3.40625 C 4.03125 -4.078125 3.265625 -4.46875 2.5 -4.46875 C 1.25 -4.46875 0.34375 -3.390625 0.34375 -2.15625 C 0.34375 -0.875 1.328125 0.109375 2.484375 0.109375 C 3.8125 0.109375 4.140625 -1.09375 4.140625 -1.1875 C 4.140625 -1.28125 4.03125 -1.28125 4 -1.28125 C 3.921875 -1.28125 3.890625 -1.25 3.875 -1.1875 C 3.59375 -0.265625 2.9375 -0.140625 2.578125 -0.140625 C 2.046875 -0.140625 1.171875 -0.5625 1.171875 -2.171875 Z M 1.171875 -2.171875 "/></symbol><symbol overflow="visible" id="glyph0-4" class="transit-chart-node node-p"><path style="stroke:none;" d="M 1.71875 -3.75 L 1.71875 -4.40625 L 0.28125 -4.296875 L 0.28125 -3.984375 C 0.984375 -3.984375 1.0625 -3.921875 1.0625 -3.484375 L 1.0625 1.171875 C 1.0625 1.625 0.953125 1.625 0.28125 1.625 L 0.28125 1.9375 C 0.625 1.921875 1.140625 1.90625 1.390625 1.90625 C 1.671875 1.90625 2.171875 1.921875 2.515625 1.9375 L 2.515625 1.625 C 1.859375 1.625 1.75 1.625 1.75 1.171875 L 1.75 -0.59375 C 1.796875 -0.421875 2.21875 0.109375 2.96875 0.109375 C 4.15625 0.109375 5.1875 -0.875 5.1875 -2.15625 C 5.1875 -3.421875 4.234375 -4.40625 3.109375 -4.40625 C 2.328125 -4.40625 1.90625 -3.96875 1.71875 -3.75 Z M 1.75 -1.140625 L 1.75 -3.359375 C 2.03125 -3.875 2.515625 -4.15625 3.03125 -4.15625 C 3.765625 -4.15625 4.359375 -3.28125 4.359375 -2.15625 C 4.359375 -0.953125 3.671875 -0.109375 2.9375 -0.109375 C 2.53125 -0.109375 2.15625 -0.3125 1.890625 -0.71875 C 1.75 -0.921875 1.75 -0.9375 1.75 -1.140625 Z M 1.75 -1.140625 "/></symbol><symbol overflow="visible" id="glyph0-5" class="transit-chart-node node-w"><path style="stroke:none;" d="M 6.171875 -3.34375 C 6.34375 -3.84375 6.65625 -3.984375 7.015625 -3.984375 L 7.015625 -4.296875 C 6.78125 -4.28125 6.5 -4.265625 6.28125 -4.265625 C 5.984375 -4.265625 5.546875 -4.28125 5.359375 -4.296875 L 5.359375 -3.984375 C 5.71875 -3.984375 5.9375 -3.796875 5.9375 -3.515625 C 5.9375 -3.453125 5.9375 -3.421875 5.875 -3.296875 L 4.96875 -0.75 L 3.984375 -3.53125 C 3.953125 -3.65625 3.9375 -3.671875 3.9375 -3.71875 C 3.9375 -3.984375 4.328125 -3.984375 4.53125 -3.984375 L 4.53125 -4.296875 C 4.234375 -4.28125 3.734375 -4.265625 3.484375 -4.265625 C 3.1875 -4.265625 2.90625 -4.28125 2.609375 -4.296875 L 2.609375 -3.984375 C 2.96875 -3.984375 3.125 -3.96875 3.234375 -3.84375 C 3.28125 -3.78125 3.390625 -3.484375 3.453125 -3.296875 L 2.609375 -0.875 L 1.65625 -3.53125 C 1.609375 -3.65625 1.609375 -3.671875 1.609375 -3.71875 C 1.609375 -3.984375 2 -3.984375 2.1875 -3.984375 L 2.1875 -4.296875 C 1.890625 -4.28125 1.328125 -4.265625 1.109375 -4.265625 C 1.0625 -4.265625 0.53125 -4.28125 0.171875 -4.296875 L 0.171875 -3.984375 C 0.671875 -3.984375 0.796875 -3.953125 0.921875 -3.640625 L 2.171875 -0.109375 C 2.21875 0.03125 2.25 0.109375 2.375 0.109375 C 2.515625 0.109375 2.53125 0.046875 2.578125 -0.09375 L 3.59375 -2.90625 L 4.609375 -0.078125 C 4.640625 0.03125 4.671875 0.109375 4.8125 0.109375 C 4.9375 0.109375 4.96875 0.015625 5 -0.078125 Z M 6.171875 -3.34375 "/></symbol><symbol overflow="visible" id="glyph0-6" class="transit-chart-node node-s"><path style="stroke:none;" d="M 3.484375 -3.875 L 2.203125 -4.171875 C 1.578125 -4.328125 1.203125 -4.859375 1.203125 -5.4375 C 1.203125 -6.140625 1.734375 -6.75 2.515625 -6.75 C 4.171875 -6.75 4.390625 -5.109375 4.453125 -4.671875 C 4.46875 -4.609375 4.46875 -4.546875 4.578125 -4.546875 C 4.703125 -4.546875 4.703125 -4.59375 4.703125 -4.78125 L 4.703125 -6.78125 C 4.703125 -6.953125 4.703125 -7.03125 4.59375 -7.03125 C 4.53125 -7.03125 4.515625 -7.015625 4.453125 -6.890625 L 4.09375 -6.328125 C 3.796875 -6.625 3.390625 -7.03125 2.5 -7.03125 C 1.390625 -7.03125 0.5625 -6.15625 0.5625 -5.09375 C 0.5625 -4.265625 1.09375 -3.53125 1.859375 -3.265625 C 1.96875 -3.234375 2.484375 -3.109375 3.1875 -2.9375 C 3.453125 -2.875 3.75 -2.796875 4.03125 -2.4375 C 4.234375 -2.171875 4.34375 -1.84375 4.34375 -1.515625 C 4.34375 -0.8125 3.84375 -0.09375 3 -0.09375 C 2.71875 -0.09375 1.953125 -0.140625 1.421875 -0.625 C 0.84375 -1.171875 0.8125 -1.796875 0.8125 -2.15625 C 0.796875 -2.265625 0.71875 -2.265625 0.6875 -2.265625 C 0.5625 -2.265625 0.5625 -2.1875 0.5625 -2.015625 L 0.5625 -0.015625 C 0.5625 0.15625 0.5625 0.21875 0.671875 0.21875 C 0.734375 0.21875 0.75 0.203125 0.8125 0.09375 C 0.8125 0.078125 0.84375 0.046875 1.171875 -0.484375 C 1.484375 -0.140625 2.125 0.21875 3.015625 0.21875 C 4.171875 0.21875 4.96875 -0.75 4.96875 -1.859375 C 4.96875 -2.84375 4.3125 -3.671875 3.484375 -3.875 Z M 3.484375 -3.875 "/></symbol><symbol overflow="visible" id="glyph0-7" class="transit-chart-node node-n"><path style="stroke:none;" d="M 2.3125 -6.671875 C 2.21875 -6.796875 2.21875 -6.8125 2.03125 -6.8125 L 0.328125 -6.8125 L 0.328125 -6.5 L 0.625 -6.5 C 0.765625 -6.5 0.96875 -6.484375 1.109375 -6.484375 C 1.34375 -6.453125 1.359375 -6.4375 1.359375 -6.25 L 1.359375 -1.046875 C 1.359375 -0.78125 1.359375 -0.3125 0.328125 -0.3125 L 0.328125 0 C 0.671875 -0.015625 1.171875 -0.03125 1.5 -0.03125 C 1.828125 -0.03125 2.3125 -0.015625 2.65625 0 L 2.65625 -0.3125 C 1.640625 -0.3125 1.640625 -0.78125 1.640625 -1.046875 L 1.640625 -6.234375 C 1.6875 -6.1875 1.6875 -6.171875 1.734375 -6.109375 L 5.796875 -0.125 C 5.890625 -0.015625 5.90625 0 5.96875 0 C 6.109375 0 6.109375 -0.0625 6.109375 -0.265625 L 6.109375 -5.765625 C 6.109375 -6.03125 6.109375 -6.5 7.140625 -6.5 L 7.140625 -6.8125 C 6.78125 -6.796875 6.296875 -6.78125 5.96875 -6.78125 C 5.640625 -6.78125 5.15625 -6.796875 4.8125 -6.8125 L 4.8125 -6.5 C 5.828125 -6.5 5.828125 -6.03125 5.828125 -5.765625 L 5.828125 -1.5 Z M 2.3125 -6.671875 "/></symbol><symbol overflow="visible" id="glyph0-8" class="transit-chart-node node-f"><path style="stroke:none;" d="M 5.796875 -6.78125 L 0.328125 -6.78125 L 0.328125 -6.46875 L 0.5625 -6.46875 C 1.328125 -6.46875 1.359375 -6.359375 1.359375 -6 L 1.359375 -0.78125 C 1.359375 -0.421875 1.328125 -0.3125 0.5625 -0.3125 L 0.328125 -0.3125 L 0.328125 0 C 0.671875 -0.03125 1.453125 -0.03125 1.84375 -0.03125 C 2.25 -0.03125 3.15625 -0.03125 3.515625 0 L 3.515625 -0.3125 L 3.1875 -0.3125 C 2.25 -0.3125 2.25 -0.4375 2.25 -0.78125 L 2.25 -3.234375 L 3.09375 -3.234375 C 4.0625 -3.234375 4.15625 -2.921875 4.15625 -2.078125 L 4.40625 -2.078125 L 4.40625 -4.71875 L 4.15625 -4.71875 C 4.15625 -3.875 4.0625 -3.546875 3.09375 -3.546875 L 2.25 -3.546875 L 2.25 -6.078125 C 2.25 -6.40625 2.265625 -6.46875 2.734375 -6.46875 L 3.921875 -6.46875 C 5.421875 -6.46875 5.671875 -5.90625 5.828125 -4.53125 L 6.078125 -4.53125 Z M 5.796875 -6.78125 "/></symbol><symbol overflow="visible" id="glyph1-0"><path style="stroke:none;" d=""/></symbol><symbol overflow="visible" id="glyph1-1c" class="transit-chart-label label-tc"><path style="stroke:none;" d="M 6.140625 -6.078125 L 0.515625 -6.078125 L 0.328125 -4.046875 L 0.578125 -4.046875 C 0.703125 -5.53125 0.890625 -5.796875 2.234375 -5.796875 C 2.40625 -5.796875 2.65625 -5.796875 2.75 -5.78125 C 2.921875 -5.734375 2.921875 -5.65625 2.921875 -5.421875 L 2.921875 -0.71875 C 2.921875 -0.40625 2.921875 -0.28125 1.984375 -0.28125 L 1.625 -0.28125 L 1.625 0 C 1.953125 -0.03125 2.9375 -0.03125 3.328125 -0.03125 C 3.71875 -0.03125 4.703125 -0.03125 5.015625 0 L 5.015625 -0.28125 L 4.671875 -0.28125 C 3.734375 -0.28125 3.734375 -0.40625 3.734375 -0.71875 L 3.734375 -5.421875 C 3.734375 -5.65625 3.734375 -5.734375 3.921875 -5.78125 C 4.015625 -5.796875 4.25 -5.796875 4.40625 -5.796875 C 5.765625 -5.796875 5.9375 -5.53125 6.0625 -4.046875 L 6.3125 -4.046875 Z M 6.140625 -6.078125 "/></symbol><symbol overflow="visible" id="glyph1-1p" class="transit-chart-label label-tp"><path style="stroke:none;" d="M 6.140625 -6.078125 L 0.515625 -6.078125 L 0.328125 -4.046875 L 0.578125 -4.046875 C 0.703125 -5.53125 0.890625 -5.796875 2.234375 -5.796875 C 2.40625 -5.796875 2.65625 -5.796875 2.75 -5.78125 C 2.921875 -5.734375 2.921875 -5.65625 2.921875 -5.421875 L 2.921875 -0.71875 C 2.921875 -0.40625 2.921875 -0.28125 1.984375 -0.28125 L 1.625 -0.28125 L 1.625 0 C 1.953125 -0.03125 2.9375 -0.03125 3.328125 -0.03125 C 3.71875 -0.03125 4.703125 -0.03125 5.015625 0 L 5.015625 -0.28125 L 4.671875 -0.28125 C 3.734375 -0.28125 3.734375 -0.40625 3.734375 -0.71875 L 3.734375 -5.421875 C 3.734375 -5.65625 3.734375 -5.734375 3.921875 -5.78125 C 4.015625 -5.796875 4.25 -5.796875 4.40625 -5.796875 C 5.765625 -5.796875 5.9375 -5.53125 6.0625 -4.046875 L 6.3125 -4.046875 Z M 6.140625 -6.078125 "/></symbol><symbol overflow="visible" id="glyph1-1w" class="transit-chart-label label-tw"><path style="stroke:none;" d="M 6.140625 -6.078125 L 0.515625 -6.078125 L 0.328125 -4.046875 L 0.578125 -4.046875 C 0.703125 -5.53125 0.890625 -5.796875 2.234375 -5.796875 C 2.40625 -5.796875 2.65625 -5.796875 2.75 -5.78125 C 2.921875 -5.734375 2.921875 -5.65625 2.921875 -5.421875 L 2.921875 -0.71875 C 2.921875 -0.40625 2.921875 -0.28125 1.984375 -0.28125 L 1.625 -0.28125 L 1.625 0 C 1.953125 -0.03125 2.9375 -0.03125 3.328125 -0.03125 C 3.71875 -0.03125 4.703125 -0.03125 5.015625 0 L 5.015625 -0.28125 L 4.671875 -0.28125 C 3.734375 -0.28125 3.734375 -0.40625 3.734375 -0.71875 L 3.734375 -5.421875 C 3.734375 -5.65625 3.734375 -5.734375 3.921875 -5.78125 C 4.015625 -5.796875 4.25 -5.796875 4.40625 -5.796875 C 5.765625 -5.796875 5.9375 -5.53125 6.0625 -4.046875 L 6.3125 -4.046875 Z M 6.140625 -6.078125 "/></symbol><symbol overflow="visible" id="glyph1-2c" class="transit-chart-label label-rc"><path style="stroke:none;" d="M 2.046875 -3.171875 L 2.046875 -5.484375 C 2.046875 -5.71875 2.078125 -5.796875 2.25 -5.828125 C 2.328125 -5.84375 2.609375 -5.84375 2.796875 -5.84375 C 3.5625 -5.84375 4.703125 -5.84375 4.703125 -4.515625 C 4.703125 -3.734375 4.3125 -3.171875 3.09375 -3.171875 Z M 4.078125 -3.046875 C 4.921875 -3.28125 5.625 -3.8125 5.625 -4.515625 C 5.625 -5.40625 4.53125 -6.125 3.21875 -6.125 L 0.359375 -6.125 L 0.359375 -5.84375 L 0.5625 -5.84375 C 1.25 -5.84375 1.28125 -5.75 1.28125 -5.421875 L 1.28125 -0.703125 C 1.28125 -0.375 1.25 -0.28125 0.5625 -0.28125 L 0.359375 -0.28125 L 0.359375 0 C 0.78125 -0.03125 1.234375 -0.03125 1.65625 -0.03125 C 2.09375 -0.03125 2.53125 -0.03125 2.96875 0 L 2.96875 -0.28125 L 2.765625 -0.28125 C 2.078125 -0.28125 2.046875 -0.375 2.046875 -0.703125 L 2.046875 -2.953125 L 3.125 -2.953125 C 3.78125 -2.953125 4.0625 -2.609375 4.09375 -2.578125 C 4.375 -2.25 4.375 -2.109375 4.375 -1.46875 C 4.375 -0.875 4.375 -0.46875 4.796875 -0.140625 C 5.21875 0.203125 5.765625 0.203125 5.859375 0.203125 C 6.609375 0.203125 6.75 -0.578125 6.75 -0.796875 C 6.75 -0.859375 6.75 -0.953125 6.625 -0.953125 C 6.5 -0.953125 6.5 -0.875 6.5 -0.8125 C 6.453125 -0.234375 6.171875 -0.03125 5.890625 -0.03125 C 5.609375 -0.03125 5.5 -0.203125 5.4375 -0.359375 C 5.359375 -0.5625 5.28125 -1.171875 5.21875 -1.5625 C 5.140625 -2.125 5.0625 -2.71875 4.078125 -3.046875 Z M 4.078125 -3.046875 "/></symbol><symbol overflow="visible" id="glyph1-2p" class="transit-chart-label label-rp"><path style="stroke:none;" d="M 2.046875 -3.171875 L 2.046875 -5.484375 C 2.046875 -5.71875 2.078125 -5.796875 2.25 -5.828125 C 2.328125 -5.84375 2.609375 -5.84375 2.796875 -5.84375 C 3.5625 -5.84375 4.703125 -5.84375 4.703125 -4.515625 C 4.703125 -3.734375 4.3125 -3.171875 3.09375 -3.171875 Z M 4.078125 -3.046875 C 4.921875 -3.28125 5.625 -3.8125 5.625 -4.515625 C 5.625 -5.40625 4.53125 -6.125 3.21875 -6.125 L 0.359375 -6.125 L 0.359375 -5.84375 L 0.5625 -5.84375 C 1.25 -5.84375 1.28125 -5.75 1.28125 -5.421875 L 1.28125 -0.703125 C 1.28125 -0.375 1.25 -0.28125 0.5625 -0.28125 L 0.359375 -0.28125 L 0.359375 0 C 0.78125 -0.03125 1.234375 -0.03125 1.65625 -0.03125 C 2.09375 -0.03125 2.53125 -0.03125 2.96875 0 L 2.96875 -0.28125 L 2.765625 -0.28125 C 2.078125 -0.28125 2.046875 -0.375 2.046875 -0.703125 L 2.046875 -2.953125 L 3.125 -2.953125 C 3.78125 -2.953125 4.0625 -2.609375 4.09375 -2.578125 C 4.375 -2.25 4.375 -2.109375 4.375 -1.46875 C 4.375 -0.875 4.375 -0.46875 4.796875 -0.140625 C 5.21875 0.203125 5.765625 0.203125 5.859375 0.203125 C 6.609375 0.203125 6.75 -0.578125 6.75 -0.796875 C 6.75 -0.859375 6.75 -0.953125 6.625 -0.953125 C 6.5 -0.953125 6.5 -0.875 6.5 -0.8125 C 6.453125 -0.234375 6.171875 -0.03125 5.890625 -0.03125 C 5.609375 -0.03125 5.5 -0.203125 5.4375 -0.359375 C 5.359375 -0.5625 5.28125 -1.171875 5.21875 -1.5625 C 5.140625 -2.125 5.0625 -2.71875 4.078125 -3.046875 Z M 4.078125 -3.046875 "/></symbol><symbol overflow="visible" id="glyph1-2w" class="transit-chart-label label-rw"><path style="stroke:none;" d="M 2.046875 -3.171875 L 2.046875 -5.484375 C 2.046875 -5.71875 2.078125 -5.796875 2.25 -5.828125 C 2.328125 -5.84375 2.609375 -5.84375 2.796875 -5.84375 C 3.5625 -5.84375 4.703125 -5.84375 4.703125 -4.515625 C 4.703125 -3.734375 4.3125 -3.171875 3.09375 -3.171875 Z M 4.078125 -3.046875 C 4.921875 -3.28125 5.625 -3.8125 5.625 -4.515625 C 5.625 -5.40625 4.53125 -6.125 3.21875 -6.125 L 0.359375 -6.125 L 0.359375 -5.84375 L 0.5625 -5.84375 C 1.25 -5.84375 1.28125 -5.75 1.28125 -5.421875 L 1.28125 -0.703125 C 1.28125 -0.375 1.25 -0.28125 0.5625 -0.28125 L 0.359375 -0.28125 L 0.359375 0 C 0.78125 -0.03125 1.234375 -0.03125 1.65625 -0.03125 C 2.09375 -0.03125 2.53125 -0.03125 2.96875 0 L 2.96875 -0.28125 L 2.765625 -0.28125 C 2.078125 -0.28125 2.046875 -0.375 2.046875 -0.703125 L 2.046875 -2.953125 L 3.125 -2.953125 C 3.78125 -2.953125 4.0625 -2.609375 4.09375 -2.578125 C 4.375 -2.25 4.375 -2.109375 4.375 -1.46875 C 4.375 -0.875 4.375 -0.46875 4.796875 -0.140625 C 5.21875 0.203125 5.765625 0.203125 5.859375 0.203125 C 6.609375 0.203125 6.75 -0.578125 6.75 -0.796875 C 6.75 -0.859375 6.75 -0.953125 6.625 -0.953125 C 6.5 -0.953125 6.5 -0.875 6.5 -0.8125 C 6.453125 -0.234375 6.171875 -0.03125 5.890625 -0.03125 C 5.609375 -0.03125 5.5 -0.203125 5.4375 -0.359375 C 5.359375 -0.5625 5.28125 -1.171875 5.21875 -1.5625 C 5.140625 -2.125 5.0625 -2.71875 4.078125 -3.046875 Z M 4.078125 -3.046875 "/></symbol><symbol overflow="visible" id="glyph1-3c" class="transit-chart-label label-sc"><path style="stroke:none;" d="M 2.03125 -3.75 C 1.3125 -3.921875 1.078125 -4.5 1.078125 -4.890625 C 1.078125 -5.5 1.5625 -6.078125 2.328125 -6.078125 C 3.484375 -6.078125 3.953125 -5.203125 4.078125 -4.3125 C 4.09375 -4.140625 4.109375 -4.09375 4.21875 -4.09375 C 4.34375 -4.09375 4.34375 -4.15625 4.34375 -4.34375 L 4.34375 -6.078125 C 4.34375 -6.25 4.34375 -6.328125 4.234375 -6.328125 C 4.171875 -6.328125 4.15625 -6.3125 4.09375 -6.203125 C 3.984375 -6.046875 4.078125 -6.15625 3.78125 -5.6875 C 3.625 -5.875 3.15625 -6.328125 2.3125 -6.328125 C 1.265625 -6.328125 0.515625 -5.5 0.515625 -4.59375 C 0.515625 -3.890625 0.9375 -3.46875 0.984375 -3.421875 C 1.375 -3.015625 1.546875 -2.984375 2.609375 -2.71875 C 3.34375 -2.5625 3.421875 -2.53125 3.71875 -2.234375 C 3.71875 -2.21875 4.03125 -1.890625 4.03125 -1.359375 C 4.03125 -0.75 3.59375 -0.078125 2.765625 -0.078125 C 2.078125 -0.078125 0.828125 -0.375 0.765625 -1.84375 C 0.75 -1.984375 0.75 -2.03125 0.640625 -2.03125 C 0.515625 -2.03125 0.515625 -1.96875 0.515625 -1.78125 L 0.515625 -0.046875 C 0.515625 0.125 0.515625 0.203125 0.625 0.203125 C 0.6875 0.203125 0.6875 0.1875 0.75 0.078125 C 0.875 -0.078125 0.78125 0.03125 1.078125 -0.4375 C 1.625 0.109375 2.34375 0.203125 2.78125 0.203125 C 3.875 0.203125 4.59375 -0.703125 4.59375 -1.65625 C 4.59375 -2.171875 4.40625 -2.5625 4.203125 -2.828125 C 3.8125 -3.328125 3.40625 -3.421875 2.828125 -3.5625 Z M 2.03125 -3.75 "/></symbol><symbol overflow="visible" id="glyph1-3p" class="transit-chart-label label-sp"><path style="stroke:none;" d="M 2.03125 -3.75 C 1.3125 -3.921875 1.078125 -4.5 1.078125 -4.890625 C 1.078125 -5.5 1.5625 -6.078125 2.328125 -6.078125 C 3.484375 -6.078125 3.953125 -5.203125 4.078125 -4.3125 C 4.09375 -4.140625 4.109375 -4.09375 4.21875 -4.09375 C 4.34375 -4.09375 4.34375 -4.15625 4.34375 -4.34375 L 4.34375 -6.078125 C 4.34375 -6.25 4.34375 -6.328125 4.234375 -6.328125 C 4.171875 -6.328125 4.15625 -6.3125 4.09375 -6.203125 C 3.984375 -6.046875 4.078125 -6.15625 3.78125 -5.6875 C 3.625 -5.875 3.15625 -6.328125 2.3125 -6.328125 C 1.265625 -6.328125 0.515625 -5.5 0.515625 -4.59375 C 0.515625 -3.890625 0.9375 -3.46875 0.984375 -3.421875 C 1.375 -3.015625 1.546875 -2.984375 2.609375 -2.71875 C 3.34375 -2.5625 3.421875 -2.53125 3.71875 -2.234375 C 3.71875 -2.21875 4.03125 -1.890625 4.03125 -1.359375 C 4.03125 -0.75 3.59375 -0.078125 2.765625 -0.078125 C 2.078125 -0.078125 0.828125 -0.375 0.765625 -1.84375 C 0.75 -1.984375 0.75 -2.03125 0.640625 -2.03125 C 0.515625 -2.03125 0.515625 -1.96875 0.515625 -1.78125 L 0.515625 -0.046875 C 0.515625 0.125 0.515625 0.203125 0.625 0.203125 C 0.6875 0.203125 0.6875 0.1875 0.75 0.078125 C 0.875 -0.078125 0.78125 0.03125 1.078125 -0.4375 C 1.625 0.109375 2.34375 0.203125 2.78125 0.203125 C 3.875 0.203125 4.59375 -0.703125 4.59375 -1.65625 C 4.59375 -2.171875 4.40625 -2.5625 4.203125 -2.828125 C 3.8125 -3.328125 3.40625 -3.421875 2.828125 -3.5625 Z M 2.03125 -3.75 "/></symbol><symbol overflow="visible" id="glyph1-3w" class="transit-chart-label label-sw"><path style="stroke:none;" d="M 2.03125 -3.75 C 1.3125 -3.921875 1.078125 -4.5 1.078125 -4.890625 C 1.078125 -5.5 1.5625 -6.078125 2.328125 -6.078125 C 3.484375 -6.078125 3.953125 -5.203125 4.078125 -4.3125 C 4.09375 -4.140625 4.109375 -4.09375 4.21875 -4.09375 C 4.34375 -4.09375 4.34375 -4.15625 4.34375 -4.34375 L 4.34375 -6.078125 C 4.34375 -6.25 4.34375 -6.328125 4.234375 -6.328125 C 4.171875 -6.328125 4.15625 -6.3125 4.09375 -6.203125 C 3.984375 -6.046875 4.078125 -6.15625 3.78125 -5.6875 C 3.625 -5.875 3.15625 -6.328125 2.3125 -6.328125 C 1.265625 -6.328125 0.515625 -5.5 0.515625 -4.59375 C 0.515625 -3.890625 0.9375 -3.46875 0.984375 -3.421875 C 1.375 -3.015625 1.546875 -2.984375 2.609375 -2.71875 C 3.34375 -2.5625 3.421875 -2.53125 3.71875 -2.234375 C 3.71875 -2.21875 4.03125 -1.890625 4.03125 -1.359375 C 4.03125 -0.75 3.59375 -0.078125 2.765625 -0.078125 C 2.078125 -0.078125 0.828125 -0.375 0.765625 -1.84375 C 0.75 -1.984375 0.75 -2.03125 0.640625 -2.03125 C 0.515625 -2.03125 0.515625 -1.96875 0.515625 -1.78125 L 0.515625 -0.046875 C 0.515625 0.125 0.515625 0.203125 0.625 0.203125 C 0.6875 0.203125 0.6875 0.1875 0.75 0.078125 C 0.875 -0.078125 0.78125 0.03125 1.078125 -0.4375 C 1.625 0.109375 2.34375 0.203125 2.78125 0.203125 C 3.875 0.203125 4.59375 -0.703125 4.59375 -1.65625 C 4.59375 -2.171875 4.40625 -2.5625 4.203125 -2.828125 C 3.8125 -3.328125 3.40625 -3.421875 2.828125 -3.5625 Z M 2.03125 -3.75 "/></symbol><symbol overflow="visible" id="glyph1-4c" class="transit-chart-label label-nc"><path style="stroke:none;" d="M 2.109375 -6.015625 C 2.046875 -6.125 2.015625 -6.125 1.84375 -6.125 L 0.34375 -6.125 L 0.34375 -5.84375 L 0.59375 -5.84375 C 1.015625 -5.84375 1.25 -5.78125 1.25 -5.78125 L 1.25 -0.953125 C 1.25 -0.703125 1.25 -0.28125 0.34375 -0.28125 L 0.34375 0 C 0.828125 -0.015625 0.953125 -0.03125 1.40625 -0.03125 C 1.828125 -0.03125 1.96875 -0.015625 2.453125 0 L 2.453125 -0.28125 C 1.53125 -0.28125 1.53125 -0.703125 1.53125 -0.953125 L 1.53125 -5.578125 L 5.34375 -0.109375 C 5.421875 0 5.46875 0 5.5 0 C 5.65625 0 5.65625 -0.078125 5.65625 -0.234375 L 5.65625 -5.171875 C 5.65625 -5.421875 5.65625 -5.84375 6.5625 -5.84375 L 6.5625 -6.125 C 6.078125 -6.109375 5.953125 -6.09375 5.515625 -6.09375 C 5.078125 -6.09375 4.953125 -6.109375 4.453125 -6.125 L 4.453125 -5.84375 C 5.375 -5.84375 5.375 -5.421875 5.375 -5.171875 L 5.375 -1.34375 Z M 2.109375 -6.015625 "/></symbol><symbol overflow="visible" id="glyph1-4p" class="transit-chart-label label-np"><path style="stroke:none;" d="M 2.109375 -6.015625 C 2.046875 -6.125 2.015625 -6.125 1.84375 -6.125 L 0.34375 -6.125 L 0.34375 -5.84375 L 0.59375 -5.84375 C 1.015625 -5.84375 1.25 -5.78125 1.25 -5.78125 L 1.25 -0.953125 C 1.25 -0.703125 1.25 -0.28125 0.34375 -0.28125 L 0.34375 0 C 0.828125 -0.015625 0.953125 -0.03125 1.40625 -0.03125 C 1.828125 -0.03125 1.96875 -0.015625 2.453125 0 L 2.453125 -0.28125 C 1.53125 -0.28125 1.53125 -0.703125 1.53125 -0.953125 L 1.53125 -5.578125 L 5.34375 -0.109375 C 5.421875 0 5.46875 0 5.5 0 C 5.65625 0 5.65625 -0.078125 5.65625 -0.234375 L 5.65625 -5.171875 C 5.65625 -5.421875 5.65625 -5.84375 6.5625 -5.84375 L 6.5625 -6.125 C 6.078125 -6.109375 5.953125 -6.09375 5.515625 -6.09375 C 5.078125 -6.09375 4.953125 -6.109375 4.453125 -6.125 L 4.453125 -5.84375 C 5.375 -5.84375 5.375 -5.421875 5.375 -5.171875 L 5.375 -1.34375 Z M 2.109375 -6.015625 "/></symbol><symbol overflow="visible" id="glyph1-4w" class="transit-chart-label label-nw"><path style="stroke:none;" d="M 2.109375 -6.015625 C 2.046875 -6.125 2.015625 -6.125 1.84375 -6.125 L 0.34375 -6.125 L 0.34375 -5.84375 L 0.59375 -5.84375 C 1.015625 -5.84375 1.25 -5.78125 1.25 -5.78125 L 1.25 -0.953125 C 1.25 -0.703125 1.25 -0.28125 0.34375 -0.28125 L 0.34375 0 C 0.828125 -0.015625 0.953125 -0.03125 1.40625 -0.03125 C 1.828125 -0.03125 1.96875 -0.015625 2.453125 0 L 2.453125 -0.28125 C 1.53125 -0.28125 1.53125 -0.703125 1.53125 -0.953125 L 1.53125 -5.578125 L 5.34375 -0.109375 C 5.421875 0 5.46875 0 5.5 0 C 5.65625 0 5.65625 -0.078125 5.65625 -0.234375 L 5.65625 -5.171875 C 5.65625 -5.421875 5.65625 -5.84375 6.5625 -5.84375 L 6.5625 -6.125 C 6.078125 -6.109375 5.953125 -6.09375 5.515625 -6.09375 C 5.078125 -6.09375 4.953125 -6.109375 4.453125 -6.125 L 4.453125 -5.84375 C 5.375 -5.84375 5.375 -5.421875 5.375 -5.171875 L 5.375 -1.34375 Z M 2.109375 -6.015625 "/></symbol><symbol overflow="visible" id="glyph1-5c" class="transit-chart-label label-fc"><path style="stroke:none;" d="M 5.375 -6.09375 L 0.34375 -6.09375 L 0.34375 -5.828125 L 0.546875 -5.828125 C 1.234375 -5.828125 1.25 -5.71875 1.25 -5.390625 L 1.25 -0.703125 C 1.25 -0.375 1.234375 -0.28125 0.546875 -0.28125 L 0.34375 -0.28125 L 0.34375 0 C 0.75 -0.03125 1.296875 -0.03125 1.71875 -0.03125 C 2.078125 -0.03125 2.890625 -0.03125 3.203125 0 L 3.203125 -0.28125 L 2.921875 -0.28125 C 2.09375 -0.28125 2.0625 -0.390625 2.0625 -0.71875 L 2.0625 -2.921875 L 2.875 -2.921875 C 3.734375 -2.921875 3.84375 -2.625 3.84375 -1.859375 L 4.09375 -1.859375 L 4.09375 -4.25 L 3.84375 -4.25 C 3.84375 -3.484375 3.734375 -3.1875 2.875 -3.1875 L 2.0625 -3.1875 L 2.0625 -5.453125 C 2.0625 -5.765625 2.078125 -5.828125 2.5 -5.828125 L 3.625 -5.828125 C 5 -5.828125 5.234375 -5.3125 5.375 -4.078125 L 5.625 -4.078125 Z M 5.375 -6.09375 "/></symbol><symbol overflow="visible" id="glyph1-5p" class="transit-chart-label label-fp"><path style="stroke:none;" d="M 5.375 -6.09375 L 0.34375 -6.09375 L 0.34375 -5.828125 L 0.546875 -5.828125 C 1.234375 -5.828125 1.25 -5.71875 1.25 -5.390625 L 1.25 -0.703125 C 1.25 -0.375 1.234375 -0.28125 0.546875 -0.28125 L 0.34375 -0.28125 L 0.34375 0 C 0.75 -0.03125 1.296875 -0.03125 1.71875 -0.03125 C 2.078125 -0.03125 2.890625 -0.03125 3.203125 0 L 3.203125 -0.28125 L 2.921875 -0.28125 C 2.09375 -0.28125 2.0625 -0.390625 2.0625 -0.71875 L 2.0625 -2.921875 L 2.875 -2.921875 C 3.734375 -2.921875 3.84375 -2.625 3.84375 -1.859375 L 4.09375 -1.859375 L 4.09375 -4.25 L 3.84375 -4.25 C 3.84375 -3.484375 3.734375 -3.1875 2.875 -3.1875 L 2.0625 -3.1875 L 2.0625 -5.453125 C 2.0625 -5.765625 2.078125 -5.828125 2.5 -5.828125 L 3.625 -5.828125 C 5 -5.828125 5.234375 -5.3125 5.375 -4.078125 L 5.625 -4.078125 Z M 5.375 -6.09375 "/></symbol><symbol overflow="visible" id="glyph1-5w" class="transit-chart-label label-fw"><path style="stroke:none;" d="M 5.375 -6.09375 L 0.34375 -6.09375 L 0.34375 -5.828125 L 0.546875 -5.828125 C 1.234375 -5.828125 1.25 -5.71875 1.25 -5.390625 L 1.25 -0.703125 C 1.25 -0.375 1.234375 -0.28125 0.546875 -0.28125 L 0.34375 -0.28125 L 0.34375 0 C 0.75 -0.03125 1.296875 -0.03125 1.71875 -0.03125 C 2.078125 -0.03125 2.890625 -0.03125 3.203125 0 L 3.203125 -0.28125 L 2.921875 -0.28125 C 2.09375 -0.28125 2.0625 -0.390625 2.0625 -0.71875 L 2.0625 -2.921875 L 2.875 -2.921875 C 3.734375 -2.921875 3.84375 -2.625 3.84375 -1.859375 L 4.09375 -1.859375 L 4.09375 -4.25 L 3.84375 -4.25 C 3.84375 -3.484375 3.734375 -3.1875 2.875 -3.1875 L 2.0625 -3.1875 L 2.0625 -5.453125 C 2.0625 -5.765625 2.078125 -5.828125 2.5 -5.828125 L 3.625 -5.828125 C 5 -5.828125 5.234375 -5.3125 5.375 -4.078125 L 5.625 -4.078125 Z M 5.375 -6.09375 "/></symbol></g><clipPath id="clip1">  <path d="M 93 27 L 112.5625 27 L 112.5625 53 L 93 53 Z M 93 27 "/></clipPath><clipPath id="clip2">  <path d="M 0 0 L 112.5625 0 L 112.5625 70.054688 L 0 70.054688 Z M 0 0 "/></clipPath><filter id="alpha" filterUnits="objectBoundingBox" x="0%" y="0%" width="100%" height="100%">  <feColorMatrix type="matrix" in="SourceGraphic" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter><mask id="mask0">  <g filter="url(#alpha)"><rect x="0" y="0" width="112.563" height="70.055" style="fill:rgb(0%,0%,0%);fill-opacity:0.5;stroke:none;"/>  </g></mask><clipPath id="clip4">  <path d="M 0 32 L 56 32 L 56 70.054688 L 0 70.054688 Z M 0 32 "/></clipPath><clipPath id="clip5">  <path d="M 41 0 L 112.5625 0 L 112.5625 45 L 41 45 Z M 41 0 "/></clipPath><clipPath id="clip6">  <path d="M 40 1 L 112.5625 1 L 112.5625 46 L 40 46 Z M 40 1 "/></clipPath><clipPath id="clip7">  <path d="M 41 34 L 88 34 L 88 70.054688 L 41 70.054688 Z M 41 34 "/></clipPath><clipPath id="clip8">  <path d="M 40 34 L 103 34 L 103 70.054688 L 40 70.054688 Z M 40 34 "/></clipPath><clipPath id="clip9">  <path d="M 40 34 L 112.5625 34 L 112.5625 70.054688 L 40 70.054688 Z M 40 34 "/></clipPath><clipPath id="clip3">  <rect x="0" y="0" width="113" height="71"/></clipPath><g id="surface5" clip-path="url(#clip3)"><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(50%,50%,50%);stroke-opacity:1;stroke-miterlimit:10;" d="M -41.784844 6.635469 C -39.956719 23.178437 -22.3825 34.897187 -9.179375 31.033906 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(50%,50%,50%);fill-opacity:1;" d="M 42.789062 9.808594 L 39 6.292969 L 40.015625 8.996094 L 37.703125 10.730469 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(50%,50%,50%);stroke-opacity:1;stroke-miterlimit:10;" d="M -40.066094 6.205781 C -34.855156 19.393281 -17.769219 25.088594 -8.148125 19.178437 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(50%,50%,50%);fill-opacity:1;" d="M 43.507812 22.363281 L 40.777344 17.972656 L 41.046875 20.851562 L 38.359375 21.914062 "/><g clip-path="url(#clip4)" clip-rule="nonzero"><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(50%,50%,50%);stroke-opacity:1;stroke-miterlimit:10;" d="M -40.066094 -6.208281 C -34.855156 -19.391875 -17.769219 -25.091094 -8.148125 -19.180938 " transform="matrix(1,0,0,-1,49.195,40.03)"/></g><path style=" stroke:none;fill-rule:nonzero;fill:rgb(50%,50%,50%);fill-opacity:1;" d="M 43.507812 57.695312 L 38.359375 58.148438 L 41.046875 59.210938 L 40.777344 62.085938 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(10.998535%,52.49939%,93.199158%);stroke-opacity:1;stroke-miterlimit:10;" d="M -6.448906 26.619844 C -17.237969 23.729219 -23.730156 17.237031 -25.870781 9.237031 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(10.998535%,52.49939%,93.199158%);fill-opacity:1;" d="M 22.574219 33.582031 L 26.003906 29.714844 L 23.324219 30.792969 L 21.539062 28.519531 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(93.199158%,46.398926%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.449531 26.619844 C 17.234687 23.729219 23.726875 17.237031 25.871406 9.237031 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(93.199158%,46.398926%,0%);fill-opacity:1;" d="M 75.8125 33.582031 L 76.851562 28.519531 L 75.066406 30.792969 L 72.386719 29.714844 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(56.999207%,17.199707%,93.199158%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.406562 30.221406 C 22.383125 34.897187 39.957344 23.178437 41.469062 9.506562 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(56.999207%,17.199707%,93.199158%);fill-opacity:1;" d="M 90.980469 33.394531 L 92.769531 28.546875 L 90.664062 30.523438 L 88.175781 29.054688 "/><g clip-path="url(#clip5)" clip-rule="nonzero"><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.125312 31.002656 C 25.805 39.533906 50.160469 27.358125 54.472969 9.303437 " transform="matrix(1,0,0,-1,49.195,40.03)"/></g><path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 104.339844 33.539062 L 105.511719 28.503906 L 103.667969 30.726562 L 101.015625 29.578125 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(10.998535%,52.49939%,93.199158%);stroke-opacity:1;stroke-miterlimit:10;" d="M -6.66375 14.572969 C -14.527031 15.045625 -20.327813 12.147187 -23.077813 7.979219 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(10.998535%,52.49939%,93.199158%);fill-opacity:1;" d="M 24.527344 34.460938 L 29 31.875 L 26.117188 32.050781 L 25.144531 29.328125 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(93.199158%,46.398926%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.664375 14.572969 C 14.527656 15.045625 20.328437 12.147187 23.078437 7.979219 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(93.199158%,46.398926%,0%);fill-opacity:1;" d="M 73.863281 34.460938 L 73.246094 29.328125 L 72.273438 32.050781 L 69.386719 31.875 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(56.999207%,17.199707%,93.199158%);stroke-opacity:1;stroke-miterlimit:10;" d="M 5.687812 17.666719 C 17.769844 25.088594 34.855781 19.393281 39.004219 8.893281 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(56.999207%,17.199707%,93.199158%);fill-opacity:1;" d="M 89.261719 33.824219 L 89.710938 28.675781 L 88.199219 31.136719 L 85.414062 30.375 "/><g clip-path="url(#clip6)" clip-rule="nonzero"><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 5.402656 18.0925 C 21.160469 29.526094 45.246406 23.502656 52.508125 8.600312 " transform="matrix(1,0,0,-1,49.195,40.03)"/></g><path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 102.964844 34.027344 L 103.019531 28.859375 L 101.703125 31.429688 L 98.863281 30.886719 "/><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(10.998535%,52.49939%,93.199158%);stroke-opacity:1;stroke-miterlimit:10;" d="M -6.66375 -14.571563 C -14.527031 -15.044219 -20.327813 -12.145781 -23.077813 -7.981719 " transform="matrix(1,0,0,-1,49.195,40.03)"/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(10.998535%,52.49939%,93.199158%);fill-opacity:1;" d="M 24.527344 45.601562 L 25.144531 50.730469 L 26.117188 48.011719 L 29 48.183594 "/><g clip-path="url(#clip7)" clip-rule="nonzero"><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(93.199158%,46.398926%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.4925 -15.723906 C 14.664375 -17.677031 22.351875 -13.833281 24.543281 -8.774688 " transform="matrix(1,0,0,-1,49.195,40.03)"/></g><path style=" stroke:none;fill-rule:nonzero;fill:rgb(93.199158%,46.398926%,0%);fill-opacity:1;" d="M 74.886719 46.152344 L 70.929688 49.476562 L 73.738281 48.804688 L 75.167969 51.3125 "/><g clip-path="url(#clip8)" clip-rule="nonzero"><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(56.999207%,17.199707%,93.199158%);stroke-opacity:1;stroke-miterlimit:10;" d="M 5.687812 -17.669219 C 17.769844 -25.091094 34.855781 -19.391875 39.004219 -8.895781 " transform="matrix(1,0,0,-1,49.195,40.03)"/></g><path style=" stroke:none;fill-rule:nonzero;fill:rgb(56.999207%,17.199707%,93.199158%);fill-opacity:1;" d="M 89.261719 46.238281 L 85.414062 49.6875 L 88.199219 48.925781 L 89.710938 51.386719 "/><g clip-path="url(#clip9)" clip-rule="nonzero"><path style="fill:none;stroke-width:0.99628;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 5.402656 -18.095 C 21.160469 -29.528594 45.246406 -23.505156 52.508125 -8.598906 " transform="matrix(1,0,0,-1,49.195,40.03)"/></g><path style=" stroke:none;fill-rule:nonzero;fill:rgb(0%,0%,0%);fill-opacity:1;" d="M 102.964844 46.03125 L 98.863281 49.175781 L 101.703125 48.628906 L 103.019531 51.199219 "/></g></defs><g id="surface1"><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M -36.042656 -0.00025 C -36.042656 3.577875 -38.945 6.476312 -42.519219 6.476312 C -46.097344 6.476312 -48.995781 3.577875 -48.995781 -0.00025 C -48.995781 -3.578375 -46.097344 -6.476813 -42.519219 -6.476813 C -38.945 -6.476813 -36.042656 -3.578375 -36.042656 -0.00025 Z M -36.042656 -0.00025 " transform="matrix(1,0,0,-1,49.195,40.031)"/><g style="fill:rgb(50%,50%,50%);fill-opacity:1;">  <use xlink:href="#glyph0-1" x="3.077" y="43.434"/></g><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M -21.870781 -0.00025 C -21.870781 3.577875 -24.769219 6.476312 -28.347344 6.476312 C -31.921563 6.476312 -34.823906 3.577875 -34.823906 -0.00025 C -34.823906 -3.578375 -31.921563 -6.476813 -28.347344 -6.476813 C -24.769219 -6.476813 -21.870781 -3.578375 -21.870781 -0.00025 Z M -21.870781 -0.00025 " transform="matrix(1,0,0,-1,49.195,40.031)"/><g style="fill:rgb(10.998535%,52.49939%,93.199158%);fill-opacity:1;">  <use xlink:href="#glyph0-2" x="17.181" y="43.434"/></g><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.476875 28.347406 C 6.476875 31.921625 3.578437 34.823969 0.0003125 34.823969 C -3.577813 34.823969 -6.47625 31.921625 -6.47625 28.347406 C -6.47625 24.769281 -3.577813 21.870844 0.0003125 21.870844 C 3.578437 21.870844 6.476875 24.769281 6.476875 28.347406 Z M 6.476875 28.347406 " transform="matrix(1,0,0,-1,49.195,40.031)"/><g style="fill:rgb(0%,54.499817%,0%);fill-opacity:1;">  <use xlink:href="#glyph0-3" x="46.981" y="13.829"/></g><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.476875 14.171625 C 6.476875 17.74975 3.578437 20.648187 0.0003125 20.648187 C -3.577813 20.648187 -6.47625 17.74975 -6.47625 14.171625 C -6.47625 10.597406 -3.577813 7.698969 0.0003125 7.698969 C 3.578437 7.698969 6.476875 10.597406 6.476875 14.171625 Z M 6.476875 14.171625 " transform="matrix(1,0,0,-1,49.195,40.031)"/><g style="fill:rgb(54.499817%,54.499817%,0%);fill-opacity:1;">  <use xlink:href="#glyph0-4" x="46.427" y="27.033"/></g><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 6.476875 -14.172125 C 6.476875 -10.597906 3.578437 -7.699469 0.0003125 -7.699469 C -3.577813 -7.699469 -6.47625 -10.597906 -6.47625 -14.172125 C -6.47625 -17.75025 -3.577813 -20.648688 0.0003125 -20.648688 C 3.578437 -20.648688 6.476875 -17.75025 6.476875 -14.172125 Z M 6.476875 -14.172125 " transform="matrix(1,0,0,-1,49.195,40.031)"/><g style="fill:rgb(54.499817%,0%,0%);fill-opacity:1;">  <use xlink:href="#glyph0-5" x="45.597" y="56.349"/></g><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 34.824531 -0.00025 C 34.824531 3.577875 31.922187 6.476312 28.347969 6.476312 C 24.769844 6.476312 21.871406 3.577875 21.871406 -0.00025 C 21.871406 -3.578375 24.769844 -6.476813 28.347969 -6.476813 C 31.922187 -6.476813 34.824531 -3.578375 34.824531 -0.00025 Z M 34.824531 -0.00025 " transform="matrix(1,0,0,-1,49.195,40.031)"/><g style="fill:rgb(93.199158%,46.398926%,0%);fill-opacity:1;">  <use xlink:href="#glyph0-6" x="74.774" y="43.434"/></g><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 48.996406 -0.00025 C 48.996406 3.577875 46.097969 6.476312 42.519844 6.476312 C 38.941719 6.476312 36.043281 3.577875 36.043281 -0.00025 C 36.043281 -3.578375 38.941719 -6.476813 42.519844 -6.476813 C 46.097969 -6.476813 48.996406 -3.578375 48.996406 -0.00025 Z M 48.996406 -0.00025 " transform="matrix(1,0,0,-1,49.195,40.031)"/><g style="fill:rgb(56.999207%,17.199707%,93.199158%);fill-opacity:1;">  <use xlink:href="#glyph0-7" x="87.978" y="43.434"/></g><g clip-path="url(#clip1)" clip-rule="nonzero"><path style="fill:none;stroke-width:0.3985;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,0%,0%);stroke-opacity:1;stroke-miterlimit:10;" d="M 63.168281 -0.00025 C 63.168281 3.577875 60.269844 6.476312 56.691719 6.476312 C 53.1175 6.476312 50.219062 3.577875 50.219062 -0.00025 C 50.219062 -3.578375 53.1175 -6.476813 56.691719 -6.476813 C 60.269844 -6.476813 63.168281 -3.578375 63.168281 -0.00025 Z M 63.168281 -0.00025 " transform="matrix(1,0,0,-1,49.195,40.031)"/></g><g style="fill:rgb(0%,0%,0%);fill-opacity:1;">  <use xlink:href="#glyph0-8" x="102.636" y="43.434"/></g><g clip-path="url(#clip2)" clip-rule="nonzero"><use xlink:href="#surface5" mask="url(#mask0)"/></g><g style="fill:rgb(34.999084%,34.999084%,34.999084%);fill-opacity:1;">  <use xlink:href="#glyph1-1c" x="11.326" y="19.037"/></g><g style="fill:rgb(34.999084%,34.999084%,34.999084%);fill-opacity:1;">  <use xlink:href="#glyph1-1p" x="11.326" y="31.066"/></g><g style="fill:rgb(34.999084%,34.999084%,34.999084%);fill-opacity:1;">  <use xlink:href="#glyph1-1w" x="11.326" y="55.123"/></g><g style="fill:rgb(6.599426%,31.498718%,55.918884%);fill-opacity:1;">  <use xlink:href="#glyph1-2c" x="29.751" y="19.037"/></g><g style="fill:rgb(65.238953%,32.479858%,0%);fill-opacity:1;">  <use xlink:href="#glyph1-3c" x="60.932" y="19.037"/></g><g style="fill:rgb(39.898682%,12.037659%,65.238953%);fill-opacity:1;">  <use xlink:href="#glyph1-4c" x="81.483" y="19.037"/></g><g style="fill:rgb(0%,0%,0%);fill-opacity:1;">  <use xlink:href="#glyph1-5c" x="94.948" y="19.037"/></g><g style="fill:rgb(6.599426%,31.498718%,55.918884%);fill-opacity:1;">  <use xlink:href="#glyph1-2p" x="29.751" y="31.066"/></g><g style="fill:rgb(65.238953%,32.479858%,0%);fill-opacity:1;">  <use xlink:href="#glyph1-3p" x="60.932" y="31.066"/></g><g style="fill:rgb(39.898682%,12.037659%,65.238953%);fill-opacity:1;">  <use xlink:href="#glyph1-4p" x="81.483" y="31.066"/></g><g style="fill:rgb(0%,0%,0%);fill-opacity:1;">  <use xlink:href="#glyph1-5p" x="94.948" y="31.066"/></g><g style="fill:rgb(6.599426%,31.498718%,55.918884%);fill-opacity:1;">  <use xlink:href="#glyph1-2w" x="29.751" y="55.123"/></g><g style="fill:rgb(65.238953%,32.479858%,0%);fill-opacity:1;">  <use xlink:href="#glyph1-3w" x="60.932" y="55.123"/></g><g style="fill:rgb(39.898682%,12.037659%,65.238953%);fill-opacity:1;">  <use xlink:href="#glyph1-4w" x="81.483" y="55.123"/></g><g style="fill:rgb(0%,0%,0%);fill-opacity:1;">  <use xlink:href="#glyph1-5w" x="94.948" y="55.123"/></g></g></svg>';

        //Fill transition chart with values from transition metrics. The glyphs are replaced by text.
        let typeTranslator = {"overall":"t", "sequential":"s", "non_sequential":"n", "repetition":"r", "finish":"f"};
        types.forEach(type => {
            states.forEach(state => {
                transitionsChart.querySelectorAll(".transit-chart-label.label-"+typeTranslator[type]+state).forEach(labelSymbolNode => {
                    //Remove previously defined symbol (letters as path).
                    while(labelSymbolNode.firstChild) {
                        labelSymbolNode.removeChild(labelSymbolNode.firstChild);
                    }
                    let textNode = this.LALMSVisualizer.documentNode.createElementNS("http://www.w3.org/2000/svg", "text");
                    textNode.setAttributeNS("http://www.w3.org/2000/svg", "dominant-baseline", "central");
                    textNode.setAttributeNS("http://www.w3.org/2000/svg", "text-anchor", "middle");
                    //textNode.classList.add()
                    let value = textNode.innerHTML = transition_metric[type+"_"+state];
                    let valueAsString = ""+value+"";
                    let numStringLength = valueAsString.length;
                    let fontSize = 0.5 - (numStringLength > 2 ? 0.1*(numStringLength-2) : 0);
                    if(fontSize < 0.2) {
                        fontSize = 0.2;
                    }
                    textNode.style.fontSize = fontSize+"em";
                    textNode.innerHTML = transition_metric[type+"_"+state];
                    labelSymbolNode.appendChild(textNode);
                    textNode.setAttributeNS("http://www.w3.org/2000/svg", "text-anchor", "middle");
                });
            });
        });

        //"Used" elements are clones. So the clones have to be updated.
        transitionsChart.innerHTML += "";

        if(typeof JXG == "undefined") {
            //User error handling.
            repetitionChart.innerHTML = this.Language.get("error_jxg_missing");
            //Developer error handling.
            //throw new Error("no JSXGraph lib found");
            console.log("no JSXGraph lib found");
        }
        else {
            //bounding box: [left, top, right, bottom]
            let xmin=-3;
            let xmax=Object.keys(questionAttemptsByQuestion).length;
            let ymin=-3;
            let ymax=Math.max(...Object.values(questionAttemptsByQuestion))+3;
            let board = JXG.JSXGraph.initBoard(
                'jxg_chart_attempt_amounts',
                {
                    boundingbox:[xmin, ymax, xmax, ymin],
                    axis:true,
                    zoom: {
                        pinchHorizontal: false,
                        pinchVertical: false,
                        pinchSensitivity: 7,
                        min: 0.5,
                        max: 2,
                        wheel: true,
                        needShift: true
                    },
                    pan: {
                        needTwoFingers: true,
                        needShift: false
                    },
                    showCopyright: false
                });
            //let point_coords = [];
            let i=1;
            for(let qkey in questionAttemptsByQuestion) {
                let p = board.create('point',[i,questionAttemptsByQuestion[qkey]], {fixed:true, name:"", size:2});
                i++;
            }
        }


        //Initiate questions information object here
        let questions = QuizOverviewAnalyzer.quizObject.questions;

        let questionsInformationObject = {};
        let vals = ["unique_users_amount", "attempts_amount"];
        let stateChars = ["c", "p", "w"];
        let uniqueUsersIdsByQuestion = {};
        stateChars.forEach(function(state_from) {
            stateChars.forEach(function(state_to) {
                
            });
        });
        for(let qid in questions) {
            uniqueUsersIdsByQuestion[qid] = [];
            questionsInformationObject[qid] = {};
            vals.forEach(val => {
                questionsInformationObject[qid][val] = 0;
            });
            questionsInformationObject[qid].pattern_state_characterization = {};
            questionsInformationObject[qid].pattern_movements = {};
            questionsInformationObject[qid].initial_movements = {};
        }

        //Loop through attempts the first time to identify existing error patterns.

        //Fill questions information object here
        for(let uid in QuizOverviewAnalyzer.Users) {
            let Attempts = QuizOverviewAnalyzer.Users[uid].QuestionAttempts;
            let length = Attempts.length;
            for(let i=0;i<length;i++) {
                //Unique users
                if(uniqueUsersIdsByQuestion[Attempts[i].questionId].indexOf(uid) == -1) {
                    uniqueUsersIdsByQuestion[Attempts[i].questionId].push(uid);
                }
                
                //Attempts
                let qid = Attempts[i].questionId;
                questionsInformationObject[qid].attempts_amount += 1;

                //Check for initial attempt
                if(i == 0 || Attempts[i-1].questionId != qid) {
                    if(questionsInformationObject[qid].initial_movements[Attempts[i].prt_name] == undefined) {
                        questionsInformationObject[qid].initial_movements[Attempts[i].prt_name] = 1;
                    }
                    else {
                        questionsInformationObject[qid].initial_movements[Attempts[i].prt_name] += 1;
                    }
                }

                //State progression after repetition (questionId == next_questionId)
                if(questionsInformationObject[qid].pattern_state_characterization[Attempts[i].prt_name] == undefined) {
                    questionsInformationObject[qid].pattern_state_characterization[Attempts[i].prt_name] = ["w", "c", "p"][Attempts[i].outcome_as_int];
                }

                if(Attempts[i].questionId == Attempts[i].next_questionId) {
                    if(questionsInformationObject[qid].pattern_movements[Attempts[i].prt_name] == undefined) {
                        questionsInformationObject[qid].pattern_movements[Attempts[i].prt_name] = {}; 
                    }

                    if(questionsInformationObject[qid].pattern_movements[Attempts[i].prt_name][Attempts[i].next_prt_name] == undefined) {
                        questionsInformationObject[qid].pattern_movements[Attempts[i].prt_name][Attempts[i].next_prt_name] = 1;
                    }
                    else {
                        questionsInformationObject[qid].pattern_movements[Attempts[i].prt_name][Attempts[i].next_prt_name] += 1;
                    }
                }

                /*let match = Attempts[i].action.match(/.*\| (.*?)$/);
                if(!!match && !!match[1]) {
                    let prtId = match[1];
                    let stateChar = ["w", "c", "p"][Attempts[i].outcome_as_int];
                    //console.log(questionsInformationObject[qid]);
                    if(questionsInformationObject[qid].patterns[stateChar].indexOf(prtId) == -1) {
                        questionsInformationObject[qid].patterns[stateChar].push(prtId);
                    }
                }
                else {
                    console.log("didn't find appropriate prt naming");
                }*/
            }
        }
        for(let qid in questions) {
            questionsInformationObject[qid].unique_users_amount = uniqueUsersIdsByQuestion[qid].length;
        }
        console.log(questionsInformationObject);


        let colors = {c:"#99ff99", p:"#ffcc99", w:"#ff9999"};
        let borderColors = {c:"#4cee4c", p:"#ee9d4c", w:"#ee4c4c"};
        //Visualize information here
        let questionsOverview = this.LALMSVisualizer.documentNode.createElement("div");
        questionsOverview.classList.add("row-wise-questions-overview");
        for(let qid in questions) {
            //questionsOverview.innerHTML += qid + ": "+ questions[qid].name + "<BR />";
            let questionDiv = this.LALMSVisualizer.documentNode.createElement("div");
            questionDiv.classList.add("single-question-overview");
            let questionNameDiv = this.LALMSVisualizer.documentNode.createElement("div");
            questionNameDiv.classList.add("lalmsviz-question-overview-main-tile");
            questionNameDiv.innerHTML = questions[qid].name;

            let questionChartDiv = this.LALMSVisualizer.documentNode.createElement("div");
            questionChartDiv.classList.add("lalmsviz-question-overview-tile");

            let curStateCount = {};
            let stateProgressionAfterRepetitionSVG = this.LALMSVisualizer.documentNode.createElementNS("http://www.w3.org/2000/svg", "svg");
            questionChartDiv.appendChild(stateProgressionAfterRepetitionSVG);
            stateProgressionAfterRepetitionSVG.setAttributeNS("http://www.w3.org/2000/svg", "viewBox", "-20 -50 250 300");
            //stateProgressionAfterRepetitionSVG.setAttribute("viewBox", "-20 -50 250 300");
            // stateProgressionAfterRepetitionSVG.setAttributeNS("http://www.w3.org/2000/svg", "width", "100%");
            // stateProgressionAfterRepetitionSVG.setAttributeNS("http://www.w3.org/2000/svg", "height", "100%");
            stateProgressionAfterRepetitionSVG.setAttributeNS("http://www.w3.org/2000/svg", "preserveAspectRatio", "xMidYMid meet");
            stateProgressionAfterRepetitionSVG.classList.add("lalmsviz-question-overview-graph");
            //Define arrow head marker.
            stateProgressionAfterRepetitionSVG.insertAdjacentHTML("afterbegin", '<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="3" refY="5"markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>');

            let patternNames = Object.keys(questionsInformationObject[qid].pattern_state_characterization);
            let patternAmount = patternNames.length;
            //Sort patterns by state
            let patternNamesByState = {}
            stateChars.forEach(stateChar => {
                patternNamesByState[stateChar] = [];
                curStateCount[stateChar] = 1;
            });
            for(let pattern_name in questionsInformationObject[qid].pattern_state_characterization) {
                patternNamesByState[questionsInformationObject[qid].pattern_state_characterization[pattern_name]].push(pattern_name);
            }
            //Additionally, sort alphabetically.
            stateChars.forEach(stateChar => {
                patternNamesByState[stateChar].sort();
            });
            let sortedPatternNames = patternNamesByState["c"].concat(patternNamesByState["p"], patternNamesByState["w"]);

            let templateCircle = this.LALMSVisualizer.documentNode.createElementNS("http://www.w3.org/2000/svg", "ellipse");
            templateCircle.setAttributeNS("http://www.w3.org/2000/svg", "stroke", "black");
            templateCircle.setAttributeNS("http://www.w3.org/2000/svg", "stroke-width", "1");
            templateCircle.setAttributeNS("http://www.w3.org/2000/svg", "rx", "20");
            templateCircle.setAttributeNS("http://www.w3.org/2000/svg", "ry", "20");
            let templateText = this.LALMSVisualizer.documentNode.createElementNS("http://www.w3.org/2000/svg", "text");
            templateText.setAttributeNS("http://www.w3.org/2000/svg", "font-family", "Arial");
            templateText.setAttributeNS("http://www.w3.org/2000/svg", "font-size", "20");
            templateText.setAttributeNS("http://www.w3.org/2000/svg", "dominant-baseline", "central");
            templateText.setAttributeNS("http://www.w3.org/2000/svg", "text-anchor", "middle");
            let templateArrowText = templateText.cloneNode(true);
            templateArrowText.setAttributeNS("http://www.w3.org/2000/svg", "font-size", "15");
            templateArrowText.setAttributeNS("http://www.w3.org/2000/svg", "stroke", "white");
            //templateArrowText.setAttributeNS("http://www.w3.org/2000/svg", "fill", "rgba(255,255,255,0.2)");
            templateArrowText.setAttributeNS("http://www.w3.org/2000/svg", "fill", "black");
            templateArrowText.setAttributeNS("http://www.w3.org/2000/svg", "paint-order", "stroke");
            templateArrowText.setAttributeNS("http://www.w3.org/2000/svg", "stroke-linejoin", "round");
            //style="stroke:white; stroke-width:0.5em; fill:black; paint-order:stroke; stroke-linejoin:round"
            templateArrowText.style.stroke = "white";
            templateArrowText.style.strokeWidth = "0.5em";
            templateArrowText.style.fill = "black";
            templateArrowText.style.paintOrder = "stroke";
            templateArrowText.style.strokeLinejoin = "round";
            
            let initialX = 0;
            let initialY = 100;
            let initialCircle = templateCircle.cloneNode(true);
            initialCircle.setAttributeNS("http://www.w3.org/2000/svg", "stroke", "#8080ff");
            initialCircle.setAttributeNS("http://www.w3.org/2000/svg", "fill", "#ccccff");
            initialCircle.setAttributeNS("http://www.w3.org/2000/svg", "cx", initialX);
            initialCircle.setAttributeNS("http://www.w3.org/2000/svg", "cy", initialY);
            let initialText = templateText.cloneNode(true);
            initialText.innerHTML = "0";
            initialText.setAttributeNS("http://www.w3.org/2000/svg", "x", initialX);
            initialText.setAttributeNS("http://www.w3.org/2000/svg", "y", initialY);

            stateProgressionAfterRepetitionSVG.appendChild(initialCircle);
            stateProgressionAfterRepetitionSVG.appendChild(initialText);
            let circlesByPatternName = {};
            //To not let the annotations cross each other badly...
            let plusOneOnEvenNodesAmount = (patternAmount+1) % 2 == 0 ? 1 : 0;
            for(let i=0;i<patternAmount;i++) {
                let letter = questionsInformationObject[qid].pattern_state_characterization[sortedPatternNames[i]];
                let number = "";
                if(patternNamesByState[letter].length > 1) {
                    number = curStateCount[letter];
                    curStateCount[letter]++;
                }
                let angle = (2*Math.PI/(patternAmount+1+plusOneOnEvenNodesAmount))*(i+1);
                let x = 100-(Math.cos(angle)*100);
                let y = 100-(Math.sin(angle)*100);

                let stateCircle = templateCircle.cloneNode(true);
                stateCircle.setAttributeNS("http://www.w3.org/2000/svg", "stroke", borderColors[letter]);
                stateCircle.setAttributeNS("http://www.w3.org/2000/svg", "fill", colors[letter]);
                stateCircle.setAttributeNS("http://www.w3.org/2000/svg", "cx", x);
                stateCircle.setAttributeNS("http://www.w3.org/2000/svg", "cy", y);
                circlesByPatternName[sortedPatternNames[i]] = stateCircle;
                let stateText = templateText.cloneNode(true);
                stateText.innerHTML = letter.toUpperCase()+number;
                stateText.setAttributeNS("http://www.w3.org/2000/svg", "x", x);
                stateText.setAttributeNS("http://www.w3.org/2000/svg", "y", y);

                stateProgressionAfterRepetitionSVG.appendChild(stateCircle);
                stateProgressionAfterRepetitionSVG.appendChild(stateText);
            }

            //ARROWS & ARROW ANNOTATIONS
            //loop again to draw arrows from the initial circle to the just created nodes
            for(let i=0;i<patternAmount;i++) {
                let movementFromInitialToPattern = questionsInformationObject[qid].initial_movements[sortedPatternNames[i]];
                if(!movementFromInitialToPattern) {
                    continue;
                }
                stateProgressionAfterRepetitionSVG.appendChild(this.LALMSVisualizer.svgArrowConnect(initialCircle, circlesByPatternName[sortedPatternNames[i]]));

                let annotationText = templateArrowText.cloneNode(true);
                annotationText.innerHTML = movementFromInitialToPattern;
                annotationText.setAttributeNS("http://www.w3.org/2000/svg", "x", (parseInt(initialCircle.getAttribute("cx"))+parseInt(circlesByPatternName[sortedPatternNames[i]].getAttribute("cx")))/2);
                annotationText.setAttributeNS("http://www.w3.org/2000/svg", "y", (parseInt(initialCircle.getAttribute("cy"))+parseInt(circlesByPatternName[sortedPatternNames[i]].getAttribute("cy")))/2);

                stateProgressionAfterRepetitionSVG.appendChild(annotationText);
            }
            let pattern_movements = questionsInformationObject[qid].pattern_movements;
            //loop again to draw arrows from each state to each other (where appropriate).
            for(let pattern_from_key in pattern_movements) {
                for(let pattern_to_key in pattern_movements[pattern_from_key]) {
                    //if _FROM_ == _TO_ visualize repetition
                    if(pattern_from_key == pattern_to_key) {
                        let position_n = sortedPatternNames.indexOf(pattern_from_key);
                        if(position_n == -1) {
                            continue;
                        }
                        //Initial circle is at position 0, so first created circle is at position 1 (array entry 0) and so an.
                        position_n += 1;
                        let angle = (2*Math.PI/(patternAmount+1+plusOneOnEvenNodesAmount))*(position_n)+Math.PI;
                        //console.log(angle);
                        stateProgressionAfterRepetitionSVG.appendChild(this.LALMSVisualizer.svgRepetitionArrow(circlesByPatternName[pattern_from_key], angle));

                        //Annotate along the same angle
                        let distFromCenter = 45;
                        //console.log(Math.cos(angle)*distFromCenter);
                        //console.log(Math.sin(angle)*distFromCenter);
                        let annotationText = templateArrowText.cloneNode(true);
                        annotationText.innerHTML = pattern_movements[pattern_from_key][pattern_to_key];
                        annotationText.setAttributeNS("http://www.w3.org/2000/svg", "x", parseInt(circlesByPatternName[pattern_from_key].getAttribute("cx"))+Math.cos(angle)*distFromCenter);
                        annotationText.setAttributeNS("http://www.w3.org/2000/svg", "y", parseInt(circlesByPatternName[pattern_from_key].getAttribute("cy"))+Math.sin(angle)*distFromCenter);

                        stateProgressionAfterRepetitionSVG.appendChild(annotationText);

                        continue;
                    }


                    //if _TO_ -> _FROM_ is also a connection to be drawn, bend the arrow.
                    let bend = 0;
                    if(pattern_movements[pattern_to_key] != undefined && pattern_movements[pattern_to_key][pattern_from_key] != undefined) {
                        bend = 25;
                    }
                    stateProgressionAfterRepetitionSVG.appendChild(this.LALMSVisualizer.svgArrowConnect(circlesByPatternName[pattern_from_key], circlesByPatternName[pattern_to_key], bend));

                    
                    //ANNOTATIONS
                    let annotationText = templateArrowText.cloneNode(true);
                    annotationText.innerHTML = pattern_movements[pattern_from_key][pattern_to_key];
                    let coordsfrom = {x: parseInt(circlesByPatternName[pattern_from_key].getAttribute("cx")), y: parseInt(circlesByPatternName[pattern_from_key].getAttribute("cy"))};
                    let coordsto = {x: parseInt(circlesByPatternName[pattern_to_key].getAttribute("cx")), y: parseInt(circlesByPatternName[pattern_to_key].getAttribute("cy"))};
                    let centerx = (coordsfrom.x+coordsto.x)/2;
                    let centery = (coordsfrom.y+coordsto.y)/2;
                    let x = 0;
                    let y = 0;
                    if(bend == 0) {
                        //If no bend, place the annotation directly between the two nodes.
                        x = centerx;
                        y = centery;
                    }
                    else {
                        //Move 90 degrees away from the center between the two nodes.
                        let dist = 15;
                        /*let angleFactor = coordsto.x-coordsfrom.x < 0 ? -1 : 1;
                        if(coordsto.x == coordsfrom.x) {
                            angleFactor = coordsto.y-coordsfrom.y < 0 ? -1 : 1;
                        }*/
                        if(coordsto.x > coordsfrom.x) {
                            dist = -dist;
                        }
                        let angleFactor = 1;
                        let angle = Math.PI/2-Math.atan((coordsto.y-coordsfrom.y)/(coordsto.x-coordsfrom.x));

                        x = centerx+Math.cos(angle*angleFactor)*dist;
                        y = centery-Math.sin(angle*angleFactor)*dist;
                    }

                    annotationText.setAttributeNS("http://www.w3.org/2000/svg", "x", x);
                    annotationText.setAttributeNS("http://www.w3.org/2000/svg", "y", y);

                    stateProgressionAfterRepetitionSVG.appendChild(annotationText);
                    //console.log("Added arrow from "+pattern_from_key+" to "+pattern_to_key+" in question "+qid);
                }
            }

            // stateProgressionAfterRepetitionSVG.style.height = "100%";
            // stateProgressionAfterRepetitionSVG.style.width = "100%";

            questionDiv.appendChild(questionNameDiv);
            questionDiv.appendChild(questionChartDiv);
            questionsOverview.appendChild(questionDiv);
            stateProgressionAfterRepetitionSVG.outerHTML += "";
            //questionsOverview += "<BR />";
        }

        /*for(let qid in questions) {
            //Visualize information here
            questionsOverview.innerHTML += qid + ": "+ questions[qid].name + "<BR />";
        }*/

        resultBlock.appendChild(questionsOverview);

        /*Plotly.newPlot(chart, [ {
        x: [1, 2, 3, 4, 5],
        y: [1, 2, 4, 8, 16] } ], {
        margin: { t: 0 } } );*/

        /*chart.classList.add("ct-chart", "ct-perfect-fourth");

        new Chartist.Line('.ct-chart', {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            series: [
              [12, 9, 7, 8, 5],
              [2, 1, 3.5, 7, 3],
              [1, 3, 4, 5, 6]
            ]
          }, {
            fullWidth: true,
            chartPadding: {
              right: 40
            }
          });*/


        /*if(!urlToFetch) {
            //User error handling.
            //...
            throw new Error("Bad quiz id 2 (not found).");
        }

        await fetch(urlToFetch).then(response => {
            console.log("received response");
            return response.text();
        })
        .then(responseText => {
            let documentNode = this.Parser.parseFromString(responseText, "text/html");
            let QuizOverviewAnalyzer = new Quiz_Overview_Analyzer(documentNode);
            QuizOverviewAnalyzer.init().then(response => {
                console.log(QuizOverviewAnalyzer);
            });
        })
        .catch(error => {
            console.log("Error in Dashboard load Promise chain");
            console.log(error);
            if(!!startAnalysisButton) {
                startAnalysisButton.classList.remove("load");
                startAnalysisButton.disabled = undefined;
            }
        });*/

        if(!!startAnalysisButton) {
            startAnalysisButton.classList.remove("load");
            startAnalysisButton.disabled = undefined;
        }

        //Display results here.


        //Following line: Emergency re-enable start button.
        //setTimeout(function() { if(!!startAnalysisButton) { startAnalysisButton.classList.remove("load"); startAnalysisButton.disabled = undefined; } if(loadingBlock != undefined && loadingBlock.parentNode != undefined) { loadingBlock.parentNode.removeChild(loadingBlock); } }, 120000)

        return true;
    }

    async downloadQuizDataChain(quiz_ids, i_current, info_node, error_node, storage_object) {

        if(storage_object == undefined) {
            storage_object = this.storage_object;
        }
        let urlToFetch = "";
        for(let j=0;j<this.Quizzes.length;j++) {
            if(this.Quizzes[j].id == quiz_ids[i_current]) {
                if(this.Quizzes[j].loaded == true) {
                    //Leave this single promise and proceed to the next in chain by throwing this one immediately to catch.
                    storage_object[quiz_ids[i_current]] = this.Quizzes[j].original_data;
                    if(info_node != undefined) {
                        info_node.innerHTML = this.Language.get("load_data", i_current+1, quiz_ids.length);
                    }
                    //throw new CatchInfoObject(1, "already loaded quiz");
                    if(i_current < quiz_ids.length-1) {
                        return this.downloadQuizDataChain(quiz_ids, i_current+1, info_node, error_node, storage_object);
                    }
                    return storage_object;
                }
                urlToFetch = this.Quizzes[j].attempts_url;
                break;
            }
        }
        if(urlToFetch == undefined || urlToFetch == "") {
            //error 12
            console.log("error 12");
            return i_current < quiz_ids.length-1 ? this.downloadQuizDataChain(quiz_ids, i_current+1, info_node, error_node, storage_object) : storage_object;
        }
        //console.log("fetching "+urlToFetch);
        return fetch(urlToFetch).then(response => {
            return response.text();
        })
        .then(responseText => {
            let fetchedDocumentNode = this.Parser.parseFromString(responseText, "text/html");
            if(!fetchedDocumentNode) {
                //error 13
                throw new Error("error 13: Couldn't fetch attempt page at "+urlToFetch);
            }
            let relevantForm = fetchedDocumentNode.querySelector(".dataformatselector");
            if(relevantForm == undefined) {
                //error 14
                throw new Error("error 14: Didn't find form dialogue at "+urlToFetch);
            }
            let downloadForm = new FormData(relevantForm);
            //According to desired interpretation, change format. Moodle default is CSV. We choose CSV here.
            downloadForm.delete("download");
            //downloadForm.append("download", "json");
            downloadForm.append("download", "csv");

            return fetch(relevantForm.action, { method: "POST", body: downloadForm })
        })
        //This step is not necessary.
        /*.then(formResponse => {
            return formResponse.blob();
        })*/
        //We may want to read it as CSV: Check the following lines-
        .then(formResponse => {
            return formResponse.text();
        })
        /*.then(csvAsText => {
            console.log(csvAsText);
        })*/
        //JSON is bad choice, because question names are, e.g., "q121300" which could be question 12 with 13.00 points max or question 121 with 3.00 points max. CSV better separates that.
        /*.then(formResponse => {
            return formResponse.json();
        })*/
        .then(/*dataAsJSON*/dataAsCSVText => {
            //console.log(dataAsJSON);
            for(let j=0;j<this.Quizzes.length;j++) {
                if(this.Quizzes[j].id == quiz_ids[i_current]) {
                    this.Quizzes[j].addOriginalData(dataAsCSVText);
                    break;
                }
            }
            storage_object[quiz_ids[i_current]] = dataAsCSVText;
            //console.log("fetched data from "+quiz_ids[i_current]+", continue with "+((i_current < quiz_ids.length-1) ? quiz_ids[i_current+1] : "nothing, stop")+".");
            if(i_current < quiz_ids.length-1) {
                if(info_node != undefined) {
                    info_node.innerHTML = this.Language.get("load_data", i_current+1, quiz_ids.length);
                }
                return this.downloadQuizDataChain(quiz_ids, i_current+1, info_node, error_node, storage_object);
            }
            if(info_node != undefined) {
                info_node.innerHTML = this.Language.get("load_data", i_current+1, quiz_ids.length)+" &mdash; "+this.Language.get("finished");
            }
            return storage_object;
        })
        .catch(error => {
            console.log("Exception in promise chain");
            //if(error instanceof Error) {
                console.log(error);
                if(error_node != undefined) {
                    error_node.innerHTML = " &mdash; "+this.Language.get("error_during_loading");
                }
            /*}
            else if(error instanceof CatchInfoObject) {
                switch(error.status) {
                    case 1:
                        console.log("Quiz already loaded. Skip.");
                        break;
                    default:
                        console.log("Unknown exception.");
                        break;
                }
            }*/
            if(i_current < quiz_ids.length-1) {
                return this.downloadQuizDataChain(quiz_ids, i_current+1, info_node, error_node, storage_object);
            }
            return storage_object;
            /*this.startAnalysisButton.classList.remove("load");
            this.startAnalysisButton.disabled = undefined;
            //loadingBlock.parentNode.removeChild(loadingBlock);
            this.LALMSVisualizer.addBlock("<p>Es ist ein Fehler aufgetreten.</p><p>Details:</p><p style=\"font-size:0.5em;\">"+error+"</p>");*/
        });
    }

    preprocessData(storage_object, additional_storage_object, label_condition_percentage) {
        let delete_count = 0;
        let nanAmount = 0;
        //If additional_storage_object is set, expect this one to be the data to be predicted.
        let data = [];
        if(label_condition_percentage == undefined) {
            label_condition_percentage = 0.8;
        }
        else if(label_condition_percentage < 0.01) {
            label_condition_percentage = 0.01;
        }
        else if(label_condition_percentage > 1) {
            label_condition_percentage = 1;
        }
        if(storage_object == undefined) {
            storage_object == this.storage_object;
        }

        if(additional_storage_object != undefined && additional_storage_object != [] && Object.keys(additional_storage_object).length != 0) {
            data = [storage_object, additional_storage_object];
        }
        else {
            let keys = Object.keys(storage_object);
            let train_object_keys = keys.slice(0,-1)
            let train_object = {};
            for(let i=0;i<train_object_keys.length;i++) {
                train_object[train_object_keys[i]] = storage_object[train_object_keys[i]];
            }
            let predict_object_key = keys.slice(-1);
            let predict_object = {};
            predict_object[predict_object_key] = storage_object[predict_object_key];

            data = [train_object, predict_object];
        }

        //data now is an array of objects that contains quizzes where the quiz id is the property number.

        let train_data_raw = data[0];
        let predict_data_raw = data[1];
        //For the beginning, expect prediction data to be one quiz. Prediction aim is a) whether a specific exercise in a quiz is accomplished (full points) or not (less than full points). b) Whether the total outcome of a quiz is bigger than x% (variable breakpoint). Prepare the prediction data accordingly.
        //---b)---
        let predict_data_table = this.processCSVData(predict_data_raw[Object.keys(predict_data_raw)[0]]);
        //Expect first line to contain the table headings.
        let headings = predict_data_table[0];
        //Strip additional quotation marks.
        headings = headings.map(function(heading) { return heading.replaceAll(/["']/g, ""); });

        //console.log(headings);
        //Search for relevant columns.
        //Todo: Add other languages here...
        let idColNum = this.getArrayIndexOfFirstEqual(headings, ["ID number", "Matrikelnummer"]);
        if(idColNum == undefined) {
            //Try E-Mail instead
            idColNum = this.getArrayIndexOfFirstEqual(headings, ["E-Mail-Adresse", "Email address"]);
        }

        if(idColNum == undefined) {
            //error 16
            console.log("error 16");
            return false;
        }

        let gradeColNum = this.getArrayIndexOfFirstBeginsWith(headings, ["Grade", "Bewertung"]);
        if(gradeColNum == undefined) {
            //error 17
            console.log("error 17");
            return false;
        }

        let maxPointsMatch = headings[gradeColNum].match(/\/(.*)/);
        if(maxPointsMatch == undefined || maxPointsMatch[1] == "") {
            //error 18
            console.log("error 18");
            return false;
        }
        let maxPoints = parseFloat(maxPointsMatch[1].replace(",", "."));
        //console.log(maxPoints);
        let breakPoint = maxPoints*label_condition_percentage;

        //Create new array with only labels and ids
        let labels = {};
        let users = {};
        let expected_value_amount = 0;
        for(let i=1;i<predict_data_table.length;i++) {
            labels[predict_data_table[i][idColNum]] = predict_data_table[i][gradeColNum] < breakPoint ? -1 : 1;
            users[predict_data_table[i][idColNum]] = {label:undefined, values:[]};
            users[predict_data_table[i][idColNum]].label = labels[predict_data_table[i][idColNum]];
        }
        //console.log(labels);
        
        //users now contains labels of each user by user id. Additionally, values are filled in the following.
        

        //Prepare the train data.
        let keys = Object.keys(train_data_raw);
        let train_data_tables = {};
        for(let i=0;i<keys.length;i++) {
            train_data_tables[keys[i]] = this.processCSVData(train_data_raw[keys[i]]);

            let headings = train_data_tables[keys[i]][0];
            //Strip additional quotation marks.
            headings = headings.map(function(heading) { return heading.replaceAll(/["']/g, ""); });

            //console.log(headings);
            //Search for relevant columns.
            //Todo: Add other languages here...
            let idColNum = this.getArrayIndexOfFirstEqual(headings, ["ID number", "Matrikelnummer"]);
            if(idColNum == undefined) {
                //Try E-Mail instead
                idColNum = this.getArrayIndexOfFirstEqual(headings, ["E-Mail-Adresse", "Email address"]);
            }

            if(idColNum == undefined) {
                //error 19
                console.log("error 19");
                return false;
            }

            //Here we take the grading of single questions instead.
            let questionColNums = this.getAllIndexOfFirstBeginsWith(headings, ["Q. ", "F. "]);
            expected_value_amount += questionColNums.length;
            let maxPointsByColNum = {};
            for(let j=0;j<questionColNums.length;j++) {
                let matches = headings[questionColNums[j]].match(/(\d*)\s*\/\s*(.*)/);
                if(matches == undefined || matches[1] == "" || matches[2] == "") {
                    //error 20
                    console.log("error 20");
                    continue;
                }
                maxPointsByColNum[questionColNums[j]] = parseFloat(matches[2].replace(/"'/, ""));
            }
            
            //Create a new array containing only id and question points percentage.
            for(let j=1;j<train_data_tables[keys[i]].length;j++) {
                //Ignore users that are not in the main object and those, for whom already values of this quiz were obviously added.
                if(users[train_data_tables[keys[i]][j][idColNum]] == undefined || users[train_data_tables[keys[i]][j][idColNum]].values.length == expected_value_amount) {
                    continue;
                }
                for(let k=0;k<questionColNums.length;k++) {
                    let value = train_data_tables[keys[i]][j][questionColNums[k]] / maxPointsByColNum[questionColNums[k]];
                    if(isNaN(value)) {
                        //In case of nan, value is not added. User is removed later due to unexpected amount of values.
                        nanAmount++;
                        continue;
                    } 
                    users[train_data_tables[keys[i]][j][idColNum]].values.push(
                        train_data_tables[keys[i]][j][questionColNums[k]] / maxPointsByColNum[questionColNums[k]]
                    );
                }
            }

            //Delete all users that have not enough values. I.e., didn't attend the last analyzed quiz.
            for(let user_id in users) {
                if(users[user_id].values.length != expected_value_amount) {
                    delete users[user_id];
                    delete_count++;
                }
            }
        }
        //console.log(users);

        //By default JSON data from Moodle quizzes comes in the form [[ {lastname:"...", ...} ]] for each quiz.
        
        //Check for same users and make one row for each.
        //console.log(delete_count);
        //console.log(nanAmount);
        return users;
    }

    train_test_split(data, relative_amount_train, shuffle) {
        if(relative_amount_train == undefined) {
            relative_amount_train = 0.8;
        }
        if(shuffle == undefined) {
            shuffle = true;
        }
        if(data == null) {
            return false;
        }
        if(Array.isArray(data)) {
            let cutOffAsInt = Math.floor(data.length*relative_amount_train);
            if(shuffle == true) {
                data_to_return = this.durstenfeldShuffle(data);
            }
            return {train:data_to_return.slice(0,-cutOffAsInt), test:data_to_return.slice(cutOffAsInt)}; 
        }
        else if(typeof data === "object") {
            let keys = Object.keys(data);
            let cutOffAsInt = Math.floor(keys.length*relative_amount_train);
            let shuffled_keys = this.durstenfeldShuffle(keys);
            let train_data = {};
            let test_data = {};
            for(let i=0;i<cutOffAsInt;i++) {
                train_data[shuffled_keys[i]] = data[shuffled_keys[i]];
            }
            for(let i=cutOffAsInt;i<shuffled_keys.length;i++) {
                test_data[shuffled_keys[i]] = data[shuffled_keys[i]];
            }
            return {train:train_data, test:test_data}; 
        }
        return;
    }

    durstenfeldShuffle(array) {
        //Durstenfeld shuffle. Thanks to Laurens Holst from stackoverflow: https://stackoverflow.com/a/12646864 .
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;        
    }

    getColIdentifierFromHeaderText(expectedHeaderTextOrArray) {
        let expectedTextArray = [];
        if(Array.isArray(expectedHeaderTextOrArray)) {
            expectedTextArray = expectedHeaderTextOrArray;
        }
        else {
            expectedTextArray = [expectedHeaderTextOrArray]
        }
        let headerNodes = this.quiz_table.querySelectorAll("th");
        let relevantHeaderNode = undefined;
        for(let i=0;i<headerNodes.length;i++) {
            if(expectedTextArray.indexOf(headerNodes[i].innerHTML.trim()) > -1) {
                relevantHeaderNode = headerNodes[i];
                break;
            }
        }
        if(relevantHeaderNode == undefined) {
            //error 6
            //console.log("error6");
            return false;
        }

        let classNames = relevantHeaderNode.classList;
        let relevantClassName = undefined;
        for(let i=0;i<relevantHeaderNode.classList.length;i++) {
            if(classNames[i].match(/c\d+/)) {
                relevantClassName = classNames[i];
                break;
            }
        }
        if(relevantClassName == undefined) {
            //error 7
            //console.log("error7");
            return false;
        }
        return relevantClassName;
    }

    getArrayIndexOfFirstEqual(haystack, nameOrArray) {
        let colNames = [];
        if(Array.isArray(nameOrArray)) {
            colNames = nameOrArray;
        }
        else {
            colNames = [nameOrArray];
        }
        let colNum;
        for(let i=0;i<colNames.length;i++) {
            let indexTest = haystack.indexOf(colNames[i]);
            if(indexTest > -1) {
                return indexTest;
            }
        }
        return;
    }

    getArrayIndexOfFirstBeginsWith(haystack, nameOrArray) {
        let colNames = [];
        if(Array.isArray(nameOrArray)) {
            colNames = nameOrArray;
        }
        else {
            colNames = [nameOrArray];
        }
        for(let i=0;i<colNames.length;i++) {
            for(let j=0;j<haystack.length;j++) {
                let indexTest = haystack[j].indexOf(colNames[i]);
                if(indexTest === 0) {
                    return j;
                }
            }
        }
        return;
    }

    getAllIndexOfFirstBeginsWith(haystack, nameOrArray) {
        let colNames = [];
        if(Array.isArray(nameOrArray)) {
            colNames = nameOrArray;
        }
        else {
            colNames = [nameOrArray];
        }
        let colNums = [];
        for(let i=0;i<colNames.length;i++) {
            for(let j=0;j<haystack.length;j++) {
                let indexTest = haystack[j].indexOf(colNames[i]);
                if(indexTest === 0) {
                    colNums.push(j);
                }
            }
        }
        return colNums;
    }

    //Thanks to Mounir from https://blog.mounirmesselmeni.de/reading-csv-file-with-javascript-and-html5-file-api .
    processCSVData(csvString, cell_delimiter, row_delimiter) {
        if(cell_delimiter == undefined) {
            cell_delimiter = ",";
        }
        if(row_delimiter == undefined) {
            row_delimiter = /\r\n|\n/;
        }
        //console.log(csvString);
        var allTextLines = csvString.split(row_delimiter);
        var lines = [];
        for (var i=0; i<allTextLines.length; i++) {
            var data = allTextLines[i].split(cell_delimiter);
                var tarr = [];
                for (var j=0; j<data.length; j++) {
                    tarr.push(data[j]);
                }
                lines.push(tarr);
        }
        return lines;
    }

    async downloadQuizResultFileByIdAs(quiz_id, type, file_prefix) {
        let mytype = type;
        if(mytype == undefined) {
            mytype = "csv";
        }

        if(file_prefix == undefined) {
            file_prefix = "";
        }

        let urlToFetch = "";
        let index = -1;
        for(let j=0;j<this.Quizzes.length;j++) {
            if(this.Quizzes[j].id == quiz_id) {
                urlToFetch = this.Quizzes[j].attempts_url;
                index = j;
                break;
            }
        }
        if(urlToFetch == undefined || urlToFetch == "") {
            console.log("bad url for quiz "+this.Quizzes[index].name);
            console.log(urlToFetch);
            return;
        }

        return fetch(urlToFetch).then(response => {
            return response.text();
        })
        .then(responseText => {
            let fetchedDocumentNode = this.Parser.parseFromString(responseText, "text/html");
            if(!fetchedDocumentNode) {
                //error 13
                throw new Error("error 13: Couldn't fetch attempt page at "+urlToFetch);
            }
            let relevantForm = fetchedDocumentNode.querySelector(".dataformatselector");
            if(relevantForm == undefined) {
                //error 14
                throw new Error("error 14: Didn't find form dialogue at "+urlToFetch);
            }
            let downloadForm = new FormData(relevantForm);
            downloadForm.delete("download");
            downloadForm.append("download", mytype);
            //downloadForm.append("download", "csv");

            return fetch(relevantForm.action, { method: "POST", body: downloadForm })
        })
        .then(formResponse => {
            return formResponse.blob();
        })
        .then(fileAsBlob => {
            let url = window.URL.createObjectURL(fileAsBlob);
            let a = document.createElement('a');
            a.href = url;
            a.download = file_prefix+this.Quizzes[index].name;
            document.body.appendChild(a);
            a.click();    
            a.remove();
        })
        .catch(error => {
            console.log("Error during file download");
            console.log(error);
        });
    }

    async downloadAllQuizResultFilesByIdAs(type) {
        let mytype = type;
        if(mytype == undefined) {
            mytype = "csv";
        }
        let all_quiz_ids = [];
        for(let j=0;j<this.Quizzes.length;j++) {
            all_quiz_ids.push(this.Quizzes[j].id);
        }

        return this.chainQuizResultFileDownloadAs(all_quiz_ids, 0, mytype).catch(error => {
            console.log("Error in promise chain (download all)");
            console.log(error);
        });

    }

    async chainQuizResultFileDownloadAs(quiz_ids, i_current, type) {
        let mytype = type;
        if(mytype == undefined) {
            mytype = "csv";
        }
        return this.downloadQuizResultFileByIdAs(quiz_ids[i_current], mytype, i_current+"_").then(response => {
            //throw new CatchInfoObject(1, "already loaded quiz");
            if(i_current < quiz_ids.length-1) {
                return this.chainQuizResultFileDownloadAs(quiz_ids, i_current+1, mytype, i_current+1+"_");
            }
            return;
        })
        .catch(error => {
            console.log("Error in promise chain ("+i_current+")");
            console.log(error);
        });

    }
}

/*class CatchInfoObject {
    constructor(status, message) {
        this.status = status;
        this.message = message;
    }
}*/

class Quiz {
    constructor(name, id, attempts_url) {
        this.name = name;
        this.id = id;
        this.attempts_url = attempts_url;
        this.loaded = false;
        this.original_data;
    }

    addOriginalData(data) {
        this.loaded = true;
        this.original_data = data;
    }
}

class LA_LMS_Visualizer {
    constructor(Language) {
        this.documentNode = document;
        this.iconContainer;
        this.dmIcon;
        this.screenModal;
        this.screenContent;
        this.backToMenuBlock;
        this.Language = Language;

        let object = this;

        //Since the users are told to start the script after page is fully loaded, we don't need something like window.addEventListener("DOMContentLoaded", function() { ...}) here.
        let style = this.documentNode.createElement("style");
        style.innerHTML = ".dm-icon { float:right; border:2px solid black; border-radius:50%; width: 7.5em; box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, .3), 0 0.0625rem 0.125rem rgba(0, 0, 0, .2); cursor:pointer; background-color:white; } .icon-container { position:fixed; bottom:50px; right:50px; float:right; display:flex; flex-direction:column; z-index:9; opacity:0.3; transform:scaleY(1); } .hoverable-vanishable { transition:opacity 1s, transform 1s; } .icon-container:hover { opacity:1; } .icon-container.vanish { opacity:1; transform:scaleY(0); } .screen-modal.vanish { transform:translate(-50%,-50%) scaleY(0); } .screen-modal { position:fixed; top:50%; left:50%; width:80%; height:80%; background-color:#ffffff; opacity:0.3; border-radius:2%; border:5px solid black; transform:translate(-50%,-50%) scaleY(1); font-size:1.5em; z-index:10} .screen-modal:hover { opacity:1; } .modal-close-x { position:absolute; top:0; right:0; padding:10px; font-size:2em; cursor:pointer; } .screen-content { width:100%; height:100%; padding:2em; overflow-y:scroll; } .lalmsviz-block { border:1px solid black; border-radius:5pt; padding:0.5em; margin-bottom:1em; } .btn.load .default-text, .btn.active .default-text { display:none; } .btn .load-text, .btn .alt-text { display:none; } .btn.load .load-text, .btn.active .alt-text { display:block; } .loading-info-block { text-align:center; } .confusion-matrix { margin-left:auto; margin-right:auto; text-align:center; } .confusion-matrix td, .confusion-matrix th { padding:0.25em; } .prediction-options { display:none; border:1px solid black; border-radius:3px; } .prediction-options.active { display:block; } .lalmsviz-tile-parent { display:flex; gap:10px; flex-wrap:wrap; } .lalmsviz-tile { height:200px; border-radius:10px; border:1px solid black; flex-grow:1; min-width:200px; display:flex; flex-flow:column; align-items:center; cursor:pointer; } .lalmsviz-tile img { height:100%; } .main-select { width:100%; } .lalmsviz-charts-parent { display:flex; gap:10px; flex-wrap:wrap; } .lalmsviz-chart-tile { height:200px; border-radius:10px; border:1px solid black; flex-grow:1; min-width:200px; display:flex; flex-flow:column; align-items:center; } .row-wise-question-overview { display:flex; flex-direction:column; } .single-question-overview { border:1px solid black; border-radius:5px; display:flex; align-items:center; } .lalmsviz-question-overview-main-tile { flex-grow:2; padding:1em; } .lalmsviz-question-overview-tile { flex-grow:1; padding:0; height:100%; } .lalmsviz-question-overview-graph { /*height:100%;*/ min-height:200px; }";
        //Classes to switch between modes (menus).
        style.innerHTML += " .menu.inactive { display:none; } .back-to-menu { cursor:pointer; }";
        //Additional styles for moveable multi select (mms) element. Thanks to Kavian K. from stackoverflow for this solution. https://stackoverflow.com/a/50877712
        style.innerHTML += " .mms-parent { display:flex; flex-direction:row; height:20em; } .mms-main-list { flex-grow:1; flex-shrink:0; min-width:0; flex-basis:0; } .mms-lists { flex-grow:1; flex-shrink:0; min-width:0; display:flex; flex-direction:column; flex-basis:0; } .mms-list { display:flex; flex-direction:row; flex-grow:1; flex-shrink:0; min-width:0; flex-basis:0; } .mms-buttons { display:flex; flex-direction:column; min-width:0; } .mms-list-label {  } .mms-select { flex-grow:1; flex-shrink:0; min-width:0; flex-basis:0; } .mms-button { flex-grow:1; flex-shrink:0; min-width:0; flex-basis:0; font-size:1.5em; } .mms-list-container { flex-direction:column; flex-basis:0; flex-grow:1; flex-shrink:0; min-width:0; display:flex; }";
        //Additional CSS for a simple loading spinner. Thanks to Dom from dcode. https://dev.to/dcodeyt/how-to-create-a-css-only-loading-spinner-5fh5 
        style.innerHTML += ".loading { display: flex; justify-content: center; } .loading::after { content: \"\"; width: 50px; height: 50px; border: 10px solid #dddddd; border-top-color: #009579; border-radius: 50%; animation: loading 1s ease infinite; } @keyframes loading { to { transform: rotate(1turn); } }";

        this.documentNode.getElementsByTagName('head')[0].appendChild(style);
        
        let fixedContainer = document.createElement("div");
        fixedContainer.classList.add("icon-container", "hoverable-vanishable");
        this.iconContainer = fixedContainer;
        
        let dmIcon = this.documentNode.createElement("img");
        dmIcon.classList.add("dm-icon");
        dmIcon.src = "https://marvin.hs-bochum.de/~mneugebauer/lightweight_la/robot-svgrepo-com-mit-licensed.svg";

        dmIcon.onclick = function() {
            object.toggleScreen();
        }
        this.dmIcon = dmIcon;

        let screenModal = this.documentNode.createElement("div");
        screenModal.classList.add("screen-modal", "hoverable-vanishable", "vanish");

        let closeButton = this.documentNode.createElement("span");
        closeButton.classList.add("modal-close-x");
        closeButton.innerHTML = "&times;";
        closeButton.onclick = function() {
            object.toggleScreen();
        };

        let screenContent = this.documentNode.createElement("div");
        screenContent.classList.add("screen-content");
        this.screenContent = screenContent;

        let backToMenuBlock = this.addBlock("< "+this.Language.get("back_to_main"));
        backToMenuBlock.classList.add("back-to-menu", "menu", "inactive");
        backToMenuBlock.onclick = this.changeScreen.bind(this, "welcome");

        let welcomeMessageBlock = this.addBlock(this.Language.get("welcome"));
        welcomeMessageBlock.classList.add("menu", "menu_welcome");

        let optionsBlock = this.addBlock();
        optionsBlock.classList.add("lalmsviz-tile-parent", "menu", "menu_welcome");
        let options = [
            {label:"label_quiz_overview", imgsrc:"https://marvin.hs-bochum.de/~mneugebauer/lightweight_la/img/states_quick.svg", menu_name:"quiz_overview"},
            {label:"label_prediction", imgsrc:"https://marvin.hs-bochum.de/~mneugebauer/lightweight_la/img/decision_forest_from_analyticsvidhya_cropped.png", menu_name:"prediction"}
        ];

        options.forEach(option => {
            let tile = document.createElement("div");
            tile.classList.add("lalmsviz-tile");
            tile.onclick = this.changeScreen.bind(this,option.menu_name);

            let tileImg = document.createElement("img");
            tileImg.src = option.imgsrc;

            let tileLabel = document.createElement("div");
            tileLabel.innerHTML = this.Language.get(option.label)

            tile.appendChild(tileImg);
            tile.appendChild(tileLabel);
            optionsBlock.appendChild(tile);
        });


        screenModal.appendChild(closeButton);
        screenModal.appendChild(screenContent);

        this.screenModal = screenModal;
        this.documentNode.body.appendChild(this.screenModal);

        this.iconContainer.appendChild(dmIcon);
        this.documentNode.body.appendChild(this.iconContainer);

        //Deprecated (already done by Moodle element): Add Plot library
        /*const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        this.documentNode.head.appendChild(script);*/
    }

    toggleScreen() {
        this.iconContainer.classList.toggle("vanish");
        this.screenModal.classList.toggle("vanish");
    }

    createBlock(innerHTML) {
        let block = this.documentNode.createElement("div");
        block.classList.add("lalmsviz-block")
        if(innerHTML != undefined) {
            block.innerHTML = innerHTML;
        }
        return block;
    }

    addNode(node) {
        this.screenContent.appendChild(node);
        return true;
    }

    addBlock(innerHTML) {
        let block = this.createBlock(innerHTML);
        this.addNode(block)
        return block;
    }

    addLoadingBlock() {
        let block = this.addBlock();
        let loadingNode = this.documentNode.createElement("div");
        loadingNode.classList.add("loading", "loading--full-height");
        block.appendChild(loadingNode);
        return block;
    }

    createInfoNode(innerHTML) {
        let info_node = this.documentNode.createElement("span");
        let info_container = this.documentNode.createElement("div");
        let info_prefix = this.documentNode.createElement("span");
        let info_suffix = this.documentNode.createElement("span");
        info_node.innerHTML = innerHTML;
        info_container.appendChild(info_prefix);
        info_container.appendChild(info_node);
        info_container.appendChild(info_suffix);

        return {container: info_container, main:info_node, prefix:info_prefix, suffix:info_suffix};
    }

    createMoveableMultiSelect(optionsObject, list_amount, main_id, ...args) {
        //Expect options to be an object in the form option_value => label.
        //args contains the id/names of the other lists

        let parent = this.documentNode.createElement("div");
        parent.classList.add("mms-parent");
        //let main_list_item = this.documentNode.createElement("div");
        //main_list_item.classList.add("mms-li");
        let main_select = this.documentNode.createElement("select");
        main_select.classList.add("mms-main-list");
        main_select.multiple = "multiple";
        main_select.id = main_id;
        main_select.name = main_id;

        let choose_list_item = this.documentNode.createElement("div");
        choose_list_item.classList.add("mms-lists");

        for(let i=0;i<list_amount;i++) {
            let select_id = args[i*2];
            let label = args[i*2+1];
            if(select_id == undefined) {
                //error 11;
                select_id = "mms_empty_identifier_"+i;
            }

            if(label == undefined) {
                //error 11;
                label = "Empty label"+i;
            }

            let list_container = this.documentNode.createElement("div");
            list_container.classList.add("mms-list-container");

            let list_label = this.documentNode.createElement("div");
            list_label.innerHTML = label;
            list_container.appendChild(list_label);

            let list_element = document.createElement("div");
            list_element.classList.add("mms-list");

            

            //buttons
            let button_div = this.documentNode.createElement("div");
            button_div.classList.add("mms-buttons");
            let add_button = this.documentNode.createElement("button");
            add_button.classList.add("mms-button");
            //Moodle specific classes for buttons.
            add_button.classList.add("btn", "btn-primary");
    
            let remove_button = add_button.cloneNode(true);
            add_button.classList.add("mms-add");
            add_button.innerHTML = /*"&#8702;"*/"&gt;";
            remove_button.classList.add("mms-remove");
            remove_button.innerHTML = /*"&#8701;"*/"&lt;";
    
            add_button.onclick = function() {
                var fromEl = document.getElementById(main_id),
                toEl = document.getElementById(select_id);

                if (fromEl.selectedIndex >= 0) {
                    var index = toEl.options.length;
            
                    for(var i = 0; i < fromEl.options.length;i++) {
                        if (fromEl.options[i].selected) {
                            toEl.options[index] = fromEl.options[i];
                            i--;
                            index++
                        }
                    }
                }
            };

            remove_button.onclick = function() {
                var fromEl = document.getElementById(select_id),
                toEl = document.getElementById(main_id);

                if (fromEl.selectedIndex >= 0) {
                    var index = toEl.options.length;
            
                    for(var i = 0; i < fromEl.options.length;i++) {
                        if (fromEl.options[i].selected) {
                            toEl.options[index] = fromEl.options[i];
                            i--;
                            index++
                        }
                    }
                }
            };

            button_div.appendChild(add_button);
            button_div.appendChild(remove_button);

            //list
            let add_select = this.documentNode.createElement("select");
            add_select.classList.add("mms-select");
            add_select.multiple = "multiple";
            add_select.id = select_id;
            add_select.name = select_id;

            list_element.appendChild(button_div);
            list_element.appendChild(add_select);
            list_container.appendChild(list_element)
            choose_list_item.appendChild(list_container);
        }

        

        for(let key in optionsObject) {
            let option = this.documentNode.createElement("option");
            option.value = key;
            option.innerHTML = optionsObject[key];
            main_select.appendChild(option);
        }

        //main_list_item.appendChild(main_select);

        //parent.appendChild(main_list_item);
        //parent.appendChild(button_item);
        parent.appendChild(main_select);
        parent.appendChild(choose_list_item);
        //parent.appendChild(choose_list_item);
        return parent;
    }

    changeScreen(screen) {
        this.screenContent.querySelectorAll(".menu").forEach(function(menu_node) {
            menu_node.classList.add("inactive");
        });

        let activedNodesCount = 0;
        this.screenContent.querySelectorAll(".menu.menu_"+screen).forEach(function(menu_node) {
            menu_node.classList.remove("inactive");
            activedNodesCount++;
        });

        if(screen != "welcome") {
            //Show "Back to selection" block.
            if(activedNodesCount == 0) {
                //Error handling, e.g., back to main menu.
                this.changeScreen("welcome");
                return;
            }

            this.screenContent.querySelectorAll(".back-to-menu").forEach(function(back_to_menu_node) {
                back_to_menu_node.classList.remove("inactive");
            });
        }

        if(activedNodesCount == 0 && screen != "welcome") {
            //Error handling, e.g., back to main menu.
            this.changeScreen("welcome");
        }
    }

    getStartAnalysisButtonContainer(onclick, label_initial, label_load) {
        let startAnalysisButtonContainer = this.documentNode.createElement("div");
        let startAnalysisButton = this.documentNode.createElement("button");

        if(!label_initial) {
            label_initial = "start_analysis";
        }
        if(!label_load) {
            label_load = "analysis_running";
        }

        //Following lines serve a loading spinner inside the button.
        /*let startButtonTextNode = this.documentNode.createElement("div");
        startButtonTextNode.classList.add("default-text");
        startButtonTextNode.innerHTML = this.Language.get("start_analysis");
        let startButtonLoadingNode = this.documentNode.createElement("div");
        startButtonLoadingNode.classList.add("loading", "loading--full-height");

        startAnalysisButton.appendChild(startButtonTextNode);
        startAnalysisButton.appendChild(startButtonLoadingNode);*/

        let startButtonTextNode = this.documentNode.createElement("div");
        startButtonTextNode.classList.add("default-text");
        startButtonTextNode.innerHTML = this.Language.get(label_initial);
        let startButtonLoadingNode = this.documentNode.createElement("div");
        startButtonLoadingNode.classList.add("load-text", "loading--full-height");
        startButtonLoadingNode.innerHTML = this.Language.get(label_load);

        startAnalysisButton.appendChild(startButtonTextNode);
        startAnalysisButton.appendChild(startButtonLoadingNode);

        //Moodle specific styles
        startAnalysisButton.classList.add("btn", "btn-primary");
        startAnalysisButtonContainer.appendChild(startAnalysisButton);

        if(onclick != undefined) {
            startAnalysisButton.onclick = onclick;
        }

        return startAnalysisButtonContainer;
    }

    svgRepetitionArrow(a, angle, spaceAngle, bendFactor) {
        if(angle == undefined) {
            angle = 0;
        }
        if(spaceAngle == undefined) {
            spaceAngle = 2*Math.PI/10; //10% of the circle
        }
        if(bendFactor == undefined) {
            bendFactor = 50;
        }
        console.log("repetition arrow");
        let arrow = this.documentNode.createElement("path");
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "strokeWidth", "2");
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "stroke", "black");
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "fill", "none");

        let acenter = { x:parseInt(a.getAttribute("cx")), y:parseInt(a.getAttribute("cy")) };

        //Only ellipsis and circles are supported at the moment.
        if(a.tagName != "ellipse" && a.tagName != "circle") {
            return;
        }

        let rx = 0;
        let ry = 0;
        if(a.tagName == "circle") {
            rx = a.getAttribute("r");
            ry = rx;
        }
        else if(a.tagName == "ellipse") {
            rx = a.getAttribute("rx");
            ry = a.getAttribute("rx");
        }
        //Coords may only include digits to be dealt validly by the following script.
        let matchx = rx.match(/^\d*$/);
        let matchy = ry.match(/^\d*$/);
        if(!matchx || !matchx[0] || !matchy || !matchy[0]) {
            console.log("bad radius for outer radius calculation in svgarrowconnect");
            return;
        }

        let coordsfrom = {x:0, y:0};
        let coordsto = {x:0, y:0};
        let coords = [coordsfrom, coordsto];
        let bendcoordsfrom = {x:0, y:0};
        let bendcoordsto = {x:0, y:0};
        let bendcoords = [bendcoordsfrom, bendcoordsto];
        for(let i=0;i<coords.length;i++) {
            let positionAngle = angle+(spaceAngle*(i == 0 ? 1 : -1));
            coords[i].x = acenter.x+Math.cos(positionAngle)*rx;
            coords[i].y = acenter.y+Math.sin(positionAngle)*ry;

            bendcoords[i].x = coords[i].x+Math.cos(positionAngle)*bendFactor;
            bendcoords[i].y = coords[i].y+Math.sin(positionAngle)*bendFactor;
        }

        let dStr =
            "M" +
            (coordsfrom.x      ) + "," + (coordsfrom.y)+
            "C" +
            (bendcoordsfrom.x) + "," + (bendcoordsfrom.y) + " " +
            (bendcoordsto.x) + "," + (bendcoordsto.y) + " " +
            (coordsto.x       ) + "," + (coordsto.y);

        arrow.setAttributeNS("http://www.w3.org/2000/svg", "d", dStr);
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "marker-end", "url(#arrowhead)");
        return arrow;
    }

    svgArrowConnect(a, b, bend) {
        //console.log("arrow connect start");
        if(bend == undefined) {
            bend = 0;
        }

        let arrow = this.documentNode.createElement("path");
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "strokeWidth", "2");
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "stroke", "black");
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "fill", "none");
        
        let acenter = { x:parseInt(a.getAttribute("cx")), y:parseInt(a.getAttribute("cy")) };
        let bcenter = { x:parseInt(b.getAttribute("cx")), y:parseInt(b.getAttribute("cy")) };

        let fromcoords = {x:acenter.x, y:acenter.y};
        let tocoords = {x:bcenter.x, y:bcenter.y};

        //Special handling for ellipses and circles: calculate start and end positions from radius.
        let elements = [a, b];
        let coords = [fromcoords, tocoords];
        let angle = bcenter.x-acenter.x == 0 ? Math.PI/2 : Math.atan((bcenter.y-acenter.y)/(bcenter.x-acenter.x));
        let diffAdditionFactor = bcenter.x-acenter.x >= 0  ? 1 : -1;
        bend = bcenter.x-acenter.x < 0 ? -bend : bend;
        if(bcenter.x == acenter.x) {
            bend = bcenter.y-acenter.y < 0 ? -bend : bend;
            diffAdditionFactor = bcenter.y-acenter.y >= 0  ? 1 : -1;
        }
        //console.log(angle);
        for(let i=0;i<elements.length;i++) {
            if(elements[i].tagName == "ellipse" || elements[i].tagName == "circle") {
                let rx = 0;
                let ry = 0;
                if(elements[i].tagName == "circle") {
                    rx = elements[i].getAttribute("r");
                    ry = rx;
                }
                else if(elements[i].tagName == "ellipse") {
                    rx = elements[i].getAttribute("rx");
                    ry = elements[i].getAttribute("rx");
                }
                //Coords may only include digits to be dealt validly by the following script.
                let matchx = rx.match(/^\d*$/);
                let matchy = ry.match(/^\d*$/);
                if(!matchx || !matchx[0] || !matchy || !matchy[0]) {
                    console.log("bad radius for outer radius calculation in svgarrowconnect");
                    continue;
                }

                //Calculate outer point of ellipse
                let diffFromCenter = {x:Math.cos(angle+i*Math.PI)*rx, y:Math.sin(angle+i*Math.PI)*ry};
                //console.log(diffFromCenter);
                let outercoords = {x:coords[i].x+diffFromCenter.x*diffAdditionFactor, y:coords[i].y+diffFromCenter.y*diffAdditionFactor};
                //console.log(outercoords);
                coords[i].x = outercoords.x;
                coords[i].y = outercoords.y;
            }
            else {
                //console.log("neither circle nor ellipse");
            }
        }
        //console.log(coords);


        //let dist = {x:(bcenter.x-acenter.x), y:(bcenter.y-acenter.y)};
        //let angle = Math.atan(dist.y/dist.x);

        //console.log(angle);
        //Thanks to Andrew Willems from stackoverflow for inspiration: https://stackoverflow.com/a/39575674
        let dStr =
            "M" +
            (fromcoords.x      ) + "," + (fromcoords.y);
        if(!bend) {
            dStr += " "+
            "L"+
            (tocoords.x      ) + "," + (tocoords.y);
        }
        else {
            //console.log("bend");
            //console.log(a);
            //console.log(b);
            dStr += " " +
            "C" +
            (fromcoords.x - bend) + "," + (fromcoords.y) + " " +
            (tocoords.x - bend) + "," + (tocoords.y) + " " +
            (tocoords.x       ) + "," + (tocoords.y);
        }

        arrow.setAttributeNS("http://www.w3.org/2000/svg", "d", dStr);
        arrow.setAttributeNS("http://www.w3.org/2000/svg", "marker-end", "url(#arrowhead)");
        return arrow;
    }
}

class LanguagePack {
    constructor(formattableStringsObject) {
        this.object = {};
        for(let property in formattableStringsObject) {
            if(formattableStringsObject[property].indexOf("{") > -1) {
                let args = [];
                let argsMatchAsArray = [...formattableStringsObject[property].matchAll(/\{(.*?)\}/g)];
                if(argsMatchAsArray == undefined || !argsMatchAsArray[0] || argsMatchAsArray == []) {
                    this.object[property] = formattableStringsObject[property];
                    continue;
                }
                for(let i=0;i<argsMatchAsArray.length;i++) {
                    //Is bad?
                    if(!argsMatchAsArray[i][1] || argsMatchAsArray[i][1] == "") {
                        continue;
                    }
                    //Is already contained in args? (I.e., same value at multiple points of the string.)
                    if(args.indexOf(argsMatchAsArray[i][1]) > -1) {
                        continue;
                    }
                    args.push(argsMatchAsArray[i][1]);
                }
                let argumentNames = args;
                this.object[property] = function(...args) {
                    let string = formattableStringsObject[property];
                    for(let i=0;i<argumentNames.length;i++) {
                        if(!args[i] && args[i] !== 0) {
                            continue;
                        }
                        string = string.replaceAll("\{"+argumentNames[i]+"\}", args[i])
                    }
                    return string;
                };
            }
            else {
                let string = formattableStringsObject[property];
                this.object[property] = function() {
                    return string;
                }
            }
        }
    }

    get(key, ...args) {
        if(!Object.hasOwn(this.object, key)) {
            throw new Error("unknown language key \""+key+"\"");
        }
        return this.object[key](...args);
    }

}

/*---------------------------vvv---RANDOMFOREST.JS---vvv------------------------*/
// MIT License
// Andrej Karpathy
var forestjs = (function(){
  
    var RandomForest = function(options) {
    }
    
    RandomForest.prototype = {
      
      /*
      data is 2D array of size N x D of examples
      labels is a 1D array of labels (only -1 or 1 for now). In future will support multiclass or maybe even regression
      options.numTrees can be used to customize number of trees to train (default = 100)
      options.maxDepth is the maximum depth of each tree in the forest (default = 4)
      options.numTries is the number of random hypotheses generated at each node during training (default = 10)
      options.trainFun is a function with signature "function myWeakTrain(data, labels, ix, options)". Here, ix is a list of 
                       indeces into data of the instances that should be payed attention to. Everything not in the list 
                       should be ignored. This is done for efficiency. The function should return a model where you store 
                       variables. (i.e. model = {}; model.myvar = 5;) This will be passed to testFun.
      options.testFun is a function with signature "funtion myWeakTest(inst, model)" where inst is 1D array specifying an example,
                       and model will be the same model that you return in options.trainFun. For example, model.myvar will be 5.
                       see decisionStumpTrain() and decisionStumpTest() downstairs for example.
      */
      train: function(data, labels, options) {
      
        options = options || {};
        this.numTrees = options.numTrees || 100;
        
        // initialize many trees and train them all independently
        this.trees= new Array(this.numTrees);
        for(var i=0;i<this.numTrees;i++) {
          this.trees[i] = new DecisionTree();
          this.trees[i].train(data, labels, options);
        }
      },
      
      /*
      inst is a 1D array of length D of an example. 
      returns the probability of label 1, i.e. a number in range [0, 1]
      */
      predictOne: function(inst) {
        
        // have each tree predict and average out all votes
        var dec=0;
        for(var i=0;i<this.numTrees;i++) {
          dec += this.trees[i].predictOne(inst);
        }
        dec /= this.numTrees;
        return dec;
      },
      
      // convenience function. Here, data is NxD array. 
      // returns probabilities of being 1 for all data in an array.
      predict: function(data) {
        
        var probabilities= new Array(data.length);
        for(var i=0;i<data.length;i++) {
          probabilities[i]= this.predictOne(data[i]);
        }
        return probabilities;
        
      }
      
    }
    
    // represents a single decision tree
    var DecisionTree = function(options) {
    }
    
    DecisionTree.prototype = {
    
      train: function(data, labels, options) {
        
        options = options || {};
        var maxDepth = options.maxDepth || 4;
        var weakType = options.type || 0;
        
        var trainFun= decision2DStumpTrain;
        var testFun= decision2DStumpTest;
        
        if(options.trainFun) trainFun = options.trainFun;
        if(options.testFun) testFun = options.testFun;
        
        if(weakType == 0) {
          trainFun= decisionStumpTrain;
          testFun= decisionStumpTest;
        }
        if(weakType == 1) {
          trainFun= decision2DStumpTrain;
          testFun= decision2DStumpTest;
        }
        
        // initialize various helper variables
        var numInternals= Math.pow(2, maxDepth)-1;
        var numNodes= Math.pow(2, maxDepth + 1)-1;
        var ixs= new Array(numNodes);
        for(var i=1;i<ixs.length;i++) ixs[i]=[];
        ixs[0]= new Array(labels.length);
        for(var i=0;i<labels.length;i++) ixs[0][i]= i; // root node starts out with all nodes as relevant
        var models = new Array(numInternals);
        
        // train
        for(var n=0; n < numInternals; n++) {
          
          // few base cases
          var ixhere= ixs[n];
          if(ixhere.length == 0) { continue; }
          if(ixhere.length == 1) { ixs[n*2+1] = [ixhere[0]]; continue; } // arbitrary send it down left
          
          // learn a weak model on relevant data for this node
          var model= trainFun(data, labels, ixhere);
          models[n]= model; // back it up model
          
          // split the data according to the learned model
          var ixleft=[];
          var ixright=[];
          for(var i=0; i<ixhere.length;i++) {
              var label= testFun(data[ixhere[i]], model);
              if(label === 1) ixleft.push(ixhere[i]);
              else ixright.push(ixhere[i]);
          }
          ixs[n*2+1]= ixleft;
          ixs[n*2+2]= ixright;
        }
        
        // compute data distributions at the leafs
        var leafPositives = new Array(numNodes);
        var leafNegatives = new Array(numNodes);
        for(var n=numInternals; n < numNodes; n++) {
          var numones= 0;
          for(var i=0;i<ixs[n].length;i++) {
              if(labels[ixs[n][i]] === 1) numones+=1;
          }
          leafPositives[n]= numones;
          leafNegatives[n]= ixs[n].length-numones;
        }
        
        // back up important prediction variables for predicting later
        this.models= models;
        this.leafPositives = leafPositives;
        this.leafNegatives = leafNegatives;
        this.maxDepth= maxDepth;
        this.trainFun= trainFun;
        this.testFun= testFun;
      }, 
      
      // returns probability that example inst is 1.
      predictOne: function(inst) { 
          
          var n=0;
          for(var i=0;i<this.maxDepth;i++) {
              var dir= this.testFun(inst, this.models[n]);
              if(dir === 1) n= n*2+1; // descend left
              else n= n*2+2; // descend right
          }
          
          return (this.leafPositives[n] + 0.5) / (this.leafNegatives[n] + 1.0); // bayesian smoothing!
      }
    }
    
    // returns model
    function decisionStumpTrain(data, labels, ix, options) {
      
      options = options || {};
      var numtries = options.numTries || 10;
      
      // choose a dimension at random and pick a best split
      var ri= randi(0, data[0].length);
      var N= ix.length;
      
      // evaluate class entropy of incoming data
      var H= entropy(labels, ix);
      var bestGain=0; 
      var bestThr= 0;
      for(var i=0;i<numtries;i++) {
      
          // pick a random splitting threshold
          var ix1= ix[randi(0, N)];
          var ix2= ix[randi(0, N)];
          while(ix2==ix1) ix2= ix[randi(0, N)]; // enforce distinctness of ix2
          
          var a= Math.random();
          var thr= data[ix1][ri]*a + data[ix2][ri]*(1-a);
          
          // measure information gain we'd get from split with thr
          var l1=1, r1=1, lm1=1, rm1=1; //counts for Left and label 1, right and label 1, left and minus 1, right and minus 1
          for(var j=0;j<ix.length;j++) {
              if(data[ix[j]][ri] < thr) {
                if(labels[ix[j]]==1) l1++;
                else lm1++;
              } else {
                if(labels[ix[j]]==1) r1++;
                else rm1++;
              }
          }
          var t= l1+lm1;  // normalize the counts to obtain probability estimates
          l1=l1/t;
          lm1=lm1/t;
          t= r1+rm1;
          r1=r1/t;
          rm1= rm1/t;
          
          var LH= -l1*Math.log(l1) -lm1*Math.log(lm1); // left and right entropy
          var RH= -r1*Math.log(r1) -rm1*Math.log(rm1);
          
          var informationGain= H - LH - RH;
          //console.log("Considering split %f, entropy %f -> %f, %f. Gain %f", thr, H, LH, RH, informationGain);
          if(informationGain > bestGain || i === 0) {
              bestGain= informationGain;
              bestThr= thr;
          }
      }
      
      model= {};
      model.thr= bestThr;
      model.ri= ri;
      return model;
    }
    
    // returns a decision for a single data instance
    function decisionStumpTest(inst, model) {
      if(!model) {
          // this is a leaf that never received any data... 
          return 1;
      }
      return inst[model.ri] < model.thr ? 1 : -1;
      
    }
    
    // returns model. Code duplication with decisionStumpTrain :(
    function decision2DStumpTrain(data, labels, ix, options) {
      
      options = options || {};
      var numtries = options.numTries || 10;
      
      // choose a dimension at random and pick a best split
      var N= ix.length;
      
      var ri1= 0;
      var ri2= 1;
      if(data[0].length > 2) {
        // more than 2D data. Pick 2 random dimensions
        ri1= randi(0, data[0].length);
        ri2= randi(0, data[0].length);
        while(ri2 == ri1) ri2= randi(0, data[0].length); // must be distinct!
      }
      
      // evaluate class entropy of incoming data
      var H= entropy(labels, ix);
      var bestGain=0; 
      var bestw1, bestw2, bestthr;
      var dots= new Array(ix.length);
      for(var i=0;i<numtries;i++) {
          
          // pick random line parameters
          var alpha= randf(0, 2*Math.PI);
          var w1= Math.cos(alpha);
          var w2= Math.sin(alpha);
          
          // project data on this line and get the dot products
          for(var j=0;j<ix.length;j++) {
            dots[j]= w1*data[ix[j]][ri1] + w2*data[ix[j]][ri2];
          }
          
          // we are in a tricky situation because data dot product distribution
          // can be skewed. So we don't want to select just randomly between
          // min and max. But we also don't want to sort as that is too expensive
          // let's pick two random points and make the threshold be somewhere between them.
          // for skewed datasets, the selected points will with relatively high likelihood
          // be in the high-desnity regions, so the thresholds will make sense
          var ix1= ix[randi(0, N)];
          var ix2= ix[randi(0, N)];
          while(ix2==ix1) ix2= ix[randi(0, N)]; // enforce distinctness of ix2
          var a= Math.random();
          var dotthr= dots[ix1]*a + dots[ix2]*(1-a);
          
          // measure information gain we'd get from split with thr
          var l1=1, r1=1, lm1=1, rm1=1; //counts for Left and label 1, right and label 1, left and minus 1, right and minus 1
          for(var j=0;j<ix.length;j++) {
              if(dots[j] < dotthr) {
                if(labels[ix[j]]==1) l1++;
                else lm1++;
              } else {
                if(labels[ix[j]]==1) r1++;
                else rm1++;
              }
          }
          var t= l1+lm1; 
          l1=l1/t;
          lm1=lm1/t;
          t= r1+rm1;
          r1=r1/t;
          rm1= rm1/t;
          
          var LH= -l1*Math.log(l1) -lm1*Math.log(lm1); // left and right entropy
          var RH= -r1*Math.log(r1) -rm1*Math.log(rm1);
          
          var informationGain= H - LH - RH;
          //console.log("Considering split %f, entropy %f -> %f, %f. Gain %f", thr, H, LH, RH, informationGain);
          if(informationGain > bestGain || i === 0) {
              bestGain= informationGain;
              bestw1= w1;
              bestw2= w2;
              bestthr= dotthr;
          }
      }
      
      model= {};
      model.w1= bestw1;
      model.w2= bestw2;
      model.dotthr= bestthr;
      return model;
    }
    
    // returns label for a single data instance
    function decision2DStumpTest(inst, model) {
      if(!model) {
          // this is a leaf that never received any data... 
          return 1;
      }
      return inst[0]*model.w1 + inst[1]*model.w2 < model.dotthr ? 1 : -1;
      
    }
    
    // Misc utility functions
    function entropy(labels, ix) {
      var N= ix.length;
      var p=0.0;
      for(var i=0;i<N;i++) {
          if(labels[ix[i]]==1) p+=1;
      }
      p=(1+p)/(N+2); // let's be bayesian about this
      q=(1+N-p)/(N+2);
      return (-p*Math.log(p) -q*Math.log(q));
    }
    
    // generate random floating point number between a and b
    function randf(a, b) {
      return Math.random()*(b-a)+a;
    }
  
    // generate random integer between a and b (b excluded)
    function randi(a, b) {
       return Math.floor(Math.random()*(b-a)+a);
    }
  
    // export public members
    var exports = {};
    exports.DecisionTree = DecisionTree;
    exports.RandomForest = RandomForest;
    return exports;
    
  })();
/*---------------------------^^^---RANDOMFOREST.JS---^^^------------------------*/

/*---------------------------vvv---CLASSES FOR QUIZ OVERVIEW---vvv------------------------*/
let Encoder = new TextEncoder();
//Hash functions to encrypt user id
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = Encoder.encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    
    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
}

let monthTranslator = {
    "Januar":0,
    "Februar":1,
    "März":2,
    "M&auml;rz":2,
    "April":3,
    "Mai":4,
    "Juni":5,
    "Juli":6,
    "August":7,
    "September":8,
    "Oktober":9,
    "November":10,
    "Dezember":11
};

class CQuestionAttempt {
    constructor(timestampOrString, questionId, action, outcome, variant) {
        this.variant = variant;
        if(this.variant == undefined) {
            this.variant = 1;
        }
        //Check timestampOrString
        this.timestamp;
        if(Number.isInteger(timestampOrString)) {
            this.timestamp = timestampOrString;
        }
        else if(timestampOrString instanceof String || typeof timestampOrString === 'string') {
            //German with full months written?
            this.timestamp = this.getTimestampFromGermanTime(timestampOrString);
        }
        this.questionId = questionId;
        this.action = action;
        this.outcome = outcome;
        if(!this.timestamp) {
            //console.log("timestring could not be converted");
            this.timestamp = timestampOrString;
        }
    }

    getTimestampFromGermanTime(timestring) {
        let hasAmPm = ((timestring.search(/ am/i) + timestring.search(/ pm/i)) > -2);
        let time;
        if(hasAmPm == true) {
            console.log("special handling for AM / PM time string is neccessary");
            return false;
        }
        //let matchAllResult = timestring.matchAll(/(\d+)\. (.{4,}?) (\d{2,4}), (\d+):(\d+):(\d+)/g);
        let matchAllResult = timestring.matchAll(/(\d+)\.* (.{4,}?) (\d{2,4}),* (\d+):(\d+):*(\d*)/g);
        let matches = Array.from(matchAllResult)[0];
        if(!matches) {
            //Give it another try, matching e. g. 18/09/23, 11:55:42
            matchAllResult = timestring.matchAll(/(\d+)[\.\/-](\d+)[\.\/-](\d+),* (\d+):(\d+):*(\d*)/g);
            matches = Array.from(matchAllResult)[0];
            if(!matches) {
                //probably not german, try Date
                //console.log(timestring)
                time = new Date(timestring);
            }
            else {
                let year = matches[3]
                if(matches[3].length == 2) {
                    year = "20"+year;
                }
                let month = parseInt(matches[2])-1;
                time = new Date(year, month, matches[1], matches[4], matches[5], matches[6]);
            }
        }
        else {
            //1: day of month, 2: month in words, 3: year, 4: hours, 5: minutes, 6:seconds
            if(monthTranslator[matches[2]] == undefined) {
                //probably not german
                return false;
            }

            time = new Date(matches[3], monthTranslator[matches[2]], matches[1], matches[4], matches[5], matches[6]);
        }
        if(isNaN(time)) {
            return false;
        }
        return time.getTime();
    }
}

class CUser {
    constructor(idOrNode, quizObject, fetchesObject, urlsObject, deferredInit) {
        //deferredInit : boolean: async function addAttempt called in constructor makes await for addAttempt impossible. In case of await is wanted, addAttempt has to be called later with initialReviewLink. function deferredInit is a shorthand for that.
        let object = this;
        this.Parser = new DOMParser();
        this.QuestionAttempts = [];
        this.quizObject = quizObject;
        this.fetches = fetchesObject;
        this.urls = urlsObject;
        this.initialReviewLink;

        if(!this.fetches) {
            this.fetches = {};
        }
        if(!this.urls) {
            this.urls = {};
        }
        if(deferredInit == undefined) {
            deferredInit == false;
        }

        if(idOrNode instanceof String || typeof idOrNode === 'string') {
            this.id = idOrNode;
        }
        else if(idOrNode instanceof Element) {
            if(idOrNode.tagName == "TR") {
                let idNode = idOrNode.querySelector(".c3");
                if(idNode == undefined) {
                    console.log("no id found for this row");
                    return;
                }
                this.id = idNode.innerHTML;

                let reviewLink = idOrNode.querySelector(".reviewlink");
                if(reviewLink == undefined) {
                    console.log("no review link found for this row");
                    return;
                }
                if(!deferredInit) {
                    this.addAttempt(reviewLink.href);
                }
                else {
                    this.initialReviewLink = reviewLink.href;
                }
            }
        }
        else {
            console.log("unknown type");
        }
    }

    async deferredInit(reviewLink) {
        if(reviewLink == undefined) {
            reviewLink = this.initialReviewLink;
        }
        if(reviewLink == undefined) {
            console.log("User deferred init impossible because of missing review link.")
            return false;
        }

        return this.addAttempt(reviewLink);
    }

    async addAttempt(reviewUrl) {
        let object = this;
        if(reviewUrl == undefined) {
            return;
        }
        return fetch(reviewUrl)
        .then(function(response) {
            return response.text();
        })
        .then(function(htmlText) {
            let fetchedPage = object.Parser.parseFromString(htmlText, "text/html");
            
            let allQuestions = fetchedPage.querySelectorAll(".que");
            if(allQuestions.length <= 1) {
                //Sometimes, default is to show questions by pages. In this case, reload the page with all questions shown.
                //Get url from .othernav or simply add "&showall=1" to the url.
                return fetch(reviewUrl+"&showall=1").then(function(responseShowAll) {
                    return responseShowAll.text();
                })
                .then(function(htmlTextShowAll) {
                    let fetchedPageShowAll = object.Parser.parseFromString(htmlTextShowAll, "text/html");
                    //console.log(fetchedPageShowAll.querySelectorAll(".que"));
                    return fetchedPageShowAll;
                });
            }
            else {
                return fetchedPage;
            }
        })
        .then(function(fetchedPageOrShowAll) {
            //test = fetchedPageOrShowAll;
            let allQuestions = fetchedPageOrShowAll.querySelectorAll(".que");
            //console.log(allQuestions);
            if(allQuestions.length < 1) {
                throw new Error("bad amount of questions");
            }

            //Assume each question is shown, even the unattended. Then, allQuestions can be paginated as in quizObject.
            //Loop through questions and variants in quiz object and append question information one by one.
            let page = 0;
            let questionIds = Object.keys(object.quizObject.questions);
            let lastPage = questionIds.length-1;
            for(let questionName in object.quizObject.questions) {
                //The variant part here differs in control group analysis.
                //let variants = quizObject.questions[questionName].variants == undefined ? 1 : quizObject.questions[questionName].variants;
                //for(let i = 0;i<variants;i++) {
                    //console.log(page);
                let relevantQuestionNode = allQuestions[page];
                //console.log(page);
                //fetch all question attempts from history
                let previousQuestionAttemptUrls = relevantQuestionNode.querySelectorAll(".history a[id*='action_link']:not(.history tr a)");
                for(let j=0;j<previousQuestionAttemptUrls.length;j++) {
                    let fetchId = Date.now().toString(36) + Math.random().toString(36).slice(2);
                    object.fetches[fetchId] = 0;
                    object.urls[fetchId] = previousQuestionAttemptUrls[j].href;
                    fetch(previousQuestionAttemptUrls[j].href)
                    .then(function(response) {
                        return response.text();
                    })
                    .then(function(htmlText) {
                        let fetchedQuestionAttemptHistoryPage = object.Parser.parseFromString(htmlText, "text/html");
                        let infoTable = fetchedQuestionAttemptHistoryPage.querySelector(".history .generaltable");
                        if(infoTable == undefined) {
                            throw new Error("no table found for history number "+i);
                        }

                        let questionAttemptInfo = object.getQuestionAttemptInfoFromTable(infoTable);

                        //Get variant from Seed: (.*?) info in action field.
                        let variant = 1;
                        let matchAllResult = questionAttemptInfo.action.matchAll(/Seed: (.*?);/g);
                        if(!!matchAllResult) {
                            let matches = Array.from(matchAllResult)[0]
                            //console.log(matches);
                            if(matches != undefined && matches[1] != undefined && matches[1] != "") {
                                variant = matches[1];
                            }
                        }

                        object.QuestionAttempts.push(new CQuestionAttempt(questionAttemptInfo.timestring, questionName, questionAttemptInfo.action, questionAttemptInfo.status, /*i+1*/variant));
                        object.fetches[fetchId] = 1;
                    })
                    .catch(function(error) {
                        console.log("Error fetching question attempt from history.");
                        console.log(error);
                    });
                }

                //Fetch most recent question attempt. This one is found on the overview page without clicking.
                let shownTable = allQuestions[page].querySelector(".generaltable");
                if(shownTable == undefined) {
                    throw new Error("no table found for question "+questionName);
                }
                let questionAttemptInfo = object.getQuestionAttemptInfoFromTable(shownTable);

                //Get variant from Seed: (.*?) info in action field.
                let variant = 1;
                let matchAllResult = questionAttemptInfo.action.matchAll(/Seed: (.*?);/g);
                if(!!matchAllResult) {
                    let matches = Array.from(matchAllResult)[0]
                    //console.log(matches);
                    if(matches != undefined && matches[1] != undefined && matches[1] != "") {
                        variant = matches[1];
                    }
                }

                object.QuestionAttempts.push(new CQuestionAttempt(questionAttemptInfo.timestring, questionName, questionAttemptInfo.action, questionAttemptInfo.status, variant));

                /*if(page == lastPage) {
                    processedAttempts++;
                    console.log("(Nearly) processed "+processedAttempts+" of "+allAttempts+ " attempts.");
                }*/

                page++;
                //}
            }
        })
        .catch(function(error) {
            console.log("error in promise chain");
            console.log(error);
        });
    }

    sanitizeAttempts(getRidOfInitializationAttempts, getRidOfFinishedAttemptAttempts, getRidOfTriesRemainingEntries, getRidOfDoubleEntries, addInfoAboutNextStep, classifyOutcomeAsInt, addInfoAboutPrtNames) {
        this.QuestionAttempts = this.getSanitizedAttempts(getRidOfInitializationAttempts, getRidOfFinishedAttemptAttempts, getRidOfTriesRemainingEntries, getRidOfDoubleEntries, addInfoAboutNextStep, classifyOutcomeAsInt, addInfoAboutPrtNames);
    }

    getQuestionAttemptInfoFromTable(tableNode) {
        if(tableNode == undefined) {
            return false;
        }
        let lastRow = tableNode.querySelector(".current.lastrow");
        if(lastRow == undefined) {
            return false;
        }
        //Assume c1 be the time, c2 be the action text and c3 be the status
        let timestringNode = lastRow.querySelector(".c1");
        let actionNode = lastRow.querySelector(".c2");
        let statusNode = lastRow.querySelector(".c3");

        if(timestringNode == undefined || statusNode == undefined) {
            return false;
        }

        return {timestring:timestringNode.innerHTML, action:(actionNode.innerHTML == undefined ? "" : actionNode.innerHTML), status:statusNode.innerHTML};
    }

    async getAttemptsAsCSV(addUserCol, addHeadingRow, encryptId, getRidOfInitializationAttempts) {
        let csvString = "";
        if(addUserCol == undefined) {
            addUserCol = true;
        }
        if(addHeadingRow == undefined) {
            addHeadingRow = false;
        }
        if(encryptId == undefined) {
            encryptId = true;
        }
        let id = this.id;
        if(encryptId == true) {
            //Because by default, Moodle's export results function returns Matrikelnummern as int, we encrypt the int too to ensure consistent results.
            let toEncrypt = parseInt(id);
            if(!isNaN(toEncrypt)) {
                id = await sha256(""+toEncrypt);
            }
            else {
                //In case not the Matricel Id is listed, the e-mail-address will be hashed here to identify unique users.
                id = await sha256(""+id);
            }
        }
        if(getRidOfInitializationAttempts == undefined) {
            getRidOfInitializationAttempts = true;
        }


        if(addHeadingRow == true) {
            if(addUserCol == true) {
                csvString += "user_id;";
            }
            csvString += "timestamp;question_id;variant;action;outcome;next_timestamp;next_question_id;next_variant";
        }

        //Sort attempts by time. To add next question attribute.
        let SortedAttempts = this.getSanitizedAttempts(getRidOfInitializationAttempts);

        for(let i=0;i<SortedAttempts.length;i++) {
            let relevantVars = []
            if(addUserCol == true) {
                relevantVars.push(id);
            }
            relevantVars.push(SortedAttempts[i].timestamp, SortedAttempts[i].questionId, SortedAttempts[i].variant,  SortedAttempts[i].action, SortedAttempts[i].outcome);
            if(SortedAttempts[i+1] != undefined) {
                relevantVars.push(SortedAttempts[i+1].timestamp, SortedAttempts[i+1].questionId, SortedAttempts[i+1].variant);
                //relevantVars.push(SortedAttempts[i+1].questionId)
            }
            else {
                relevantVars.push("", "_finish", "");
            }
            //csvString += "\""+relevantVars.join("\";\"")+"\"\n";
            csvString += "'"+relevantVars.join("';'")+"'\n";
        }

        //csvString += "\n";
        return csvString;
    }

    /*Leave the calculations up to python.
    async getOverallInfoAsCSVRow(addHeadingRow, encryptId, getRidOfInitializationAttempts) {
        let csvString = "";
        if(addHeadingRow == undefined) {
            addHeadingRow = false;
        }
        if(encryptId == undefined) {
            encryptId = true;
        }
        let id = this.id;
        if(encryptId == true) {
            id = await sha256(this.id);
            
        }
        if(getRidOfInitializationAttempts == undefined) {
            getRidOfInitializationAttempts = true;
        }

        if(addHeadingRow == true) {
            if(addUserCol == true) {
                csvString += "id,";
            }
            csvString += "started_working_amount,solved_amount,calls,first_action,last_action";
        }

        //Sort attempts by time. To add next question attribute.
        let SortedAttempts = this.getSanitizedAttempts(getRidOfInitializationAttempts);

        if(getRidOfInitializationAttempts == true) {
            let initialTimestamp = SortedAttempts[0].timestamp;
            let SortedAttemptsCopy = JSON.parse(JSON.stringify(SortedAttempts));
            SortedAttempts = [];
            for(let j=0;j<SortedAttemptsCopy.length;j++) {
                if(SortedAttemptsCopy[j].timestamp != initialTimestamp) {
                    SortedAttempts.push(SortedAttemptsCopy[j]);
                }
            }
        }

        for(let i=0;i<SortedAttempts.length;i++) {
            let relevantVars = []
            if(addUserCol == true) {
                relevantVars.push(id);
            }
            relevantVars.push(SortedAttempts[i].timestamp, SortedAttempts[i].questionId, SortedAttempts[i].variant,  SortedAttempts[i].action, SortedAttempts[i].outcome);
            if(SortedAttempts[i+1] != undefined) {
                relevantVars.push(SortedAttempts[i+1].timestamp, SortedAttempts[i+1].questionId, SortedAttempts[i+1].variant);
                //relevantVars.push(SortedAttempts[i+1].questionId)
            }
            else {
                relevantVars.push("", "_finish", "");
            }
            csvString += "\""+relevantVars.join("\";\"")+"\"\n";
        }

        //csvString += "\n";
        return csvString;
    }*/

    getSanitizedAttempts(getRidOfInitializationAttempts, getRidOfFinishedAttemptAttempts, getRidOfTriesRemainingEntries, getRidOfDoubleEntries, addInfoAboutNextStep, classifyOutcomeAsInt, addInfoAboutPrtNames) {
        //Will sort the question attempts and get rid of initialization attempts.
        if(getRidOfInitializationAttempts == undefined) {
            getRidOfInitializationAttempts = true;
        }
        if(getRidOfFinishedAttemptAttempts == undefined) {
            getRidOfFinishedAttemptAttempts = true;
        }
        if(getRidOfDoubleEntries == undefined) {
            getRidOfDoubleEntries = false;
        }
        if(getRidOfTriesRemainingEntries == undefined) {
            getRidOfTriesRemainingEntries = false;
        }
        if(addInfoAboutNextStep == undefined) {
            addInfoAboutNextStep = false;
        }
        if(classifyOutcomeAsInt == undefined) {
            classifyOutcomeAsInt = false;
        }
        
        
        if(this.QuestionAttempts.length == 0) {
            console.log("error: no attempts to sanitize");
            return [];
        }

        let SanitizedAttempts = JSON.parse(JSON.stringify(this.QuestionAttempts));
        SanitizedAttempts.sort(function(a, b) { return parseInt(a.timestamp) - parseInt(b.timestamp); });

        if(getRidOfFinishedAttemptAttempts == true) {
            let SanitizedAttemptsCopy = JSON.parse(JSON.stringify(SanitizedAttempts));
            SanitizedAttempts = [];
            for(let i=0;i<SanitizedAttemptsCopy.length;i++) {
                if(SanitizedAttemptsCopy[i].action != "Versuch beendet" && SanitizedAttemptsCopy[i].action != "Attempt finished") {
                    SanitizedAttempts.push(SanitizedAttemptsCopy[i]);
                }
            }
        }

        if(getRidOfInitializationAttempts && SanitizedAttempts.length > 0) {

            let initialTimestamp = SanitizedAttempts[0].timestamp;
            let SanitizedAttemptsCopy = JSON.parse(JSON.stringify(SanitizedAttempts));
            SanitizedAttempts = [];
            for(let j=0;j<SanitizedAttemptsCopy.length;j++) {
                if(SanitizedAttemptsCopy[j].timestamp != initialTimestamp) {
                    SanitizedAttempts.push(SanitizedAttemptsCopy[j]);
                }
            }
        }

        if(getRidOfTriesRemainingEntries && SanitizedAttempts.length > 0) {
            let SanitizedAttemptsCopy = JSON.parse(JSON.stringify(SanitizedAttempts));
            SanitizedAttempts = [];

            for(let i=0;i<SanitizedAttemptsCopy.length;i++) {
                if(SanitizedAttemptsCopy[i].outcome == "Verbleibende Versuche: 1" || SanitizedAttemptsCopy[i].outcome == "Tries remaining: 1") {
                    continue;
                }
                SanitizedAttempts.push(SanitizedAttemptsCopy[i]);
            }
        }
        
        if(getRidOfDoubleEntries && SanitizedAttempts.length > 0) {
            let SanitizedAttemptsCopy = JSON.parse(JSON.stringify(SanitizedAttempts));
            SanitizedAttempts = [];

            let lastAttempt = SanitizedAttemptsCopy[0];
            for(let i=0;i<SanitizedAttemptsCopy.length;i++) {
                if(lastAttempt.questionId == SanitizedAttemptsCopy[i].questionId && lastAttempt.variant == SanitizedAttemptsCopy[i].variant && lastAttempt.action == SanitizedAttemptsCopy[i].action) {
                    continue;
                }
                SanitizedAttempts.push(SanitizedAttemptsCopy[i]);
            }
        }

        if(classifyOutcomeAsInt == true && SanitizedAttempts.length > 0) {
            for(let i=0;i<SanitizedAttempts.length;i++) {
                let state_as_int = 0;
                if(["Correct", "Richtig"].includes(SanitizedAttempts[i].outcome)) {
                    state_as_int = 1
                }
                else if(["Partially correct", "Teilweise richtig"].includes(SanitizedAttempts[i].outcome)) {
                    state_as_int = 2;
                }
                else {
                    //Falsch, Incorrect / Fehler
                    state_as_int = 0;
                }
                SanitizedAttempts[i].outcome_as_int = state_as_int;
            }
        }

        if(addInfoAboutPrtNames && SanitizedAttempts.length > 0) {
            for(let i=0;i<SanitizedAttempts.length;i++) {
                /* Example action: Absenden: Seed: 480757020; ans1: y=3*x+5 [score]; prt1: # = 1 | prt1-1-T */
                let match = SanitizedAttempts[i].action.match(/.*\| (.*?)$/);
                if(!match || !match[1]) {
                    console.log("no prt name found");
                    continue;
                }
                let prtId = match[1];
                SanitizedAttempts[i].prt_name = prtId;
            }
        }

        if(addInfoAboutNextStep && SanitizedAttempts.length > 1) {
            for(let i=0;i<SanitizedAttempts.length;i++) {
                if(SanitizedAttempts[i+1] == undefined) {
                    SanitizedAttempts[i].next_questionId = "_finish";
                    continue;
                }
                SanitizedAttempts[i].next_questionId = SanitizedAttempts[i+1].questionId;
                SanitizedAttempts[i].next_variant = SanitizedAttempts[i+1].variant;
                SanitizedAttempts[i].next_outcome = SanitizedAttempts[i+1].outcome;
                if(SanitizedAttempts[i].outcome_as_int != undefined) {
                    SanitizedAttempts[i].next_outcome_as_int = SanitizedAttempts[i+1].outcome_as_int;
                }
                if(SanitizedAttempts[i].prt_name != undefined) {
                    SanitizedAttempts[i].next_prt_name = SanitizedAttempts[i+1].prt_name;
                }
                SanitizedAttempts[i].next_timestamp = SanitizedAttempts[i+1].timestamp;
            }
        }
        return SanitizedAttempts;
    }
}

class Quiz_Overview_Analyzer {
    constructor(quizid) {
        this.quizid = quizid;
        this.rows;
        this.allAttempts = 0;
        this.processedAttempts = 0;
        this.fetches = {};
        this.urls = {};
        this.Users = {};
        this.csvText = "";
        this.documentNode;
        this.quizObject = {questions:{}};
        this.Parser = new DOMParser();

        /*if(!documentNode) {
            this.documentNode = document;
        }
        else {
            this.documentNode = documentNode;
        }

        if(!this.documentNode.body) {
            throw new Error("Bad document node.");
        }*/

        /*this.rows = this.documentNode.querySelectorAll("#attempts tbody tr:not(.emptyrow)");
        this.allAttempts = this.rows.length;

        console.log("There are "+this.allAttempts+" rows. Run 'loadUsers();' or 'loadUsers(from, to);' or 'loadUsersStepwise();' to start processing.");*/
    }

    async init(urlToFetch) {
        //Load the quizObject from the given id.
        let base_url = window.location.origin;
        if(base_url == undefined || base_url == "") {
            //error 3
            return false;
        }

        if(!urlToFetch) {
            //Compute url
            urlToFetch = base_url+"/mod/quiz/report.php?id="+this.quizd+"&mode=overview";
        }

        let tempQuizObject = await fetch(base_url+"/mod/quiz/edit.php?cmid="+this.quizid).then(response => {
            return response.text();
        }).then(responseAsText => {
            let documentNode = this.Parser.parseFromString(responseAsText, "text/html");
            let slotsNodes = documentNode.querySelectorAll(".slots");
            if(slotsNodes.length != 1) {
                throw new Error("bad amount of slots nodes");
            }
            let i=1;
            let object = this;
            slotsNodes[0].querySelectorAll(".slot").forEach(function(slotNode) {
                let question_name = slotNode.querySelector(".questionname").innerHTML;
                let question_edit_url = slotNode.querySelector(".activityinstance a").href;
                object.quizObject.questions[i] = {name:question_name, edit_url:question_edit_url, page:i};
                i++;
            });
            return this.quizObject;
        }).catch(error => {
            console.log("Error in quiz overview initialization promise chain (quizObject).")
            console.log(error);
            return false;
        });

        let tempDocNode = await fetch(urlToFetch).then(response => {
            console.log("received response");
            return response.text();
        })
        .then(responseText => {
            let documentNode = this.Parser.parseFromString(responseText, "text/html");
            this.documentNode = documentNode;
            this.rows = documentNode.querySelectorAll("#attempts tbody tr:not(.emptyrow)");
            this.allAttempts = this.rows.length;

            console.log("There are "+this.allAttempts+" rows. Run 'loadUsers();' or 'loadUsers(from, to);' or 'loadUsersStepwise();' to start processing.");
        })
        .catch(error => {
            console.log("Error in quiz overview initialization promise chain (rows).");
            console.log(error);
            /*if(!!startAnalysisButton) {
                startAnalysisButton.classList.remove("load");
                startAnalysisButton.disabled = undefined;
            }*/
        });
        return true;
    }

    async loadUsers(from, to) {
        if(from == undefined) {
            from = 0;
        }
        if(to == undefined) {
            to = this.rows.length;
        }
        for(let i=from;i<to;i++) {
            console.log("Load user "+i+" from "+to);
            let id;
            let idNode = this.rows[i].querySelector(".c3");
            if(idNode == undefined) {
                console.log("no id found for row "+i);
                continue;
            }
            id = idNode.innerHTML;
            if(id == "") {
                console.log("empty id in row "+i);
                continue;
            }
            if(this.Users[id] == undefined) {
                this.Users[id] = new CUser(this.rows[i], this.quizObject, this.fetches, this.urls, true);
                await this.Users[id].deferredInit();
                //this.Users[id].sanitizeAttempts(true, true, true, true, true, true);
            }
            else {
                //Get review link and add attempt to already existing user.
                let reviewLink = this.rows[i].querySelector(".reviewlink");
                if(reviewLink != undefined) {
                    //await?
                    await this.Users[id].addAttempt(reviewLink.href);
                }
                else {
                    console.log("Found user row of already existing user, but didn't find review link.");
                }
            }
        }
    }
    
    async loadCSV(UsersObject) {
        if(UsersObject == undefined) {
            if(this.Users == undefined) {
                return false;
            }
            UsersObject = Users;
        }
        //let csvText = "";
        this.csvText = "";
        let first = true;
        for(let i in UsersObject) {
            this.csvText += await UsersObject[i].getAttemptsAsCSV(true, first);
            if(first == true) { first = false; }
        }
    
        /*let c = document.createElement("a");
        c.download = "alquiz-analysis-control.csv";
        var t = new Blob([csvText], {
            type: "text/plain"
        });
        c.href = window.URL.createObjectURL(t);
        c.click();*/
    }
    
    downloadCSV() {
        let c = document.createElement("a");
        c.download = "steps.csv";
        var t = new Blob([this.csvText], {
            type: "text/plain"
        });
        c.href = window.URL.createObjectURL(t);
        c.click();
    }
    
    async loadAndDownloadCSV() {
        return await this.loadCSV().then(response => {
            this.downloadCSV();
            return response;
        });
    }
    
    getFetchState() {
        /*let overallFetches = Object.keys(fetches).length;
        let solvedFetches = 0;
        for(let fetchId in fetches) {
            if(fetches[fetchId] == 1) {
                solvedFetches++;
            }
        }*/
        let infoObject = this.getFetchStateMachineReadable();
        console.log("Fetched "+infoObject.solved+" of "+infoObject.overall+".");
    }
    
    getFetchStateMachineReadable() {
        let overallFetches = Object.keys(this.fetches).length;
        let solvedFetches = 0;
        for(let fetchId in this.fetches) {
            if(this.fetches[fetchId] == 1) {
                solvedFetches++;
            }
        }
        return {"solved":solvedFetches, "overall":overallFetches};
    }
}

/*---------------------------^^^---CLASSES FOR QUIZ OVERVIEW---^^^------------------------*/

/*---------------------------vvv------------LANGUAGES-------------vvv------------------------*/
let German = new LanguagePack({
    welcome:"Hallo! W&auml;hle eine Option.",
    quizzes_overview:"Es stehen {amount} Quizze f&uuml;r die Analyse zur Verf&uuml;gung.",
    quizzes_choose_prediction:"W&auml;hle, welche/s Quiz(ze) zum Training und welche/s zur Vorhersage genutzt werden sollen.",
    train_with:"Training mit...",
    prediction_of:"Vorhersage von...",
    start_analysis:"Analyse starten",
    analysis_running:"Analyse l&auml;uft...",
    load_data:"Lade Daten {loaded}/{overall}",
    finished:"Fertig",
    training:"Training",
    prediction:"Vorhersage",
    error_during_loading:"Mind. 1 Quiz konnte nicht geladen werden.",
    calculate:"Berechne ({add_info})",
    accuracy_is:"Die Vorhersagewahrscheinlichkeit bei dieser Kombination betr&auml;gt {accuracy}.",
    real:"Tats&auml;chlich",
    predicted:"Vorhersage",
    student_amount:"{participated_all_quizzes_amount} der Studierenden haben alle der ausgew&auml;hlten Quizze absolviert.",
    show_options:"Optionen anzeigen",
    hide_options:"Optionen verbergen",
    breakpoint:"Ben&ouml;tigte Mindestpunktzahl (%) f&uuml;r bestanden: ",
    num_trees:"RandomForest Baumanzahl: ",
    label_prediction:"Vorhersage (work in progress)",
    label_quiz_overview:"Quiz Dashboard",
    back_to_main:"Zur&uuml;ck zur Auswahl",
    quizzes_choose_overview:"W&auml;hle ein Quiz, welches in das Dashboard geladen wird.",
    start_overview_load:"Dashboard laden",
    load_overview_running:"Wird geladen...",
    error_jxg_missing:"Einbindung der JSXGraph Bibliothek benötigt, um diesen Graph darzustellen."
});

let English = new LanguagePack({
    error_jxg_missing:"Chart can't be processed due to missing JSXGraph module."
});

let Parser = new DOMParser();
let LALMSAnalyzer = new LA_LMS_Analyzer({Parser:Parser, Language:German});
//LALMSAnalyzer.LALMSVisualizer.dmIcon.click();