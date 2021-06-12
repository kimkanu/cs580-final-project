\NeedsTeXFormat{LaTeX2e}
\ProvidesExplClass{homework}{2020/03/23}{1.0}{Homework class}

\LoadClass[11pt, a4paper]{article}

\RequirePackage{expl3}
\RequirePackage{xparse}
\RequirePackage{xstring}
\RequirePackage{xcolor}
\RequirePackage{setspace}
\RequirePackage{fancyhdr}

\setstretch{1.1}
\parskip=7pt

\makeatletter
\ExplSyntaxOn

\definecolor{homework_textcolor}{HTML}{14171a}
\definecolor{homework_headingcolor}{HTML}{262a2e}
\definecolor{homework_misccolor}{HTML}{64696e}

\color { homework_textcolor }

%===========%
% MAKETITLE %
%===========%
\tl_new:N \g_date_tl
\tl_new:N \g_subject_tl
\tl_new:N \g_student_id_tl
\tl_new:N \g_name_tl

\def \subject #1 {
    \tl_set:Nn \g_subject_tl { #1 }
}
\def \studentid #1 {
    \tl_set:Nn \g_student_id_tl { #1 }
}
\def \name #1 {
    \tl_set:Nn \g_name_tl { #1 }
}
\def \date #1 {
    \tl_set:Nn \g_date_tl { #1 }
}

\def \maketitle {
    \author { \g_student_id_tl \ \g_name_tl }
    \vspace* { -1.5em }
    \__homework_print_title:
    \thispagestyle { fancy }
}

\cs_new:Npn \__homework_print_title: {
    \noindent
    \parbox { \textwidth } {
        \textcolor { homework_headingcolor } {
            \Huge \bfseries \@title
        }
    }
    \par
    \vskip1.2em
    \noindent
    \textcolor { homework_misccolor!50!white } {
        \rule{ 3cm } { 0.1pt }
    }
    \vskip3.4em
}


%===============%
% HEADER/FOOTER %
%===============%

\pagestyle { fancy }
\fancyhf {}
\rhead { \__homework_print_misc: }
\cfoot { \textcolor { homework_misccolor } { \sffamily \small \thepage } }
\renewcommand { \headrulewidth } { 0pt }
\setlength { \headheight } { 21pt }

\cs_new:Npn \__homework_print_misc: {
    \noindent\parbox { \textwidth } {
        \small \sffamily
        \textcolor { homework_misccolor } {
            \hfill
            \textcolor { homework_misccolor!85!black } {
                \bfseries
                \g_student_id_tl
                \quad \g_name_tl
            }
            \,·\,\g_date_tl
        }
        \par
        \textcolor { homework_misccolor } {
            \hfill\g_subject_tl
        }
    }
}


%==========%
% SOLUTION %
%==========%
\newcounter { homework_solution }
\setcounter { homework_solution } { 1 }
\tl_new:N \l__counter_expanded
\tl_set:Nx \l__counter_expanded { 1 }
\newsavebox { \homework_numbering }
\NewDocumentCommand { \solution }
    { s O{ \l__counter_expanded } +m }
    {
        \noindent
        \sbox { \homework_numbering } {
            \textcolor { homework_headingcolor } {
                \IfBooleanTF #1 { \# } {}
                \itshape \bfseries \Large
                \__homework_oldstyle:n { #2 } .
            }
        }
        \hspace*{ \dimexpr - \wd \homework_numbering - 5pt\relax }
        \usebox { \homework_numbering }
        \hskip 5pt
        #3
        \par
        \vspace{0.7em}

        \addtocounter { homework_solution } { 1 }
        \tl_set:Nx \l__counter_expanded { \arabic{ homework_solution } }
    }

\cs_new:Nn \__homework_oldstyle:n {
    \tl_map_inline:nn { #1 } { \__homework_oldstyle_digits_only:n { ##1 } }
}

\cs_new:Nn \__homework_oldstyle_digits_only:n {
    \IfInteger{#1}{{\slshape\oldstylenums{#1}}}{#1} 
}
\ExplSyntaxOff
\makeatother

