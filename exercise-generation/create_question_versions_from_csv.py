#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jul 31 13:03:04 2023

@author: malte
"""
#%%------------------------------------INIT----------------------------------
from lxml import etree
import copy
import pandas as pd
import json
import re

parser = etree.XMLParser(strip_cdata=False)

#root = etree.Element("quiz")
#tree = etree.ElementTree(root)

class QuestionPool:
    def __init__(self, Question_Ver, Raw_Questions):
        self.Question_Ver = Question_Ver
        self.Questions = []
        
        self.root = etree.Element("quiz")
        self.tree = etree.ElementTree(self.root)
        
        self.first_elements = []
        self.last_elements = []
        
        for Question in Raw_Questions:            
            CopiedQuestion = copy.deepcopy(Question)
            
            add_to_script_text = ""
            if self.Question_Ver.callback_add_to_script != None:
                add_to_script_text = self.Question_Ver.callback_add_to_script(Question=CopiedQuestion)
            
            #Add script and hint (if desired) to exercise text.
            exercise_hint_string = ""
            if self.Question_Ver.show_hint == True:
                exercise_hint_string = "" if pd.isna(Question.exercise_hint) else f'<p class="hint">{Question.exercise_hint}</p>'
            for questiontext_element in CopiedQuestion.root.iterchildren("questiontext"):
                for questiontext_text_element in questiontext_element.iterchildren("text"):
                    questiontext_text_element.text = etree.CDATA(f"{Question_Ver.script_on_init}{add_to_script_text}{questiontext_text_element.text}{exercise_hint_string}")
            
            
            if self.Question_Ver.callback_change_before_clone != None:
                self.Question_Ver.callback_change_before_clone(Question=CopiedQuestion)
            
            if self.Question_Ver.variants_as_single == True:
                print("special handling for variants as single")
                
                seeds = []
                for seed in CopiedQuestion.root.iterchildren("deployedseed"):
                    seeds.append(copy.deepcopy(seed))
                    CopiedQuestion.root.remove(seed)
                
                if len(seeds) < 1:
                    print(f"No seed given for t{CopiedQuestion.topic_number}-{CopiedQuestion.exercise_number:02d}-{CopiedQuestion.exercise_part}.")
                    self.Questions.append(CopiedQuestion)
                    continue
                
                question_clones = []
                
                seed_amount = len(seeds) if (self.Question_Ver.fixed_seed_amount == 0 or len(seeds) < self.Question_Ver.fixed_seed_amount) else self.Question_Ver.fixed_seed_amount
                
                for j in range(seed_amount):
                    question_clones.append(copy.deepcopy(CopiedQuestion))
                    question_clones[j].root.append(seeds[j])    
                    j+=1
                    
                variant_count = 1
                for question_variant in question_clones:
                    for name_element in question_variant.root.iterchildren("name"):
                        for nametext_element in name_element.iterchildren("text"):
                            nametext_element.text = f"{nametext_element.text} (Auto-Generation Variant {variant_count})"
                    self.Questions.append(question_variant)
                    variant_count+=1
                
            else:
                self.Questions.append(CopiedQuestion)
        
        if self.Question_Ver.custom_first_elements_filepath != "":
            custom_first_element_tree = etree.parse(self.Question_Ver.custom_first_elements_filepath, parser)
            custom_first_element_root = custom_first_element_tree.getroot()
            for question_element in custom_first_element_root.iterchildren("question"):
                if question_element.attrib["type"] != "category":
                    self.first_elements.append(question_element)
        
        if self.Question_Ver.custom_last_elements_filepath != "":
            custom_last_element_tree = etree.parse(self.Question_Ver.custom_last_elements_filepath, parser)
            custom_last_element_root = custom_last_element_tree.getroot()
            for question_element in custom_last_element_root.iterchildren("question"):
                if question_element.attrib["type"] != "category":
                    self.last_elements.append(question_element)
        
        self.update_xml_tree();
        
    def get_category_as_xml_element(self, category_name):
        category_question = etree.Element("question", type="category")
        category = etree.SubElement(category_question, "category")
        category_text = etree.SubElement(category, "text")
        info = etree.SubElement(category, "info")
        info.append(etree.Element("text"))
        category_question.append(etree.Element("idnumber"))
        category_text.text = f"$course$/top/Question Pool Einstiegsakademie/{self.Question_Ver.name}/{category_name}"
        return category_question
    
    def update_xml_tree(self):
        self.root = etree.Element("quiz")
        self.tree = etree.ElementTree(self.root)
        
        if self.first_elements != []:
            
            if self.Question_Ver.callback_first_quiz_element_text != None:
                text = self.Question_Ver.callback_first_quiz_element_text(**self.Question_Ver.callback_kwargs)
                for questiontext_element in self.first_elements[0].iterchildren("questiontext"):
                    for questiontext_textelement in questiontext_element.iterchildren("text"):
                        questiontext_textelement.text = etree.CDATA(text)
            
            self.root.append(self.get_category_as_xml_element("000 Start Elements"))
            for starting_element in self.first_elements:
                self.root.append(starting_element)
                
            
        
        for Question in self.Questions:
            last_category = ""
            category_string = f"t{Question.topic_number}_{Question.topic_id} {Question.topic_label}"
            if category_string != last_category:
                self.root.append(self.get_category_as_xml_element(category_string))
                last_category = category_string
                
            self.root.append(Question.root)
        
        if self.last_elements != []:
            self.root.append(self.get_category_as_xml_element("zzz Config Elements"))
            for finishing_element in self.last_elements:
                self.root.append(finishing_element)
                
            #change text in finishing element which shall contain the configuration
            if self.Question_Ver.callback_last_quiz_element_text != None:
                text = self.Question_Ver.callback_last_quiz_element_text(**self.Question_Ver.callback_kwargs)
                questions = []
                for question in self.root.iterchildren("question"):
                    questions.append(question)
                
                last_question = questions[-1]
                for questiontext_element in last_question.iterchildren("questiontext"):
                    for questiontext_text_element in questiontext_element.iterchildren("text"):
                        questiontext_text_element.text = etree.CDATA(text)
    
    def write_to_file(self, filepath=""):
        if filepath == "":
            filepath = f"output-{self.Question_Ver.name}.xml"
        self.tree.write(filepath, pretty_print=True)

class QuestionVersion:
    def __init__(self, name, variants_as_single=False, script_on_init="", custom_first_elements_filepath="", custom_last_elements_filepath="", fixed_seed_amount=0, show_hint=True, callback_first_quiz_element_text=None, callback_last_quiz_element_text=None, callback_add_to_script=None, callback_change_before_clone=None, **callback_kwargs):
        self.name = name
        self.variants_as_single = variants_as_single
        self.script_on_init = script_on_init
        self.custom_first_elements_filepath = custom_first_elements_filepath
        self.callback_first_quiz_element_text = callback_first_quiz_element_text
        self.custom_last_elements_filepath = custom_last_elements_filepath
        self.fixed_seed_amount = fixed_seed_amount
        self.show_hint = show_hint
        self.callback_last_quiz_element_text = callback_last_quiz_element_text
        self.callback_add_to_script = callback_add_to_script
        self.callback_kwargs = callback_kwargs
        self.callback_change_before_clone = callback_change_before_clone
    

class MoodleQuestion:
    def __init__(self, topic_number, topic_id, exercise_number, exercise_part, topic_label, exercise_description, exercise_variables, exercise_text, exercise_content, exercise_hint, custom_general_feedback, exercise_note, custom_prt, add_prt_node_on_not_correct, add_prt_node_wa, custom_input, custom_seed):
        self.topic_number = topic_number
        self.topic_id = topic_id
        self.exercise_number = exercise_number
        self.exercise_part = exercise_part
        self.topic_label = topic_label
        self.exercise_description = exercise_description
        self.exercise_variables = exercise_variables
        self.exercise_text = exercise_text
        self.exercise_content = exercise_content
        self.exercise_hint = exercise_hint
        self.custom_general_feedback = custom_general_feedback
        self.exercise_note = exercise_note
        self.custom_prt = None if pd.isna(custom_prt) else etree.fromstring(custom_prt, parser)
        self.add_prt_node_on_not_correct = add_prt_node_on_not_correct
        self.add_prt_node_wa = None if type(add_prt_node_wa) is not list else [wa for wa in add_prt_node_wa if pd.isna(wa) == False]
        self.custom_input = None if pd.isna(custom_input) else etree.fromstring(custom_input, parser)
        self.custom_seed = None if pd.isna(custom_seed) else etree.fromstring(custom_seed, parser)
        
        default_question_quiz_tree = etree.parse("default_question.xml", parser)
        default_question_quiz_root = default_question_quiz_tree.getroot()
        
        for question_element in default_question_quiz_root.iterchildren("question"):
            if question_element.attrib["type"] == "stack":
                self.root = question_element
                break
        
        for questionname_element in self.root.iterchildren("name"):
            for questionname_text_element in questionname_element.iterchildren("text"):
                questionname_text_element.text = f"t{self.topic_number}-{self.exercise_number:02d}-{self.exercise_part} {self.exercise_description}"
        
        exercise_content_string = "" if pd.isna(self.exercise_content) else f"<p>{self.exercise_content}</p>"
        for questiontext_element in self.root.iterchildren("questiontext"):
            for questiontext_text_element in questiontext_element.iterchildren("text"):
                questiontext_text_element.text = etree.CDATA(f"<p>{self.exercise_text}</p>\n{exercise_content_string}")
        
        for questionvariables_element in self.root.iterchildren("questionvariables"):
            for questionvariables_text_element in questionvariables_element.iterchildren("text"):
                questionvariables_text_element.text = self.exercise_variables
                
        if self.custom_general_feedback is not None and not pd.isna(self.custom_general_feedback):
            for general_feedback_element in self.root.iterchildren("generalfeedback"):
                for general_feedback_text_element in general_feedback_element.iterchildren("text"):
                    general_feedback_text_element.text = etree.CDATA(self.custom_general_feedback)
        
        if self.exercise_note is not None and not pd.isna(self.exercise_note):
            for questionnote_element in self.root.iterchildren("questionnote"):
                for questionnote_text_element in questionnote_element.iterchildren("text"):
                    questionnote_text_element.text = self.exercise_note
        
        
        if self.custom_prt is not None:
            for prt_element in self.root.iterchildren("prt"):
                self.root.remove(prt_element)
            if self.custom_prt.tag == "prt":
                self.root.append(self.custom_prt)
            elif self.custom_prt.tag == "prt_fields":
                for prt_element in self.custom_prt.iterchildren("prt"):
                    self.root.append(prt_element)
            
        if self.custom_input is not None:
            for old_input_element in self.root.iterchildren("input"):
                self.root.remove(old_input_element)
            if self.custom_input.tag == "input":
                self.root.append(self.custom_input)
            elif self.custom_input.tag == "input_fields":
                for input_element in self.custom_input.iterchildren("input"):
                    self.root.append(input_element)
        
        if self.custom_seed is not None:
            for old_seed_element in self.root.iterchildren("deployedseed"):
                self.root.remove(old_seed_element)
            if self.custom_seed.tag == "deployedseed":
                self.root.append(self.custom_seed)
            elif self.custom_seed.tag == "seed_fields":
                for seed_element in self.custom_seed.iterchildren("deployedseed"):
                    self.root.append(seed_element)
        
        if self.add_prt_node_wa is not None:
            i=1
            for wa_text in self.add_prt_node_wa: 
                node_to_add_tree = etree.parse("default-prt-node.xml", parser)
                node_to_add = node_to_add_tree.getroot()
                
                for sans_element in node_to_add.iterchildren("sans"):
                    sans_element.text = "ans1"
                    
                for tans_element in node_to_add.iterchildren("tans"):
                    tans_element.text = f"wa{i}"
                
                for truefeedback_element in node_to_add.iterchildren("truefeedback"):
                    for truefeedback_text_element in truefeedback_element.iterchildren("text"):
                        truefeedback_text_element.text = etree.CDATA(wa_text)
                
                
                for prt in self.root.iterchildren("prt"):
                    
                    all_nodes = []
                    node_amount = 0
                    
                    prtname = ""
                    for prtname_element in prt.iterchildren("name"):
                        prtname = prtname_element.text
                    
                    for node in prt.iterchildren("node"):
                        all_nodes.append(node)
                        node_amount+=1
                
                    if node_amount <= 0:
                        continue
                    
                    #Assume that the last node in the tree is the last node in the flow chart. This code is problematic if e. g. the last node in the XML is one of the first nodes in the prt.
                    last_node = all_nodes[-1]
                    last_node_number = 0
                    for name_element in last_node.iterchildren("name"):
                        last_node_number = int(name_element.text)
                    new_node_name = f"{last_node_number+1}"
                    new_node_label = f"{last_node_number+2}"
                        
                    for name_element in node_to_add.iterchildren("name"):
                        name_element.text = new_node_name
                        
                    for trueanswernote_element in node_to_add.iterchildren("trueanswernote"):
                        trueanswernote_element.text = f"{prtname}-{new_node_label}-T"
                    for falseanswernote_element in node_to_add.iterchildren("falseanswernote"):
                        falseanswernote_element.text = f"{prtname}-{new_node_label}-F"
                    
                    for falsenextnode_element in last_node.iterchildren("falsenextnode"):
                        if falsenextnode_element.text == "-1":
                            falsenextnode_element.text = new_node_name
                            
                    #for truescore_element in last_node.iterchildren("truescore"):
                    #    if truescore_element.text != "1":
                    #        for truenextnode_element in node.iterchildren("truenextnode"):
                    #            if truenextnode_element.text == "-1":
                    #                truenextnode_element.text = new_node_name
                                    
                    prt.append(copy.deepcopy(node_to_add))
                
                i+=1
                
        if self.add_prt_node_on_not_correct is not None and not pd.isna(self.add_prt_node_on_not_correct):
            node_to_add_tree = etree.parse("default-prt-node.xml", parser)
            node_to_add = node_to_add_tree.getroot()
            for truefeedback_element in node_to_add.iterchildren("truefeedback"):
                for truefeedback_text_element in truefeedback_element.iterchildren("text"):
                    truefeedback_text_element.text = etree.CDATA(f"<p>{self.add_prt_node_on_not_correct}</p>")
            
            
                
            for prt in self.root.iterchildren("prt"):
                #node_amount = 0
                #for node in prt.iterchildren("node"):
                #    node_amount+=1
                for node in prt.iterchildren("node"):
                    for falsenextnode_element in node.iterchildren("falsenextnode"):
                        if falsenextnode_element.text == "-1":
                            falsenextnode_element.text = "999"
                    for truescore_element in node.iterchildren("truescore"):
                        if truescore_element.text != "1":
                            for truenextnode_element in node.iterchildren("truenextnode"):
                                if truenextnode_element.text == "-1":
                                    truenextnode_element.text = "999"
            
                prtname = ""
                for prtname_element in prt.iterchildren("name"):
                    prtname = prtname_element.text
                    
                for trueanswernote_element in node_to_add.iterchildren("trueanswernote"):
                    trueanswernote_element.text = f"{prtname}-1000-T"
                for falseanswernote_element in node_to_add.iterchildren("falseanswernote"):
                    falseanswernote_element.text = f"{prtname}-1000-F"
                    
                prt.append(copy.deepcopy(node_to_add))
                
            
    def __str__(self):
        return f"{etree.tostring(self.root, pretty_print=True)}"

#%%-----------------------------------UPDATE----------------------------------
df = pd.read_csv("exercises.csv", delimiter=";")

last_category = ""
to_parse = df[df.already_parsed == 0]
#to_parse = df[df.note == 0]
Exercises_To_Parse = []
for data in to_parse.itertuples():
    Exercise_To_Parse = MoodleQuestion(data.topic_number, data.topic_id, data.exercise_number, data.exercise_part, data.topic_label, data.exercise_description, data.exercise_variables, data.exercise_text, data.exercise_content, data.exercise_hint, data.custom_general_feedback, data.exercise_note, data.custom_prt, data.add_prt_node_on_not_correct, [data.add_prt_node_wa1, data.add_prt_node_wa2, data.add_prt_node_wa3], data.custom_input, data.custom_seed)
    Exercises_To_Parse.append(Exercise_To_Parse)
    
#%%------------------------------------TEST----------------------------------

TestVersion = QuestionPool(QuestionVersion("test"), Exercises_To_Parse)
TestVersion.write_to_file("output.xml")

#%%------------------------------------PREVIEW---------------------------------
def normal_version_config_text(**kwargs):
    Exercises = kwargs.get("Exercises")
    if Exercises == None:
        print("no exercises found for config callback of instant tutoring version")
        return ""
    
    info_dict = {}
    groups = []
    groups.append({"id":"start", "name":"Start","questions":["i"]})
    
    SortedExercises = sorted(Exercises, key=lambda x:f"t{x.topic_number}_{x.topic_id}_{x.exercise_number}_{x.exercise_part}")
    
    previous_group = ""
    for Exercise in SortedExercises:
        group_identifier = f"t{Exercise.topic_number}_{Exercise.topic_id}_{Exercise.exercise_number}"
        if previous_group == group_identifier:
            groups[-1]["questions"].append(Exercise.exercise_part)
        else:
            groups.append({"id":group_identifier, "name":Exercise.topic_label , "questions":[Exercise.exercise_part]})
        previous_group = group_identifier
    
    info_dict["groups"] = groups
    return json.dumps(info_dict)


NormalVersion = QuestionPool(QuestionVersion("normal", False, '<script src="https://marvin.hs-bochum.de/~mneugebauer/alquiz-qpool-normal.js"></script>', "start-normal.xml", "config-normal.xml", callback_last_quiz_element_text=normal_version_config_text, Exercises=Exercises_To_Parse), Exercises_To_Parse)
NormalVersion.write_to_file()

#%%------------------------------------ROLE-PLAY-GAME----------------------------------

def rpg_version_insert_config_text(**kwargs):
    random_colors = ["#573036","#1BA1C7","#B38ABB","#D558A8","#1B5658","#810311","#74CD27","#3CF48A","#77B211","#FD9C80","#E249B2","#D57774","#944A6C","#9B49A2","#FA00D1","#E2AFDA","#EB3E57","#7E182C","#3960A7","#E44FCD","#278495","#6D9D29","#302FFF","#BBCBC4","#C5F99B","#A3717F","#395C44","#10F046","#E39FB2","#23F5CC","#01D504","#C6F237","#B64537","#8C9BF5","#9F6D55","#65D794","#162095","#DD5BE4","#A4FFDC","#BA9DCC","#D34FDB","#910602","#C8B210","#3BDBAA","#916F06","#C5B6C7","#88383B","#71BC2E","#B20EE3","#C751FB","#496108","#4DA97E","#F8C255","#642E0E","#16C9D7","#C768E5","#DA8376","#93916B","#A4AA17","#62CB69","#CD51BA","#877931","#DDB76F","#C14532","#70C3CA","#6AC2E3","#8F822E","#040237","#AEC069","#C6E2B2","#0EE073","#E239C3","#D5C5B6","#167CFE","#7D9C92","#B138AC","#5E748B","#F31FE0","#A5F944","#58EF3F","#917DAB","#582BAF","#A7BB80","#FA570F","#E3C6EB","#CA2CB0","#914779","#27FE1F","#593E8B","#0DCB1E","#316E18","#D333EA","#ADB645","#1B303D","#DD089D","#5DB7C6","#B24D21","#CF7D35","#34BC98","#E9FCEE"]
    random_filters = ["invert(20%) sepia(11%) saturate(2292%) hue-rotate(301deg) brightness(88%) contrast(87%)","invert(46%) sepia(89%) saturate(419%) hue-rotate(147deg) brightness(97%) contrast(96%)","invert(67%) sepia(28%) saturate(423%) hue-rotate(244deg) brightness(85%) contrast(89%)","invert(50%) sepia(90%) saturate(907%) hue-rotate(290deg) brightness(87%) contrast(90%)","invert(26%) sepia(12%) saturate(2407%) hue-rotate(133deg) brightness(95%) contrast(86%)","invert(8%) sepia(64%) saturate(6140%) hue-rotate(346deg) brightness(93%) contrast(104%)","invert(68%) sepia(76%) saturate(507%) hue-rotate(42deg) brightness(95%) contrast(83%)","invert(72%) sepia(40%) saturate(699%) hue-rotate(89deg) brightness(101%) contrast(98%)","invert(64%) sepia(52%) saturate(5261%) hue-rotate(48deg) brightness(107%) contrast(87%)","invert(84%) sepia(53%) saturate(4565%) hue-rotate(313deg) brightness(115%) contrast(108%)","invert(52%) sepia(64%) saturate(4425%) hue-rotate(292deg) brightness(93%) contrast(90%)","invert(81%) sepia(50%) saturate(3032%) hue-rotate(305deg) brightness(86%) contrast(94%)","invert(34%) sepia(25%) saturate(1028%) hue-rotate(280deg) brightness(96%) contrast(89%)","invert(35%) sepia(65%) saturate(573%) hue-rotate(248deg) brightness(92%) contrast(92%)","invert(54%) sepia(100%) saturate(7435%) hue-rotate(298deg) brightness(97%) contrast(127%)","invert(96%) sepia(86%) saturate(2059%) hue-rotate(203deg) brightness(96%) contrast(83%)","invert(33%) sepia(19%) saturate(6570%) hue-rotate(328deg) brightness(97%) contrast(89%)","invert(14%) sepia(27%) saturate(5843%) hue-rotate(328deg) brightness(98%) contrast(98%)","invert(33%) sepia(56%) saturate(621%) hue-rotate(180deg) brightness(96%) contrast(95%)","invert(76%) sepia(58%) saturate(7362%) hue-rotate(280deg) brightness(93%) contrast(93%)","invert(40%) sepia(10%) saturate(2946%) hue-rotate(142deg) brightness(107%) contrast(86%)","invert(53%) sepia(90%) saturate(357%) hue-rotate(43deg) brightness(87%) contrast(88%)","invert(12%) sepia(96%) saturate(6720%) hue-rotate(247deg) brightness(102%) contrast(101%)","invert(93%) sepia(3%) saturate(752%) hue-rotate(102deg) brightness(89%) contrast(85%)","invert(100%) sepia(16%) saturate(5613%) hue-rotate(328deg) brightness(109%) contrast(92%)","invert(51%) sepia(4%) saturate(3367%) hue-rotate(293deg) brightness(95%) contrast(75%)","invert(28%) sepia(21%) saturate(737%) hue-rotate(86deg) brightness(102%) contrast(87%)","invert(52%) sepia(95%) saturate(903%) hue-rotate(88deg) brightness(115%) contrast(90%)","invert(78%) sepia(4%) saturate(2863%) hue-rotate(296deg) brightness(88%) contrast(102%)","invert(100%) sepia(72%) saturate(2181%) hue-rotate(84deg) brightness(106%) contrast(91%)","invert(43%) sepia(74%) saturate(1175%) hue-rotate(89deg) brightness(106%) contrast(114%)","invert(96%) sepia(38%) saturate(4597%) hue-rotate(13deg) brightness(104%) contrast(89%)","invert(36%) sepia(12%) saturate(4301%) hue-rotate(324deg) brightness(93%) contrast(92%)","invert(64%) sepia(5%) saturate(3975%) hue-rotate(195deg) brightness(98%) contrast(96%)","invert(49%) sepia(5%) saturate(4049%) hue-rotate(334deg) brightness(89%) contrast(72%)","invert(80%) sepia(24%) saturate(818%) hue-rotate(88deg) brightness(91%) contrast(88%)","invert(18%) sepia(23%) saturate(6913%) hue-rotate(217deg) brightness(94%) contrast(98%)","invert(46%) sepia(92%) saturate(1381%) hue-rotate(268deg) brightness(96%) contrast(85%)","invert(91%) sepia(24%) saturate(563%) hue-rotate(85deg) brightness(103%) contrast(103%)","invert(70%) sepia(13%) saturate(705%) hue-rotate(233deg) brightness(94%) contrast(91%)","invert(45%) sepia(84%) saturate(1892%) hue-rotate(259deg) brightness(88%) contrast(94%)","invert(11%) sepia(63%) saturate(4965%) hue-rotate(14deg) brightness(103%) contrast(124%)","invert(72%) sepia(81%) saturate(1388%) hue-rotate(8deg) brightness(93%) contrast(87%)","invert(92%) sepia(80%) saturate(1117%) hue-rotate(82deg) brightness(101%) contrast(69%)","invert(43%) sepia(44%) saturate(6440%) hue-rotate(38deg) brightness(93%) contrast(95%)","invert(80%) sepia(6%) saturate(490%) hue-rotate(246deg) brightness(91%) contrast(96%)","invert(27%) sepia(85%) saturate(439%) hue-rotate(308deg) brightness(84%) contrast(94%)","invert(61%) sepia(95%) saturate(366%) hue-rotate(48deg) brightness(91%) contrast(84%)","invert(22%) sepia(84%) saturate(4934%) hue-rotate(280deg) brightness(90%) contrast(116%)","invert(41%) sepia(23%) saturate(6695%) hue-rotate(255deg) brightness(101%) contrast(97%)","invert(32%) sepia(17%) saturate(2438%) hue-rotate(36deg) brightness(96%) contrast(94%)","invert(54%) sepia(42%) saturate(476%) hue-rotate(100deg) brightness(100%) contrast(84%)","invert(76%) sepia(85%) saturate(388%) hue-rotate(335deg) brightness(100%) contrast(95%)","invert(18%) sepia(12%) saturate(6525%) hue-rotate(354deg) brightness(97%) contrast(92%)","invert(67%) sepia(27%) saturate(3791%) hue-rotate(137deg) brightness(101%) contrast(83%)","invert(51%) sepia(33%) saturate(1489%) hue-rotate(239deg) brightness(96%) contrast(86%)","invert(76%) sepia(76%) saturate(1360%) hue-rotate(305deg) brightness(86%) contrast(86%)","invert(62%) sepia(7%) saturate(1282%) hue-rotate(19deg) brightness(91%) contrast(88%)","invert(57%) sepia(80%) saturate(463%) hue-rotate(23deg) brightness(95%) contrast(84%)","invert(99%) sepia(33%) saturate(3140%) hue-rotate(51deg) brightness(87%) contrast(79%)","invert(52%) sepia(46%) saturate(3109%) hue-rotate(280deg) brightness(85%) contrast(86%)","invert(51%) sepia(15%) saturate(1482%) hue-rotate(13deg) brightness(88%) contrast(89%)","invert(77%) sepia(47%) saturate(395%) hue-rotate(353deg) brightness(90%) contrast(91%)","invert(29%) sepia(72%) saturate(1119%) hue-rotate(334deg) brightness(100%) contrast(91%)","invert(72%) sepia(7%) saturate(2161%) hue-rotate(136deg) brightness(100%) contrast(88%)","invert(67%) sepia(76%) saturate(312%) hue-rotate(161deg) brightness(93%) contrast(90%)","invert(44%) sepia(53%) saturate(494%) hue-rotate(15deg) brightness(101%) contrast(89%)","invert(5%) sepia(65%) saturate(6178%) hue-rotate(225deg) brightness(82%) contrast(117%)","invert(74%) sepia(10%) saturate(1407%) hue-rotate(32deg) brightness(95%) contrast(97%)","invert(99%) sepia(25%) saturate(1040%) hue-rotate(32deg) brightness(96%) contrast(83%)","invert(74%) sepia(55%) saturate(3187%) hue-rotate(95deg) brightness(100%) contrast(89%)","invert(36%) sepia(82%) saturate(2028%) hue-rotate(285deg) brightness(89%) contrast(99%)","invert(100%) sepia(14%) saturate(6473%) hue-rotate(297deg) brightness(96%) contrast(89%)","invert(32%) sepia(97%) saturate(1864%) hue-rotate(203deg) brightness(101%) contrast(102%)","invert(59%) sepia(17%) saturate(351%) hue-rotate(110deg) brightness(98%) contrast(88%)","invert(27%) sepia(54%) saturate(2411%) hue-rotate(277deg) brightness(97%) contrast(89%)","invert(44%) sepia(22%) saturate(502%) hue-rotate(170deg) brightness(94%) contrast(88%)","invert(29%) sepia(79%) saturate(5626%) hue-rotate(292deg) brightness(105%) contrast(102%)","invert(76%) sepia(95%) saturate(349%) hue-rotate(32deg) brightness(103%) contrast(95%)","invert(85%) sepia(39%) saturate(1594%) hue-rotate(52deg) brightness(105%) contrast(87%)","invert(63%) sepia(16%) saturate(751%) hue-rotate(224deg) brightness(80%) contrast(85%)","invert(21%) sepia(70%) saturate(2838%) hue-rotate(251deg) brightness(79%) contrast(98%)","invert(77%) sepia(8%) saturate(1333%) hue-rotate(39deg) brightness(92%) contrast(91%)","invert(63%) sepia(81%) saturate(6168%) hue-rotate(355deg) brightness(100%) contrast(97%)","invert(90%) sepia(93%) saturate(7327%) hue-rotate(187deg) brightness(95%) contrast(93%)","invert(22%) sepia(100%) saturate(1928%) hue-rotate(289deg) brightness(98%) contrast(93%)","invert(37%) sepia(6%) saturate(4740%) hue-rotate(267deg) brightness(86%) contrast(84%)","invert(88%) sepia(89%) saturate(7374%) hue-rotate(48deg) brightness(88%) contrast(133%)","invert(27%) sepia(17%) saturate(2095%) hue-rotate(219deg) brightness(96%) contrast(93%)","invert(62%) sepia(73%) saturate(2975%) hue-rotate(82deg) brightness(97%) contrast(103%)","invert(34%) sepia(11%) saturate(5321%) hue-rotate(66deg) brightness(88%) contrast(81%)","invert(39%) sepia(69%) saturate(5452%) hue-rotate(275deg) brightness(95%) contrast(99%)","invert(65%) sepia(95%) saturate(273%) hue-rotate(25deg) brightness(90%) contrast(87%)","invert(17%) sepia(41%) saturate(502%) hue-rotate(158deg) brightness(90%) contrast(97%)","invert(18%) sepia(80%) saturate(7083%) hue-rotate(309deg) brightness(92%) contrast(100%)","invert(88%) sepia(6%) saturate(5508%) hue-rotate(156deg) brightness(88%) contrast(72%)","invert(29%) sepia(18%) saturate(5200%) hue-rotate(352deg) brightness(103%) contrast(83%)","invert(61%) sepia(55%) saturate(1048%) hue-rotate(339deg) brightness(88%) contrast(83%)","invert(64%) sepia(14%) saturate(1723%) hue-rotate(114deg) brightness(94%) contrast(93%)","invert(100%) sepia(5%) saturate(4521%) hue-rotate(53deg) brightness(102%) contrast(96%)"]
    text = ""
    Exercises = kwargs.get("Exercises")
    if Exercises == None:
        print("no exercises found for config callback of role play game tutoring version")
        return ""
    
    seed_limit = kwargs.get("seed_limit")
    if seed_limit == None:
        seed_limit = 0
        print("continue without seed limit in an role play game version")
    
    text = """

    """
    
    info_dict = {}
    groups = {}
    groups["start"] = "Start"
    questions = {}
    questions["start"] = {"name":"Start", "group":"start"}
    #In what order are the exercises parsed? They are implemented in Moodle alphabetically, but here: first come, first serves?
    
    SortedExercises = sorted(Exercises, key=lambda x:f"t{x.topic_number}_{x.topic_id}_{x.exercise_number}_{x.exercise_part}")
    color_count = 0
    for Exercise in SortedExercises:
        group_identifier = f"t{Exercise.topic_number}_{Exercise.topic_id}_{Exercise.exercise_number}"
        group_check = groups.get(group_identifier)
        if group_check == None:
            groups[group_identifier] = Exercise.topic_label
            
        #Check amount of possible variants
        seed_amount = 0
        for seed in Exercise.root.iterchildren("deployedseed"):
            seed_amount+=1
        
        if seed_amount < 1:
            print(f"No seed given for t{Exercise.topic_number}-{Exercise.exercise_number}-{Exercise.exercise_part}.")
            seed_amount = 1
                
        variant_amount = seed_amount if (seed_limit == 0 or seed_amount < seed_limit) else seed_limit
        question_identifier = f"{group_identifier}_{Exercise.exercise_part}"
        #print(question_identifier)
        #questions[question_identifier] = {"name":Exercise.exercise_description, "variants":variant_amount, "hint":Exercise.exercise_hint, "color":random_colors[color_count], "filter":random_filters[color_count]}
        questions[question_identifier] = {"name":Exercise.exercise_description, "variants":variant_amount, "color":random_colors[color_count], "filter":random_filters[color_count]}
        
        color_count+=1
    #print(groups)
    info_dict["groups"] = groups
    info_dict["questions"] = questions
    #print(info_dict)
    
    #Necessary to escape " and ' here?
    quiz_info_as_string = json.dumps(info_dict)
    
    text = f"""
