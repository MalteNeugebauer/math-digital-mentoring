console.log("start alquiz analysis");
//----------------QUIZ OBJECTS--------------------
//In control design, questions section_09_check_in_modified2_6 and section_09_check_in_modified2_7 are merged in one question section_09_check_in_modified2_6and7.
/* WiMa SoSe 2023*/
let quizObject = {
    groups: {
        start: "Start",
        s3: "3 Elementare Funktionen",
        s4: "4 Eigenschaften von Funktionen",
        s5: "5 Grenzwerte, Stetigkeit und Definitionslücken",
        s6: "6 Differentialrechnung I (Ableitungsregeln)",
        s7: "7 Differentialrechnung II (Anwendung)",
        s8: "8 Differentialrechnung in mehreren Variablen",
        s9: "9 Finanzmathematik I",
        s10: "10 Finanzmathematik II",
        s11: "11 Lineare Algebra Grundlagen",
        s12: "12 Weiterführende Matrixrechnung",
        s13: "13 Lineare Optimierung"

    },
    questions: {
        start: {
            name: "Home",
            group: "start",
            onsuccess: "s3_1",
            onfailure: "s3_1"
        },
        s3_1: {
            /*orange*/
            name: "Geradengleichung aufstellen 1",
            onsuccess: "s3_2",
            onfailure: "s3_2",
            variants: 4,
            color: "#fbc02d",
            filter: "invert(75%) sepia(32%) saturate(1024%) hue-rotate(352deg) brightness(102%) contrast(97%)"
        },
        s3_2: {
            /*red-orange*/
            name: "Geradengleichung aufstellen 2",
            onsuccess: "s3_3",
            onfailure: "s3_3",
            variants: 4,
            color: "#ff3d00",
            filter: "invert(31%) sepia(93%) saturate(4185%) hue-rotate(7deg) brightness(105%) contrast(110%)"
        },
        s3_3: {
            /*light orange*/
            name: "Scheitelpunkt aus Graphik ablesen",
            variants: 4,
            color: "#ffcc80",
            filter: "invert(94%) sepia(80%) saturate(1438%) hue-rotate(304deg) brightness(109%) contrast(101%)"
        },
        s3_4: {
            /*???*/
            name: "Erlösfunktion",
            variants: 4,
            color: "#CF7D35",
            filter: "invert(61%) sepia(55%) saturate(1048%) hue-rotate(339deg) brightness(88%) contrast(83%)"
        },
        s3_5: {
            /*???*/
            name: "Abschnittsweise def Funktion",
            variants: 4,
            color: "#34BC98",
            filter: "invert(64%) sepia(14%) saturate(1723%) hue-rotate(114deg) brightness(94%) contrast(93%)"
        },
        s3_6: {
            /*???*/
            name: "Gewinnfunktion aufstellen",
            variants: 4,
            color: "#E9FCEE",
            filter: "invert(100%) sepia(5%) saturate(4521%) hue-rotate(53deg) brightness(102%) contrast(96%)"
        },
        section_03_check_out_modified2_1: {
            name: "Angebot und Nachfrage",
            variants: 4,
            color: "#573036",
            filter: "invert(20%) sepia(11%) saturate(2292%) hue-rotate(301deg) brightness(88%) contrast(87%)",
            group: "s3"
        },
        section_03_check_out_modified2_2: {
            name: "Scheitelpunktform DOMAINUID 4 ACEA29",
            variants: 4,
            color: "#1BA1C7",
            filter: "invert(46%) sepia(89%) saturate(419%) hue-rotate(147deg) brightness(97%) contrast(96%)",
            group: "s3"
        },
        section_03_check_out_modified2_3: {
            name: "Erlösfunktion E(p) aufstellen",
            variants: 4,
            color: "#B38ABB",
            filter: "invert(67%) sepia(28%) saturate(423%) hue-rotate(244deg) brightness(85%) contrast(89%)",
            group: "s3"
        },
        section_03_check_out_modified2_4: {
            name: "Produktionsfunktion Def ök",
            variants: 4,
            color: "#D558A8",
            filter: "invert(50%) sepia(90%) saturate(907%) hue-rotate(290deg) brightness(87%) contrast(90%)",
            group: "s3"
        },
        section_03_check_out_modified2_5: {
            name: "Gewinnschwelle & Gewinngrenze Kap. 2.7 (TF) (Duplikat Malte)",
            variants: 4,
            color: "#1B5658",
            filter: "invert(26%) sepia(12%) saturate(2407%) hue-rotate(133deg) brightness(95%) contrast(86%)",
            group: "s3"
        },
        section_03_check_out_modified2_6: {
            name: "Definitionsbereich Ök. Kap. 2.7 (TF)",
            variants: 4,
            color: "#810311",
            filter: "invert(8%) sepia(64%) saturate(6140%) hue-rotate(346deg) brightness(93%) contrast(104%)",
            group: "s3"
        },
        section_04_check_in_modified_6: {
            name: "Nullstelle abspalten (Duplikat Malte)",
            variants: 4,
            color: "#74CD27",
            filter: "invert(68%) sepia(76%) saturate(507%) hue-rotate(42deg) brightness(95%) contrast(83%)",
            group: "s4"
        },
        s4_1: {
            /*very light green*/
            name: "NS reverse",
            onsuccess: "s4_2",
            onfailure: "s4_2",
            variants: 4,
            color: "#ccff90",
            filter: "invert(88%) sepia(22%) saturate(727%) hue-rotate(38deg) brightness(103%) contrast(107%)"
        },
        s4_2: {
            /*light green*/
            name: "NS bei Def",
            onsuccess: "s4_3",
            onfailure: "s4_3",
            variants: 4,
            color: "#b2ff59",
            filter: "invert(96%) sepia(97%) saturate(787%) hue-rotate(29deg) brightness(100%) contrast(108%)"
        },
        s4_3: {
            /*green*/
            name: "NS Wurzelfkt",
            onsuccess: "s4_4",
            onfailure: "s4_4",
            variants: 4,
            color: "#76ff03",
            filter: "invert(67%) sepia(72%) saturate(618%) hue-rotate(43deg) brightness(110%) contrast(103%)"
        },
        s4_4: {
            /*dimmed green*/
            name: "4.2 Polynom von Grad 4 her bestimmen",
            onsuccess: "s4_5",
            onfailure: "s4_5",
            variants: 4,
            color: "#64dd17",
            filter: "invert(79%) sepia(18%) saturate(3453%) hue-rotate(45deg) brightness(97%) contrast(91%)"
        },
        s4_5: {
            /*dark green*/
            name: "4.1 Funktion ablesen Grad 4",
            variants: 4,
            color: "#689f38",
            filter: "invert(54%) sepia(21%) saturate(1222%) hue-rotate(49deg) brightness(99%) contrast(83%)"
        },
        section_05_check_in_3: {
            name: "Grenzwert gegen inf ablesen",
            variants: 4,
            color: "#3CF48A",
            filter: "invert(72%) sepia(40%) saturate(699%) hue-rotate(89deg) brightness(101%) contrast(98%)",
            group: "s5"
        },
        section_05_check_in_modified2_7: {
            name: "Stetigkeit abschnittsw def Funktion (Duplikat Malte)",
            variants: 4,
            color: "#E249B2",
            filter: "invert(52%) sepia(64%) saturate(4425%) hue-rotate(292deg) brightness(93%) contrast(90%)",
            group: "s5"
        },
        section_05_check_in_6: {
            name: "Polstelle",
            variants: 4,
            color: "#77B211",
            filter: "invert(64%) sepia(52%) saturate(5261%) hue-rotate(48deg) brightness(107%) contrast(87%)",
            group: "s5"
        },
        section_05_check_in_modified2_8: {
            name: "Hebbare Lücke (Duplikat Malte)",
            variants: 4,
            color: "#D57774",
            filter: "invert(81%) sepia(50%) saturate(3032%) hue-rotate(305deg) brightness(86%) contrast(94%)",
            group: "s5"
        },
        section_05_check_in_8: {
            name: "Asymptote",
            variants: 4,
            color: "#FD9C80",
            filter: "invert(84%) sepia(53%) saturate(4565%) hue-rotate(313deg) brightness(115%) contrast(108%)",
            group: "s5"
        },
        section_05_check_out_1: {
            name: "Grenzwertaufgabe mögliche Polstellen (TU)",
            variants: 4,
            color: "#E249B2",
            filter: "invert(52%) sepia(64%) saturate(4425%) hue-rotate(292deg) brightness(93%) contrast(90%)",
            group: "s5"
        },
        section_05_check_out_2: {
            name: "Nullstellen und Polstellen von sqrt(P/Q-1) Kap. 2.4 & 2.6 (TF)",
            variants: 4,
            color: "#D57774",
            filter: "invert(81%) sepia(50%) saturate(3032%) hue-rotate(305deg) brightness(86%) contrast(94%)",
            group: "s5"
        },
        section_05_check_out_3: {
            name: "Nullstellen, Polstellen und Asymptoten einer gebrochenrationalen Funktion Kap. 2.4 & 2.6 (TF)",
            variants: 4,
            color: "#944A6C",
            filter: "invert(34%) sepia(25%) saturate(1028%) hue-rotate(280deg) brightness(96%) contrast(89%)",
            group: "s5"
        },
        section_05_check_out_5: {
            name: "Asymptote VWL",
            variants: 4,
            color: "#9B49A2",
            filter: "invert(35%) sepia(65%) saturate(573%) hue-rotate(248deg) brightness(92%) contrast(92%)",
            group: "s5"
        },
        section_05_check_out_6: {
            name: "Sprungstelle abschnittsw def Funktion",
            variants: 4,
            color: "#FA00D1",
            filter: "invert(54%) sepia(100%) saturate(7435%) hue-rotate(298deg) brightness(97%) contrast(127%)",
            group: "s5"
        },
        s6_1: {
            /*very light purple*/
            name: "Ableitungsfunktion Konstante",
            onsuccess: "s6_2",
            onfailure: "s6_2",
            variants: 4,
            color: "#ea80fc",
            filter: "invert(76%) sepia(34%) saturate(6604%) hue-rotate(231deg) brightness(102%) contrast(98%)"
        },
        s6_2: {
            /*light purple*/
            name: "Ableitungsfunktion Potenzfunktion",
            onsuccess: "s6_3",
            onfailure: "s6_3",
            variants: 4,
            color: "#e040fb",
            filter: "invert(37%) sepia(85%) saturate(3762%) hue-rotate(272deg) brightness(104%) contrast(97%)"
        },
        s6_3: {
            /*purple*/
            name: "Ableitungsfunktion Potenzfunktion gebrochener Exponent",
            variants: 4,
            color: "#d500f9",
            filter: "invert(26%) sepia(92%) saturate(2035%) hue-rotate(275deg) brightness(86%) contrast(153%)"
        },
        section_06_check_out_1: {
            name: "01 Summen- und konstanter Faktor",
            variants: 4,
            color: "#E2AFDA",
            filter: "invert(96%) sepia(86%) saturate(2059%) hue-rotate(203deg) brightness(96%) contrast(83%)",
            group: "s6"
        },
        section_06_check_out_2: {
            name: "02 Produktregel (TF)",
            variants: 4,
            color: "#EB3E57",
            filter: "invert(33%) sepia(19%) saturate(6570%) hue-rotate(328deg) brightness(97%) contrast(89%)",
            group: "s6"
        },
        section_06_check_out_3: {
            name: "03 Quotientenregel[neu](TF)",
            variants: 4,
            color: "#7E182C",
            filter: "invert(14%) sepia(27%) saturate(5843%) hue-rotate(328deg) brightness(98%) contrast(98%)",
            group: "s6"
        },
        section_06_check_out_4: {
            name: "05 Logarithmisches Ableiten",
            variants: 4,
            color: "#3960A7",
            filter: "invert(33%) sepia(56%) saturate(621%) hue-rotate(180deg) brightness(96%) contrast(95%)",
            group: "s6"
        },
        section_06_check_out_5: {
            name: "04 Kettenregel",
            variants: 4,
            color: "#E44FCD",
            filter: "invert(76%) sepia(58%) saturate(7362%) hue-rotate(280deg) brightness(93%) contrast(93%)",
            group: "s6"
        },
        section_07_check_in_1: {
            name: "Newtonverfahren",
            variants: 4,
            color: "#278495",
            filter: "invert(40%) sepia(10%) saturate(2946%) hue-rotate(142deg) brightness(107%) contrast(86%)",
            group: "s7"
        },
        section_07_check_in_2: {
            name: "Stationäre kritische Stelle",
            variants: 4,
            color: "#6D9D29",
            filter: "invert(53%) sepia(90%) saturate(357%) hue-rotate(43deg) brightness(87%) contrast(88%)",
            group: "s7"
        },
        section_07_check_in_modified2_4: {
            name: "Extrema und Wendestelle (Duplikat Malte)",
            variants: 4,
            color: "#A3717F",
            filter: "invert(51%) sepia(4%) saturate(3367%) hue-rotate(293deg) brightness(95%) contrast(75%)",
            group: "s7"
        },
        section_07_check_out_1: {
            name: "Grenzkostenfunktion",
            variants: 4,
            color: "#302FFF",
            filter: "invert(12%) sepia(96%) saturate(6720%) hue-rotate(247deg) brightness(102%) contrast(101%)",
            group: "s7"
        },
        section_07_check_out_2: {
            name: "Kurvendiskussion: gebrochenrationale Funktion",
            variants: 4,
            color: "#BBCBC4",
            filter: "invert(93%) sepia(3%) saturate(752%) hue-rotate(102deg) brightness(89%) contrast(85%)",
            group: "s7"
        },
        section_07_check_out_3: {
            name: "Maximalen Gewinn bestimmen",
            variants: 4,
            color: "#C5F99B",
            filter: "invert(100%) sepia(16%) saturate(5613%) hue-rotate(328deg) brightness(109%) contrast(92%)",
            group: "s7"
        },
        section_07_check_out_4: {
            name: "Optimierung Gewinn",
            variants: 4,
            color: "#A3717F",
            filter: "invert(51%) sepia(4%) saturate(3367%) hue-rotate(293deg) brightness(95%) contrast(75%)",
            group: "s7"
        },
        section_07_check_out_5: {
            name: "Optimierung Umsatz",
            variants: 4,
            color: "#395C44",
            filter: "invert(28%) sepia(21%) saturate(737%) hue-rotate(86deg) brightness(102%) contrast(87%)",
            group: "s7"
        },
        section_08_check_in_2: {
            name: "01 partiell Diff",
            variants: 4,
            color: "#10F046",
            filter: "invert(52%) sepia(95%) saturate(903%) hue-rotate(88deg) brightness(115%) contrast(90%)",
            group: "s8"
        },
        section_08_check_in_3: {
            name: "02 partiell Diff",
            variants: 4,
            color: "#E39FB2",
            filter: "invert(78%) sepia(4%) saturate(2863%) hue-rotate(296deg) brightness(88%) contrast(102%)",
            group: "s8"
        },
        section_08_check_out_2: {
            name: "06 partiell Diff",
            variants: 4,
            color: "#01D504",
            filter: "invert(43%) sepia(74%) saturate(1175%) hue-rotate(89deg) brightness(106%) contrast(114%)",
            group: "s8"
        },
        section_08_check_out_3: {
            name: "7.03 Det 3x3 Folie 16",
            variants: 4,
            color: "#C6F237",
            filter: "invert(96%) sepia(38%) saturate(4597%) hue-rotate(13deg) brightness(104%) contrast(89%)",
            group: "s8"
        },
        section_09_check_in_1: {
            name: "wann ver-x-facht sich K",
            variants: 4,
            color: "#B64537",
            filter: "invert(36%) sepia(12%) saturate(4301%) hue-rotate(324deg) brightness(93%) contrast(92%)",
            group: "s9"
        },
        section_09_check_in_2: {
            name: "Zinssatz i berechnen",
            variants: 4,
            color: "#8C9BF5",
            filter: "invert(64%) sepia(5%) saturate(3975%) hue-rotate(195deg) brightness(98%) contrast(96%)",
            group: "s9"
        },
        section_09_check_in_modified2_6and7: {
            name: "Barwert Zahlungsstrom (Duplikat Malte)(Kopiert aus Barwert Endwert Zahlungsstrom)",
        },
        /*section_09_check_in_modified2_6: {
            name: "Barwert Zahlungsstrom (Duplikat Malte)(Kopiert aus Barwert Endwert Zahlungsstrom)",
            variants: 4,
            color: "#910602",
            filter: "invert(11%) sepia(63%) saturate(4965%) hue-rotate(14deg) brightness(103%) contrast(124%)",
            group: "s9"
        },
        section_09_check_in_modified2_7: {
            name: "Endwert Zahlungsstrom (Duplikat Malte)(Kopiert aus Barwert Endwert Zahlungsstrom)",
            variants: 4,
            color: "#C8B210",
            filter: "invert(72%) sepia(81%) saturate(1388%) hue-rotate(8deg) brightness(93%) contrast(87%)",
            group: "s9"
        },*/
        section_09_check_in_4: {
            name: "BW",
            variants: 4,
            color: "#9F6D55",
            filter: "invert(49%) sepia(5%) saturate(4049%) hue-rotate(334deg) brightness(89%) contrast(72%)",
            group: "s9"
        },
        section_09_check_in_5: {
            name: "EW",
            variants: 4,
            color: "#65D794",
            filter: "invert(80%) sepia(24%) saturate(818%) hue-rotate(88deg) brightness(91%) contrast(88%)",
            group: "s9"
        },
        section_09_check_in_6: {
            name: "Grundbegriffe",
            variants: 4,
            color: "#162095",
            filter: "invert(18%) sepia(23%) saturate(6913%) hue-rotate(217deg) brightness(94%) contrast(98%)",
            group: "s9"
        },
        section_09_check_out_1: {
            name: "Äquivalenzprinzip",
            variants: 4,
            color: "#DD5BE4",
            filter: "invert(46%) sepia(92%) saturate(1381%) hue-rotate(268deg) brightness(96%) contrast(85%)",
            group: "s9"
        },
        section_09_check_out_2: {
            name: "Effektivzins 1",
            variants: 4,
            color: "#A4FFDC",
            filter: "invert(91%) sepia(24%) saturate(563%) hue-rotate(85deg) brightness(103%) contrast(103%)",
            group: "s9"
        },
        section_09_check_out_3: {
            name: "Impl. Terminzinss.",
            variants: 4,
            color: "#BA9DCC",
            filter: "invert(70%) sepia(13%) saturate(705%) hue-rotate(233deg) brightness(94%) contrast(91%)",
            group: "s9"
        },
        section_09_check_out_4: {
            name: "Barwert und Endwert eines Zahlungsstroms",
            variants: 4,
            color: "#D34FDB",
            filter: "invert(45%) sepia(84%) saturate(1892%) hue-rotate(259deg) brightness(88%) contrast(94%)",
            group: "s9"
        },
        section_09_check_out_5: {
            name: "Endwert berechnen",
            variants: 4,
            color: "#910602",
            filter: "invert(11%) sepia(63%) saturate(4965%) hue-rotate(14deg) brightness(103%) contrast(124%)",
            group: "s9"
        },
        section_09_check_out_6: {
            name: "Kapitalwert bestimmen",
            variants: 4,
            color: "#C8B210",
            filter: "invert(72%) sepia(81%) saturate(1388%) hue-rotate(8deg) brightness(93%) contrast(87%)",
            group: "s9"
        },
        section_10_check_in_3: {
            name: "Rentenbarwertfaktor",
            variants: 4,
            color: "#3BDBAA",
            filter: "invert(92%) sepia(80%) saturate(1117%) hue-rotate(82deg) brightness(101%) contrast(69%)",
            group: "s10"
        },
        section_10_check_in_4: {
            name: "Rentenendwertfaktor",
            variants: 4,
            color: "#916F06",
            filter: "invert(43%) sepia(44%) saturate(6440%) hue-rotate(38deg) brightness(93%) contrast(95%)",
            group: "s10"
        },
        section_10_check_out_1: {
            name: "Rente n berechnen",
            variants: 4,
            color: "#C5B6C7",
            filter: "invert(80%) sepia(6%) saturate(490%) hue-rotate(246deg) brightness(91%) contrast(96%)",
            group: "s10"
        },
        section_10_check_out_modified2_6: {
            name: "Rentenbarwert, Rentenendwert (Duplikat Malte)",
            variants: 4,
            color: "#DA8376",
            filter: "invert(76%) sepia(76%) saturate(1360%) hue-rotate(305deg) brightness(86%) contrast(86%)",
            group: "s10"
        },
        section_10_check_out_3: {
            name: "Annuität berechnen",
            variants: 4,
            color: "#88383B",
            filter: "invert(27%) sepia(85%) saturate(439%) hue-rotate(308deg) brightness(84%) contrast(94%)",
            group: "s10"
        },
        section_10_check_out_4: {
            name: "Annutätentilgung, Tilgungsplan",
            variants: 4,
            color: "#71BC2E",
            filter: "invert(61%) sepia(95%) saturate(366%) hue-rotate(48deg) brightness(91%) contrast(84%)",
            group: "s10"
        },
        section_10_check_out_5: {
            name: "Laufzeit eines Darlehens",
            variants: 4,
            color: "#B20EE3",
            filter: "invert(22%) sepia(84%) saturate(4934%) hue-rotate(280deg) brightness(90%) contrast(116%)",
            group: "s10"
        },
        section_10_check_out_6: {
            name: "Restschuld eines Darlehens",
            variants: 4,
            color: "#C751FB",
            filter: "invert(41%) sepia(23%) saturate(6695%) hue-rotate(255deg) brightness(101%) contrast(97%)",
            group: "s10"
        },
        section_11_check_in_modified_7: {
            name: "MatrixMultiplikation",
            variants: 4,
            color: "#496108",
            filter: "invert(32%) sepia(17%) saturate(2438%) hue-rotate(36deg) brightness(96%) contrast(94%)",
            group: "s11"
        },
        section_11_check_in_modified_8: {
            name: "Transponieren",
            variants: 4,
            color: "#4DA97E",
            filter: "invert(54%) sepia(42%) saturate(476%) hue-rotate(100deg) brightness(100%) contrast(84%)",
            group: "s11"
        },
        section_11_check_in_modified_9: {
            name: "8.12 LGS Matrix-Form Folie 11 (5.1 LGS) (Duplikat Malte)",
            variants: 4,
            color: "#F8C255",
            filter: "invert(76%) sepia(85%) saturate(388%) hue-rotate(335deg) brightness(100%) contrast(95%)",
            group: "s11"
        },
        section_11_check_out_1: {
            name: "6.02 extern Matrizenrechnung",
            variants: 4,
            color: "#642E0E",
            filter: "invert(18%) sepia(12%) saturate(6525%) hue-rotate(354deg) brightness(97%) contrast(92%)",
            group: "s11"
        },
        section_11_check_out_2: {
            name: "6.03 Matrix-Vektor-Produkt",
            variants: 4,
            color: "#16C9D7",
            filter: "invert(67%) sepia(27%) saturate(3791%) hue-rotate(137deg) brightness(101%) contrast(83%)",
            group: "s11"
        },
        section_11_check_out_3: {
            name: "6.06 Addition von 2 Linearkombi",
            variants: 4,
            color: "#C768E5",
            filter: "invert(51%) sepia(33%) saturate(1489%) hue-rotate(239deg) brightness(96%) contrast(86%)",
            group: "s11"
        },
        section_11_check_out_4: {
            name: "6.08 Folie S.18 Matrixprodukt",
            variants: 4,
            color: "#DA8376",
            filter: "invert(76%) sepia(76%) saturate(1360%) hue-rotate(305deg) brightness(86%) contrast(86%)",
            group: "s11"
        },
        section_11_check_out_5: {
            name: "6.11 Operationen von 3 Matrizen",
            variants: 4,
            color: "#93916B",
            filter: "invert(62%) sepia(7%) saturate(1282%) hue-rotate(19deg) brightness(91%) contrast(88%)",
            group: "s11"
        },
        section_11_check_out_6: {
            name: "8.05 LGS 2x2",
            variants: 4,
            color: "#A4AA17",
            filter: "invert(57%) sepia(80%) saturate(463%) hue-rotate(23deg) brightness(95%) contrast(84%)",
            group: "s11"
        },
        section_11_check_out_7: {
            name: "8.06 LGS 3x3",
            variants: 4,
            color: "#62CB69",
            filter: "invert(99%) sepia(33%) saturate(3140%) hue-rotate(51deg) brightness(87%) contrast(79%)",
            group: "s11"
        },
        section_12_check_in_4: {
            name: "Inverse 2x2",
            variants: 4,
            color: "#CD51BA",
            filter: "invert(52%) sepia(46%) saturate(3109%) hue-rotate(280deg) brightness(85%) contrast(86%)",
            group: "s12"
        },
        section_12_check_in_5: {
            name: "Streichungsmatrix",
            variants: 4,
            color: "#877931",
            filter: "invert(51%) sepia(15%) saturate(1482%) hue-rotate(13deg) brightness(88%) contrast(89%)",
            group: "s12"
        },
        section_12_check_in_6: {
            name: "7.01 Det 2x2",
            variants: 4,
            color: "#DDB76F",
            filter: "invert(77%) sepia(47%) saturate(395%) hue-rotate(353deg) brightness(90%) contrast(91%)",
            group: "s12"
        },
        section_12_check_out_modified_1: {
            name: "7.03 Det 3x3 Folie 16",
            variants: 4,
            color: "#C14532",
            filter: "invert(29%) sepia(72%) saturate(1119%) hue-rotate(334deg) brightness(100%) contrast(91%)",
            group: "s12"
        },
        section_12_check_out_modified_2: {
            name: "Inverse 3x3",
            variants: 4,
            color: "#70C3CA",
            filter: "invert(72%) sepia(7%) saturate(2161%) hue-rotate(136deg) brightness(100%) contrast(88%)",
            group: "s12"
        },
        section_12_check_out_modified_3: {
            name: "Inverse singulär 3x3",
            variants: 4,
            color: "#6AC2E3",
            filter: "invert(67%) sepia(76%) saturate(312%) hue-rotate(161deg) brightness(93%) contrast(90%)",
            group: "s12"
        },
        section_12_check_out_modified_4: {
            name: "Laplace 4x4 (TF) (Duplikat Malte)",
            variants: 4,
            color: "#8F822E",
            filter: "invert(44%) sepia(53%) saturate(494%) hue-rotate(15deg) brightness(101%) contrast(89%)",
            group: "s12"
        },
        section_13_check_out_modified_1: {
            name: "Simplex Pivotelement Dualer Simplex",
            variants: 4,
            color: "#040237",
            filter: "invert(5%) sepia(65%) saturate(6178%) hue-rotate(225deg) brightness(82%) contrast(117%)",
            group: "s13"
        },
        section_13_check_out_modified_2: {
            name: "Simplex Pivotelement+Neue Basis angeben",
            variants: 4,
            color: "#AEC069",
            filter: "invert(74%) sepia(10%) saturate(1407%) hue-rotate(32deg) brightness(95%) contrast(97%)",
            group: "s13"
        },
        section_13_check_out_modified_3: {
            name: "Simplex dual",
            variants: 4,
            color: "#C6E2B2",
            filter: "invert(99%) sepia(25%) saturate(1040%) hue-rotate(32deg) brightness(96%) contrast(83%)",
            group: "s13"
        },
        section_13_check_out_modified_4: {
            name: "Simplex Tableau aufstellen (Duplikat Malte)",
            variants: 4,
            color: "#0EE073",
            filter: "invert(74%) sepia(55%) saturate(3187%) hue-rotate(95deg) brightness(100%) contrast(89%)",
            group: "s13",
            onsuccess: "_finish",
            onfailure: "_finish"
        }
    }
};

