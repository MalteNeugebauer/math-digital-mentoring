# %% imports
import numpy as np
import pandas as pd

# %% read data

exercise_tokens = [
	"syn_a1",
	"syn_a2",
	"syn_b1",
	"syn_b2",
	"syn_c",
	"syn_d",
	"syn_e",
	"syn_f",
	"syn_main",
	"fra_a",
	"fra_b",
	"fra_c",
	"fra_d",
	"fra_e",
	"fra_f",
	"bin_a",
	"bin_b",
	"bin_c",
	"bin_main",
	"fra_main",
	"pq_a",
	"pq_b",
	"pq_main",
	"rul_a",
	"rul_b",
	"rul_c",
	"rul_d",
	"rul_e",
	"rul_main",
	"tri_a",
	"tri_b",
	"tri_c",
	"tri_d",
	"tri_e",
	"tri_f",
	"tri_g",
	"tri_main"    
]

exercise_tokens_df = pd.DataFrame(index=exercise_tokens)
exercise_tokens_df[exercise_tokens_df.index.str.endswith('main')]

# %% analyse
endboss_questions_bool = exercise_tokens_df.index.str.endswith('main') \
                      & (exercise_tokens_df.index != 'bin_main')   # bin_main is no endboss
endboss_questions_names = exercise_tokens_df.index[endboss_questions_bool]

info_questions_names = ["start_instructions", "syn_instructions", "fra_instructions", "pq_instructions", "rul_instructions", "tri_instructions"]


# %% confusion matrix / hop graph

#hops = pd.read_csv('../alquiz_history.csv')
hops = pd.read_csv('hops.csv', delimiter=";")

#Finish state is not of relevance here
hops = hops.drop(hops[hops.next_question_id == "_finish"].index, axis=0)

absolute_graph = pd.crosstab(hops['question_id'], hops['next_question_id'], normalize='index')
absolute_graph = pd.crosstab(hops['question_id'], hops['next_question_id'])

#graph *= 100

graph = absolute_graph.copy(deep=True)

for source in absolute_graph.index:
    sumRow = np.sum(absolute_graph.loc[source,:])
    for dest in absolute_graph.columns:
        graph.loc[source,dest] = absolute_graph.loc[source,dest] / sumRow

# %% complete question names
all_questions = ['start_instructions'] + list(exercise_tokens_df.index) + ['sur_instructions', 'survey']
add_questions = ['fra_instructions', 'pq_instructions', 'rul_instructions', 'syn_instructions', 'tri_instructions']
for new_q in add_questions:
    qtype = new_q[:new_q.index('_')+1]  # e.g. 'fra_'
    pos = [all_questions.index(q) for q in all_questions if q.startswith(qtype)][0]
    all_questions.insert(pos, new_q)

# sort graph in the order of the questions
assert absolute_graph.shape[0] == len(all_questions)
absolute_graph = absolute_graph[all_questions].loc[all_questions]

assert graph.shape[0] == len(all_questions)
graph = graph[all_questions].loc[all_questions]

# %% make single large drawing
qtypes = {'fra': 'fractions', 'pq': 'pq formula', 'rul': 'power laws', 'syn': 'syntax', 'tri': 'trigonometry', 'sur': 'survey'}

bend_angle = 50
biggestValue = graph.max().max()
with open('drawing.tex', 'w') as f:
    # place question nodes
    for x, ex in enumerate(all_questions):
        boss_style = ", boss" if ex in endboss_questions_names else ""
        print(rf'\node [state{boss_style}] ({ex}) at ({x}, 0) {{}};', file=f)

    # draw category braces
    for qid, qname in qtypes.items():
        qtype_questions = [q for q in all_questions if q.startswith(qid)]
        first = qtype_questions[0]
        last = qtype_questions[-1]
        print(rf'\draw [category] ({first}.west) -- ({last}.east) node [midway, below=20pt+1.5em] {{{qname}\strut}};', file=f)

    # draw hop arrows
    for source in graph.index:
        for dest in graph.columns:
            val = graph.loc[source, dest]

            strength = 1+val/biggestValue*0.7 if val > 1 else 0.7
            opacity = round(50+val/biggestValue*50 if val > 1 else 10)

            if val > 2: # ignore the minority! ;-) otherwise... too many arrows!
                if source == dest:
                    bend_style = 'loop above'
                else:
                    dist = all_questions.index(dest) - all_questions.index(source)
                    start_angle = bend_angle if dist > 0 else (180 + bend_angle)
                    end_angle = 180 - start_angle

                    stength = abs(dist / 2)
                    bend_style = f"controls=+({start_angle}:{stength}) and +({end_angle}:{stength})"

                #print(rf'\path [line width={val/50:.1f}pt, black!{round(val / 2 + 50)}] ({source}) edge [{bend_style}] node {{${val:.1f}\%$}} ({dest});', file=f)
                print(rf'\path [line width={strength:.1f}pt, black!{opacity}] ({source}) edge [{bend_style}] node {{${val}$}} ({dest});', file=f)