<script src="https://marvin.hs-bochum.de/~mneugebauer/alquiz-fantasy-bg-ver3.js"></script>
<script>
    let quizObjectAsString = '{quiz_info_as_string}';
    let quizObject = JSON.parse(quizObjectAsString)
    let ALQuiz = new FantasyQuiz(quizObject);
    ALQuiz.setCurrentQuestionId("start");
    document.addEventListener("DOMContentLoaded", function() {{
        ALQuiz.init();
    }});
</script>
<p dir="ltr" style="text-align: left;display:none;">Some formula to load Mathjax \(x=1\)<br></p>

<p>[[input:ans1]] [[validation:ans1]]</p>
<p>[[input:ans2]] [[validation:ans2]]<br></p>
    """
    
    return text

def rpg_version_normalize_input_to_algebraic(**kwargs):
    Question = kwargs.get("Question")
    if Question == None:
        print("no question found for input change")
        return False
    
    for input_element in Question.root.iterchildren("input"):
        handling = False
        for type_element in input_element.iterchildren("type"):
            if type_element.text == "equiv":
                handling = True
                type_element.text = "algebraic"
                
        if handling == False:
            continue
        
        
        for syntaxhint_element in input_element.iterchildren("syntaxhint"):
            if "firstline" in syntaxhint_element.text:
                sub_word_with_comma = re.compile("firstline[,\s]*(?=.*)")
                syntaxhint_element.text = sub_word_with_comma.sub("", syntaxhint_element.text)
        
        name = ""
        for name_element in input_element.iterchildren("name"):
            name = name_element.text
        
        for input_options_element in input_element.iterchildren("options"):
            if "hideequiv" in input_options_element.text:
                sub_word_with_comma = re.compile("hideequiv[,\s]*(?=.*)")
                input_options_element.text = sub_word_with_comma.sub("", input_options_element.text)
            if "firstline" in input_options_element.text:
                sub_word_with_comma = re.compile("firstline[,\s]*(?=.*)")
                input_options_element.text = sub_word_with_comma.sub("", input_options_element.text)
                
        name = ""
        for input_name_element in input_element.iterchildren("name"):
            name = input_name_element.text
        if name == "":
            continue
        
        for input_tans_element in input_element.iterchildren("tans"):
            input_tans_element.text = f"last({input_tans_element.text})"
        
        for prt in Question.root.iterchildren("prt"):
            for node in prt.iterchildren("node"):
                for sans in node.iterchildren("sans"):
                    if name in sans.text:
                        regex = re.compile(f'{name}')
                        sans.text = regex.sub(f"[{name}]", sans.text)
                        
    return True
            
            
            
                
rpg_fixed_seed_amount = 4
RPGVersion = QuestionPool(QuestionVersion("rpg", True, script_on_init='<script>window.location.href = document.querySelector("[id*=quiznavbutton]").href; document.addEventListener("DOMContentLoaded", function() { document.querySelectorAll(".back_instruction").forEach(function(elem) { elem.style.display = "block"; }); });</script>\n<p class="back_instruction" style="display:none;">Um zurück zum Spiel zu gelangen, klicken Sie bitte in der Quiz-Navigation auf das erste Element.</p>\n', custom_first_elements_filepath="start-rpg.xml", fixed_seed_amount=rpg_fixed_seed_amount, show_hint=True, callback_first_quiz_element_text=rpg_version_insert_config_text, callback_change_before_clone=rpg_version_normalize_input_to_algebraic, Exercises=Exercises_To_Parse, seed_limit=rpg_fixed_seed_amount), Exercises_To_Parse)
RPGVersion.write_to_file()

#%%------------------------------------INTELLIGENT TUTORING SYSTEM----------------------------------

def it_version_config_text(**kwargs):
    text = ""
    Exercises = kwargs.get("Exercises")
    if Exercises == None:
        print("no exercises found for config callback of instant tutoring version")
        return ""
    
    seed_limit = kwargs.get("seed_limit")
    if seed_limit == None:
        seed_limit = 0
        print("continue without seed limit in an instant tutoring version")
    
    info_dict = {}
    groups = {}
    groups["start"] = "Start"
    questions = {}
    questions["start"] = {"name":"Start", "group":"start"}
    #, "type":"instruction"
    
    SortedExercises = sorted(Exercises, key=lambda x:f"t{x.topic_number}_{x.topic_id}_{x.exercise_number}_{x.exercise_part}")
    
    
    for Exercise in SortedExercises:
        #Check amount of possible variants
        seed_amount = 0
        for seed in Exercise.root.iterchildren("deployedseed"):
            seed_amount+=1
        if seed_amount < 1:
            print(f"No seed given for t{Exercise.topic_number}-{Exercise.exercise_number}-{Exercise.exercise_part}.")
            seed_amount = 1
                
        variant_amount = seed_amount if (seed_limit == 0 or seed_amount < seed_limit) else seed_limit
        
        group_identifier = f"t{Exercise.topic_number}_{Exercise.topic_id}_{Exercise.exercise_number}"
        group_check = groups.get(group_identifier)
        if group_check == None:
            groups[group_identifier] = Exercise.topic_label
        question_identifier = f"{group_identifier}_{Exercise.exercise_part}"
        questions[question_identifier] = {"name":Exercise.exercise_description, "variants":variant_amount}
        text = f"{text}t{Exercise.topic_number}_{Exercise.exercise_number}_{Exercise.exercise_part}\n"
    #print(groups)
    info_dict["groups"] = groups
    info_dict["questions"] = questions
    #print(info_dict)
    return f'<script>window.location.href = document.querySelector("[id*=quiznavbutton]").href;</script>\n<p>Sie sind in der Konfigurationsdatei vom Digitalen Mentor gelandet. Klicken sie bitte auf eine der anderen Fragen in der Test-Navigation, um zurück zum Übungsraum zu gelangen.</p>\n{json.dumps(info_dict)}'

def it_version_add_to_script_text(**kwargs):
    text = ""
    Question = kwargs.get("Question")
    if Question == None:
        print("no question found for callback of add to script text")
        return "start"
    text = f"<script>ALQuiz.setCurrentQuestionId('t{Question.topic_number}_{Question.topic_id}_{Question.exercise_number}_{Question.exercise_part}')</script>"
    return text

def it_version_change_text(**kwargs):
    #Change inputs
    Question = kwargs.get("Question")
    if Question == None:
        print("no question found for input change")
        return False
    #Turn algebraic input into equivalence reasoning
    for input_element in Question.root.iterchildren("input"):
        handling = False
        for input_type_element in input_element.iterchildren("type"):
            if(input_type_element.text == "algebraic"):
                input_type_element.text = "equiv"
                handling = True
        if handling == False:
            continue
        
        for input_options_element in input_element.iterchildren("options"):
            if input_options_element.text == "" or input_options_element.text == None:
                input_options_element.text = "hideequiv"
            elif not "hideequiv" in input_options_element.text:
                input_options_element.text = f"{input_options_element.text}, hideequiv"
        name = ""
        for input_name_element in input_element.iterchildren("name"):
            name = input_name_element.text
        if name == "":
            continue
        
        for input_tans_element in input_element.iterchildren("tans"):
            input_tans_element.text = f"[{input_tans_element.text}]"
        
        for prt in Question.root.iterchildren("prt"):
            for node in prt.iterchildren("node"):
                for sans in node.iterchildren("sans"):
                    if name in sans.text:
                        regex = re.compile(f'{name}')
                        sans.text = regex.sub(f"last({name})", sans.text)
                    #else:
                    #    print(f"{name} is not in {sans.text} ({Question.exercise_description})")
    
    return True
        

it_fixed_seed_amount = 4
InstantTutoringVersion = QuestionPool(QuestionVersion("instant-tutoring", True, '<script src="https://marvin.hs-bochum.de/~mneugebauer/alquiz-qpool-instant-tutoring.js"></script>', "start-instant-tutoring.xml", "config-instant-tutoring.xml", it_fixed_seed_amount, True, callback_last_quiz_element_text=it_version_config_text, callback_add_to_script=it_version_add_to_script_text, callback_change_before_clone=it_version_change_text, Exercises=Exercises_To_Parse, seed_limit=it_fixed_seed_amount), Exercises_To_Parse)
InstantTutoringVersion.write_to_file()

#%%------------------------------------PA AND ENDBOSS-----------------------
def pa_version_add_to_script_text(**kwargs):
    text = ""
    Question = kwargs.get("Question")
    if Question == None:
        print("no question found for callback of add to script text")
        return "start"
    text = f"<script>ALQuiz.setCurrentQuestionId('t{Question.topic_number}_{Question.topic_id}_{Question.exercise_number}_{Question.exercise_part}')</script>"
            
    
    hint_text = ""
    if Question.exercise_hint != "" and not pd.isna(Question.exercise_hint):
        hint_text = f'<div class="hint">{Question.exercise_hint}</div>'
    else:
        hint_text = "Viel Erfolg beim Lösen dieser Aufgabe!"
    
    text = f'{text}<p class="bubble">{hint_text}</p><img class="dm-icon" src="https://marvin.hs-bochum.de/~mneugebauer/dm-avatar-grin.svg">'
    
    return text

PAEndbossVersion = QuestionPool(QuestionVersion("pa", False, '<script src="https://marvin.hs-bochum.de/~mneugebauer/alquiz-qpool-pa.js"></script>', "start-instant-tutoring.xml", show_hint=False, custom_last_elements_filepath="config-instant-tutoring.xml", callback_add_to_script=pa_version_add_to_script_text, callback_last_quiz_element_text=it_version_config_text, Exercises=Exercises_To_Parse), Exercises_To_Parse)
PAEndbossVersion.write_to_file()

#%%