/*Preparatory courses WiSe 2023-24*/
let quizObjectAsString = '{"groups": {"start": "Start", "t0_syn_1": "Syntax", "t1_fra_1": "Bruchrechnung", "t3_frabin_1": "Binom. Formeln", "t4_pq_1": "pq-Formel", "t5_rul_1": "Potenzrechenregeln", "t7_der_1": "Ableitungen"}, "questions": {"start": {"name": "Start", "group": "start"}, "t0_syn_1_a": {"name": "Gleichung eingeben (Multiplikation)", "variants": 4, "color": "#573036", "filter": "invert(20%) sepia(11%) saturate(2292%) hue-rotate(301deg) brightness(88%) contrast(87%)"}, "t0_syn_1_b": {"name": "Gleichung eingeben (Division)", "variants": 4, "color": "#1BA1C7", "filter": "invert(46%) sepia(89%) saturate(419%) hue-rotate(147deg) brightness(97%) contrast(96%)"}, "t0_syn_1_c": {"name": "Potenzen", "variants": 4, "color": "#B38ABB", "filter": "invert(67%) sepia(28%) saturate(423%) hue-rotate(244deg) brightness(85%) contrast(89%)"}, "t0_syn_1_d": {"name": "Rationale Ausdr\u00fccke", "variants": 3, "color": "#D558A8", "filter": "invert(50%) sepia(90%) saturate(907%) hue-rotate(290deg) brightness(87%) contrast(90%)"}, "t0_syn_1_e": {"name": "Wurzelzeichen", "variants": 4, "color": "#1B5658", "filter": "invert(26%) sepia(12%) saturate(2407%) hue-rotate(133deg) brightness(95%) contrast(86%)"}, "t0_syn_1_f": {"name": "Mehrere L\u00f6sungen", "variants": 4, "color": "#810311", "filter": "invert(8%) sepia(64%) saturate(6140%) hue-rotate(346deg) brightness(93%) contrast(104%)"}, "t0_syn_1_g": {"name": "Gleichung mehrschrittig l\u00f6sen", "variants": 4, "color": "#74CD27", "filter": "invert(68%) sepia(76%) saturate(507%) hue-rotate(42deg) brightness(95%) contrast(83%)"}, "t0_syn_1_h": {"name": "Griechische Buchstaben", "variants": 4, "color": "#3CF48A", "filter": "invert(72%) sepia(40%) saturate(699%) hue-rotate(89deg) brightness(101%) contrast(98%)"}, "t0_syn_1_i": {"name": "Syntax-Endboss", "variants": 4, "color": "#77B211", "filter": "invert(64%) sepia(52%) saturate(5261%) hue-rotate(48deg) brightness(107%) contrast(87%)"}, "t1_fra_1_bi-a": {"name": "K\u00fcrzen zweier einfacher Br\u00fcche", "variants": 4, "color": "#FD9C80", "filter": "invert(84%) sepia(53%) saturate(4565%) hue-rotate(313deg) brightness(115%) contrast(108%)"}, "t1_fra_1_bi-b": {"name": "K\u00fcrzen zweier Br\u00fcche mit Variablen", "variants": 4, "color": "#E249B2", "filter": "invert(52%) sepia(64%) saturate(4425%) hue-rotate(292deg) brightness(93%) contrast(90%)"}, "t1_fra_1_bi-c": {"name": "K\u00fcrzen zweier Br\u00fcche mit Variablen und Zahlen", "variants": 4, "color": "#D57774", "filter": "invert(81%) sepia(50%) saturate(3032%) hue-rotate(305deg) brightness(86%) contrast(94%)"}, "t1_fra_1_bi-d": {"name": "K\u00fcrzen zweier Br\u00fcche mit Termen", "variants": 4, "color": "#944A6C", "filter": "invert(34%) sepia(25%) saturate(1028%) hue-rotate(280deg) brightness(96%) contrast(89%)"}, "t1_fra_1_bii-a": {"name": "Einfachen Bruch erweitern", "variants": 4, "color": "#9B49A2", "filter": "invert(35%) sepia(65%) saturate(573%) hue-rotate(248deg) brightness(92%) contrast(92%)"}, "t1_fra_1_bii-b": {"name": "Bruch mit Variablen erweitern", "variants": 4, "color": "#FA00D1", "filter": "invert(54%) sepia(100%) saturate(7435%) hue-rotate(298deg) brightness(97%) contrast(127%)"}, "t1_fra_1_bii-c": {"name": "Bruch mit Variablen und Zahlen erweitern", "variants": 4, "color": "#E2AFDA", "filter": "invert(96%) sepia(86%) saturate(2059%) hue-rotate(203deg) brightness(96%) contrast(83%)"}, "t1_fra_1_ca": {"name": "Einfache Addition von Br\u00fcchen", "variants": 4, "color": "#EB3E57", "filter": "invert(33%) sepia(19%) saturate(6570%) hue-rotate(328deg) brightness(97%) contrast(89%)"}, "t1_fra_1_cb": {"name": "Addition von Br\u00fcchen mit Variablen und gleichem Nenner", "variants": 4, "color": "#7E182C", "filter": "invert(14%) sepia(27%) saturate(5843%) hue-rotate(328deg) brightness(98%) contrast(98%)"}, "t1_fra_1_cc": {"name": "Addition von Br\u00fcchen mit Variablen und unterschiedlichen Nennern", "variants": 4, "color": "#3960A7", "filter": "invert(33%) sepia(56%) saturate(621%) hue-rotate(180deg) brightness(96%) contrast(95%)"}, "t1_fra_1_cd": {"name": "Addition von Br\u00fcchen mit einer Variablen und unterschiedlichen Nennern", "variants": 4, "color": "#E44FCD", "filter": "invert(76%) sepia(58%) saturate(7362%) hue-rotate(280deg) brightness(93%) contrast(93%)"}, "t1_fra_1_ce": {"name": "Addition von Br\u00fcchen mit Variablen und unterschiedlichen Nennern I", "variants": 4, "color": "#278495", "filter": "invert(40%) sepia(10%) saturate(2946%) hue-rotate(142deg) brightness(107%) contrast(86%)"}, "t1_fra_1_cf": {"name": "Addition von Br\u00fcchen mit Variablen und unterschiedlichen Nennern II", "variants": 4, "color": "#6D9D29", "filter": "invert(53%) sepia(90%) saturate(357%) hue-rotate(43deg) brightness(87%) contrast(88%)"}, "t1_fra_1_da": {"name": "Multiplikation zweier einfacher Br\u00fcche", "variants": 4, "color": "#302FFF", "filter": "invert(12%) sepia(96%) saturate(6720%) hue-rotate(247deg) brightness(102%) contrast(101%)"}, "t1_fra_1_db": {"name": "Multiplikation zweier Br\u00fcche mit Variablen", "variants": 4, "color": "#BBCBC4", "filter": "invert(93%) sepia(3%) saturate(752%) hue-rotate(102deg) brightness(89%) contrast(85%)"}, "t1_fra_1_dc": {"name": "Multiplikation Bruch mit Zahlen, Bruch mit Variablen, Ganzzahl", "variants": 4, "color": "#C5F99B", "filter": "invert(100%) sepia(16%) saturate(5613%) hue-rotate(328deg) brightness(109%) contrast(92%)"}, "t1_fra_1_dd": {"name": "Multiplikation zweier Br\u00fcche mit Termen", "variants": 4, "color": "#A3717F", "filter": "invert(51%) sepia(4%) saturate(3367%) hue-rotate(293deg) brightness(95%) contrast(75%)"}, "t1_fra_1_de": {"name": "Einfacher Doppelbruch", "variants": 4, "color": "#395C44", "filter": "invert(28%) sepia(21%) saturate(737%) hue-rotate(86deg) brightness(102%) contrast(87%)"}, "t1_fra_1_df": {"name": "Bruch und Geteilt-Rechnung", "variants": 4, "color": "#10F046", "filter": "invert(52%) sepia(95%) saturate(903%) hue-rotate(88deg) brightness(115%) contrast(90%)"}, "t1_fra_1_dg": {"name": "Doppelbruch mit Zahlen und Variablen", "variants": 4, "color": "#E39FB2", "filter": "invert(78%) sepia(4%) saturate(2863%) hue-rotate(296deg) brightness(88%) contrast(102%)"}, "t1_fra_1_dh": {"name": "Doppelbruch mit Termen", "variants": 4, "color": "#23F5CC", "filter": "invert(100%) sepia(72%) saturate(2181%) hue-rotate(84deg) brightness(106%) contrast(91%)"}, "t1_fra_1_ea": {"name": "Bruchrechnung Kombination I", "variants": 4, "color": "#01D504", "filter": "invert(43%) sepia(74%) saturate(1175%) hue-rotate(89deg) brightness(106%) contrast(114%)"}, "t1_fra_1_eb": {"name": "Bruchrechnung Kombination II", "variants": 4, "color": "#C6F237", "filter": "invert(96%) sepia(38%) saturate(4597%) hue-rotate(13deg) brightness(104%) contrast(89%)"}, "t1_fra_1_ec": {"name": "Bruchrechnung Kombination III", "variants": 4, "color": "#B64537", "filter": "invert(36%) sepia(12%) saturate(4301%) hue-rotate(324deg) brightness(93%) contrast(92%)"}, "t3_frabin_1_g": {"name": "Binomische Formeln Ia - Erste binomische Formel", "variants": 4, "color": "#8C9BF5", "filter": "invert(64%) sepia(5%) saturate(3975%) hue-rotate(195deg) brightness(98%) contrast(96%)"}, "t3_frabin_1_h": {"name": "Binomische Formeln Ib - Zweite binomische Formel", "variants": 4, "color": "#9F6D55", "filter": "invert(49%) sepia(5%) saturate(4049%) hue-rotate(334deg) brightness(89%) contrast(72%)"}, "t3_frabin_1_i": {"name": "Binomische Formeln Ic - Dritte binomische Formel", "variants": 4, "color": "#65D794", "filter": "invert(80%) sepia(24%) saturate(818%) hue-rotate(88deg) brightness(91%) contrast(88%)"}, "t3_frabin_1_j": {"name": "Binomische Formeln I - Anwendungsaufgabe", "variants": 4, "color": "#162095", "filter": "invert(18%) sepia(23%) saturate(6913%) hue-rotate(217deg) brightness(94%) contrast(98%)"}, "t3_frabin_1_k": {"name": "Bruchrechenregeln Ig2 - Bruch mit binomischem Term erweitern 2 (copy)", "variants": 3, "color": "#DD5BE4", "filter": "invert(46%) sepia(92%) saturate(1381%) hue-rotate(268deg) brightness(96%) contrast(85%)"}, "t4_pq_1_a": {"name": "p-q-Formal Ia - Termumformung", "variants": 4, "color": "#A4FFDC", "filter": "invert(91%) sepia(24%) saturate(563%) hue-rotate(85deg) brightness(103%) contrast(103%)"}, "t4_pq_1_b": {"name": "p-q-Formel Ib - pq-Formel", "variants": 4, "color": "#BA9DCC", "filter": "invert(70%) sepia(13%) saturate(705%) hue-rotate(233deg) brightness(94%) contrast(91%)"}, "t4_pq_1_c": {"name": "p-q-Formel I - Endboss", "variants": 4, "color": "#D34FDB", "filter": "invert(45%) sepia(84%) saturate(1892%) hue-rotate(259deg) brightness(88%) contrast(94%)"}, "t5_rul_1_a": {"name": "Potenzrechenregeln Ia \u2013 Exponenten addieren", "variants": 2, "color": "#910602", "filter": "invert(11%) sepia(63%) saturate(4965%) hue-rotate(14deg) brightness(103%) contrast(124%)"}, "t5_rul_1_b": {"name": "Potenzrechenregeln Ib \u2013 Exponenten subtrahieren", "variants": 2, "color": "#C8B210", "filter": "invert(72%) sepia(81%) saturate(1388%) hue-rotate(8deg) brightness(93%) contrast(87%)"}, "t5_rul_1_c": {"name": "Potenzrechenregeln Ic - Wurzel als Potenz darstellen", "variants": 4, "color": "#3BDBAA", "filter": "invert(92%) sepia(80%) saturate(1117%) hue-rotate(82deg) brightness(101%) contrast(69%)"}, "t5_rul_1_d": {"name": "Potenzrechenregeln Id \u2013 Exponenten multiplizieren", "variants": 2, "color": "#916F06", "filter": "invert(43%) sepia(44%) saturate(6440%) hue-rotate(38deg) brightness(93%) contrast(95%)"}, "t5_rul_1_e": {"name": "Potenzrechenregeln Ie - Potenzrechenregeln anwenden", "variants": 2, "color": "#C5B6C7", "filter": "invert(80%) sepia(6%) saturate(490%) hue-rotate(246deg) brightness(91%) contrast(96%)"}, "t5_rul_1_f": {"name": "Potenzrechenregeln I - Endboss", "variants": 2, "color": "#88383B", "filter": "invert(27%) sepia(85%) saturate(439%) hue-rotate(308deg) brightness(84%) contrast(94%)"}, "t7_der_1_a": {"name": "Ganzzahlige Summanden ableiten", "variants": 4, "color": "#71BC2E", "filter": "invert(61%) sepia(95%) saturate(366%) hue-rotate(48deg) brightness(91%) contrast(84%)"}, "t7_der_1_b": {"name": "Gebrochenrationale Summanden ableiten", "variants": 4, "color": "#B20EE3", "filter": "invert(22%) sepia(84%) saturate(4934%) hue-rotate(280deg) brightness(90%) contrast(116%)"}, "t7_der_1_c": {"name": "Produkte ableiten I", "variants": 4, "color": "#C751FB", "filter": "invert(41%) sepia(23%) saturate(6695%) hue-rotate(255deg) brightness(101%) contrast(97%)"}, "t7_der_1_d": {"name": "Produkte ableiten II", "variants": 4, "color": "#496108", "filter": "invert(32%) sepia(17%) saturate(2438%) hue-rotate(36deg) brightness(96%) contrast(94%)"}, "t7_der_1_e": {"name": "Division ableiten I", "variants": 4, "color": "#4DA97E", "filter": "invert(54%) sepia(42%) saturate(476%) hue-rotate(100deg) brightness(100%) contrast(84%)"}, "t7_der_1_f": {"name": "Division ableiten II", "variants": 4, "color": "#F8C255", "filter": "invert(76%) sepia(85%) saturate(388%) hue-rotate(335deg) brightness(100%) contrast(95%)"}, "t7_der_1_g": {"name": "Kettenregel I", "variants": 4, "color": "#642E0E", "filter": "invert(18%) sepia(12%) saturate(6525%) hue-rotate(354deg) brightness(97%) contrast(92%)"}, "t7_der_1_h": {"name": "Kettenregel II", "variants": 4, "color": "#16C9D7", "filter": "invert(67%) sepia(27%) saturate(3791%) hue-rotate(137deg) brightness(101%) contrast(83%)"}, "t7_der_1_i": {"name": "Gemischtes I", "variants": 4, "color": "#C768E5", "filter": "invert(51%) sepia(33%) saturate(1489%) hue-rotate(239deg) brightness(96%) contrast(86%)"}, "t7_der_1_j": {"name": "Gemischtes II", "variants": 4, "color": "#DA8376", "filter": "invert(76%) sepia(76%) saturate(1360%) hue-rotate(305deg) brightness(86%) contrast(86%)"}, "t7_der_1_k": {"name": "Gemischtes III", "variants": 4, "color": "#93916B", "filter": "invert(62%) sepia(7%) saturate(1282%) hue-rotate(19deg) brightness(91%) contrast(88%)"}, "t7_der_1_l": {"name": "Gemischtes IV", "variants": 4, "color": "#A4AA17", "filter": "invert(57%) sepia(80%) saturate(463%) hue-rotate(23deg) brightness(95%) contrast(84%)"}, "t7_der_1_m": {"name": "Gemischtes V", "variants": 4, "color": "#62CB69", "filter": "invert(99%) sepia(33%) saturate(3140%) hue-rotate(51deg) brightness(87%) contrast(79%)"}, "t7_der_1_n": {"name": "Gemischtes VI", "variants": 4, "color": "#CD51BA", "filter": "invert(52%) sepia(46%) saturate(3109%) hue-rotate(280deg) brightness(85%) contrast(86%)"}}}';
quizObject = JSON.parse(quizObjectAsString);