# %% make multiple drawing, one for each question type
qtypes = {'fra': 'fractions', 'pq': 'pq formula', 'rul': 'power laws', 'syn': 'syntax', 'tri': 'trigonometry', 'sur': 'survey'}


#for qid, qname in qtypes.items():
#    print("continue here")

bend_angle = 80
biggestValue = graph.max().max()
for qid, qname in qtypes.items():
    qtype_questions = [q for q in all_questions if q.startswith(qid)]
    if qid == "fra":
        qtype_questions.pop()
        qtype_questions.append("bin_a")
        qtype_questions.append("bin_b")
        qtype_questions.append("bin_c")
        qtype_questions.append("bin_main")
        qtype_questions.append("fra_main")
    print(qtype_questions)
    with open(f'./tex/drawing-{qname}.tex', 'w') as f:
        # place question nodes
        for x, ex in enumerate(qtype_questions):
            if ex in endboss_questions_names:
                boss_style = ", boss"
            elif ex in info_questions_names:
                boss_style = ", info"
            else:
                boss_style = ""
            print(rf'\node [state{boss_style}] ({ex}) at ({x}, 0) {{}};', file=f)

        # place input/output nodes
        print(rf'\node [inout] (input) at (-1, 1) {{}};', file=f)
        print(rf'\node [inout] (output) at ({x+1}, 1) {{}};', file=f)

        # reduce graph
        first_q_idx = all_questions.index(qtype_questions[0])
        last_q_idx = all_questions.index(qtype_questions[-1])
        input_row = absolute_graph.iloc[:first_q_idx].sum()[qtype_questions]
        input_col = absolute_graph.iloc[:,:first_q_idx].sum(axis='columns')[qtype_questions]
        output_row = absolute_graph.iloc[last_q_idx+1:].sum()[qtype_questions]
        output_col = absolute_graph.iloc[:,last_q_idx+1:].sum(axis='columns')[qtype_questions]
        input_col['input'] = 0
        input_col['output'] = 0
        output_col['input'] = 0
        output_col['output'] = 0
        qtype_index = ['input'] + qtype_questions + ['output']
        qtype_graph = absolute_graph.loc[qtype_questions, qtype_questions]
        qtype_graph.loc['input'] = input_row
        qtype_graph.loc['output'] = output_row
        qtype_graph.loc[:, 'input'] = input_col
        qtype_graph.loc[:, 'output'] = output_col
        qtype_graph = qtype_graph[qtype_index].loc[qtype_index]
        
        for source in qtype_graph.index:
            sumRow = np.sum(qtype_graph.loc[source,:])
            for dest in qtype_graph.columns:
                if sumRow==0:
                    qtype_graph.loc[source,dest] = 0
                else:
                    qtype_graph.loc[source,dest] = qtype_graph.loc[source,dest] / sumRow
        #print(qname)
        #print(qtype_graph)

        

        # draw arrows
        for source in qtype_graph.index:
            for dest in qtype_graph.columns:
                val = qtype_graph.loc[source, dest]

                strength = 1+val/biggestValue*0.7 if val > 0.1 else 0.7
                opacity = round(50+val/biggestValue*50 if val > 0.1 else 10)
                if opacity > 100:
                    opacity = 100

                if val > 0.1: # ignore the minority! ;-) otherwise... too many arrows!
                    if source == dest:
                        bend_style = 'loop above'
                    else:
                        src_idx = qtype_index.index(source)
                        dst_idx = qtype_index.index(dest)
                        dist = dst_idx - src_idx
                        start_angle = bend_angle if dist > 0 else (180 + bend_angle)
                        end_angle = 180 - start_angle

                        stength = abs(dist / 1)
                        bend_style = f"controls=+({start_angle}:{stength}) and +({end_angle}:{stength})"

                    #print(rf'\path [line width={val/50:.1f}pt, black!{round(val / 2 + 50)}] ({source}) edge [{bend_style}] node {{${val:.1f}\%$}} ({dest});', file=f)
                    print(rf'\path [line width={strength:.1f}pt, black!{opacity}] ({source}) edge [{bend_style}] node[inner sep=1pt, fill=white, fill opacity=0.7, text opacity=1] {{${val:.3f}$}} ({dest});', file=f)