var processedAttempts = 0;
var allAttempts = 0;
//var CryptoObj = 
var fetches = {};
var urls = {};

//Paginate quiz objects
let page = 0;
for(let i in quizObject.questions) {
    quizObject.questions[i].page = page;
    let toAdd = quizObject.questions[i].variants == undefined ? 1 : quizObject.questions[i].variants;
    page += toAdd;
}

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
//----------------CLASSES-------------------------
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
    constructor(idOrNode) {
        let object = this;
        this.Parser = new DOMParser();
        this.QuestionAttempts = [];

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
                this.addAttempt(reviewLink.href);
            }
        }
        else {
            console.log("unknown type");
        }
    }
    
    addAttempt(reviewUrl) {
        let object = this;
        if(reviewUrl == undefined) {
            return;
        }
        fetch(reviewUrl)
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
            let questionIds = Object.keys(quizObject.questions);
            let lastPage = questionIds.length-1;
            for(let questionName in quizObject.questions) {
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
                    fetches[fetchId] = 0;
                    urls[fetchId] = previousQuestionAttemptUrls[j].href;
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
                        fetches[fetchId] = 1;
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

                if(page == lastPage) {
                    processedAttempts++;
                    console.log("(Nearly) processed "+processedAttempts+" of "+allAttempts+ " attempts.");
                }

                page++;
                //}
            }
        })
        .catch(function(error) {
            console.log("error in promise chain");
            console.log(error);
        });
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
            csvString += "timestamp;question_id;variant;action;outcome;next_timestamp;next_question_id;next_variant\n";
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

    getSanitizedAttempts(getRidOfInitializationAttempts, getRidOfFinishedAttemptAttempts) {
        //Will sort the question attempts and get rid of initialization attempts.
        if(getRidOfInitializationAttempts == undefined) {
            getRidOfInitializationAttempts = true;
        }
        if(getRidOfFinishedAttemptAttempts == undefined) {
            getRidOfFinishedAttemptAttempts = true;
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

        if(!getRidOfInitializationAttempts) {
            return SanitizedAttempts;
        }

        if(SanitizedAttempts.length == 0) {
            console.log("no attempts after sanitizing");
            return [];
        }

        let initialTimestamp = SanitizedAttempts[0].timestamp;
        let SanitizedAttemptsCopy = JSON.parse(JSON.stringify(SanitizedAttempts));
        SanitizedAttempts = [];
        for(let j=0;j<SanitizedAttemptsCopy.length;j++) {
            if(SanitizedAttemptsCopy[j].timestamp != initialTimestamp) {
                SanitizedAttempts.push(SanitizedAttemptsCopy[j]);
            }
        }
        return SanitizedAttempts;
    }
}


//----------------MAIN-------------------------
//Classic theme?
//let rows = document.querySelectorAll("#responses tbody tr:not(.emptyrow)");
//Alternative for HS BO Moodle Theme?
let rows = document.querySelectorAll("#attempts tbody tr:not(.emptyrow)");
allAttempts = rows.length;
let Users = {};

console.log("There are "+allAttempts+" rows. Run 'loadUsers();' or 'loadUsers(from, to);' or 'loadUsersStepwise();' to start processing.");

//for(let i=7;i<8;i++) {
function loadUsers(from, to) {
    if(from == undefined) {
        from = 0;
    }
    if(to == undefined) {
        to = rows.length;
    }
    for(let i=from;i<to;i++) {
        let id;
        let idNode = rows[i].querySelector(".c3");
        if(idNode == undefined) {
            console.log("no id found for row "+i);
            continue;
        }
        id = idNode.innerHTML;
        if(id == "") {
            console.log("empty id in row "+i);
            continue;
        }
        if(Users[id] == undefined) {
            Users[id] = new CUser(rows[i]);
        }
        else {
            //Get review link and add attempt to already existing user.
            let reviewLink = rows[i].querySelector(".reviewlink");
            if(reviewLink != undefined) {
                Users[id].addAttempt(reviewLink.href);
            }
            else {
                console.log("Found user row of already existing user, but didn't find review link.");
            }
        }
    }
}

var csvText = "";
async function loadCSV(UsersObject) {
    if(UsersObject == undefined) {
        if(Users == undefined) {
            return false;
        }
        UsersObject = Users;
    }
    //let csvText = "";
    csvText = "";
    let first = true;
    for(let i in UsersObject) {
        csvText += await UsersObject[i].getAttemptsAsCSV(true, first);
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

function downloadCSV() {
    let c = document.createElement("a");
    c.download = "alquiz-analysis-control.csv";
    var t = new Blob([csvText], {
        type: "text/plain"
    });
    c.href = window.URL.createObjectURL(t);
    c.click();
}

async function loadAndDownloadCSV() {
    return await loadCSV().then(function(response) {
        downloadCSV();
        return response;
    });
}

function getFetchState() {
    /*let overallFetches = Object.keys(fetches).length;
    let solvedFetches = 0;
    for(let fetchId in fetches) {
        if(fetches[fetchId] == 1) {
            solvedFetches++;
        }
    }*/
    infoObject = getFetchStateMachineReadable();
    console.log("Fetched "+infoObject.solved+" of "+infoObject.overall+".");
}

function getFetchStateMachineReadable() {
    let overallFetches = Object.keys(fetches).length;
    let solvedFetches = 0;
    for(let fetchId in fetches) {
        if(fetches[fetchId] == 1) {
            solvedFetches++;
        }
    }
    return {"solved":solvedFetches, "overall":overallFetches};
}

//----------------TEST--------------------------
function showAllAttemptsOf018345157(questionId) {
    if(questionId == undefined) {
        questionId = "start";
    }
    let OnlyStartAttempts = [];
    if(Users["018345157"] != undefined) {
        Users["018345157"].QuestionAttempts.forEach(function(QuestionAttempt) {
            if(QuestionAttempt.questionId == questionId) {
                OnlyStartAttempts.push(QuestionAttempt);
            }
        });
    }
    console.log(OnlyStartAttempts);
}

var processCount = 0;
function processStepByStep() {
    fetchInfoObject = getFetchStateMachineReadable();
    if(fetchInfoObject.solved == fetchInfoObject.overall) {
        if(processCount == allAttempts) {
            console.log("Successfully processed all attempts.")
            if(interval != undefined) {
                clearInterval(interval);
            }
            return;
        }
        else {
            loadUsers(processCount, processCount+1);
            processCount++;
        }
    }
}

var interval;
function loadUsersStepwise() {
    interval = setInterval(processStepByStep, 5000);
}